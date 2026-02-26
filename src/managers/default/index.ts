import EventEmitter from "../../utils/event-emitter";
import {extend, defer, windowBounds, isNumber} from "../../utils/core";
import scrollType from "../../utils/scrolltype";
import Mapping from "../../mapping";
import Queue from "../../utils/queue";
import Stage from "../helpers/stage";
import Views from "../helpers/views";
import { EVENTS } from "../../utils/constants";
import type Layout from "../../layout";
import type Section from "../../section";
import type Contents from "../../contents";
import type IframeView from "../views/iframe";
import type { IEventEmitter, ManagerOptions, ViewSettings, ViewLocation, RequestFunction, SizeObject, ReframeBounds, LayoutProps } from "../../types";

export interface DefaultManagerEvents extends Record<string, any[]> {
	"resize": [Section];
	"resized": [{ width: number; height: number }, string?];
	"orientationchange": [number];
	"added": [IframeView];
	"scroll": [{ top: number; left: number }];
	"scrolled": [{ top: number; left: number }];
	"removed": [IframeView];
}

class DefaultViewManager implements IEventEmitter<DefaultManagerEvents> {
	name: string;
	optsSettings: ManagerOptions["settings"];
	View: new (section: Section, options?: ViewSettings) => IframeView;
	request: RequestFunction;
	renditionQueue: Queue;
	q: Queue;
	settings: ManagerOptions;
	viewSettings: Omit<ViewSettings, "layout"> & { layout?: Layout | LayoutProps };
	rendered: boolean;
	stage!: Stage;
	container!: HTMLElement;
	views!: Views;
	_bounds!: { left: number; right: number; top: number; bottom: number; width: number; height: number };
	_stageSize: SizeObject | undefined;
	overflow!: string;
	layout!: Layout;
	mapping!: Mapping;
	location!: ViewLocation[];
	isPaginated!: boolean;
	scrollLeft!: number;
	scrollTop!: number;
	ignore!: boolean;
	writingMode!: string;
	_hasScrolled!: boolean;
	_onScroll: ((e?: Event) => void) | undefined;
	_onUnload: ((e: Event) => void) | undefined;
	orientationTimeout: ReturnType<typeof setTimeout> | undefined;
	resizeTimeout!: ReturnType<typeof setTimeout>;
	afterScrolled!: ReturnType<typeof setTimeout>;
	winBounds!: { top: number; left: number; right: number; bottom: number; width: number; height: number };

	declare on: IEventEmitter<DefaultManagerEvents>["on"];
	declare off: IEventEmitter<DefaultManagerEvents>["off"];
	declare emit: IEventEmitter<DefaultManagerEvents>["emit"];
	declare __listeners: IEventEmitter<DefaultManagerEvents>["__listeners"];

	constructor(options: ManagerOptions) {

		this.name = "default";
		this.optsSettings = options.settings;
		this.View = options.view as unknown as new (section: Section, options?: ViewSettings) => IframeView;
		this.request = options.request!;
		this.renditionQueue = options.queue!;
		this.q = new Queue(this);

		this.settings = extend({} as ManagerOptions, {
			infinite: true,
			hidden: false,
			width: undefined,
			height: undefined,
			axis: undefined,
			writingMode: undefined,
			flow: "scrolled",
			ignoreClass: "",
			fullsize: undefined,
			allowScriptedContent: false,
			allowPopups: false
		});

		extend(this.settings, options.settings || {});

		this.viewSettings = {
			ignoreClass: this.settings.ignoreClass,
			axis: this.settings.axis,
			flow: this.settings.flow,
			layout: this.layout,
			method: this.settings.method, // srcdoc, blobUrl, write
			width: 0,
			height: 0,
			forceEvenPages: true,
			allowScriptedContent: this.settings.allowScriptedContent,
			allowPopups: this.settings.allowPopups
		};

		this.rendered = false;

	}

	render(element: HTMLElement, size: SizeObject): void {
		const tag = element.tagName;

		if (typeof this.settings.fullsize === "undefined" &&
				tag && (tag.toLowerCase() == "body" ||
				tag.toLowerCase() == "html")) {
				this.settings.fullsize = true;
		}

		if (this.settings.fullsize) {
			this.settings.overflow = "visible";
			this.overflow = this.settings.overflow;
		}

		this.settings.size = size;

		this.settings.rtlScrollType = scrollType();

		// Save the stage
		this.stage = new Stage({
			width: size.width,
			height: size.height,
			overflow: this.overflow,
			hidden: this.settings.hidden,
			axis: this.settings.axis,
			fullsize: this.settings.fullsize,
			direction: this.settings.direction
		});

		this.stage.attachTo(element);

		// Get this stage container div
		this.container = this.stage.getContainer();

		// Views array methods
		this.views = new Views(this.container);

		// Calculate Stage Size
		this._bounds = this.bounds();
		this._stageSize = this.stage.size();

		// Set the dimensions for views
		this.viewSettings.width = this._stageSize.width;
		this.viewSettings.height = this._stageSize.height;

		// Function to handle a resize event.
		// Will only attach if width and height are both fixed.
		this.stage.onResize(() => this.onResized());

		this.stage.onOrientationChange((e: Event) => this.onOrientationChange(e));

		// Add Event Listeners
		this.addEventListeners();

		// Add Layout method
		// this.applyLayoutMethod();
		if (this.layout) {
			this.updateLayout();
		}

		this.rendered = true;

	}

	addEventListeners(): void {
		let scroller;

		this._onUnload = (_e: Event): void => {
			this.destroy();
		};
		window.addEventListener("unload", this._onUnload);

		if(!this.settings.fullsize) {
			scroller = this.container;
		} else {
			scroller = window;
		}

		this._onScroll = this.onScroll.bind(this);
		scroller.addEventListener("scroll", this._onScroll);
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

	destroy(): void {
		clearTimeout(this.orientationTimeout);
		clearTimeout(this.resizeTimeout);
		clearTimeout(this.afterScrolled);

		this.clear();

		this.removeEventListeners();

		this.stage.destroy();

		this.rendered = false;

		this.__listeners = {};
	}

	onOrientationChange(_e?: Event): void {
		const {orientation} = window;

		if(this.optsSettings?.resizeOnOrientationChange) {
			this.resize();
		}

		// Per ampproject:
		// In IOS 10.3, the measured size of an element is incorrect if the
		// element size depends on window size directly and the measurement
		// happens in window.resize event. Adding a timeout for correct
		// measurement. See https://github.com/ampproject/amphtml/issues/8479
		clearTimeout(this.orientationTimeout);
		this.orientationTimeout = setTimeout(() => {
			this.orientationTimeout = undefined;

			if(this.optsSettings?.resizeOnOrientationChange) {
				this.resize();
			}

			this.emit(EVENTS.MANAGERS.ORIENTATION_CHANGE, orientation);
		}, 500);

	}

	onResized(_e?: Event): void {
		this.resize();
	}

	resize(width?: number, height?: number, epubcfi?: string): void {
		const stageSize = this.stage.size(width, height);

		// For Safari, wait for orientation to catch up
		// if the window is a square
		this.winBounds = windowBounds();
		if (this.orientationTimeout &&
				this.winBounds.width === this.winBounds.height) {
			// reset the stage size for next resize
			this._stageSize = undefined;
			return;
		}

		if (this._stageSize &&
				this._stageSize.width === stageSize.width &&
				this._stageSize.height === stageSize.height ) {
			// Size is the same, no need to resize
			return;
		}

		this._stageSize = stageSize;

		this._bounds = this.bounds();

		// Clear current views
		this.clear();

		// Update for new views
		this.viewSettings.width = this._stageSize.width;
		this.viewSettings.height = this._stageSize.height;

		this.updateLayout();

		this.emit(EVENTS.MANAGERS.RESIZED, {
			width: this._stageSize.width,
			height: this._stageSize.height
		}, epubcfi);
	}

	createView(section: Section, forceRight?: boolean): IframeView {
		return new this.View(section, extend(this.viewSettings as ViewSettings, { forceRight }) );
	}

	handleNextPrePaginated(forceRight: boolean, section: Section, action: (section: Section) => Promise<IframeView>): Promise<IframeView> | undefined {
		let next;

		if (this.layout.name === "pre-paginated" && this.layout.divisor > 1) {
			if (forceRight || section.index === 0) {
				// First page (cover) should stand alone for pre-paginated books
				return undefined;
			}
			next = section.next?.();
			if (next && !next.properties!.includes("page-spread-left")) {
				return action.call(this, next);
			}
		}
		return undefined;
	}

	display(section: Section, target?: string): Promise<void> {

		const displaying = new defer<void>();
		const displayed = displaying.promise;

		// Check if moving to target is needed
		if (target === section.href || isNumber(target)) {
			target = undefined;
		}

		// Check to make sure the section we want isn't already shown
		const visible = this.views.find(section);

		// View is already shown, just move to correct location in view
		if(visible && section && this.layout.name !== "pre-paginated") {
			const offset = visible.offset();

			if (this.settings.direction === "ltr") {
				this.scrollTo(offset.left, offset.top, true);
			} else {
				const width = visible.width();
				this.scrollTo(offset.left + width, offset.top, true);
			}

			if(target) {
				const offset = visible.locationOf(target);
				const width = visible.width();
				this.moveTo(offset, width);
			}

			displaying.resolve();
			return displayed;
		}

		// Hide all current views
		this.clear();

		let forceRight = false;
		if (this.layout.name === "pre-paginated" && this.layout.divisor === 2 && section.properties!.includes("page-spread-right")) {
			forceRight = true;
		}

		this.add(section, forceRight)
			.then((view: IframeView) => {

				// Move to correct place within the section, if needed
				if(target) {
					const offset = view.locationOf(target);
					const width = view.width();
					this.moveTo(offset, width);
				}

			}, (err) => {
				displaying.reject(err);
			})
			.then(() => {
				return this.handleNextPrePaginated(forceRight, section, this.add);
			})
			.then(() => {

				this.views.show();

				displaying.resolve();

			});
		// .then(function(){
		// 	return this.hooks.display.trigger(view);
		// }.bind(this))
		// .then(function(){
		// 	this.views.show();
		// }.bind(this));
		return displayed;
	}

	afterDisplayed(view: IframeView): void {
		this.emit(EVENTS.MANAGERS.ADDED, view);
	}

	afterResized(view: IframeView): void {
		this.emit(EVENTS.MANAGERS.RESIZE, view.section);
	}

	moveTo(offset: { left: number; top: number }, width?: number): void {
		let distX = 0,
				distY = 0;

		if(!this.isPaginated) {
			distY = offset.top;
		} else {
			distX = Math.floor(offset.left / this.layout.delta) * this.layout.delta;

			if (distX + this.layout.delta > this.container.scrollWidth) {
				distX = this.container.scrollWidth - this.layout.delta;
			}

			distY = Math.floor(offset.top / this.layout.height) * this.layout.height;

			if (distY + this.layout.height > this.container.scrollHeight) {
				distY = this.container.scrollHeight - this.layout.height;
			}
		}
		if(this.settings.direction === "rtl"){
			/***
				the `floor` function above (L343) is on positive values, so we should add one `layout.delta`
				to distX or use `Math.ceil` function, or multiply offset.left by -1
				before `Math.floor`
			*/
			distX = distX + this.layout.delta
			distX = distX - width!
		}
		this.scrollTo(distX, distY, true);
	}

	add(section: Section, forceRight?: boolean): Promise<IframeView> {
		const view = this.createView(section, forceRight);

		this.views.append(view);

		// view.on(EVENTS.VIEWS.SHOWN, this.afterDisplayed.bind(this));
		view.onDisplayed = (view): void => this.afterDisplayed(view);
		view.onResize = (view): void => this.afterResized(view);

		view.on(EVENTS.VIEWS.AXIS, (axis: string) => {
			this.updateAxis(axis);
		});

		view.on(EVENTS.VIEWS.WRITING_MODE, (mode: string) => {
			this.updateWritingMode(mode);
		});

		return view.display(this.request);
	}

	append(section: Section, forceRight?: boolean): Promise<IframeView> {
		const view = this.createView(section, forceRight);
		this.views.append(view);

		view.onDisplayed = (view): void => this.afterDisplayed(view);
		view.onResize = (view): void => this.afterResized(view);

		view.on(EVENTS.VIEWS.AXIS, (axis: string) => {
			this.updateAxis(axis);
		});

		view.on(EVENTS.VIEWS.WRITING_MODE, (mode: string) => {
			this.updateWritingMode(mode);
		});

		return view.display(this.request);
	}

	prepend(section: Section, forceRight?: boolean): Promise<IframeView> {
		const view = this.createView(section, forceRight);

		view.on(EVENTS.VIEWS.RESIZED, (bounds: ReframeBounds) => {
			this.counter(bounds);
		});

		this.views.prepend(view);

		view.onDisplayed = (view): void => this.afterDisplayed(view);
		view.onResize = (view): void => this.afterResized(view);

		view.on(EVENTS.VIEWS.AXIS, (axis: string) => {
			this.updateAxis(axis);
		});

		view.on(EVENTS.VIEWS.WRITING_MODE, (mode: string) => {
			this.updateWritingMode(mode);
		});

		return view.display(this.request);
	}

	counter(bounds: ReframeBounds): void {
		if(this.settings.axis === "vertical") {
			this.scrollBy(0, bounds.heightDelta, true);
		} else {
			this.scrollBy(bounds.widthDelta, 0, true);
		}

	}

	// resizeView(view) {
	//
	// 	if(this.settings.globalLayoutProperties.layout === "pre-paginated") {
	// 		view.lock("both", this.bounds.width, this.bounds.height);
	// 	} else {
	// 		view.lock("width", this.bounds.width, this.bounds.height);
	// 	}
	//
	// };

	next(): Promise<void> | undefined {
		let next: Section | undefined;
		let left;

		const dir = this.settings.direction;

		if(!this.views.length) return undefined;

		if(this.isPaginated && this.settings.axis === "horizontal" && (!dir || dir === "ltr")) {

			this.scrollLeft = this.container.scrollLeft;

			left = this.container.scrollLeft + this.container.offsetWidth + this.layout.delta;

			if(left <= this.container.scrollWidth) {
				this.scrollBy(this.layout.delta, 0, true);
			} else {
				// Re-expand to get accurate dimensions before jumping to next section.
				// On some platforms (Android Chrome/Brave), the initial expand() during
				// render may measure before CSS column layout fully settles, causing
				// scrollWidth to be one page too narrow.
				const view = this.views.last();
				if (view) {
					view.expand();
				}
				left = this.container.scrollLeft + this.container.offsetWidth + this.layout.delta;
				if (left <= this.container.scrollWidth) {
					this.scrollBy(this.layout.delta, 0, true);
				} else {
					next = view?.section.next?.();
				}
			}
		} else if (this.isPaginated && this.settings.axis === "horizontal" && dir === "rtl") {

			this.scrollLeft = this.container.scrollLeft;

			if (this.settings.rtlScrollType === "default"){
				left = this.container.scrollLeft;

				if (left > 0) {
					this.scrollBy(this.layout.delta, 0, true);
				} else {
					const view = this.views.last();
					if (view) {
						view.expand();
					}
					left = this.container.scrollLeft;
					if (left > 0) {
						this.scrollBy(this.layout.delta, 0, true);
					} else {
						next = view?.section.next?.();
					}
				}
			} else {
				left = this.container.scrollLeft + ( this.layout.delta * -1 );

				if (left > this.container.scrollWidth * -1){
					this.scrollBy(this.layout.delta, 0, true);
				} else {
					const view = this.views.last();
					if (view) {
						view.expand();
					}
					left = this.container.scrollLeft + ( this.layout.delta * -1 );
					if (left > this.container.scrollWidth * -1) {
						this.scrollBy(this.layout.delta, 0, true);
					} else {
						next = view?.section.next?.();
					}
				}
			}

		} else if (this.isPaginated && this.settings.axis === "vertical") {

			this.scrollTop = this.container.scrollTop;

			const reachedBottom = Math.abs(this.container.scrollHeight - this.container.clientHeight - this.container.scrollTop) < 1;

			if(!reachedBottom) {
				this.scrollBy(0, this.layout.height, true);
			} else {
				const view = this.views.last();
				if (view) {
					view.expand();
				}
				const reachedBottomAfterExpand = Math.abs(this.container.scrollHeight - this.container.clientHeight - this.container.scrollTop) < 1;
				if (!reachedBottomAfterExpand) {
					this.scrollBy(0, this.layout.height, true);
				} else {
					next = view?.section.next?.();
				}
			}

		} else {
			next = this.views.last()!.section.next?.();
		}

		if(next) {
			this.clear();
			// The new section may have a different writing-mode from the old section. Thus, we need to update layout.
			this.updateLayout();

			let forceRight = false;
			if (this.layout.name === "pre-paginated" && this.layout.divisor === 2 && next.properties!.includes("page-spread-right")) {
				forceRight = true;
			}

			return this.append(next, forceRight)
				.then(() => {
					return this.handleNextPrePaginated(forceRight, next, this.append);
				}, (err) => {
					return err;
				})
				.then(() => {

					// Reset position to start for scrolled-doc vertical-rl in default mode
					if (!this.isPaginated &&
						this.settings.axis === "horizontal" &&
						this.settings.direction === "rtl" &&
						this.settings.rtlScrollType === "default") {

						this.scrollTo(this.container.scrollWidth, 0, true);
					}
					this.views.show();
				});
		}
		return undefined;

	}

	prev(): Promise<void> | undefined {
		let prev: Section | undefined;
		let left;
		const dir = this.settings.direction;

		if(!this.views.length) return undefined;

		if(this.isPaginated && this.settings.axis === "horizontal" && (!dir || dir === "ltr")) {

			this.scrollLeft = this.container.scrollLeft;

			left = this.container.scrollLeft;

			if(left > 0) {
				this.scrollBy(-this.layout.delta, 0, true);
			} else {
				const view = this.views.first();
				if (view) {
					view.expand();
				}
				left = this.container.scrollLeft;
				if (left > 0) {
					this.scrollBy(-this.layout.delta, 0, true);
				} else {
					prev = view?.section.prev?.();
				}
			}

		} else if (this.isPaginated && this.settings.axis === "horizontal" && dir === "rtl") {

			this.scrollLeft = this.container.scrollLeft;

			if (this.settings.rtlScrollType === "default"){
				left = this.container.scrollLeft + this.container.offsetWidth;

				if (left < this.container.scrollWidth) {
					this.scrollBy(-this.layout.delta, 0, true);
				} else {
					const view = this.views.first();
					if (view) {
						view.expand();
					}
					left = this.container.scrollLeft + this.container.offsetWidth;
					if (left < this.container.scrollWidth) {
						this.scrollBy(-this.layout.delta, 0, true);
					} else {
						prev = view?.section.prev?.();
					}
				}
			}
			else{
				left = this.container.scrollLeft;

				if (left < 0) {
					this.scrollBy(-this.layout.delta, 0, true);
				} else {
					const view = this.views.first();
					if (view) {
						view.expand();
					}
					left = this.container.scrollLeft;
					if (left < 0) {
						this.scrollBy(-this.layout.delta, 0, true);
					} else {
						prev = view?.section.prev?.();
					}
				}
			}

		} else if (this.isPaginated && this.settings.axis === "vertical") {

			this.scrollTop = this.container.scrollTop;

			const top = this.container.scrollTop;

			if(top > 0) {
				this.scrollBy(0, -(this.layout.height), true);
			} else {
				const view = this.views.first();
				if (view) {
					view.expand();
				}
				const topAfterExpand = this.container.scrollTop;
				if (topAfterExpand > 0) {
					this.scrollBy(0, -(this.layout.height), true);
				} else {
					prev = view?.section.prev?.();
				}
			}

		} else {

			prev = this.views.first()!.section.prev?.();

		}

		if(prev) {
			this.clear();
			// The new section may have a different writing-mode from the old section. Thus, we need to update layout.
			this.updateLayout();

			let forceRight = false;
			if (this.layout.name === "pre-paginated" && this.layout.divisor === 2 && typeof prev.prev?.() !== "object") {
				forceRight = true;
			}

			return this.prepend(prev, forceRight)
				.then(() => {
					if (this.layout.name === "pre-paginated" && this.layout.divisor > 1) {
						const left = prev.prev?.();
						if (left) {
							return this.prepend(left);
						}
					}
					return undefined;
				}, (err) => {
					return err;
				})
				.then(() => {
					if(this.isPaginated && this.settings.axis === "horizontal") {
						if (this.settings.direction === "rtl") {
							if (this.settings.rtlScrollType === "default"){
								this.scrollTo(0, 0, true);
							}
							else{
								this.scrollTo((this.container.scrollWidth * -1) + this.layout.delta, 0, true);
							}
						} else {
							this.scrollTo(this.container.scrollWidth - this.layout.delta, 0, true);
						}
					}
					this.views.show();
				});
		}
		return undefined;
	}

	current(): IframeView | null {
		const visible = this.visible();
		if(visible.length){
			// Current is the last visible view
			return visible[visible.length-1]!;
		}
		return null;
	}

	clear (): void {

		// this.q.clear();

		if (this.views) {
			this.views.hide();
			this.scrollTo(0,0, true);
			this.views.clear();
		}
	}

	currentLocation(): ViewLocation[] {
		this.updateLayout();
		if (this.isPaginated && this.settings.axis === "horizontal") {
			this.location = this.paginatedLocation();
		} else {
			this.location = this.scrolledLocation();
		}
		return this.location;
	}

	scrolledLocation(): ViewLocation[] {
		const visible = this.visible();
		const container = this.container.getBoundingClientRect();
		const pageHeight = (container.height < window.innerHeight) ? container.height : window.innerHeight;
		const pageWidth = (container.width < window.innerWidth) ? container.width : window.innerWidth;
		const vertical = (this.settings.axis === "vertical");
		const _rtl =  (this.settings.direction === "rtl");
		
		let offset = 0;
		const used = 0;

		if(this.settings.fullsize) {
			offset = vertical ? window.scrollY : window.scrollX;
		}

		const sections = visible.map((view) => {
			const index = view.section.index!;
			const href = view.section.href!;
			const position = view.position();
			const width = view.width();
			const height = view.height();

			let startPos;
			let endPos;
			let stopPos;
			let totalPages;

			if (vertical) {
				startPos = offset + container.top - position.top + used;
				endPos = startPos + pageHeight - used;
				totalPages = this.layout.count(height, pageHeight).pages;
				stopPos = pageHeight;
			} else {
				startPos = offset + container.left - position.left + used;
				endPos = startPos + pageWidth - used;
				totalPages = this.layout.count(width, pageWidth).pages;
				stopPos = pageWidth;
			}

			let currPage = Math.ceil(startPos / stopPos);
			let pages = [];
			let endPage = Math.ceil(endPos / stopPos);

			// Reverse page counts for horizontal rtl
			if (this.settings.direction === "rtl" && !vertical) {
				const tempStartPage = currPage;
				currPage = totalPages - endPage;
				endPage = totalPages - tempStartPage;
			}

			pages = [];
			for (let i = currPage; i <= endPage; i++) {
				const pg = i + 1;
				pages.push(pg);
			}

			const mapping = this.mapping.page(view.contents!, view.section.cfiBase!, startPos, endPos);

			return {
				index,
				href,
				pages,
				totalPages,
				mapping: mapping!
			};
		});

		return sections;
	}

	paginatedLocation(): ViewLocation[] {
		const visible = this.visible();
		const container = this.container.getBoundingClientRect();

		let left = 0;
		let used = 0;

		if(this.settings.fullsize) {
			left = window.scrollX;
		}

		const sections = visible.map((view) => {
			const index = view.section.index!;
			const href = view.section.href!;
			let offset;
			const position = view.position();
			const width = view.width();

			// Find mapping
			let start;
			let end;
			let pageWidth;

			if (this.settings.direction === "rtl") {
				offset = container.right - left;
				pageWidth = Math.min(Math.abs(offset - position.left), this.layout.width) - used;
				end = position.width - (position.right - offset) - used;
				start = end - pageWidth;
			} else {
				offset = container.left + left;
				pageWidth = Math.min(position.right - offset, this.layout.width) - used;
				start = offset - position.left + used;
				end = start + pageWidth;
			}

			used += pageWidth;

			const mapping = this.mapping.page(view.contents!, view.section.cfiBase!, start, end);

			const totalPages = this.layout.count(width).pages;
			let startPage = Math.floor(start / this.layout.pageWidth);
			const pages = [];
			let endPage = Math.floor(end / this.layout.pageWidth);

			// start page should not be negative
			if (startPage < 0) {
				startPage = 0;
				endPage = endPage + 1;
			}

			// Reverse page counts for rtl
			if (this.settings.direction === "rtl") {
				const tempStartPage = startPage;
				startPage = totalPages - endPage;
				endPage = totalPages - tempStartPage;
			}


			for (let i = startPage + 1; i <= endPage; i++) {
				const pg = i;
				pages.push(pg);
			}

			return {
				index,
				href,
				pages,
				totalPages,
				mapping: mapping!
			};
		});

		return sections;
	}

	isVisible(view: IframeView, offsetPrev: number, offsetNext: number, _container?: { left: number; right: number; top: number; bottom: number; width: number; height: number }): boolean {
		const position = view.position();
		const container = _container || this.bounds();

		if(this.settings.axis === "horizontal" &&
			position.right > container.left - offsetPrev &&
			position.left < container.right + offsetNext) {

			return true;

		} else if(this.settings.axis === "vertical" &&
			position.bottom > container.top - offsetPrev &&
			position.top < container.bottom + offsetNext) {

			return true;
		}

		return false;

	}

	visible(): IframeView[] {
		const container = this.bounds();
		const views = this.views.displayed();
		const viewsLength = views.length;
		const visible = [];
		let isVisible;
		let view;

		for (let i = 0; i < viewsLength; i++) {
			view = views[i]!;
			isVisible = this.isVisible(view, 0, 0, container);

			if(isVisible === true) {
				visible.push(view);
			}

		}
		return visible;
	}

	scrollBy(x: number, y: number, silent?: boolean): void {
		const dir = this.settings.direction === "rtl" ? -1 : 1;

		if(silent) {
			this.ignore = true;
		}

		if(!this.settings.fullsize) {
			if(x) this.container.scrollLeft += x * dir;
			if(y) this.container.scrollTop += y;
		} else {
			window.scrollBy(x * dir, y * dir);
		}
		this._hasScrolled = true;
	}

	scrollTo(x: number, y: number, silent?: boolean): void {
		if(silent) {
			this.ignore = true;
		}

		if(!this.settings.fullsize) {
			this.container.scrollLeft = x;
			this.container.scrollTop = y;
		} else {
			window.scrollTo(x,y);
		}
		this._hasScrolled = true;
	}

	onScroll(): void {
		let scrollTop;
		let scrollLeft;

		if(!this.settings.fullsize) {
			scrollTop = this.container.scrollTop;
			scrollLeft = this.container.scrollLeft;
		} else {
			scrollTop = window.scrollY;
			scrollLeft = window.scrollX;
		}

		this.scrollTop = scrollTop;
		this.scrollLeft = scrollLeft;

		if(!this.ignore) {
			this.emit(EVENTS.MANAGERS.SCROLL, {
				top: scrollTop,
				left: scrollLeft
			});

			clearTimeout(this.afterScrolled);
			this.afterScrolled = setTimeout(() => {
				this.emit(EVENTS.MANAGERS.SCROLLED, {
					top: this.scrollTop,
					left: this.scrollLeft
				});
			}, 20);



		} else {
			this.ignore = false;
		}

	}

	bounds(): { left: number; right: number; top: number; bottom: number; width: number; height: number } {
		const bounds = this.stage.bounds();

		return bounds as { left: number; right: number; top: number; bottom: number; width: number; height: number };
	}

	applyLayout(layout: Layout): void {

		this.layout = layout;
		this.updateLayout();
		if (this.views && this.views.length > 0 && this.layout.name === "pre-paginated") {
			this.display(this.views.first()!.section);
		}
		 // this.manager.layout(this.layout.format);
	}

	updateLayout(): void {

		if (!this.stage) {
			return;
		}

		this._stageSize = this.stage.size();

		if(!this.isPaginated) {
			this.layout.calculate(this._stageSize.width, this._stageSize.height);
		} else {
			this.layout.calculate(
				this._stageSize.width,
				this._stageSize.height,
				this.settings.gap
			);

			// Set the look ahead offset for what is visible
			this.settings.offset = this.layout.delta / this.layout.divisor;

			// this.stage.addStyleRules("iframe", [{"margin-right" : this.layout.gap + "px"}]);

		}

		// Set the dimensions for views
		this.viewSettings.width = this.layout.width;
		this.viewSettings.height = this.layout.height;

		this.setLayout(this.layout);
	}

	setLayout(layout: Layout): void {

		this.viewSettings.layout = layout;

		this.mapping = new Mapping(layout.props, this.settings.direction, this.settings.axis);

		if(this.views) {

			this.views.forEach((view: IframeView) => {
				if (view) {
					view.setLayout(layout);
				}
			});

		}

	}

	updateWritingMode(mode: string): void {
		this.writingMode = mode;
	}

	updateAxis(axis: string, forceUpdate?: boolean): void {

		if (!forceUpdate && axis === this.settings.axis) {
			return;
		}

		this.settings.axis = axis;

		this.stage && this.stage.axis(axis);

		this.viewSettings.axis = axis;

		if (this.mapping) {
			this.mapping = new Mapping(this.layout.props, this.settings.direction, this.settings.axis);
		}

		if (this.layout) {
			if (axis === "vertical") {
				this.layout.spread("none");
			} else {
				this.layout.spread(this.layout.settings.spread);
			}
		}
	}

	updateFlow(flow: string, defaultScrolledOverflow: string = "auto"): void {
		const isPaginated = (flow === "paginated" || flow === "auto");

		this.isPaginated = isPaginated;

		if (flow === "scrolled-doc" ||
				flow === "scrolled-continuous" ||
				flow === "scrolled") {
			this.updateAxis("vertical");
		} else {
			this.updateAxis("horizontal");
		}

		this.viewSettings.flow = flow;

		if (!this.settings.overflow) {
			this.overflow = isPaginated ? "hidden" : defaultScrolledOverflow;
		} else {
			this.overflow = this.settings.overflow;
		}

		this.stage && this.stage.overflow(this.overflow);

		this.updateLayout();

	}

	getContents(): Contents[] {
		const contents: Contents[] = [];
		if (!this.views) {
			return contents;
		}
		this.views.forEach((view: IframeView) => {
			const viewContents = view && view.contents;
			if (viewContents) {
				contents.push(viewContents);
			}
		});
		return contents;
	}

	direction(dir: string = "ltr"): void {
		this.settings.direction = dir;

		this.stage && this.stage.direction(dir);

		this.viewSettings.direction = dir;

		this.updateLayout();
	}

	isRendered(): boolean {
		return this.rendered;
	}
}

//-- Enable binding events to Manager
EventEmitter(DefaultViewManager.prototype);

export default DefaultViewManager;
