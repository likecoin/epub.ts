import {uuid, isNumber, isElement, windowBounds, extend} from "../../utils/core";
import type { StageOptions } from "../../types";
function throttle(func: (...args: unknown[]) => void, wait: number): (...args: unknown[]) => void {
	let timeout: ReturnType<typeof setTimeout> | null = null;
	let previous = 0;
	return function(this: unknown, ...args: unknown[]) {
		const now = Date.now();
		const remaining = wait - (now - previous);
		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			func.call(this, ...args);
		} else if (!timeout) {
			timeout = setTimeout(() => {
				previous = Date.now();
				timeout = null;
				func.call(this, ...args);
			}, remaining);
		}
	};
}

class Stage {
	settings: StageOptions;
	id: string;
	container: HTMLDivElement;
	wrapper!: HTMLDivElement;
	element!: HTMLElement;
	resizeFunc!: () => void;
	orientationChangeFunc!: (e: Event) => void;
	containerStyles!: CSSStyleDeclaration;
	containerPadding!: { left: number; right: number; top: number; bottom: number };
	sheet!: CSSStyleSheet;

	constructor(_options?: StageOptions) {
		this.settings = _options || {};
		this.id = "epubjs-container-" + uuid();

		this.container = this.create(this.settings);

		if(this.settings.hidden) {
			this.wrapper = this.wrap(this.container);
		}

	}

	/*
	* Creates an element to render to.
	* Resizes to passed width and height or to the elements size
	*/
	create(options: StageOptions): HTMLDivElement {
		let height: string | number | undefined  = options.height;// !== false ? options.height : "100%";
		let width: string | number | undefined   = options.width;// !== false ? options.width : "100%";
		const overflow  = options.overflow || false;
		const axis = options.axis || "vertical";
		const direction = options.direction;

		extend(this.settings, options);

		if(options.height && isNumber(options.height)) {
			height = options.height + "px";
		}

		if(options.width && isNumber(options.width)) {
			width = options.width + "px";
		}

		// Create new container element
		const container = document.createElement("div");

		container.id = this.id;
		container.classList.add("epub-container");

		// Style Element
		// container.style.fontSize = "0";
		container.style.wordSpacing = "0";
		container.style.lineHeight = "0";
		container.style.verticalAlign = "top";
		container.style.position = "relative";
		container.style.overflowAnchor = "none";

		if(axis === "horizontal") {
			// container.style.whiteSpace = "nowrap";
			container.style.display = "flex";
			container.style.flexDirection = "row";
			container.style.flexWrap = "nowrap";
		}

		if(width){
			container.style.width = width as string;
		}

		if(height){
			container.style.height = height as string;
		}

		if (overflow) {
			if (overflow === "scroll" && axis === "vertical") {
				container.style.overflowY = overflow;
				container.style.overflowX = "hidden";
			} else if (overflow === "scroll" && axis === "horizontal") {
				container.style.overflowY = "hidden";
				container.style.overflowX = overflow;
			} else {
				container.style.overflow = overflow as string;
			}
		}

		if (direction) {
			container.dir = direction;
			container.style.direction = direction;
		}

		if (direction && this.settings.fullsize) {
			document.body.style.direction = direction;
		}

		return container;
	}

	wrap(container: HTMLElement): HTMLDivElement {
		const wrapper = document.createElement("div");

		wrapper.style.visibility = "hidden";
		wrapper.style.overflow = "hidden";
		wrapper.style.width = "0";
		wrapper.style.height = "0";

		wrapper.appendChild(container);
		return wrapper;
	}


	getElement(_element: HTMLElement | string): HTMLElement {
		let element: HTMLElement | null = null;

		if(isElement(_element)) {
			element = _element as HTMLElement;
		} else if (typeof _element === "string") {
			element = document.getElementById(_element);
		}

		if(!element){
			throw new Error("Not an Element");
		}

		return element;
	}

	attachTo(what: HTMLElement | string): HTMLElement | void {

		const element = this.getElement(what);
		let base;

		if(!element){
			return;
		}

		if(this.settings.hidden) {
			base = this.wrapper;
		} else {
			base = this.container;
		}

		element.appendChild(base);

		this.element = element;

		return element;

	}

	getContainer(): HTMLDivElement {
		return this.container;
	}

	onResize(func: () => void): void {
		// Only listen to window for resize event if width and height are not fixed.
		// This applies if it is set to a percent or auto.
		if(!isNumber(this.settings.width) ||
			 !isNumber(this.settings.height) ) {
			this.resizeFunc = throttle(func, 50);
			window.addEventListener("resize", this.resizeFunc, false);
		}

	}

	onOrientationChange(func: (e: Event) => void): void {
		this.orientationChangeFunc = func;
		window.addEventListener("orientationchange", this.orientationChangeFunc, false);
	}

	size(width?: number | string | null, height?: number | string | null): { width: number; height: number } {
		let bounds;
		const _width = width || this.settings.width;
		const _height = height || this.settings.height;

		// If width or height are set to false, inherit them from containing element
		if(width === null) {
			bounds = this.element.getBoundingClientRect();

			if(bounds.width) {
				width = Math.floor(bounds.width);
				this.container.style.width = width + "px";
			}
		} else {
			if (isNumber(width)) {
				this.container.style.width = width + "px";
			} else if (width) {
				this.container.style.width = width as string;
			}
		}

		if(height === null) {
			bounds = bounds || this.element.getBoundingClientRect();

			if(bounds.height) {
				height = bounds.height;
				this.container.style.height = height + "px";
			}

		} else {
			if (isNumber(height)) {
				this.container.style.height = height + "px";
			} else if (height) {
				this.container.style.height = height as string;
			}
		}

		if(!isNumber(width)) {
			width = this.container.clientWidth;
		}

		if(!isNumber(height)) {
			height = this.container.clientHeight;
		}

		this.containerStyles = window.getComputedStyle(this.container);

		this.containerPadding = {
			left: parseFloat(this.containerStyles.paddingLeft) || 0,
			right: parseFloat(this.containerStyles.paddingRight) || 0,
			top: parseFloat(this.containerStyles.paddingTop) || 0,
			bottom: parseFloat(this.containerStyles.paddingBottom) || 0
		};

		// Bounds not set, get them from window
		const _windowBounds = windowBounds();
		const bodyStyles = window.getComputedStyle(document.body);
		const bodyPadding = {
			left: parseFloat(bodyStyles.paddingLeft) || 0,
			right: parseFloat(bodyStyles.paddingRight) || 0,
			top: parseFloat(bodyStyles.paddingTop) || 0,
			bottom: parseFloat(bodyStyles.paddingBottom) || 0
		};

		if (!_width) {
			width = _windowBounds.width -
								bodyPadding.left -
								bodyPadding.right;
		}

		if ((this.settings.fullsize && !_height) || !_height) {
			height = _windowBounds.height -
								bodyPadding.top -
								bodyPadding.bottom;
		}

		return {
			width: (width as number) -
							this.containerPadding.left -
							this.containerPadding.right,
			height: (height as number) -
							this.containerPadding.top -
							this.containerPadding.bottom
		};

	}

	bounds(): DOMRect | { width: number; height: number } {
		let box;
		if (this.container.style.overflow !== "visible") {
			box = this.container && this.container.getBoundingClientRect();
		}

		if(!box || !box.width || !box.height) {
			return windowBounds();
		} else {
			return box;
		}

	}

	getSheet(): CSSStyleSheet {
		const style = document.createElement("style");

		// WebKit hack --> https://davidwalsh.name/add-rules-stylesheets
		style.appendChild(document.createTextNode(""));

		document.head.appendChild(style);

		return style.sheet!;
	}

	addStyleRules(selector: string, rulesArray: Record<string, string>[]): void {
		const scope = "#" + this.id + " ";
		let rules = "";

		if(!this.sheet){
			this.sheet = this.getSheet();
		}

		rulesArray.forEach(function(set) {
			for (const prop in set) {
				if(set.hasOwnProperty(prop)) {
					rules += prop + ":" + set[prop] + ";";
				}
			}
		});

		this.sheet.insertRule(scope + selector + " {" + rules + "}", 0);
	}

	axis(axis: string): void {
		if(axis === "horizontal") {
			this.container.style.display = "flex";
			this.container.style.flexDirection = "row";
			this.container.style.flexWrap = "nowrap";
		} else {
			this.container.style.display = "block";
		}
		this.settings.axis = axis;
	}

	// orientation(orientation) {
	// 	if (orientation === "landscape") {
	//
	// 	} else {
	//
	// 	}
	//
	// 	this.orientation = orientation;
	// }

	direction(dir: string): void {
		if (this.container) {
			this.container.dir = dir;
			this.container.style.direction = dir;
		}

		if (this.settings.fullsize) {
			document.body.style.direction = dir;
		}
		this.settings.dir = dir;
	}

	overflow(overflow: string): void {
		if (this.container) {
			if (overflow === "scroll" && this.settings.axis === "vertical") {
				this.container.style.overflowY = overflow;
				this.container.style.overflowX = "hidden";
			} else if (overflow === "scroll" && this.settings.axis === "horizontal") {
				this.container.style.overflowY = "hidden";
				this.container.style.overflowX = overflow;
			} else {
				this.container.style.overflow = overflow;
			}
		}
		this.settings.overflow = overflow;
	}

	destroy(): void {
		let _base;

		if (this.element) {

			if(this.settings.hidden) {
				_base = this.wrapper;
			} else {
				_base = this.container;
			}

			if(this.element.contains(this.container)) {
				this.element.removeChild(this.container);
			}

			window.removeEventListener("resize", this.resizeFunc);
			window.removeEventListener("orientationchange", this.orientationChangeFunc);

		}
	}
}

export default Stage;
