import EventEmitter from "./utils/event-emitter";
import {isNumber, prefixed, borders, defaults} from "./utils/core";
import EpubCFI from "./epubcfi";
import Mapping from "./mapping";
import {replaceLinks} from "./utils/replacements";
import { EPUBJS_VERSION, EVENTS, DOM_EVENTS } from "./utils/constants";
import type { ViewportSettings, LayoutProps, EpubCFIPair, IEventEmitter } from "./types";
import type Section from "./section";

const hasNavigator = typeof (navigator) !== "undefined";

const isChrome = hasNavigator && /Chrome/.test(navigator.userAgent);
const isWebkit = hasNavigator && !isChrome && /AppleWebKit/.test(navigator.userAgent);

const ELEMENT_NODE = 1;
const _TEXT_NODE = 3;

/**
	* Handles DOM manipulation, queries and events for View contents
	* @class
	* @param {document} doc Document
	* @param {element} content Parent Element (typically Body)
	* @param {string} cfiBase Section component of CFIs
	* @param {number} sectionIndex Index in Spine of Conntent's Section
	*/
export interface ContentsEvents {
	"expand": [];
	"resize": [{ width: number; height: number }];
	"selected": [string];
	"selectedRange": [Range];
	"linkClicked": [string];
	[event: string]: any[];
}

class Contents implements IEventEmitter<ContentsEvents> {
	declare on: IEventEmitter<ContentsEvents>["on"];
	declare off: IEventEmitter<ContentsEvents>["off"];
	declare emit: IEventEmitter<ContentsEvents>["emit"];
	declare __listeners: IEventEmitter<ContentsEvents>["__listeners"];

	epubcfi: EpubCFI;
	document: Document;
	documentElement: HTMLElement;
	content: HTMLElement;
	window: Window;
	_size: { width: number; height: number };
	sectionIndex: number;
	cfiBase: string;
	called: number;
	active: boolean;
	observer: ResizeObserver | MutationObserver | undefined;
	expanding: ReturnType<typeof setTimeout> | undefined;
	onResize: ((size: { width: number; height: number }) => void) | undefined;
	_expanding!: boolean;
	_resizeCheck: (() => void) | undefined;
	_triggerEvent: ((e: Event) => void) | undefined;
	_onSelectionChange: ((e: Event) => void) | undefined;
	_onVisibilityChange: (() => void) | undefined;
	_mediaQueryHandlers: { mql: MediaQueryList; handler: (e: MediaQueryListEvent) => void }[];
	selectionEndTimeout: ReturnType<typeof setTimeout> | undefined;
	_layoutStyle!: string;

	constructor(doc: Document, content?: HTMLElement, cfiBase?: string, sectionIndex?: number) {
		// Blank Cfi for Parsing
		this.epubcfi = new EpubCFI();

		this.document = doc;
		this.documentElement =  this.document.documentElement as HTMLElement;
		this.content = content || this.document.body as HTMLElement;
		this.window = this.document.defaultView!;

		this._size = {
			width: 0,
			height: 0
		};

		this.sectionIndex = sectionIndex || 0;
		this.cfiBase = cfiBase || "";

		this._mediaQueryHandlers = [];
		this.epubReadingSystem("epub.js", EPUBJS_VERSION);
		this.called = 0;
		this.active = true;
		this.listeners();
	}

	/**
		* Get DOM events that are listened for and passed along
		*/
	static get listenedEvents(): typeof DOM_EVENTS {
		return DOM_EVENTS;
	}

	/**
		* Get or Set width
		* @param {number} [w]
		* @returns {number} width
		*/
	width(w?: number | string): number {
		// var frame = this.documentElement;
		const frame = this.content;

		if (w && isNumber(w)) {
			w = w + "px";
		}

		if (w) {
			frame.style.width = w as string;
			// this.content.style.width = w;
		}

		return parseInt(this.window.getComputedStyle(frame)["width"]);


	}

	/**
		* Get or Set height
		* @param {number} [h]
		* @returns {number} height
		*/
	height(h?: number | string): number {
		// var frame = this.documentElement;
		const frame = this.content;

		if (h && isNumber(h)) {
			h = h + "px";
		}

		if (h) {
			frame.style.height = h as string;
			// this.content.style.height = h;
		}

		return parseInt(this.window.getComputedStyle(frame)["height"]);

	}

	/**
		* Get or Set width of the contents
		* @param {number} [w]
		* @returns {number} width
		*/
	contentWidth(w?: number | string): number {

		const content = this.content || this.document.body;

		if (w && isNumber(w)) {
			w = w + "px";
		}

		if (w) {
			content.style.width = w as string;
		}

		return parseInt(this.window.getComputedStyle(content)["width"]);


	}

	/**
		* Get or Set height of the contents
		* @param {number} [h]
		* @returns {number} height
		*/
	contentHeight(h?: number | string): number {

		const content = this.content || this.document.body;

		if (h && isNumber(h)) {
			h = h + "px";
		}

		if (h) {
			content.style.height = h as string;
		}

		return parseInt(this.window.getComputedStyle(content)["height"]);

	}

	/**
		* Get the width of the text using Range
		* @returns {number} width
		*/
	textWidth(): number {
		let width;
		const range = this.document.createRange();
		const content = this.content || this.document.body;
		const border = borders(content);

		// Select the contents of frame
		range.selectNodeContents(content);

		// get the width of the text content
		const rect = range.getBoundingClientRect();
		width = rect.width;

		if (border && border.width) {
			width += border.width;
		}

		return Math.round(width);
	}

	/**
		* Get the height of the text using Range
		* @returns {number} height
		*/
	textHeight(): number {
		const range = this.document.createRange();
		const content = this.content || this.document.body;

		range.selectNodeContents(content);

		const rect = range.getBoundingClientRect();
		const height = rect.bottom;

		return Math.round(height);
	}

	/**
		* Get documentElement scrollWidth
		* @returns {number} width
		*/
	scrollWidth(): number {
		const width = this.documentElement.scrollWidth;

		return width;
	}

	/**
		* Get documentElement scrollHeight
		* @returns {number} height
		*/
	scrollHeight(): number {
		const height = this.documentElement.scrollHeight;

		return height;
	}

	/**
		* Set overflow css style of the contents
		* @param {string} [overflow]
		*/
	overflow(overflow?: string): string {

		if (overflow) {
			this.documentElement.style.overflow = overflow;
		}

		return this.window.getComputedStyle(this.documentElement)["overflow"];
	}

	/**
		* Set overflowX css style of the documentElement
		* @param {string} [overflow]
		*/
	overflowX(overflow?: string): string {

		if (overflow) {
			this.documentElement.style.overflowX = overflow;
		}

		return this.window.getComputedStyle(this.documentElement)["overflowX"];
	}

	/**
		* Set overflowY css style of the documentElement
		* @param {string} [overflow]
		*/
	overflowY(overflow?: string): string {

		if (overflow) {
			this.documentElement.style.overflowY = overflow;
		}

		return this.window.getComputedStyle(this.documentElement)["overflowY"];
	}

	/**
		* Set Css styles on the contents element (typically Body)
		* @param {string} property
		* @param {string} value
		* @param {boolean} [priority] set as "important"
		*/
	css(property: string, value?: string, priority?: boolean): string {
		const content = this.content || this.document.body;

		if (value) {
			content.style.setProperty(property, value, priority ? "important" : "");
		} else {
			content.style.removeProperty(property);
		}

		return (this.window.getComputedStyle(content) as unknown as Record<string, string>)[property] ?? "";
	}

	/**
		* Get or Set the viewport element
		* @param {object} [options]
		* @param {string} [options.width]
		* @param {string} [options.height]
		* @param {string} [options.scale]
		* @param {string} [options.minimum]
		* @param {string} [options.maximum]
		* @param {string} [options.scalable]
		*/
	viewport(options?: Partial<Record<keyof ViewportSettings, string | number>>): ViewportSettings {
		let _width, _height, _scale, _minimum, _maximum, _scalable;
		// var width, height, scale, minimum, maximum, scalable;
		let $viewport = this.document.querySelector("meta[name='viewport']");
		const parsed: Partial<ViewportSettings> = {
			"width": undefined,
			"height": undefined,
			"scale": undefined,
			"minimum": undefined,
			"maximum": undefined,
			"scalable": undefined
		};
		const newContent: string[] = [];
		let settings: Partial<Record<keyof ViewportSettings, string | number>> = {};

		/*
		* check for the viewport size
		* <meta name="viewport" content="width=1024,height=697" />
		*/
		if($viewport && $viewport.hasAttribute("content")) {
			const content = $viewport.getAttribute("content") ?? "";
			const _width = content.match(/width\s*=\s*([^,]*)/);
			const _height = content.match(/height\s*=\s*([^,]*)/);
			const _scale = content.match(/initial-scale\s*=\s*([^,]*)/);
			const _minimum = content.match(/minimum-scale\s*=\s*([^,]*)/);
			const _maximum = content.match(/maximum-scale\s*=\s*([^,]*)/);
			const _scalable = content.match(/user-scalable\s*=\s*([^,]*)/);

			if(_width && _width.length && typeof _width[1] !== "undefined"){
				parsed.width = _width[1];
			}
			if(_height && _height.length && typeof _height[1] !== "undefined"){
				parsed.height = _height[1];
			}
			if(_scale && _scale.length && typeof _scale[1] !== "undefined"){
				parsed.scale = _scale[1];
			}
			if(_minimum && _minimum.length && typeof _minimum[1] !== "undefined"){
				parsed.minimum = _minimum[1];
			}
			if(_maximum && _maximum.length && typeof _maximum[1] !== "undefined"){
				parsed.maximum = _maximum[1];
			}
			if(_scalable && _scalable.length && typeof _scalable[1] !== "undefined"){
				parsed.scalable = _scalable[1];
			}
		}

		settings = defaults(options ?? {} as Partial<Record<keyof ViewportSettings, string | number>>, parsed as Partial<Record<keyof ViewportSettings, string | number>>);

		if (options) {
			if (settings.width) {
				newContent.push("width=" + settings.width);
			}

			if (settings.height) {
				newContent.push("height=" + settings.height);
			}

			if (settings.scale) {
				newContent.push("initial-scale=" + settings.scale);
			}

			if (settings.scalable === "no") {
				newContent.push("minimum-scale=" + settings.scale);
				newContent.push("maximum-scale=" + settings.scale);
				newContent.push("user-scalable=" + settings.scalable);
			} else {

				if (settings.scalable) {
					newContent.push("user-scalable=" + settings.scalable);
				}

				if (settings.minimum) {
					newContent.push("minimum-scale=" + settings.minimum);
				}

				if (settings.maximum) {
					newContent.push("minimum-scale=" + settings.maximum);
				}
			}

			if (!$viewport) {
				$viewport = this.document.createElement("meta");
				$viewport.setAttribute("name", "viewport");
				this.document.querySelector("head")!.appendChild($viewport);
			}

			$viewport.setAttribute("content", newContent.join(", "));

			this.window.scrollTo(0, 0);
		}


		return settings as unknown as ViewportSettings;
	}

	/**
	 * Event emitter for when the contents has expanded
	 * @private
	 */
	expand(): void {
		this.emit(EVENTS.CONTENTS.EXPAND);
	}

	/**
	 * Add DOM listeners
	 * @private
	 */
	listeners(): void {
		this.imageLoadListeners();

		this.mediaQueryListeners();

		// this.fontLoadListeners();

		this.addEventListeners();

		this.addSelectionListeners();

		// this.transitionListeners();

		if (typeof ResizeObserver === "undefined") {
			this.resizeListeners();
			this.visibilityListeners();
		} else {
			this.resizeObservers();
		}

		// this.mutationObservers();

		this.linksHandler();
	}

	/**
	 * Remove DOM listeners
	 * @private
	 */
	removeListeners(): void {

		this.removeEventListeners();

		this.removeSelectionListeners();

		if (this._onVisibilityChange) {
			document.removeEventListener("visibilitychange", this._onVisibilityChange);
			this._onVisibilityChange = undefined;
		}

		if (this._resizeCheck) {
			this.document.removeEventListener("transitionend", this._resizeCheck);
			this._resizeCheck = undefined;
		}

		for (const { mql, handler } of this._mediaQueryHandlers) {
			mql.removeEventListener("change", handler);
		}
		this._mediaQueryHandlers = [];

		if (this.observer) {
			this.observer.disconnect();
		}

		clearTimeout(this.expanding);

		const images = this.document.querySelectorAll("img");
		for (let i = 0; i < images.length; i++) {
			images[i]!.onload = null;
		}
	}

	/**
	 * Check if size of contents has changed and
	 * emit 'resize' event if it has.
	 * @private
	 */
	resizeCheck(): void {
		const width = this.textWidth();
		const height = this.textHeight();

		if (width != this._size.width || height != this._size.height) {

			this._size = {
				width: width,
				height: height
			};

			this.onResize && this.onResize(this._size);
			this.emit(EVENTS.CONTENTS.RESIZE, this._size);
		}
	}

	/**
	 * Poll for resize detection
	 * @private
	 */
	resizeListeners(): void {
		let _width, _height;
		// Test size again
		clearTimeout(this.expanding);
		requestAnimationFrame(this.resizeCheck.bind(this));
		this.expanding = setTimeout(this.resizeListeners.bind(this), 350);
	}

	/**
	 * Listen for visibility of tab to change
	 * @private
	 */
	visibilityListeners(): void {
		this._onVisibilityChange = (): void => {
			if (document.visibilityState === "visible" && this.active === false) {
				this.active = true;
				this.resizeListeners();
			} else {
				this.active = false;
				clearTimeout(this.expanding);
			}
		};
		document.addEventListener("visibilitychange", this._onVisibilityChange);
	}

	/**
	 * Use css transitions to detect resize
	 * @private
	 */
	transitionListeners(): void {
		const body = this.content;

		body.style["transitionProperty"] = "font, font-size, font-size-adjust, font-stretch, font-variation-settings, font-weight, width, height";
		body.style["transitionDuration"] = "0.001ms";
		body.style["transitionTimingFunction"] = "linear";
		body.style["transitionDelay"] = "0";

		this._resizeCheck = this.resizeCheck.bind(this);
		this.document.addEventListener("transitionend", this._resizeCheck!);
	}

	/**
	 * Listen for media query changes and emit 'expand' event
	 * Adapted from: https://github.com/tylergaw/media-query-events/blob/master/js/mq-events.js
	 * @private
	 */
	mediaQueryListeners(): void {
		const sheets = this.document.styleSheets;
		const mediaChangeHandler = (m: MediaQueryListEvent): void => {
			if(m.matches && !this._expanding) {
				setTimeout(this.expand.bind(this), 1);
			}
		};

		for (let i = 0; i < sheets.length; i += 1) {
			let rules;
			// Firefox errors if we access cssRules cross-domain
			try {
				rules = sheets[i]!.cssRules;
			} catch (_e) {
				return;
			}
			if(!rules) return; // Stylesheets changed
			for (let j = 0; j < rules.length; j += 1) {
				if((rules[j] as CSSMediaRule).media){
					const mql = this.window.matchMedia((rules[j] as CSSMediaRule).media.mediaText);
					mql.addEventListener("change", mediaChangeHandler);
					this._mediaQueryHandlers.push({ mql, handler: mediaChangeHandler });
				}
			}
		}
	}

	/**
	 * Use ResizeObserver to listen for changes in the DOM and check for resize
	 * @private
	 */
	resizeObservers(): void {
		// create an observer instance
		this.observer = new ResizeObserver((_e) => {
			requestAnimationFrame(this.resizeCheck.bind(this));
		});

		// pass in the target node
		this.observer.observe(this.document.documentElement);
	}

	/**
	 * Use MutationObserver to listen for changes in the DOM and check for resize
	 * @private
	 */
	mutationObservers(): void {
		// create an observer instance
		this.observer = new MutationObserver((_mutations) => {
			this.resizeCheck();
		});

		// configuration of the observer:
		const config = { attributes: true, childList: true, characterData: true, subtree: true };

		// pass in the target node, as well as the observer options
		this.observer.observe(this.document, config);
	}

	/**
	 * Test if images are loaded or add listener for when they load
	 * @private
	 */
	imageLoadListeners(): void {
		const images = this.document.querySelectorAll("img");
		let img;
		for (let i = 0; i < images.length; i++) {
			img = images[i]!;

			if (typeof img.naturalWidth !== "undefined" &&
					img.naturalWidth === 0) {
				img.onload = this.expand.bind(this);
			}
		}
	}

	/**
	 * Listen for font load and check for resize when loaded
	 * @private
	 */
	fontLoadListeners(): void {
		if (!this.document || !this.document.fonts) {
			return;
		}

		this.document.fonts.ready.then(() => {
			this.resizeCheck();
		});

	}

	/**
	 * Get the documentElement
	 * @returns {element} documentElement
	 */
	root(): HTMLElement | null {
		if(!this.document) return null;
		return this.document.documentElement;
	}

	/**
	 * Get the location offset of a EpubCFI or an #id
	 * @param {string | EpubCFI} target
	 * @param {string} [ignoreClass] for the cfi
	 * @returns { {left: Number, top: Number }
	 */
	locationOf(target: string, ignoreClass?: string): { left: number; top: number } {
		let position;
		const targetPos = {"left": 0, "top": 0};

		if(!this.document) return targetPos;

		if(this.epubcfi.isCfiString(target)) {
			const range = new EpubCFI(target).toRange(this.document, ignoreClass);

			if(range) {
				try {
					if (!range.endContainer ||
						(range.startContainer == range.endContainer
						&& range.startOffset == range.endOffset)) {
						// If the end for the range is not set, it results in collapsed becoming
						// true. This in turn leads to inconsistent behaviour when calling
						// getBoundingRect. Wrong bounds lead to the wrong page being displayed.
						// https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/15684911/
						let pos = (range.startContainer.textContent ?? "").indexOf(" ", range.startOffset);
						if (pos == -1) {
							pos = (range.startContainer.textContent ?? "").length;
						}
						range.setEnd(range.startContainer, pos);
					}
				} catch (e) {
					// eslint-disable-next-line no-console
					console.error("setting end offset to start container length failed", e);
				}

				if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
					position = (range.startContainer as Element).getBoundingClientRect();
					targetPos.left = position.left;
					targetPos.top = position.top;
				} else {
					// Webkit does not handle collapsed range bounds correctly
					// https://bugs.webkit.org/show_bug.cgi?id=138949

					// Construct a new non-collapsed range
					if (isWebkit) {
						const container = range.startContainer;
						const newRange = new Range();
						try {
							if (container.nodeType === ELEMENT_NODE) {
								position = (container as Element).getBoundingClientRect();
							} else if (range.startOffset + 2 < (container as CharacterData).length) {
								newRange.setStart(container, range.startOffset);
								newRange.setEnd(container, range.startOffset + 2);
								position = newRange.getBoundingClientRect();
							} else if (range.startOffset - 2 > 0) {
								newRange.setStart(container, range.startOffset - 2);
								newRange.setEnd(container, range.startOffset);
								position = newRange.getBoundingClientRect();
							} else { // empty, return the parent element
								position = (container.parentNode as Element).getBoundingClientRect();
							}
						} catch (e) {
							// eslint-disable-next-line no-console
							console.error(e, e instanceof Error ? e.stack : undefined);
						}
					} else {
						position = range.getBoundingClientRect();
					}
				}
			}

		} else if(typeof target === "string" &&
			target.indexOf("#") > -1) {

			const id = target.substring(target.indexOf("#")+1);
			const el = this.document.getElementById(id);
			if(el) {
				if (isWebkit) {
					// Webkit reports incorrect bounding rects in Columns
					const newRange = new Range();
					newRange.selectNode(el);
					position = newRange.getBoundingClientRect();
				} else {
					position = el.getBoundingClientRect();
				}
			}
		}

		if (position) {
			targetPos.left = position.left;
			targetPos.top = position.top;
		}

		return targetPos;
	}

	/**
	 * Append a stylesheet link to the document head
	 * @param {string} src url
	 */
	addStylesheet(src: string): Promise<boolean> {
		return new Promise((resolve: (value: boolean) => void, _reject: (reason?: unknown) => void) => {
			let $stylesheet;
			let ready = false;

			if(!this.document) {
				resolve(false);
				return;
			}

			// Check if link already exists
			$stylesheet = this.document.querySelector("link[href='"+src+"']");
			if ($stylesheet) {
				resolve(true);
				return; // already present
			}

			$stylesheet = this.document.createElement("link");
			$stylesheet.type = "text/css";
			$stylesheet.rel = "stylesheet";
			$stylesheet.href = src;
			$stylesheet.onload = (): void => {
				if (!ready) {
					ready = true;
					// Let apply
					setTimeout(() => {
						resolve(true);
					}, 1);
				}
			};

			this.document.head.appendChild($stylesheet);

		});
	}

	_getStylesheetNode(key?: string): HTMLStyleElement | false {
		let styleEl: HTMLStyleElement;
		key = "epubjs-inserted-css-" + (key || "");

		if(!this.document) return false;

		// Check if link already exists
		styleEl = this.document.getElementById(key) as HTMLStyleElement;
		if (!styleEl) {
			styleEl = this.document.createElement("style");
			styleEl.id = key;
			// Append style element to head
			this.document.head.appendChild(styleEl);
		}
		return styleEl;
	}

	/**
	 * Append stylesheet css
	 * @param {string} serializedCss
	 * @param {string} key If the key is the same, the CSS will be replaced instead of inserted
	 */
	addStylesheetCss(serializedCss: string, key?: string): boolean {
		if(!this.document || !serializedCss) return false;

		const styleEl = this._getStylesheetNode(key);
		if (!styleEl) return false;
		styleEl.textContent = serializedCss;

		return true;
	}

	/**
	 * Append stylesheet rules to a generate stylesheet
	 * Array: https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule
	 * Object: https://github.com/desirable-objects/json-to-css
	 * @param {array | object} rules
	 * @param {string} key If the key is the same, the CSS will be replaced instead of inserted
	 */
	addStylesheetRules(rules: Record<string, Record<string, string> | Array<Record<string, string>>> | Array<Array<string | string[]>>, key?: string): void {
		if(!this.document || !rules || (Array.isArray(rules) && rules.length === 0)) return;

		// Grab style sheet
		const styleSheet: CSSStyleSheet = (this._getStylesheetNode(key) as HTMLStyleElement).sheet as CSSStyleSheet;

		if (Array.isArray(rules)) {
			// Array format: [selector, [prop, val], ...] or [selector, [[prop, val], ...]]
			for (let i = 0, rl = rules.length; i < rl; i++) {
				let j = 1, rule: Array<string | string[]> = rules[i]!, propStr = "";
				const selector = rules[i]![0] as string;
				// If the second argument of a rule is an array of arrays, correct our variables.
				if (Array.isArray(rule[1]?.[0])) {
					rule = rule[1] as string[];
					j = 0;
				}

				for (let pl = rule.length; j < pl; j++) {
					const prop = rule[j]!;
					propStr += prop[0] + ":" + prop[1] + (prop[2] ? " !important" : "") + ";\n";
				}

				// Insert CSS Rule
				styleSheet.insertRule(selector + "{" + propStr + "}", styleSheet.cssRules.length);
			}
		} else {
			const selectors = Object.keys(rules);
			selectors.forEach((selector) => {
				const definition = rules[selector]!;
				if (Array.isArray(definition)) {
					definition.forEach((item) => {
						const _rules = Object.keys(item);
						const result = _rules.map((rule) => {
							return `${rule}:${item[rule]}`;
						}).join(";");
						styleSheet.insertRule(`${selector}{${result}}`, styleSheet.cssRules.length);
					});
				} else {
					const _rules = Object.keys(definition);
					const result = _rules.map((rule) => {
						return `${rule}:${definition[rule]}`;
					}).join(";");
					styleSheet.insertRule(`${selector}{${result}}`, styleSheet.cssRules.length);
				}
			});
		}
	}

	/**
	 * Append a script tag to the document head
	 * @param {string} src url
	 * @returns {Promise} loaded
	 */
	addScript(src: string): Promise<boolean> {

		return new Promise((resolve: (value: boolean) => void, _reject: (reason?: unknown) => void) => {
			let ready = false;

			if(!this.document) {
				resolve(false);
				return;
			}

			const $script = this.document.createElement("script");
			$script.type = "text/javascript";
			$script.async = true;
			$script.src = src;
			$script.onload = (): void => {
				if (!ready) {
					ready = true;
					setTimeout(() => {
						resolve(true);
					}, 1);
				}
			};

			this.document.head.appendChild($script);

		});
	}

	/**
	 * Add a class to the contents container
	 * @param {string} className
	 */
	addClass(className: string): void {
		if(!this.document) return;

		const content = this.content || this.document.body;

		if (content) {
			content.classList.add(className);
		}

	}

	/**
	 * Remove a class from the contents container
	 * @param className - class name to remove
	 */
	removeClass(className: string): void {
		if(!this.document) return;

		const content = this.content || this.document.body;

		if (content) {
			content.classList.remove(className);
		}

	}

	/**
	 * Add DOM event listeners
	 * @private
	 */
	addEventListeners(): void {
		if(!this.document) {
			return;
		}

		this._triggerEvent = this.triggerEvent.bind(this);

		DOM_EVENTS.forEach((eventName) => {
			this.document.addEventListener(eventName, this._triggerEvent!, { passive: true });
		});

	}

	/**
	 * Remove DOM event listeners
	 * @private
	 */
	removeEventListeners(): void {
		if(!this.document) {
			return;
		}
		DOM_EVENTS.forEach((eventName) => {
			this.document.removeEventListener(eventName, this._triggerEvent!);
		});
		this._triggerEvent = undefined;
	}

	/**
	 * Emit passed browser events
	 * @private
	 */
	triggerEvent(e: Event): void {
		this.emit(e.type, e);
	}

	/**
	 * Add listener for text selection
	 * @private
	 */
	addSelectionListeners(): void {
		if(!this.document) {
			return;
		}
		this._onSelectionChange = this.onSelectionChange.bind(this);
		this.document.addEventListener("selectionchange", this._onSelectionChange!, { passive: true });
	}

	/**
	 * Remove listener for text selection
	 * @private
	 */
	removeSelectionListeners(): void {
		if(!this.document) {
			return;
		}
		this.document.removeEventListener("selectionchange", this._onSelectionChange!);
		this._onSelectionChange = undefined;
	}

	/**
	 * Handle getting text on selection
	 * @private
	 */
	onSelectionChange(_e: Event): void {
		if (this.selectionEndTimeout) {
			clearTimeout(this.selectionEndTimeout);
		}
		this.selectionEndTimeout = setTimeout(() => {
			const selection = this.window.getSelection();
			if (selection) {
				this.triggerSelectedEvent(selection);
			}
		}, 250);
	}

	/**
	 * Emit event on text selection
	 * @private
	 */
	triggerSelectedEvent(selection: Selection): void {
		let range, cfirange;

		if (selection && selection.rangeCount > 0) {
			range = selection.getRangeAt(0);
			if(!range.collapsed) {
				// cfirange = this.section.cfiFromRange(range);
				cfirange = new EpubCFI(range, this.cfiBase).toString();
				this.emit(EVENTS.CONTENTS.SELECTED, cfirange);
				this.emit(EVENTS.CONTENTS.SELECTED_RANGE, range);
			}
		}
	}

	/**
	 * Get a Dom Range from EpubCFI
	 * @param {EpubCFI} _cfi
	 * @param {string} [ignoreClass]
	 * @returns {Range} range
	 */
	range(_cfi: string, ignoreClass?: string): Range {
		const cfi = new EpubCFI(_cfi);
		return cfi.toRange(this.document, ignoreClass)!;
	}

	/**
	 * Get an EpubCFI from a Dom Range
	 * @param {Range} range
	 * @param {string} [ignoreClass]
	 * @returns {EpubCFI} cfi
	 */
	cfiFromRange(range: Range, ignoreClass?: string): string {
		return new EpubCFI(range, this.cfiBase, ignoreClass).toString();
	}

	/**
	 * Get an EpubCFI from a Dom node
	 * @param {node} node
	 * @param {string} [ignoreClass]
	 * @returns {EpubCFI} cfi
	 */
	cfiFromNode(node: Node, ignoreClass?: string): string {
		return new EpubCFI(node, this.cfiBase, ignoreClass).toString();
	}

	/**
	 * Size the contents to a given width and height
	 * @param {number} [width]
	 * @param {number} [height]
	 */
	size(width?: number, height?: number): void {
		const viewport: Partial<Record<keyof ViewportSettings, string | number>> = { scale: 1.0, scalable: "no" };

		this.layoutStyle("scrolling");

		if (width !== undefined && width >= 0) {
			this.width(width);
			viewport.width = width;
			this.css("padding", "0 "+(width/12)+"px");
		}

		if (height !== undefined && height >= 0) {
			this.height(height);
			viewport.height = height;
		}

		this.css("margin", "0");
		this.css("box-sizing", "border-box");


		this.viewport(viewport);
	}

	/**
	 * Apply columns to the contents for pagination
	 * @param {number} width
	 * @param {number} height
	 * @param {number} columnWidth
	 * @param {number} gap
	 */
	columns(width: number, height: number, columnWidth: number, gap: number, dir?: string): void {
		const COLUMN_AXIS = prefixed("column-axis");
		const COLUMN_GAP = prefixed("column-gap");
		const COLUMN_WIDTH = prefixed("column-width");
		const COLUMN_FILL = prefixed("column-fill");

		const writingMode = this.writingMode();
		const axis = (writingMode.indexOf("vertical") === 0) ? "vertical" : "horizontal";

		this.layoutStyle("paginated");

		if (dir === "rtl" && axis === "horizontal") {
			this.direction(dir);
		}

		this.width(width);
		this.height(height);

		// Deal with Mobile trying to scale to viewport
		this.viewport({ width: width, height: height, scale: 1.0, scalable: "no" });

		// Fixes Safari column cut offs, but causes RTL issues.
		// Required on iOS: block-level body in CSS columns triggers a
		// WKWebView content-size expansion feedback loop where scrollWidth
		// grows toward infinity. inline-block shrink-wraps the body to
		// its explicit width, breaking the cycle.
		this.css("display", "inline-block");

		this.css("overflow-y", "hidden");
		this.css("margin", "0", true);

		if (axis === "vertical") {
			this.css("padding-top", (gap / 2) + "px", true);
			this.css("padding-bottom", (gap / 2) + "px", true);
			this.css("padding-left", "20px");
			this.css("padding-right", "20px");
			this.css(COLUMN_AXIS, "vertical");
		} else {
			this.css("padding-top", "20px");
			this.css("padding-bottom", "20px");
			this.css("padding-left", (gap / 2) + "px", true);
			this.css("padding-right", (gap / 2) + "px", true);
			this.css(COLUMN_AXIS, "horizontal");
		}

		this.css("box-sizing", "border-box");
		this.css("max-width", "inherit");

		this.css(COLUMN_FILL, "auto");

		this.css(COLUMN_GAP, gap+"px");
		this.css(COLUMN_WIDTH, columnWidth+"px");
	}

	/**
	 * Scale contents from center
	 * @param {number} scale
	 * @param {number} offsetX
	 * @param {number} offsetY
	 */
	scaler(scale: number, offsetX?: number, offsetY?: number): void {
		const scaleStr = "scale(" + scale + ")";
		let translateStr = "";
		// this.css("position", "absolute"));
		this.css("transform-origin", "top left");

		if ((offsetX !== undefined && offsetX >= 0) || (offsetY !== undefined && offsetY >= 0)) {
			translateStr = " translate(" + (offsetX || 0 )+ "px, " + (offsetY || 0 )+ "px )";
		}

		this.css("transform", scaleStr + translateStr);
	}

	/**
	 * Fit contents into a fixed width and height
	 * @param {number} width
	 * @param {number} height
	 */
	fit(width: number, height: number, section?: Section): void {
		const viewport = this.viewport();
		const viewportWidth = parseInt(viewport.width);
		const viewportHeight = parseInt(viewport.height);
		const widthScale = width / viewportWidth;
		const heightScale = height / viewportHeight;
		const scale = widthScale < heightScale ? widthScale : heightScale;

		// the translate does not work as intended, elements can end up unaligned
		// var offsetY = (height - (viewportHeight * scale)) / 2;
		// var offsetX = 0;
		// if (this.sectionIndex % 2 === 1) {
		// 	offsetX = width - (viewportWidth * scale);
		// }

		this.layoutStyle("paginated");

		// scale needs width and height to be set
		this.width(viewportWidth);
		this.height(viewportHeight);
		this.overflow("hidden");

		// Scale to the correct size
		this.scaler(scale, 0, 0);
		// this.scaler(scale, offsetX > 0 ? offsetX : 0, offsetY);

		// background images are not scaled by transform
		this.css("background-size", viewportWidth * scale + "px " + viewportHeight * scale + "px");

		this.css("background-color", "transparent");
		if (section && section.properties!.includes("page-spread-left")) {
			// set margin since scale is weird
			const marginLeft = width - (viewportWidth * scale);
			this.css("margin-left", marginLeft + "px");
		}
	}

	/**
	 * Set the direction of the text
	 * @param {string} [dir="ltr"] "rtl" | "ltr"
	 */
	direction(dir: string): void {
		if (this.documentElement) {
			this.documentElement.style["direction"] = dir;
		}
	}

	mapPage(cfiBase: string, layout: LayoutProps, start: number, end: number, dev?: boolean): EpubCFIPair | undefined {
		const mapping = new Mapping(layout, undefined, undefined, dev);

		return mapping.page(this, cfiBase, start, end);
	}

	/**
	 * Emit event when link in content is clicked
	 * @private
	 */
	linksHandler(): void {
		replaceLinks(this.content, (href) => {
			this.emit(EVENTS.CONTENTS.LINK_CLICKED, href);
		});
	}

	/**
	 * Set the writingMode of the text
	 * @param {string} [mode="horizontal-tb"] "horizontal-tb" | "vertical-rl" | "vertical-lr"
	 */
	writingMode(mode?: string): string {
		const WRITING_MODE = prefixed("writing-mode");

		if (mode && this.documentElement) {
			(this.documentElement.style as unknown as Record<string, string>)[WRITING_MODE] = mode;
		}

		return (this.window.getComputedStyle(this.documentElement) as unknown as Record<string, string>)[WRITING_MODE] || "";
	}

	/**
	 * Set the layoutStyle of the content
	 * @param {string} [style="paginated"] "scrolling" | "paginated"
	 * @private
	 */
	layoutStyle(style?: string): string {

		if (style) {
			this._layoutStyle = style;
			navigator.epubReadingSystem!.layoutStyle = this._layoutStyle;
		}

		return this._layoutStyle || "paginated";
	}

	/**
	 * Add the epubReadingSystem object to the navigator
	 * @param {string} name
	 * @param {string} version
	 * @private
	 */
	epubReadingSystem(name: string, version: string): void {
		navigator.epubReadingSystem = {
			name: name,
			version: version,
			layoutStyle: this.layoutStyle(),
			hasFeature: function (feature: string): boolean {
				switch (feature) {
					case "dom-manipulation":
						return true;
					case "layout-changes":
						return true;
					case "touch-events":
						return true;
					case "mouse-events":
						return true;
					case "keyboard-events":
						return true;
					case "spine-scripting":
						return false;
					default:
						return false;
				}
			}
		};
	}

	destroy(): void {
		this.removeListeners();
		this.__listeners = {};
	}
}

EventEmitter(Contents.prototype);

export default Contents;
