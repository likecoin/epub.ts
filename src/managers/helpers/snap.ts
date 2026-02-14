import {extend, defer} from "../../utils/core";
import { EVENTS } from "../../utils/constants";
import EventEmitter from "../../utils/event-emitter";
import type { IEventEmitter } from "../../types";
import type DefaultViewManager from "../default/index";
import type Contents from "../../contents";
import type Layout from "../../layout";

// easing equations from https://github.com/danro/easing-js/blob/master/easing.js
const PI_D2 = (Math.PI / 2);
const EASING_EQUATIONS = {
		easeOutSine: function (pos: number): number {
				return Math.sin(pos * PI_D2);
		},
		easeInOutSine: function (pos: number): number {
				return (-0.5 * (Math.cos(Math.PI * pos) - 1));
		},
		easeInOutQuint: function (pos: number): number {
				if ((pos /= 0.5) < 1) {
						return 0.5 * Math.pow(pos, 5);
				}
				return 0.5 * (Math.pow((pos - 2), 5) + 2);
		},
		easeInCubic: function(pos: number): number {
			return Math.pow(pos, 3);
  	}
};

class Snap implements IEventEmitter {
	settings: { duration: number; minVelocity: number; minDistance: number; easing: (pos: number) => number; [key: string]: any };
	manager!: DefaultViewManager;
	layout!: Layout;
	fullsize!: boolean;
	element!: HTMLElement;
	_supportsTouch: boolean | undefined;
	scroller: HTMLElement | Window | undefined;
	isVertical!: boolean;
	touchCanceler!: boolean;
	resizeCanceler!: boolean;
	snapping!: boolean;
	scrollLeft!: number;
	scrollTop!: number;
	startTouchX: number | undefined;
	startTouchY: number | undefined;
	startTime: number | undefined;
	endTouchX: number | undefined;
	endTouchY: number | undefined;
	endTime: number | undefined;
	_onResize: ((...args: any[]) => void) | undefined;
	_onScroll: ((...args: any[]) => void) | undefined;
	_onTouchStart: ((...args: any[]) => void) | undefined;
	_onTouchMove: ((...args: any[]) => void) | undefined;
	_onTouchEnd: ((...args: any[]) => void) | undefined;
	_afterDisplayed: ((...args: any[]) => void) | undefined;

	declare on: IEventEmitter["on"];
	declare off: IEventEmitter["off"];
	declare emit: IEventEmitter["emit"];

	constructor(manager: DefaultViewManager, options?: Record<string, any>) {

		this.settings = extend({
			duration: 80,
			minVelocity: 0.2,
			minDistance: 10,
			easing: EASING_EQUATIONS["easeInCubic"]
		}, options || {});

		this._supportsTouch = this.supportsTouch();

		if (this._supportsTouch) {
			this.setup(manager);
		}
	}

	setup(manager: DefaultViewManager): void {
		this.manager = manager;

		this.layout = this.manager.layout;

		this.fullsize = this.manager.settings.fullsize ?? false;
		if (this.fullsize) {
			this.element = this.manager.stage.element;
			this.scroller = window;
			this.disableScroll();
		} else {
			this.element = this.manager.stage.container;
			this.scroller = this.element;
			(this.element.style as any)["WebkitOverflowScrolling"] = "touch";
		}

		// this.overflow = this.manager.overflow;

		// set lookahead offset to page width
		this.manager.settings.offset = this.layout.width;
		this.manager.settings.afterScrolledTimeout = this.settings.duration * 2;

		this.isVertical = this.manager.settings.axis === "vertical";

		// disable snapping if not paginated or axis in not horizontal
		if (!this.manager.isPaginated || this.isVertical) {
			return;
		}

		this.touchCanceler = false;
		this.resizeCanceler = false;
		this.snapping = false;


		this.scrollLeft;
		this.scrollTop;

		this.startTouchX = undefined;
		this.startTouchY = undefined;
		this.startTime = undefined;
		this.endTouchX = undefined;
		this.endTouchY = undefined;
		this.endTime = undefined;

		this.addListeners();
	}

	supportsTouch(): boolean {
		if (("ontouchstart" in window) || (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch) {
			return true;
		}

		return false;
	}

	disableScroll(): void {
		this.element.style.overflow = "hidden";
	}

	enableScroll(): void {
		this.element.style.overflow = "";
	}

	addListeners(): void {
		this._onResize = this.onResize.bind(this);
		window.addEventListener("resize", this._onResize);

		this._onScroll = this.onScroll.bind(this);
		this.scroller!.addEventListener("scroll", this._onScroll);

		this._onTouchStart = this.onTouchStart.bind(this);
		this.scroller!.addEventListener("touchstart", this._onTouchStart, { passive: true });
		this.on("touchstart", this._onTouchStart);

		this._onTouchMove = this.onTouchMove.bind(this);
		this.scroller!.addEventListener("touchmove", this._onTouchMove, { passive: true });
		this.on("touchmove", this._onTouchMove);

		this._onTouchEnd = this.onTouchEnd.bind(this);
		this.scroller!.addEventListener("touchend", this._onTouchEnd, { passive: true });
		this.on("touchend", this._onTouchEnd);

		this._afterDisplayed = this.afterDisplayed.bind(this);
		this.manager.on(EVENTS.MANAGERS.ADDED, this._afterDisplayed);
	}

	removeListeners(): void {
		window.removeEventListener("resize", this._onResize!);
		this._onResize = undefined;

		this.scroller!.removeEventListener("scroll", this._onScroll!);
		this._onScroll = undefined;

		this.scroller!.removeEventListener("touchstart", this._onTouchStart!, { passive: true } as EventListenerOptions);
		this.off("touchstart", this._onTouchStart!);
		this._onTouchStart = undefined;

		this.scroller!.removeEventListener("touchmove", this._onTouchMove!, { passive: true } as EventListenerOptions);
		this.off("touchmove", this._onTouchMove!);
		this._onTouchMove = undefined;

		this.scroller!.removeEventListener("touchend", this._onTouchEnd!, { passive: true } as EventListenerOptions);
		this.off("touchend", this._onTouchEnd!);
		this._onTouchEnd = undefined;

		this.manager.off(EVENTS.MANAGERS.ADDED, this._afterDisplayed!);
		this._afterDisplayed = undefined;
	}

	afterDisplayed(view: { contents: Contents }): void {
		const contents = view.contents;
		["touchstart", "touchmove", "touchend"].forEach((e) => {
			contents.on(e, (ev: TouchEvent) => this.triggerViewEvent(ev, contents));
		});
	}

	triggerViewEvent(e: TouchEvent, contents: Contents): void {
		this.emit(e.type, e, contents);
	}

	onScroll(_e?: Event): void {
		this.scrollLeft = this.fullsize ? window.scrollX : (this.scroller as HTMLElement).scrollLeft;
		this.scrollTop = this.fullsize ? window.scrollY : (this.scroller as HTMLElement).scrollTop;
	}

	onResize(_e?: Event): void {
		this.resizeCanceler = true;
	}

	onTouchStart(e: TouchEvent): void {
		const { screenX, screenY } = e.touches[0]!;

		if (this.fullsize) {
			this.enableScroll();
		}

		this.touchCanceler = true;

		if (!this.startTouchX) {
			this.startTouchX = screenX;
			this.startTouchY = screenY;
			this.startTime = this.now();
		}

		this.endTouchX = screenX;
		this.endTouchY = screenY;
		this.endTime = this.now();
	}

	onTouchMove(e: TouchEvent): void {
		const { screenX, screenY } = e.touches[0]!;
		const deltaY = Math.abs(screenY - this.endTouchY!);

		this.touchCanceler = true;


		if (!this.fullsize && deltaY < 10) {
			this.element.scrollLeft -= screenX - this.endTouchX!;
		}

		this.endTouchX = screenX;
		this.endTouchY = screenY;
		this.endTime = this.now();
	}

	onTouchEnd(_e?: TouchEvent): void {
		if (this.fullsize) {
			this.disableScroll();
		}

		this.touchCanceler = false;

		const swipped = this.wasSwiped();

		if (swipped !== 0) {
			this.snap(swipped);
		} else {
			this.snap();
		}

		this.startTouchX = undefined;
		this.startTouchY = undefined;
		this.startTime = undefined;
		this.endTouchX = undefined;
		this.endTouchY = undefined;
		this.endTime = undefined;
	}

	wasSwiped(): number {
		const snapWidth = this.layout.pageWidth * this.layout.divisor;
		const distance = (this.endTouchX! - this.startTouchX!);
		const absolute = Math.abs(distance);
		const time = this.endTime! - this.startTime!;
		const velocity = (distance / time);
		const minVelocity = this.settings.minVelocity;

		if (absolute <= this.settings.minDistance || absolute >= snapWidth) {
			return 0;
		}

		if (velocity > minVelocity) {
			// previous
			return -1;
		} else if (velocity < -minVelocity) {
			// next
			return 1;
		}

		return 0;
	}

	needsSnap(): boolean {
		const left = this.scrollLeft;
		const snapWidth = this.layout.pageWidth * this.layout.divisor;
		return (left % snapWidth) !== 0;
	}

	snap(howMany: number = 0): Promise<void> {
		const left = this.scrollLeft;
		const snapWidth = this.layout.pageWidth * this.layout.divisor;
		let snapTo = Math.round(left / snapWidth) * snapWidth;

		if (howMany) {
			snapTo += (howMany * snapWidth);
		}

		return this.smoothScrollTo(snapTo);
	}

	smoothScrollTo(destination: number): Promise<void> {
		const deferred = new defer();
		const start = this.scrollLeft;
		const startTime = this.now();

		const duration = this.settings.duration;
		const easing = this.settings.easing;

		this.snapping = true;

		// add animation loop
		const tick = (): void => {
			const now = this.now();
			const time = Math.min(1, ((now - startTime) / duration));
			const _timeFunction = easing(time);


			if (this.touchCanceler || this.resizeCanceler) {
				this.resizeCanceler = false;
				this.snapping = false;
				deferred.resolve();
				return;
			}

			if (time < 1) {
					window.requestAnimationFrame(tick);
					this.scrollTo(start + ((destination - start) * time), 0);
			} else {
					this.scrollTo(destination, 0);
					this.snapping = false;
					deferred.resolve();
			}
		};

		tick();

		return deferred.promise;
	}

	scrollTo(left: number = 0, top: number = 0): void {
		if (this.fullsize) {
			window.scroll(left, top);
		} else {
			(this.scroller as HTMLElement).scrollLeft = left;
			(this.scroller as HTMLElement).scrollTop = top;
		}
	}

	now(): number {
		return ("now" in window.performance) ? performance.now() : new Date().getTime();
	}

	destroy(): void {
		if (!this.scroller) {
			return;
		}

		if (this.fullsize) {
			this.enableScroll();
		}

		this.removeListeners();

		this.scroller = undefined;
	}
}

EventEmitter(Snap.prototype);

export default Snap;
