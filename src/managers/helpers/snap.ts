import {extend, defer, requestAnimationFrame, prefixed} from "../../utils/core";
import { EVENTS, DOM_EVENTS } from "../../utils/constants";
import EventEmitter from "../../utils/event-emitter";
import type { IEventEmitter } from "../../types";

// easing equations from https://github.com/danro/easing-js/blob/master/easing.js
const PI_D2 = (Math.PI / 2);
const EASING_EQUATIONS = {
		easeOutSine: function (pos) {
				return Math.sin(pos * PI_D2);
		},
		easeInOutSine: function (pos) {
				return (-0.5 * (Math.cos(Math.PI * pos) - 1));
		},
		easeInOutQuint: function (pos) {
				if ((pos /= 0.5) < 1) {
						return 0.5 * Math.pow(pos, 5);
				}
				return 0.5 * (Math.pow((pos - 2), 5) + 2);
		},
		easeInCubic: function(pos) {
			return Math.pow(pos, 3);
  	}
};

class Snap implements IEventEmitter {
	settings: any;
	manager: any;
	layout: any;
	fullsize: boolean;
	element: any;
	scroller: any;
	isVertical: boolean;
	touchCanceler: boolean;
	resizeCanceler: boolean;
	snapping: boolean;
	scrollLeft: number;
	scrollTop: number;
	startTouchX: number;
	startTouchY: number;
	startTime: number;
	endTouchX: number;
	endTouchY: number;
	endTime: number;
	_onResize: (...args: any[]) => void;
	_onScroll: (...args: any[]) => void;
	_onTouchStart: (...args: any[]) => void;
	_onTouchMove: (...args: any[]) => void;
	_onTouchEnd: (...args: any[]) => void;
	_afterDisplayed: (...args: any[]) => void;

	declare on: IEventEmitter["on"];
	declare off: IEventEmitter["off"];
	declare emit: IEventEmitter["emit"];

	constructor(manager: any, options?: any) {

		this.settings = extend({
			duration: 80,
			minVelocity: 0.2,
			minDistance: 10,
			easing: EASING_EQUATIONS['easeInCubic']
		}, options || {});

		this.supportsTouch = this.supportsTouch();

		if (this.supportsTouch) {
			this.setup(manager);
		}
	}

	setup(manager: any): void {
		this.manager = manager;

		this.layout = this.manager.layout;

		this.fullsize = this.manager.settings.fullsize;
		if (this.fullsize) {
			this.element = this.manager.stage.element;
			this.scroller = window;
			this.disableScroll();
		} else {
			this.element = this.manager.stage.container;
			this.scroller = this.element;
			this.element.style["WebkitOverflowScrolling"] = "touch";
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

	supportsTouch(): any {
		if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
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
		window.addEventListener('resize', this._onResize);

		this._onScroll = this.onScroll.bind(this);
		this.scroller.addEventListener('scroll', this._onScroll);

		this._onTouchStart = this.onTouchStart.bind(this);
		this.scroller.addEventListener('touchstart', this._onTouchStart, { passive: true });
		this.on('touchstart', this._onTouchStart);

		this._onTouchMove = this.onTouchMove.bind(this);
		this.scroller.addEventListener('touchmove', this._onTouchMove, { passive: true });
		this.on('touchmove', this._onTouchMove);

		this._onTouchEnd = this.onTouchEnd.bind(this);
		this.scroller.addEventListener('touchend', this._onTouchEnd, { passive: true });
		this.on('touchend', this._onTouchEnd);

		this._afterDisplayed = this.afterDisplayed.bind(this);
		this.manager.on(EVENTS.MANAGERS.ADDED, this._afterDisplayed);
	}

	removeListeners(): void {
		window.removeEventListener('resize', this._onResize);
		this._onResize = undefined;

		this.scroller.removeEventListener('scroll', this._onScroll);
		this._onScroll = undefined;

		this.scroller.removeEventListener('touchstart', this._onTouchStart, { passive: true });
		this.off('touchstart', this._onTouchStart);
		this._onTouchStart = undefined;

		this.scroller.removeEventListener('touchmove', this._onTouchMove, { passive: true });
		this.off('touchmove', this._onTouchMove);
		this._onTouchMove = undefined;

		this.scroller.removeEventListener('touchend', this._onTouchEnd, { passive: true });
		this.off('touchend', this._onTouchEnd);
		this._onTouchEnd = undefined;

		this.manager.off(EVENTS.MANAGERS.ADDED, this._afterDisplayed);
		this._afterDisplayed = undefined;
	}

	afterDisplayed(view: any): void {
		let contents = view.contents;
		["touchstart", "touchmove", "touchend"].forEach((e) => {
			contents.on(e, (ev) => this.triggerViewEvent(ev, contents));
		});
	}

	triggerViewEvent(e: any, contents: any): void {
		this.emit(e.type, e, contents);
	}

	onScroll(e?: any): void {
		this.scrollLeft = this.fullsize ? window.scrollX : this.scroller.scrollLeft;
		this.scrollTop = this.fullsize ? window.scrollY : this.scroller.scrollTop;
	}

	onResize(e?: any): void {
		this.resizeCanceler = true;
	}

	onTouchStart(e: any): void {
		let { screenX, screenY } = e.touches[0];

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

	onTouchMove(e: any): void {
		let { screenX, screenY } = e.touches[0];
		let deltaY = Math.abs(screenY - this.endTouchY);

		this.touchCanceler = true;


		if (!this.fullsize && deltaY < 10) {
			this.element.scrollLeft -= screenX - this.endTouchX;
		}

		this.endTouchX = screenX;
		this.endTouchY = screenY;
		this.endTime = this.now();
	}

	onTouchEnd(e?: any): void {
		if (this.fullsize) {
			this.disableScroll();
		}

		this.touchCanceler = false;

		let swipped = this.wasSwiped();

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
		let snapWidth = this.layout.pageWidth * this.layout.divisor;
		let distance = (this.endTouchX - this.startTouchX);
		let absolute = Math.abs(distance);
		let time = this.endTime - this.startTime;
		let velocity = (distance / time);
		let minVelocity = this.settings.minVelocity;

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
	}

	needsSnap(): boolean {
		let left = this.scrollLeft;
		let snapWidth = this.layout.pageWidth * this.layout.divisor;
		return (left % snapWidth) !== 0;
	}

	snap(howMany: number = 0): Promise<any> {
		let left = this.scrollLeft;
		let snapWidth = this.layout.pageWidth * this.layout.divisor;
		let snapTo = Math.round(left / snapWidth) * snapWidth;

		if (howMany) {
			snapTo += (howMany * snapWidth);
		}

		return this.smoothScrollTo(snapTo);
	}

	smoothScrollTo(destination: number): Promise<any> {
		const deferred = new defer();
		const start = this.scrollLeft;
		const startTime = this.now();

		const duration = this.settings.duration;
		const easing = this.settings.easing;

		this.snapping = true;

		// add animation loop
		function tick() {
			const now = this.now();
			const time = Math.min(1, ((now - startTime) / duration));
			const timeFunction = easing(time);


			if (this.touchCanceler || this.resizeCanceler) {
				this.resizeCanceler = false;
				this.snapping = false;
				deferred.resolve();
				return;
			}

			if (time < 1) {
					window.requestAnimationFrame(tick.bind(this));
					this.scrollTo(start + ((destination - start) * time), 0);
			} else {
					this.scrollTo(destination, 0);
					this.snapping = false;
					deferred.resolve();
			}
		}

		tick.call(this);

		return deferred.promise;
	}

	scrollTo(left: number = 0, top: number = 0): void {
		if (this.fullsize) {
			window.scroll(left, top);
		} else {
			this.scroller.scrollLeft = left;
			this.scroller.scrollTop = top;
		}
	}

	now(): number {
		return ('now' in window.performance) ? performance.now() : new Date().getTime();
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
