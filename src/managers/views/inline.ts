import EventEmitter from "../../utils/event-emitter";
import {extend, borders, uuid, isNumber, bounds, defer, qs, parse} from "../../utils/core";
import EpubCFI from "../../epubcfi";
import Contents from "../../contents";
import { EVENTS } from "../../utils/constants";
import type Section from "../../section";
import type Layout from "../../layout";
import type { IEventEmitter, ViewSettings, RequestFunction, SizeObject, ReframeBounds } from "../../types";

export interface InlineViewEvents extends Record<string, any[]> {
	"loaderror": [unknown];
	"rendered": [Section];
	"resized": [{ width: number; height: number }];
	"displayed": [InlineView];
	"shown": [InlineView];
	"hidden": [InlineView];
}

class InlineView implements IEventEmitter<InlineViewEvents> {
	settings: ViewSettings & { layout: Layout };
	id: string;
	section: Section;
	index: number;
	element: HTMLElement;
	added: boolean;
	displayed: boolean;
	rendered: boolean;
	width: number;
	height: number;
	fixedWidth: number;
	fixedHeight: number;
	epubcfi: EpubCFI;
	layout: Layout;
	frame: HTMLDivElement | undefined;
	resizing!: boolean;
	_width: number | undefined;
	_height: number | undefined;
	_textWidth: number | undefined;
	_textHeight: number | undefined;
	_needsReframe!: boolean;
	_expanding!: boolean;
	elementBounds: SizeObject | undefined;
	prevBounds: SizeObject | undefined;
	lockedWidth!: number;
	lockedHeight!: number;
	document!: Document;
	window!: Window;
	contents: Contents | undefined;
	rendering!: boolean;
	stopExpanding!: boolean;

	declare on: IEventEmitter<InlineViewEvents>["on"];
	declare off: IEventEmitter<InlineViewEvents>["off"];
	declare emit: IEventEmitter<InlineViewEvents>["emit"];

	constructor(section: Section, options?: ViewSettings) {
		this.settings = extend({
			ignoreClass : "",
			axis: "vertical",
			width: 0,
			height: 0,
			layout: undefined,
			globalLayoutProperties: {},
		}, options || {}) as ViewSettings & { layout: Layout };

		this.id = "epubjs-view:" + uuid();
		this.section = section;
		this.index = section.index!;

		this.element = this.container(this.settings.axis);

		this.added = false;
		this.displayed = false;
		this.rendered = false;

		this.width  = this.settings.width!;
		this.height = this.settings.height!;

		this.fixedWidth  = 0;
		this.fixedHeight = 0;

		// Blank Cfi for Parsing
		this.epubcfi = new EpubCFI();

		this.layout = this.settings.layout;
		// Dom events to listen for
		// this.listenedEvents = ["keydown", "keyup", "keypressed", "mouseup", "mousedown", "click", "touchend", "touchstart"];

	}

	container(axis?: string): HTMLElement {
		const element = document.createElement("div");

		element.classList.add("epub-view");

		// if(this.settings.axis === "horizontal") {
		//   element.style.width = "auto";
		//   element.style.height = "0";
		// } else {
		//   element.style.width = "0";
		//   element.style.height = "auto";
		// }

		element.style.overflow = "hidden";

		if(axis && axis == "horizontal"){
			element.style.display = "inline-block";
		} else {
			element.style.display = "block";
		}

		return element;
	}

	create(): HTMLDivElement {

		if(this.frame) {
			return this.frame;
		}

		if(!this.element) {
			this.element = this.container();
		}

		this.frame = document.createElement("div");
		this.frame.id = this.id;
		this.frame.style.overflow = "hidden";
		this.frame.style.wordSpacing = "initial";
		this.frame.style.lineHeight = "initial";

		this.resizing = true;

		// this.frame.style.display = "none";
		this.element.style.visibility = "hidden";
		this.frame.style.visibility = "hidden";

		if(this.settings.axis === "horizontal") {
			this.frame.style.width = "auto";
			this.frame.style.height = "0";
		} else {
			this.frame.style.width = "0";
			this.frame.style.height = "auto";
		}

		this._width = 0;
		this._height = 0;

		this.element.appendChild(this.frame);
		this.added = true;

		this.elementBounds = bounds(this.element);

		return this.frame;
	}

	render(request: RequestFunction, show?: boolean): Promise<void> {

		// view.onLayout = this.layout.format.bind(this.layout);
		this.create();

		// Fit to size of the container, apply padding
		this.size();

		// Render Chain
		return this.section.render(request)
			.then((contents: string) => {
				return this.load(contents);
			})
			// .then(function(doc){
			// 	return this.hooks.content.trigger(view, this);
			// }.bind(this))
			.then(() => {
				// this.settings.layout.format(view.contents);
				// return this.hooks.layout.trigger(view, this);
			})
			// .then(function(){
			// 	return this.display();
			// }.bind(this))
			// .then(function(){
			// 	return this.hooks.render.trigger(view, this);
			// }.bind(this))
			.then(() => {

				// apply the layout function to the contents
				this.settings.layout.format(this.contents!);

				// Expand the iframe to the full size of the content
				// this.expand();

				// Listen for events that require an expansion of the iframe
				this.addListeners();

				if(show !== false) {
					//this.q.enqueue(function(view){
					this.show();
					//}, view);
				}
				// this.map = new Map(view, this.layout);
				//this.hooks.show.trigger(view, this);
				this.emit(EVENTS.VIEWS.RENDERED, this.section);

			})
			.catch((e: unknown) => {
				this.emit(EVENTS.VIEWS.LOAD_ERROR, e);
			});

	}

	// Determine locks base on settings
	size(_width?: number, _height?: number): void {
		const width = _width || this.settings.width!;
		const height = _height || this.settings.height!;

		if(this.layout.name === "pre-paginated") {
			// TODO: check if these are different than the size set in chapter
			this.lock("both", width, height);
		} else if(this.settings.axis === "horizontal") {
			this.lock("height", width, height);
		} else {
			this.lock("width", width, height);
		}

	}

	// Lock an axis to element dimensions, taking borders into account
	lock(what: string, width: number, height: number): void {
		const elBorders = borders(this.element);
		let iframeBorders;

		if(this.frame) {
			iframeBorders = borders(this.frame);
		} else {
			iframeBorders = {width: 0, height: 0};
		}

		if(what == "width" && isNumber(width)){
			this.lockedWidth = width - elBorders.width - iframeBorders.width;
			this.resize(this.lockedWidth, false); //  width keeps ratio correct
		}

		if(what == "height" && isNumber(height)){
			this.lockedHeight = height - elBorders.height - iframeBorders.height;
			this.resize(false, this.lockedHeight);
		}

		if(what === "both" &&
				isNumber(width) &&
				isNumber(height)){

			this.lockedWidth = width - elBorders.width - iframeBorders.width;
			this.lockedHeight = height - elBorders.height - iframeBorders.height;

			this.resize(this.lockedWidth, this.lockedHeight);
		}

	}

	// Resize a single axis based on content dimensions
	expand(_force?: boolean): void {
		let width = this.lockedWidth;
		let height = this.lockedHeight;

		let textWidth, textHeight;

		if(!this.frame || this._expanding) return;

		this._expanding = true;

		// Expand Horizontally
		if(this.settings.axis === "horizontal") {
			width = this.contentWidth(textWidth);
		} // Expand Vertically
		else if(this.settings.axis === "vertical") {
			height = this.contentHeight(textHeight);
		}

		// Only Resize if dimensions have changed or
		// if Frame is still hidden, so needs reframing
		if(this._needsReframe || width != this._width || height != this._height){
			this.resize(width, height);
		}

		this._expanding = false;
	}

	contentWidth(_min?: number): number {
		return this.frame!.scrollWidth;
	}

	contentHeight(_min?: number): number {
		return this.frame!.scrollHeight;
	}


	resize(width: number | false, height: number | false): void {

		if(!this.frame) return;

		if(isNumber(width)){
			this.frame.style.width = width + "px";
			this._width = width as number;
		}

		if(isNumber(height)){
			this.frame.style.height = height + "px";
			this._height = height as number;
		}

		this.prevBounds = this.elementBounds;

		this.elementBounds = bounds(this.element);

		const size: ReframeBounds = {
			width: this.elementBounds.width,
			height: this.elementBounds.height,
			widthDelta: this.elementBounds.width - this.prevBounds!.width,
			heightDelta: this.elementBounds.height - this.prevBounds!.height,
		};

		this.onResize(this, size);

		this.emit(EVENTS.VIEWS.RESIZED, size);

	}


	load(contents: string): Promise<Contents> {
		const loading = new defer<Contents>();
		const loaded = loading.promise;
		const doc = parse(contents, "text/html");
		const body = qs(doc, "body");

		/*
		var srcs = doc.querySelectorAll("[src]");

		Array.prototype.slice.call(srcs)
			.forEach(function(item) {
				var src = item.getAttribute("src");
				var assetUri = URI(src);
				var origin = assetUri.origin();
				var absoluteUri;

				if (!origin) {
					absoluteUri = assetUri.absoluteTo(this.section.url);
					item.src = absoluteUri;
				}
			}.bind(this));
		*/
		this.frame!.innerHTML = body!.innerHTML;

		this.document = this.frame!.ownerDocument;
		this.window = this.document.defaultView!;

		this.contents = new Contents(this.document, this.frame!);

		this.rendering = false;

		loading.resolve(this.contents);


		return loaded;
	}

	setLayout(layout: Layout): void {
		this.layout = layout;
	}


	resizeListenters(): void {
		// Test size again
		// clearTimeout(this.expanding);
		// this.expanding = setTimeout(this.expand.bind(this), 350);
	}

	addListeners(): void {
		//TODO: Add content listeners for expanding
	}

	removeListeners(): void {
		//TODO: remove content listeners for expanding
	}

	display(request: RequestFunction): Promise<InlineView> {
		const displayed = new defer<InlineView>();

		if (!this.displayed) {

			this.render(request).then(() => {

				this.emit(EVENTS.VIEWS.DISPLAYED, this);
				this.onDisplayed(this);

				this.displayed = true;

				displayed.resolve(this);

			});

		} else {
			displayed.resolve(this);
		}


		return displayed.promise;
	}

	show(): void {

		this.element.style.visibility = "visible";

		if(this.frame){
			this.frame.style.visibility = "visible";
		}

		this.emit(EVENTS.VIEWS.SHOWN, this);
	}

	hide(): void {
		// this.frame.style.display = "none";
		this.element.style.visibility = "hidden";
		this.frame!.style.visibility = "hidden";

		this.stopExpanding = true;
		this.emit(EVENTS.VIEWS.HIDDEN, this);
	}

	position(): DOMRect {
		return this.element.getBoundingClientRect();
	}

	locationOf(target: string): { left: number; top: number } {
		const parentPos = this.frame!.getBoundingClientRect();
		const targetPos = this.contents!.locationOf(target, this.settings.ignoreClass);

		return {
			"left": window.scrollX + parentPos.left + targetPos.left,
			"top": window.scrollY + parentPos.top + targetPos.top
		};
	}

	onDisplayed(_view: InlineView): void {
		// Stub, override with a custom functions
	}

	onResize(_view: InlineView, _e?: ReframeBounds): void {
		// Stub, override with a custom functions
	}

	bounds(): SizeObject {
		if(!this.elementBounds) {
			this.elementBounds = bounds(this.element);
		}
		return this.elementBounds;
	}

	destroy(): void {

		if(this.displayed){
			this.displayed = false;

			this.removeListeners();

			this.stopExpanding = true;
			this.element.removeChild(this.frame!);
			this.displayed = false;
			this.frame = undefined;

			this._textWidth = undefined;
			this._textHeight = undefined;
			this._width = undefined;
			this._height = undefined;
		}
		// this.element.style.height = "0px";
		// this.element.style.width = "0px";
	}
}

EventEmitter(InlineView.prototype);

export default InlineView;
