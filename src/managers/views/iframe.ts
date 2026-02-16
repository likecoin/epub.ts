import EventEmitter from "../../utils/event-emitter";
import {extend, borders, uuid, isNumber, bounds, defer, createBlobUrl, revokeBlobUrl} from "../../utils/core";
import EpubCFI from "../../epubcfi";
import Contents from "../../contents";
import { EVENTS } from "../../utils/constants";
import { Pane, Highlight, Underline } from "../../marks-pane";
import type { Mark } from "../../marks-pane";
import type { IEventEmitter, ViewSettings, ReframeBounds, RequestFunction } from "../../types";
import type Section from "../../section";
import type Layout from "../../layout";

class IframeView implements IEventEmitter {
	settings: ViewSettings;
	id: string;
	section: Section;
	index: number;
	element: HTMLElement;
	added: boolean;
	displayed: boolean;
	rendered: boolean;
	fixedWidth: number;
	fixedHeight: number;
	epubcfi: EpubCFI;
	layout: Layout;
	pane: Pane | undefined;
	highlights: Record<string, { mark: Mark; element: SVGElement | null; listeners: (EventListener | undefined)[] }>;
	underlines: Record<string, { mark: Mark; element: SVGElement | null; listeners: (EventListener | undefined)[] }>;
	marks: Record<string, { element: HTMLAnchorElement; range: Range; listeners: (EventListener | undefined)[] }>;
	iframe: HTMLIFrameElement | undefined;
	resizing!: boolean;
	_width: number | undefined;
	_height: number | undefined;
	_textWidth: number | undefined;
	_textHeight: number | undefined;
	_contentWidth: number | undefined;
	_contentHeight: number | undefined;
	_needsReframe!: boolean;
	_expanding!: boolean;
	elementBounds!: { width: number; height: number };
	supportsSrcdoc!: boolean;
	sectionRender!: Promise<string>;
	lockedWidth!: number;
	lockedHeight!: number;
	prevBounds: ReframeBounds | undefined;
	blobUrl!: string;
	document!: Document;
	window!: Window;
	contents: Contents | undefined;
	rendering!: boolean;
	writingMode!: string;
	stopExpanding!: boolean;
	axis!: string;
	expanded?: boolean;

	declare on: IEventEmitter["on"];
	declare off: IEventEmitter["off"];
	declare emit: IEventEmitter["emit"];
	declare __listeners: IEventEmitter["__listeners"];

	constructor(section: Section, options?: ViewSettings) {
		this.settings = extend({
			ignoreClass : "",
			axis: undefined, //options.layout && options.layout.props.flow === "scrolled" ? "vertical" : "horizontal",
			direction: undefined,
			width: 0,
			height: 0,
			layout: undefined,
			globalLayoutProperties: {},
			method: undefined,
			forceRight: false,
			allowScriptedContent: false,
			allowPopups: false
		} as ViewSettings, options || {});

		this.id = "epubjs-view-" + uuid();
		this.section = section;
		this.index = section.index!;

		this.element = this.container(this.settings.axis);

		this.added = false;
		this.displayed = false;
		this.rendered = false;

		// this.width  = this.settings.width;
		// this.height = this.settings.height;

		this.fixedWidth  = 0;
		this.fixedHeight = 0;

		// Blank Cfi for Parsing
		this.epubcfi = new EpubCFI();

		this.layout = this.settings.layout as unknown as Layout;
		// Dom events to listen for
		// this.listenedEvents = ["keydown", "keyup", "keypressed", "mouseup", "mousedown", "click", "touchend", "touchstart"];

		this.pane = undefined;
		this.highlights = {};
		this.underlines = {};
		this.marks = {};

	}

	container(axis?: string): HTMLElement {
		const element = document.createElement("div");

		element.classList.add("epub-view");

		// this.element.style.minHeight = "100px";
		element.style.height = "0px";
		element.style.width = "0px";
		element.style.overflow = "hidden";
		element.style.position = "relative";
		element.style.display = "block";

		if(axis && axis == "horizontal"){
			element.style.flex = "none";
		} else {
			element.style.flex = "initial";
		}

		return element;
	}

	create(): HTMLIFrameElement {

		if(this.iframe) {
			return this.iframe;
		}

		if(!this.element) {
			this.element = this.container();
		}

		this.iframe = document.createElement("iframe");
		this.iframe.id = this.id;
		this.iframe.scrolling = "no"; // Might need to be removed: breaks ios width calculations
		this.iframe.style.overflow = "hidden";
		this.iframe.setAttribute("seamless", "seamless");
		// Back up if seamless isn't supported
		this.iframe.style.border = "none";

		// sandbox
		this.iframe.sandbox = "allow-same-origin";
		if (this.settings.allowScriptedContent) {
			this.iframe.sandbox += " allow-scripts";
		}
		if (this.settings.allowPopups) {
			this.iframe.sandbox += " allow-popups";
		}

		this.iframe.setAttribute("enable-annotation", "true");

		this.resizing = true;

		// this.iframe.style.display = "none";
		this.element.style.visibility = "hidden";
		this.iframe.style.visibility = "hidden";

		this.iframe.style.width = "0";
		this.iframe.style.height = "0";
		this._width = 0;
		this._height = 0;

		this.element.setAttribute("ref", String(this.index));

		this.added = true;

		this.elementBounds = bounds(this.element);

		// if(width || height){
		//   this.resize(width, height);
		// } else if(this.width && this.height){
		//   this.resize(this.width, this.height);
		// } else {
		//   this.iframeBounds = bounds(this.iframe);
		// }


		if(("srcdoc" in this.iframe)) {
			this.supportsSrcdoc = true;
		} else {
			this.supportsSrcdoc = false;
		}

		if (!this.settings.method) {
			this.settings.method = this.supportsSrcdoc ? "srcdoc" : "write";
		}

		return this.iframe;
	}

	render(request: RequestFunction, _show?: boolean): Promise<void> {

		// view.onLayout = this.layout.format.bind(this.layout);
		this.create();

		// Fit to size of the container, apply padding
		this.size();

		if(!this.sectionRender) {
			this.sectionRender = this.section.render(request);
		}

		// Render Chain
		return this.sectionRender
			.then((contents: string) => {
				return this.load(contents);
			})
			.then(() => {

				// find and report the writingMode axis
				const writingMode = this.contents!.writingMode();

				// Set the axis based on the flow and writing mode
				let axis;
				if (this.settings.flow === "scrolled") {
					axis = (writingMode.indexOf("vertical") === 0) ? "horizontal" : "vertical";
				} else {
					axis = (writingMode.indexOf("vertical") === 0) ? "vertical" : "horizontal";
				}

				if (writingMode.indexOf("vertical") === 0 && this.settings.flow === "paginated") {
					this.layout.delta = this.layout.height;
				}

				this.setAxis(axis);
				this.emit(EVENTS.VIEWS.AXIS, axis);

				this.setWritingMode(writingMode);
				this.emit(EVENTS.VIEWS.WRITING_MODE, writingMode);


				// apply the layout function to the contents
				this.layout.format(this.contents!, this.section, this.axis);

				// Listen for events that require an expansion of the iframe
				this.addListeners();

				return new Promise<void>((resolve, _reject) => {
					// Expand the iframe to the full size of the content
					this.expand();

					if (this.settings.forceRight) {
						this.element.style.marginLeft = this.width() + "px";
					}
					resolve();
				});

			}, (e: Error) => {
				this.emit(EVENTS.VIEWS.LOAD_ERROR, e);
				return new Promise((resolve, reject) => {
					reject(e);
				});
			})
			.then(() => {
				this.emit(EVENTS.VIEWS.RENDERED, this.section);
			});

	}

	reset (): void {
		if (this.iframe) {
			this.iframe.style.width = "0";
			this.iframe.style.height = "0";
			this._width = 0;
			this._height = 0;
			this._textWidth = undefined;
			this._contentWidth = undefined;
			this._textHeight = undefined;
			this._contentHeight = undefined;
		}
		this._needsReframe = true;
	}

	// Determine locks base on settings
	size(_width?: number, _height?: number): void {
		const width = _width || this.settings.width!;
		const height = _height || this.settings.height!;

		if(this.layout.name === "pre-paginated") {
			this.lock("both", width, height);
		} else if(this.settings.axis === "horizontal") {
			this.lock("height", width, height);
		} else {
			this.lock("width", width, height);
		}

		this.settings.width = width;
		this.settings.height = height;
	}

	// Lock an axis to element dimensions, taking borders into account
	lock(what: string, width: number, height: number): void {
		const elBorders = borders(this.element);
		let iframeBorders;

		if(this.iframe) {
			iframeBorders = borders(this.iframe);
		} else {
			iframeBorders = {width: 0, height: 0};
		}

		if(what == "width" && isNumber(width)){
			this.lockedWidth = width - elBorders.width - iframeBorders.width;
			// this.resize(this.lockedWidth, width); //  width keeps ratio correct
		}

		if(what == "height" && isNumber(height)){
			this.lockedHeight = height - elBorders.height - iframeBorders.height;
			// this.resize(width, this.lockedHeight);
		}

		if(what === "both" &&
			 isNumber(width) &&
			 isNumber(height)){

			this.lockedWidth = width - elBorders.width - iframeBorders.width;
			this.lockedHeight = height - elBorders.height - iframeBorders.height;
			// this.resize(this.lockedWidth, this.lockedHeight);
		}

		if(this.displayed && this.iframe) {

			// this.contents.layout();
			this.expand();
		}



	}

	// Resize a single axis based on content dimensions
	expand(_force?: boolean): void {
		let width = this.lockedWidth;
		let height = this.lockedHeight;
		let columns;

		let _textWidth, _textHeight;

		if(!this.iframe || this._expanding) return;

		this._expanding = true;

		if(this.layout.name === "pre-paginated") {
			width = this.layout.columnWidth;
			height = this.layout.height;
		}
		// Expand Horizontally
		else if(this.settings.axis === "horizontal") {
			// Get the width of the text
			width = this.contents!.textWidth();

			if (width % this.layout.pageWidth > 0) {
				width = Math.ceil(width / this.layout.pageWidth) * this.layout.pageWidth;
			}

			if (this.settings.forceEvenPages) {
				columns = (width / this.layout.pageWidth);
				if ( this.layout.divisor > 1 &&
						 this.layout.name === "reflowable" &&
						(columns % 2 > 0)) {
					// add a blank page
					width += this.layout.pageWidth;
				}
			}

		} // Expand Vertically
		else if(this.settings.axis === "vertical") {
			height = this.contents!.textHeight();
			if (this.settings.flow === "paginated" &&
				height % this.layout.height > 0) {
				height = Math.ceil(height / this.layout.height) * this.layout.height;
			}
		}

		// Only Resize if dimensions have changed or
		// if Frame is still hidden, so needs reframing
		if(this._needsReframe || width != this._width || height != this._height){
			this.reframe(width, height);
		}

		this._expanding = false;
	}

	reframe(width: number, height: number): void {
		if(isNumber(width)){
			this.element.style.width = width + "px";
			this.iframe!.style.width = width + "px";
			this._width = width;
		}

		if(isNumber(height)){
			this.element.style.height = height + "px";
			this.iframe!.style.height = height + "px";
			this._height = height;
		}

		const widthDelta = this.prevBounds ? width - this.prevBounds.width : width;
		const heightDelta = this.prevBounds ? height - this.prevBounds.height : height;

		const size = {
			width: width,
			height: height,
			widthDelta: widthDelta,
			heightDelta: heightDelta,
		};

		this.pane && this.pane.render();

		requestAnimationFrame(() => {
			let mark;
			for (const m in this.marks) {
				if (this.marks.hasOwnProperty(m)) {
					mark = this.marks[m]!;
					this.placeMark(mark.element, mark.range);
				}
			}
		});

		this.onResize(this, size);

		this.emit(EVENTS.VIEWS.RESIZED, size);

		this.prevBounds = size;

		this.elementBounds = bounds(this.element);

	}


	load(contents: string): Promise<Contents> {
		const loading = new defer<Contents>();
		const loaded = loading.promise;

		if(!this.iframe) {
			loading.reject(new Error("No Iframe Available"));
			return loaded;
		}

		this.iframe.onload = (event: Event): void => {

			this.onLoad(event, loading);

		};

		if (this.settings.method === "blobUrl") {
			this.blobUrl = createBlobUrl(contents, "application/xhtml+xml");
			this.iframe.src = this.blobUrl;
			this.element.appendChild(this.iframe);
		} else if(this.settings.method === "srcdoc"){
			this.iframe.srcdoc = contents;
			this.element.appendChild(this.iframe);
		} else {

			this.element.appendChild(this.iframe);

			this.document = this.iframe.contentDocument!;

			if(!this.document) {
				loading.reject(new Error("No Document Available"));
				return loaded;
			}

			this.document.open();
			this.document.write(contents);
			this.document.close();

		}

		return loaded;
	}

	onLoad(event: Event, promise: { resolve: (value: Contents | PromiseLike<Contents>) => void; reject: (reason?: unknown) => void }): void {

		this.window = this.iframe!.contentWindow!;
		this.document = this.iframe!.contentDocument!;

		this.contents = new Contents(this.document, this.document.body, this.section.cfiBase, this.section.index);

		this.rendering = false;

		let link = this.document.querySelector("link[rel='canonical']");
		if (link) {
			link.setAttribute("href", this.section.canonical);
		} else {
			link = this.document.createElement("link");
			link.setAttribute("rel", "canonical");
			link.setAttribute("href", this.section.canonical);
			this.document.querySelector("head")!.appendChild(link);
		}

		this.contents.on(EVENTS.CONTENTS.EXPAND, () => {
			if(this.displayed && this.iframe) {
				this.expand();
				if (this.contents) {
					this.layout.format(this.contents);
				}
			}
		});

		this.contents.on(EVENTS.CONTENTS.RESIZE, (_e: Event) => {
			if(this.displayed && this.iframe) {
				this.expand();
				if (this.contents) {
					this.layout.format(this.contents);
				}
			}
		});

		promise.resolve(this.contents);
	}

	setLayout(layout: Layout): void {
		this.layout = layout;

		if (this.contents) {
			this.layout.format(this.contents);
			this.expand();
		}
	}

	setAxis(axis: string): void {

		this.settings.axis = axis;

		if(axis == "horizontal"){
			this.element.style.flex = "none";
		} else {
			this.element.style.flex = "initial";
		}

		this.size();

	}

	setWritingMode(mode: string): void {
		// this.element.style.writingMode = writingMode;
		this.writingMode = mode;
	}

	addListeners(): void {
		//TODO: Add content listeners for expanding
	}

	removeListeners(): void {
		if (this.contents) {
			this.contents.off(EVENTS.CONTENTS.EXPAND);
			this.contents.off(EVENTS.CONTENTS.RESIZE);
		}
	}

	display(request: RequestFunction): Promise<IframeView> {
		const displayed = new defer<IframeView>();

		if (!this.displayed) {

			this.render(request)
				.then(() => {

					this.emit(EVENTS.VIEWS.DISPLAYED, this);
					this.onDisplayed(this);

					this.displayed = true;
					displayed.resolve(this);

				}, (err) => {
					displayed.reject(err);
				});

		} else {
			displayed.resolve(this);
		}


		return displayed.promise;
	}

	show(): void {

		this.element.style.visibility = "visible";

		if(this.iframe){
			this.iframe.style.visibility = "visible";

			// Remind Safari to redraw the iframe
			this.iframe.style.transform = "translateZ(0)";
			this.iframe.offsetWidth;
			this.iframe.style.transform = "";
		}

		this.emit(EVENTS.VIEWS.SHOWN, this);
	}

	hide(): void {
		// this.iframe.style.display = "none";
		this.element.style.visibility = "hidden";
		this.iframe!.style.visibility = "hidden";

		this.stopExpanding = true;
		this.emit(EVENTS.VIEWS.HIDDEN, this);
	}

	offset(): { top: number; left: number } {
		return {
			top: this.element.offsetTop,
			left: this.element.offsetLeft
		}
	}

	width(): number {
		return this._width!;
	}

	height(): number {
		return this._height!;
	}

	position(): DOMRect {
		return this.element.getBoundingClientRect();
	}

	locationOf(target: string): { left: number; top: number } {
		const _parentPos = this.iframe!.getBoundingClientRect();
		const targetPos = this.contents!.locationOf(target, this.settings.ignoreClass);

		return {
			"left": targetPos.left,
			"top": targetPos.top
		};
	}

	onDisplayed(_view: IframeView): void {
		// Stub, override with a custom functions
	}

	onResize(_view: IframeView, _e?: ReframeBounds): void {
		// Stub, override with a custom functions
	}

	bounds(force?: boolean): { width: number; height: number } {
		if(force || !this.elementBounds) {
			this.elementBounds = bounds(this.element);
		}

		return this.elementBounds;
	}

	highlight(cfiRange: string, data: Record<string, string> = {}, cb?: EventListener, className: string = "epubjs-hl", styles: Record<string, string> = {}): Mark | undefined {
		if (!this.contents) {
			return;
		}
		const attributes = Object.assign({"fill": "yellow", "fill-opacity": "0.3", "mix-blend-mode": "multiply"}, styles);
		const range = this.contents.range(cfiRange);

		const emitter: EventListener = (_e: Event): void => {
			this.emit(EVENTS.VIEWS.MARK_CLICKED, cfiRange, data);
		};

		data["epubcfi"] = cfiRange;

		if (!this.pane) {
			this.pane = new Pane(this.iframe!, this.element);
		}

		const m = new Highlight(range, className, data, attributes);
		let h: Mark;
		try {
			h = this.pane.addMark(m);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error("Failed to add highlight for", cfiRange, e);
			return;
		}

		this.highlights[cfiRange] = { "mark": h, "element": h.element, "listeners": [emitter, cb] };

		h.element!.setAttribute("ref", className);
		h.element!.addEventListener("click", emitter);
		h.element!.addEventListener("touchstart", emitter);

		if (cb) {
			h.element!.addEventListener("click", cb);
			h.element!.addEventListener("touchstart", cb);
		}
		return h;
	}

	underline(cfiRange: string, data: Record<string, string> = {}, cb?: EventListener, className: string = "epubjs-ul", styles: Record<string, string> = {}): Mark | undefined {
		if (!this.contents) {
			return;
		}
		const attributes = Object.assign({"stroke": "black", "stroke-opacity": "0.3", "mix-blend-mode": "multiply"}, styles);
		const range = this.contents.range(cfiRange);
		const emitter: EventListener = (_e: Event): void => {
			this.emit(EVENTS.VIEWS.MARK_CLICKED, cfiRange, data);
		};

		data["epubcfi"] = cfiRange;

		if (!this.pane) {
			this.pane = new Pane(this.iframe!, this.element);
		}

		const m = new Underline(range, className, data, attributes);
		let h: Mark;
		try {
			h = this.pane.addMark(m);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error("Failed to add underline for", cfiRange, e);
			return;
		}

		this.underlines[cfiRange] = { "mark": h, "element": h.element, "listeners": [emitter, cb] };

		h.element!.setAttribute("ref", className);
		h.element!.addEventListener("click", emitter);
		h.element!.addEventListener("touchstart", emitter);

		if (cb) {
			h.element!.addEventListener("click", cb);
			h.element!.addEventListener("touchstart", cb);
		}
		return h;
	}

	mark(cfiRange: string, data: Record<string, string> = {}, cb?: EventListener): Node | { element: HTMLAnchorElement; range: Range; listeners: (EventListener | undefined)[] } | null | undefined {
		if (!this.contents) {
			return;
		}

		if (cfiRange in this.marks) {
			const item = this.marks[cfiRange];
			return item;
		}

		let range = this.contents.range(cfiRange);
		if (!range) {
			return;
		}
		const container = range.commonAncestorContainer;
		const parent = (container.nodeType === 1) ? container : container.parentNode;

		const emitter: EventListener = (_e: Event): void => {
			this.emit(EVENTS.VIEWS.MARK_CLICKED, cfiRange, data);
		};

		if (range.collapsed && container.nodeType === 1) {
			range = new Range();
			range.selectNodeContents(container);
		} else if (range.collapsed) { // Webkit doesn't like collapsed ranges
			range = new Range();
			range.selectNodeContents(parent!);
		}

		const mark = this.document.createElement("a");
		mark.setAttribute("ref", "epubjs-mk");
		mark.style.position = "absolute";

		mark.dataset["epubcfi"] = cfiRange;

		if (data) {
			Object.keys(data).forEach((key) => {
				mark.dataset[key] = data[key];
			});
		}

		if (cb) {
			mark.addEventListener("click", cb);
			mark.addEventListener("touchstart", cb);
		}

		mark.addEventListener("click", emitter);
		mark.addEventListener("touchstart", emitter);

		this.placeMark(mark, range);

		this.element.appendChild(mark);

		this.marks[cfiRange] = { "element": mark, "range": range, "listeners": [emitter, cb] };

		return parent;
	}

	placeMark(element: HTMLElement, range: Range): void {
		let top, right, left;

		if(this.layout.name === "pre-paginated" ||
			this.settings.axis !== "horizontal") {
			const pos = range.getBoundingClientRect();
			top = pos.top;
			right = pos.right;
		} else {
			// Element might break columns, so find the left most element
			const rects = range.getClientRects();

			let rect;
			for (let i = 0; i != rects.length; i++) {
				rect = rects[i]!;
				if (!left || rect.left < left) {
					left = rect.left;
					// right = rect.right;
					right = Math.ceil(left / this.layout.props.pageWidth!) * this.layout.props.pageWidth! - (this.layout.gap / 2);
					top = rect.top;
				}
			}
		}

		element.style.top = `${top}px`;
		element.style.left = `${right}px`;
	}

	unhighlight(cfiRange: string): void {
		if (cfiRange in this.highlights) {
			const item = this.highlights[cfiRange]!;

			this.pane!.removeMark(item.mark);
			item.listeners.forEach((l: EventListener | undefined) => {
				if (l) {
					item.element!.removeEventListener("click", l);
					item.element!.removeEventListener("touchstart", l);
				};
			});
			delete this.highlights[cfiRange];
		}
	}

	ununderline(cfiRange: string): void {
		if (cfiRange in this.underlines) {
			const item = this.underlines[cfiRange]!;
			this.pane!.removeMark(item.mark);
			item.listeners.forEach((l: EventListener | undefined) => {
				if (l) {
					item.element!.removeEventListener("click", l);
					item.element!.removeEventListener("touchstart", l);
				};
			});
			delete this.underlines[cfiRange];
		}
	}

	unmark(cfiRange: string): void {
		if (cfiRange in this.marks) {
			const item = this.marks[cfiRange]!;
			this.element.removeChild(item.element);
			item.listeners.forEach((l: EventListener | undefined) => {
				if (l) {
					item.element.removeEventListener("click", l);
					item.element.removeEventListener("touchstart", l);
				};
			});
			delete this.marks[cfiRange];
		}
	}

	destroy(): void {

		for (const cfiRange in this.highlights) {
			this.unhighlight(cfiRange);
		}

		for (const cfiRange in this.underlines) {
			this.ununderline(cfiRange);
		}

		for (const cfiRange in this.marks) {
			this.unmark(cfiRange);
		}

		if (this.blobUrl) {
			revokeBlobUrl(this.blobUrl);
		}

		if(this.displayed){
			this.displayed = false;

			this.removeListeners();
			this.contents!.destroy();

			this.stopExpanding = true;

			if (this.iframe) {
				this.iframe.onload = null;
			}
			this.element.removeChild(this.iframe!);

			if (this.pane) {
				this.pane.element.remove();
				this.pane = undefined;
			}

			this.iframe = undefined;
			this.contents = undefined;

			this._textWidth = undefined;
			this._textHeight = undefined;
			this._width = undefined;
			this._height = undefined;
		}

		this.__listeners = {};
	}
}

EventEmitter(IframeView.prototype);

export default IframeView;
