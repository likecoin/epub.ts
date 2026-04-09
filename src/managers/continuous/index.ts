import {extend, defer} from "../../utils/core";
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
	scrollDeltaVert!: number;
	scrollDeltaHorz!: number;
	_scrolled!: (...args: unknown[]) => void;
	didScroll!: boolean;
	prevScrollTop!: number;
	prevScrollLeft!: number;
	scrollTimeout!: ReturnType<typeof setTimeout>;
	trimTimeout!: ReturnType<typeof setTimeout>;
	private _filling: boolean = false;

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

	async fill(): Promise<void> {
		this._filling = true;
		let result: boolean | void | Error = true;
		while (result) {
			result = await this.q.enqueue(() => {
				return this.check();
			});
		}
		this._filling = false;
	}

	moveTo(offset: { left: number; top: number }): void {
		let distX = 0;
		let distY = 0;

		if(!this.isPaginated) {
			distY = offset.top;
		} else {
			distX = Math.floor(offset.left / this.layout.delta) * this.layout.delta;
		}

		if (distX > 0 || distY > 0) {
			this.scrollBy(distX, distY, true);
		}
	}

	afterResized(view: IframeView): void {
		this.emit(EVENTS.MANAGERS.RESIZE, view.section);
	}

	removeShownListeners(view: IframeView): void {
		view.onDisplayed = function(): void {};
	}

	private setupViewListeners(view: IframeView, onResized?: (bounds: ReframeBounds) => void): void {
		view.on(EVENTS.VIEWS.RESIZED, (_bounds: ReframeBounds) => {
			onResized?.(_bounds);
			view.expanded = true;
		});

		view.on(EVENTS.VIEWS.AXIS, (axis: string) => {
			this.updateAxis(axis);
		});

		view.on(EVENTS.VIEWS.WRITING_MODE, (mode: string) => {
			this.updateWritingMode(mode);
		});

		view.onDisplayed = (v): void => this.afterDisplayed(v);
	}

	add(section: Section): Promise<IframeView> {
		const view = this.createView(section);

		this.views.append(view);
		this.setupViewListeners(view);
		view.onResize = (v): void => this.afterResized(v);

		return view.display(this.request);
	}

	append(section: Section): Promise<IframeView> {
		const view = this.createView(section);

		this.setupViewListeners(view);
		this.views.append(view);

		return Promise.resolve(view);
	}

	prepend(section: Section): Promise<IframeView> {
		const view = this.createView(section);

		this.setupViewListeners(view, (bounds) => this.counter(bounds));
		this.views.prepend(view);

		return Promise.resolve(view);
	}

	counter(bounds: ReframeBounds): void {
		if(this.settings.axis === "vertical") {
			this.scrollBy(0, bounds.heightDelta, true);
		} else {
			this.scrollBy(bounds.widthDelta, 0, true);
		}
		// Sync cached scroll position so check() reads correct values
		if (!this.settings.fullsize) {
			this.scrollTop = this.container.scrollTop;
			this.scrollLeft = this.container.scrollLeft;
		} else {
			const dir = this.settings.direction === "rtl" && this.settings.rtlScrollType === "default" ? -1 : 1;
			this.scrollTop = window.scrollY * dir;
			this.scrollLeft = window.scrollX * dir;
		}
	}

	update(_offset?: number): Promise<void> {
		const container = this.bounds();
		const views = this.views.all();
		const viewsLength = views.length;
		const offset = typeof _offset !== "undefined" ? _offset : (this.settings.offset || 0);

		const updating = new defer<void>();
		const promises: Promise<void>[] = [];
		for (let i = 0; i < viewsLength; i++) {
			const view = views[i]!;
			const isVisible = this.isVisible(view, offset, offset, container);

			if(isVisible) {
				if (!view.displayed) {
					const displayed = view.display(this.request)
						.then(function (v: IframeView) {
							v.show();
						}, (_err: Error) => {
							view.hide();
						});
					promises.push(displayed);
				} else {
					view.show();
				}
			} else {
				// Don't touch views during fill — scroll positions may be stale.
				// Only hide (not destroy) off-screen views so they can be
				// re-shown instantly if the user scrolls back. trim() handles
				// actual cleanup on a delay.
				if (!this._filling && view.displayed) {
					view.hide();

					clearTimeout(this.trimTimeout);
					this.trimTimeout = setTimeout(() => {
						this.q.enqueue(() => this.trim());
					}, 250);
				}
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
		const newViews: Promise<IframeView>[] = [];

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
			if (rtl && rtlScrollType === "default" && writingMode === "horizontal") {
				offset = contentLength - visibleLength - offset;
			}
			if (rtl && rtlScrollType === "negative" && writingMode === "horizontal") {
				offset = offset * -1;
			}
		} else {
			if ((horizontal && rtl && rtlScrollType === "negative") ||
				(!horizontal && rtl && rtlScrollType === "default")) {
				offset = offset * -1;
			}
		}

		const end = offset + visibleLength + delta;
		const start = offset - delta;

		if (end >= contentLength) {
			const last = this.views.last();
			const next = last && last.section.next?.();
			if(next) {
				newViews.push(this.append(next));
			}
		}

		if (start < 0) {
			const first = this.views.first();
			const prev = first && first.section.prev?.();
			if(prev) {
				newViews.push(this.prepend(prev));
			}
		}

		const promises = newViews.map((viewPromise) => {
			return viewPromise.then((view) => view.display(this.request));
		});

		if(newViews.length){
			return Promise.all(promises)
				.then(() => {
					return this.check();
				})
				.then(() => {
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

		const lastView = this.views.last();
		const firstView = this.views.first();
		const isAtEnd = lastView && !lastView.section.next?.();
		const isAtStart = firstView && !firstView.section.prev?.();

		// Keep more buffer views when at the boundaries of the book
		const keepAbove = isAtEnd ? 2 : 1;
		const keepBelow = isAtStart ? 2 : 1;

		for (let i = 0; i < above.length - keepAbove; i++) {
			this.erase(above[i]!, above);
		}

		for (let j = keepBelow; j < below.length; j++) {
			this.erase(below[j]!);
		}

		task.resolve();
		return task.promise;
	}

	erase(view: IframeView, above?: IframeView[]): void {
		const prevTop = !this.settings.fullsize ? this.container.scrollTop : window.scrollY;
		const prevLeft = !this.settings.fullsize ? this.container.scrollLeft : window.scrollX;

		const bounds = view.bounds();
		this.views.remove(view);

		if(above) {
			if (this.settings.axis === "vertical") {
				this.scrollTo(0, prevTop - bounds.height, true);
			} else if(this.settings.direction === "rtl") {
				this.scrollTo(this.settings.fullsize ? prevLeft + Math.floor(bounds.width) : prevLeft, 0, true);
			} else {
				this.scrollTo(prevLeft - Math.floor(bounds.width), 0, true);
			}
		}
	}

	addEventListeners(_stage?: Stage): void {
		this._onUnload = (_e: Event): void => {
			this.ignore = true;
			this.destroy();
		};
		window.addEventListener("unload", this._onUnload);

		this.addScrollListeners();

		if (this.isPaginated && this.settings.snap) {
			this.snapper = new Snap(this as unknown as DefaultViewManager, (typeof this.settings.snap === "object") ? this.settings.snap as Record<string, unknown> : undefined);
		}
	}

	addScrollListeners(): void {
		const dir = this.settings.direction === "rtl" && this.settings.rtlScrollType === "default" ? -1 : 1;

		this.scrollDeltaVert = 0;
		this.scrollDeltaHorz = 0;

		const scroller = !this.settings.fullsize ? this.container : window;
		if(!this.settings.fullsize) {
			this.scrollTop = this.container.scrollTop;
			this.scrollLeft = this.container.scrollLeft;
		} else {
			this.scrollTop = window.scrollY * dir;
			this.scrollLeft = window.scrollX * dir;
		}

		this._onScroll = this.onScroll.bind(this);
		scroller.addEventListener("scroll", this._onScroll);
		this._scrolled = debounce(() => this.scrolled(), 30);

		this.didScroll = false;
	}

	removeEventListeners(): void {
		const scroller = !this.settings.fullsize ? this.container : window;
		scroller.removeEventListener("scroll", this._onScroll!);
		this._onScroll = undefined;

		window.removeEventListener("unload", this._onUnload!);
		this._onUnload = undefined;
	}

	onScroll(): void {
		const dir = this.settings.direction === "rtl" && this.settings.rtlScrollType === "default" ? -1 : 1;

		const scrollTop = !this.settings.fullsize ? this.container.scrollTop : window.scrollY * dir;
		const scrollLeft = !this.settings.fullsize ? this.container.scrollLeft : window.scrollX * dir;

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
