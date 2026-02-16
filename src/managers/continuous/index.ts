import {extend, defer, requestAnimationFrame} from "../../utils/core";
import DefaultViewManager from "../default";
import Snap from "../helpers/snap";
import { EVENTS } from "../../utils/constants";
import type Section from "../../section";
import type IframeView from "../views/iframe";
import type Stage from "../helpers/stage";
import type { ManagerOptions, ReframeBounds } from "../../types";
function debounce(func: (...args: unknown[]) => void, wait: number): (...args: unknown[]) => void {
	let timeout: ReturnType<typeof setTimeout>;
	return function(this: unknown, ...args: unknown[]) {
		clearTimeout(timeout);
		timeout = setTimeout(() => {
			func.call(this, ...args);
		}, wait);
	};
}

class ContinuousViewManager extends DefaultViewManager {
	snapper: Snap | undefined;
	tick!: typeof requestAnimationFrame;
	scrollDeltaVert!: number;
	scrollDeltaHorz!: number;
	_scrolled!: (...args: unknown[]) => void;
	didScroll!: boolean;
	prevScrollTop!: number;
	prevScrollLeft!: number;
	scrollTimeout!: ReturnType<typeof setTimeout>;
	trimTimeout!: ReturnType<typeof setTimeout>;

	constructor(options: ManagerOptions) {
		super(options);

		this.name = "continuous";

		this.settings = extend({} as ManagerOptions, {
			infinite: true,
			overflow: undefined,
			axis: undefined,
			writingMode: undefined,
			flow: "scrolled",
			offset: 500,
			offsetDelta: 250,
			width: undefined,
			height: undefined,
			snap: false,
			afterScrolledTimeout: 10,
			allowScriptedContent: false,
			allowPopups: false
		});

		extend(this.settings, options.settings || {});

		// Gap can be 0, but defaults doesn't handle that
		const settingsGap = options.settings?.gap;
		if (settingsGap !== undefined && settingsGap === 0) {
			this.settings.gap = settingsGap;
		}

		this.viewSettings = {
			ignoreClass: this.settings.ignoreClass,
			axis: this.settings.axis,
			flow: this.settings.flow,
			layout: this.layout,
			width: 0,
			height: 0,
			forceEvenPages: false,
			allowScriptedContent: this.settings.allowScriptedContent,
			allowPopups: this.settings.allowPopups
		};

		this.scrollTop = 0;
		this.scrollLeft = 0;
	}

	display(section: Section, target?: string): Promise<void> {
		return DefaultViewManager.prototype.display.call(this, section, target)
			.then(() => {
				return this.fill();
			});
	}

	fill(_full?: defer<void>): Promise<void> {
		const full = _full || new defer<void>();

		this.q.enqueue(() => {
			return this.check();
		}).then((result) => {
			if (result) {
				this.fill(full);
			} else {
				full.resolve();
			}
		});

		return full.promise;
	}

	moveTo(offset: { left: number; top: number }): void {
		// var bounds = this.stage.bounds();
		// var dist = Math.floor(offset.top / bounds.height) * bounds.height;
		let distX = 0,
				distY = 0;

		let _offsetX = 0,
				_offsetY = 0;

		if(!this.isPaginated) {
			distY = offset.top;
			_offsetY = offset.top+(this.settings.offsetDelta ?? 0);
		} else {
			distX = Math.floor(offset.left / this.layout.delta) * this.layout.delta;
			_offsetX = distX+(this.settings.offsetDelta ?? 0);
		}

		if (distX > 0 || distY > 0) {
			this.scrollBy(distX, distY, true);
		}
	}

	afterResized(view: IframeView): void {
		this.emit(EVENTS.MANAGERS.RESIZE, view.section);
	}

	// Remove Previous Listeners if present
	removeShownListeners(view: IframeView): void {

		// view.off("shown", this.afterDisplayed);
		// view.off("shown", this.afterDisplayedAbove);
		view.onDisplayed = function(): void {};

	}

	add(section: Section): Promise<IframeView> {
		const view = this.createView(section);

		this.views.append(view);

		view.on(EVENTS.VIEWS.RESIZED, (_bounds: ReframeBounds) => {
			view.expanded = true;
		});

		view.on(EVENTS.VIEWS.AXIS, (axis: string) => {
			this.updateAxis(axis);
		});

		view.on(EVENTS.VIEWS.WRITING_MODE, (mode: string) => {
			this.updateWritingMode(mode);
		});

		// view.on(EVENTS.VIEWS.SHOWN, this.afterDisplayed.bind(this));
		view.onDisplayed = (view): void => this.afterDisplayed(view);
		view.onResize = (view): void => this.afterResized(view);

		return view.display(this.request);
	}

	// @ts-expect-error - Returns IframeView synchronously unlike base class Promise<IframeView>
	append(section: Section): IframeView {
		const view = this.createView(section);

		view.on(EVENTS.VIEWS.RESIZED, (_bounds: ReframeBounds) => {
			view.expanded = true;
		});

		view.on(EVENTS.VIEWS.AXIS, (axis: string) => {
			this.updateAxis(axis);
		});

		view.on(EVENTS.VIEWS.WRITING_MODE, (mode: string) => {
			this.updateWritingMode(mode);
		});

		this.views.append(view);

		view.onDisplayed = (view): void => this.afterDisplayed(view);

		return view;
	}

	// @ts-expect-error - Returns IframeView synchronously unlike base class Promise<IframeView>
	prepend(section: Section): IframeView {
		const view = this.createView(section);

		view.on(EVENTS.VIEWS.RESIZED, (_bounds: ReframeBounds) => {
			this.counter(_bounds);
			view.expanded = true;
		});

		view.on(EVENTS.VIEWS.AXIS, (axis: string) => {
			this.updateAxis(axis);
		});

		view.on(EVENTS.VIEWS.WRITING_MODE, (mode: string) => {
			this.updateWritingMode(mode);
		});

		this.views.prepend(view);

		view.onDisplayed = (view): void => this.afterDisplayed(view);

		return view;
	}

	counter(bounds: ReframeBounds): void {
		if(this.settings.axis === "vertical") {
			this.scrollBy(0, bounds.heightDelta, true);
		} else {
			this.scrollBy(bounds.widthDelta, 0, true);
		}
	}

	update(_offset?: number): Promise<void> {
		const container = this.bounds();
		const views = this.views.all();
		const viewsLength = views.length;
		const visible = [];
		const offset = typeof _offset != "undefined" ? _offset : (this.settings.offset || 0);
		let isVisible;
		let view: IframeView;

		const updating = new defer<void>();
		const promises = [];
		for (let i = 0; i < viewsLength; i++) {
			view = views[i]!;

			isVisible = this.isVisible(view, offset, offset, container);

			if(isVisible === true) {
				// console.log("visible " + view.index, view.displayed);

				if (!view.displayed) {
					const displayed = view.display(this.request)
						.then(function (view: IframeView) {
							view.show();
						}, (_err: Error) => {
							view.hide();
						});
					promises.push(displayed);
				} else {
					view.show();
				}
				visible.push(view);
			} else {
				this.q.enqueue(() => view.destroy());
				// console.log("hidden " + view.index, view.displayed);

				clearTimeout(this.trimTimeout);
				this.trimTimeout = setTimeout(() => {
					this.q.enqueue(() => this.trim());
				}, 250);
			}

		}

		if(promises.length){
			return (Promise.all(promises) as unknown as Promise<void>)
				.catch((err: Error) => {
					updating.reject(err);
				});
		} else {
			updating.resolve();
			return updating.promise;
		}

	}

	check(_offsetLeft?: number, _offsetTop?: number): Promise<boolean | void | Error> {
		const checking = new defer<boolean>();
		const newViews: IframeView[] = [];

		const horizontal = (this.settings.axis === "horizontal");
		let delta = this.settings.offset || 0;

		if (_offsetLeft && horizontal) {
			delta = _offsetLeft;
		}

		if (_offsetTop && !horizontal) {
			delta = _offsetTop;
		}

		const bounds = this._bounds; // bounds saved this until resize

		let offset = horizontal ? this.scrollLeft : this.scrollTop;
		const visibleLength = horizontal ? Math.floor(bounds.width) : bounds.height;
		const contentLength = horizontal ? this.container.scrollWidth : this.container.scrollHeight;
		const writingMode = (this.writingMode && this.writingMode.indexOf("vertical") === 0) ? "vertical" : "horizontal";
		const rtlScrollType = this.settings.rtlScrollType;
		const rtl = this.settings.direction === "rtl";

		if (!this.settings.fullsize) {
			// Scroll offset starts at width of element
			if (rtl && rtlScrollType === "default" && writingMode === "horizontal") {
				offset = contentLength - visibleLength - offset;
			}
			// Scroll offset starts at 0 and goes negative
			if (rtl && rtlScrollType === "negative" && writingMode === "horizontal") {
				offset = offset * -1;
			}
		} else {
			// Scroll offset starts at 0 and goes negative
			if ((horizontal && rtl && rtlScrollType === "negative") ||
				(!horizontal && rtl && rtlScrollType === "default")) {
				offset = offset * -1;
			}
		}

		const prepend = (): void => {
			const first = this.views.first();
			const prev = first && first.section.prev?.();

			if(prev) {
				newViews.push(this.prepend(prev));
			}
		};

		const append = (): void => {
			const last = this.views.last();
			const next = last && last.section.next?.();

			if(next) {
				newViews.push(this.append(next));
			}

		};

		const end = offset + visibleLength + delta;
		const start = offset - delta;

		if (end >= contentLength) {
			append();
		}
		
		if (start < 0) {
			prepend();
		}
		

		const promises = newViews.map((view) => {
			return view.display(this.request);
		});

		if(newViews.length){
			return Promise.all(promises)
				.then(() => {
					return this.check();
				})
				.then(() => {
					// Check to see if anything new is on screen after rendering
					return this.update(delta);
				}, (err: Error) => {
					return err;
				});
		} else {
			this.q.enqueue(() => {
				this.update();
			});
			checking.resolve(false);
			return checking.promise;
		}


	}

	trim(): Promise<void> {
		const task = new defer<void>();
		const displayed = this.views.displayed();
		if (!displayed.length) {
			task.resolve();
			return task.promise;
		}
		const first = displayed[0]!;
		const last = displayed[displayed.length-1]!;
		const firstIndex = this.views.indexOf(first);
		const lastIndex = this.views.indexOf(last);
		const above = this.views.slice(0, firstIndex);
		const below = this.views.slice(lastIndex+1);

		// Erase all but last above
		for (let i = 0; i < above.length-1; i++) {
			this.erase(above[i]!, above);
		}

		// Erase all except first below
		for (let j = 1; j < below.length; j++) {
			this.erase(below[j]!);
		}

		task.resolve();
		return task.promise;
	}

	erase(view: IframeView, above?: IframeView[]): void { //Trim

		let prevTop;
		let prevLeft;

		if(!this.settings.fullsize) {
			prevTop = this.container.scrollTop;
			prevLeft = this.container.scrollLeft;
		} else {
			prevTop = window.scrollY;
			prevLeft = window.scrollX;
		}

		const bounds = view.bounds();

		this.views.remove(view);
		
		if(above) {
			if (this.settings.axis === "vertical") {
				this.scrollTo(0, prevTop - bounds.height, true);
			} else {
				if(this.settings.direction === "rtl") {
					if (!this.settings.fullsize) {
						this.scrollTo(prevLeft, 0, true);
					} else {
						this.scrollTo(prevLeft + Math.floor(bounds.width), 0, true);
					}
				} else {
					this.scrollTo(prevLeft - Math.floor(bounds.width), 0, true);
				}
			}
		}

	}

	addEventListeners(_stage?: Stage): void {

		this._onUnload = (_e: Event): void => {
			this.ignore = true;
			// this.scrollTo(0,0);
			this.destroy();
		};
		window.addEventListener("unload", this._onUnload);

		this.addScrollListeners();

		if (this.isPaginated && this.settings.snap) {
			this.snapper = new Snap(this as unknown as DefaultViewManager, (typeof this.settings.snap === "object") ? this.settings.snap as Record<string, unknown> : undefined);
		}
	}

	addScrollListeners(): void {
		let scroller;

		this.tick = requestAnimationFrame;

		const dir = this.settings.direction === "rtl" && this.settings.rtlScrollType === "default" ? -1 : 1;

		this.scrollDeltaVert = 0;
		this.scrollDeltaHorz = 0;

		if(!this.settings.fullsize) {
			scroller = this.container;
			this.scrollTop = this.container.scrollTop;
			this.scrollLeft = this.container.scrollLeft;
		} else {
			scroller = window;
			this.scrollTop = window.scrollY * dir;
			this.scrollLeft = window.scrollX * dir;
		}

		this._onScroll = this.onScroll.bind(this);
		scroller.addEventListener("scroll", this._onScroll);
		this._scrolled = debounce(() => this.scrolled(), 30);
		// this.tick.call(window, this.onScroll.bind(this));

		this.didScroll = false;

	}

	removeEventListeners(): void {
		let scroller;

		if(!this.settings.fullsize) {
			scroller = this.container;
		} else {
			scroller = window;
		}

		scroller.removeEventListener("scroll", this._onScroll!);
		this._onScroll = undefined;

		window.removeEventListener("unload", this._onUnload!);
		this._onUnload = undefined;
	}

	onScroll(): void {
		let scrollTop;
		let scrollLeft;
		const dir = this.settings.direction === "rtl" && this.settings.rtlScrollType === "default" ? -1 : 1;

		if(!this.settings.fullsize) {
			scrollTop = this.container.scrollTop;
			scrollLeft = this.container.scrollLeft;
		} else {
			scrollTop = window.scrollY * dir;
			scrollLeft = window.scrollX * dir;
		}

		this.scrollTop = scrollTop;
		this.scrollLeft = scrollLeft;

		if(!this.ignore) {

			this._scrolled();

		} else {
			this.ignore = false;
		}

		this.scrollDeltaVert += Math.abs(scrollTop-this.prevScrollTop);
		this.scrollDeltaHorz += Math.abs(scrollLeft-this.prevScrollLeft);

		this.prevScrollTop = scrollTop;
		this.prevScrollLeft = scrollLeft;

		clearTimeout(this.scrollTimeout);
		this.scrollTimeout = setTimeout(() => {
			this.scrollDeltaVert = 0;
			this.scrollDeltaHorz = 0;
		}, 150);

		clearTimeout(this.afterScrolled);

		this.didScroll = false;

	}

	scrolled(): void {

		this.q.enqueue(() => {
			return this.check();
		});

		this.emit(EVENTS.MANAGERS.SCROLL, {
			top: this.scrollTop,
			left: this.scrollLeft
		});

		clearTimeout(this.afterScrolled);
		this.afterScrolled = setTimeout(() => {

			// Don't report scroll if we are about the snap
			if (this.snapper && this.snapper.supportsTouch() && this.snapper.needsSnap()) {
				return;
			}

			this.emit(EVENTS.MANAGERS.SCROLLED, {
				top: this.scrollTop,
				left: this.scrollLeft
			});

		}, this.settings.afterScrolledTimeout);
	}

	next(): Promise<void> | undefined {

		const delta = this.layout.props.name === "pre-paginated" &&
								this.layout.props.spread ? this.layout.props.delta * 2 : this.layout.props.delta;

		if(!this.views.length) return undefined;

		if(this.isPaginated && this.settings.axis === "horizontal") {

			this.scrollBy(delta, 0, true);

		} else {

			this.scrollBy(0, this.layout.height, true);

		}

		this.q.enqueue(() => {
			return this.check();
		});
		return undefined;
	}

	prev(): Promise<void> | undefined {

		const delta = this.layout.props.name === "pre-paginated" &&
								this.layout.props.spread ? this.layout.props.delta * 2 : this.layout.props.delta;

		if(!this.views.length) return undefined;

		if(this.isPaginated && this.settings.axis === "horizontal") {

			this.scrollBy(-delta, 0, true);

		} else {

			this.scrollBy(0, -this.layout.height, true);

		}

		this.q.enqueue(() => {
			return this.check();
		});
		return undefined;
	}

	updateFlow(flow: string): void {
		if (this.rendered && this.snapper) {
			this.snapper.destroy();
			this.snapper = undefined;
		}

		super.updateFlow(flow, "scroll");

		if (this.rendered && this.isPaginated && this.settings.snap) {
			this.snapper = new Snap(this as unknown as DefaultViewManager, (typeof this.settings.snap === "object") ? this.settings.snap as Record<string, unknown> : undefined);
		}
	}

	destroy(): void {
		clearTimeout(this.scrollTimeout);
		clearTimeout(this.trimTimeout);

		super.destroy();

		if (this.snapper) {
			this.snapper.destroy();
		}
	}

}

export default ContinuousViewManager;
