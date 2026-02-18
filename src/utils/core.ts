/**
 * Core Utilities and Helpers
 * @module Core
*/

/**
 * @returns {function} requestAnimationFrame
 * @memberof Core
 */
export const requestAnimationFrame = (typeof window != "undefined") ? window.requestAnimationFrame.bind(window) : false;
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const _COMMENT_NODE = 8;
const _DOCUMENT_NODE = 9;
const _URL = typeof URL != "undefined" ? URL : (typeof window != "undefined" ? window.URL : undefined!);

/**
 * Generates a UUID
 * based on: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
 * @returns {string} uuid
 * @memberof Core
 */
export function uuid(): string {
	let d = new Date().getTime();
	const uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
		const r = (d + Math.random()*16)%16 | 0;
		d = Math.floor(d/16);
		return (c=="x" ? r : (r&0x7|0x8)).toString(16);
	});
	return uuid;
}

/**
 * Gets the height of a document
 * @returns {number} height
 * @memberof Core
 */
export function documentHeight(): number {
	return Math.max(
			document.documentElement.clientHeight,
			document.body.scrollHeight,
			document.documentElement.scrollHeight,
			document.body.offsetHeight,
			document.documentElement.offsetHeight
	);
}

/**
 * Checks if a node is an element
 * @param {object} obj
 * @returns {boolean}
 * @memberof Core
 */
export function isElement(obj: unknown): boolean {
	return !!(obj && (obj as Node).nodeType == 1);
}

/**
 * @param {any} n
 * @returns {boolean}
 * @memberof Core
 */
export function isNumber(n: unknown): boolean {
	return !isNaN(parseFloat(n as string)) && isFinite(n as number);
}

/**
 * @param {any} n
 * @returns {boolean}
 * @memberof Core
 */
export function isFloat(n: unknown): boolean {
	const f = parseFloat(n as string);

	if (isNumber(n) === false) {
		return false;
	}

	if (typeof n === "string" && n.indexOf(".") > -1) {
		return true;
	}

	return Math.floor(f) !== f;
}

/**
 * Get a prefixed css property
 * @param {string} unprefixed
 * @returns {string}
 * @memberof Core
 */
export function prefixed(unprefixed: string): string {
	const vendors = ["Webkit", "webkit", "Moz", "O", "ms" ];
	const prefixes = ["-webkit-", "-webkit-", "-moz-", "-o-", "-ms-"];
	const lower = unprefixed.toLowerCase();
	const length = vendors.length;

	if (typeof(document) === "undefined" || lower in document.body.style) {
		return unprefixed;
	}

	for (let i = 0; i < length; i++) {
		if ((prefixes[i] + lower) in document.body.style) {
			return prefixes[i] + lower;
		}
	}

	return unprefixed;
}

/**
 * Apply defaults to an object
 * @param {object} obj
 * @returns {object}
 * @memberof Core
 */
export function defaults<T extends object>(obj: T, ...sources: object[]): T {
	for (let i = 0; i < sources.length; i++) {
		const source = sources[i] as Record<string, unknown>;
		for (const prop in source) {
			if ((obj as Record<string, unknown>)[prop] === void 0) (obj as Record<string, unknown>)[prop] = source[prop];
		}
	}
	return obj;
}

/**
 * Extend properties of an object
 * @param {object} target
 * @returns {object}
 * @memberof Core
 */
export function extend<T extends object>(target: T, ...sources: (object | null | undefined)[]): T {
	sources.forEach(function (source) {
		if(!source) return;
		Object.getOwnPropertyNames(source).forEach(function(propName) {
			Object.defineProperty(target, propName, Object.getOwnPropertyDescriptor(source, propName)!);
		});
	});
	return target;
}

/**
 * Fast quicksort insert for sorted array -- based on:
 *  http://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
 * @param {any} item
 * @param {array} array
 * @param {function} [compareFunction]
 * @returns {number} location (in array)
 * @memberof Core
 */
export function insert<T>(item: T, array: T[], compareFunction?: (a: T, b: T) => number): number {
	const location = locationOf(item, array, compareFunction);
	array.splice(location, 0, item);

	return location;
}

/**
 * Finds where something would fit into a sorted array
 * @param {any} item
 * @param {array} array
 * @param {function} [compareFunction]
 * @param {function} [_start]
 * @param {function} [_end]
 * @returns {number} location (in array)
 * @memberof Core
 */
export function locationOf<T>(item: T, array: T[], compareFunction?: (a: T, b: T) => number, _start?: number, _end?: number): number {
	const start = _start || 0;
	const end = _end || array.length;
	const pivot = Math.floor(start + (end - start) / 2);
	if(!compareFunction){
		compareFunction = function(a: T, b: T): number {
			if((a as unknown as string | number) > (b as unknown as string | number)) return 1;
			if((a as unknown as string | number) < (b as unknown as string | number)) return -1;
			return 0;
		};
	}
	if(end-start <= 0) {
		return pivot;
	}

	const compared = compareFunction(array[pivot]!, item);
	if(end-start === 1) {
		return compared >= 0 ? pivot : pivot + 1;
	}
	if(compared === 0) {
		return pivot;
	}
	if(compared === -1) {
		return locationOf(item, array, compareFunction, pivot, end);
	} else{
		return locationOf(item, array, compareFunction, start, pivot);
	}
}

/**
 * Finds index of something in a sorted array
 * Returns -1 if not found
 * @param {any} item
 * @param {array} array
 * @param {function} [compareFunction]
 * @param {function} [_start]
 * @param {function} [_end]
 * @returns {number} index (in array) or -1
 * @memberof Core
 */
export function indexOfSorted<T>(item: T, array: T[], compareFunction?: (a: T, b: T) => number, _start?: number, _end?: number): number {
	const start = _start || 0;
	const end = _end || array.length;
	const pivot = Math.floor(start + (end - start) / 2);
	if(!compareFunction){
		compareFunction = function(a: T, b: T): number {
			if((a as unknown as string | number) > (b as unknown as string | number)) return 1;
			if((a as unknown as string | number) < (b as unknown as string | number)) return -1;
			return 0;
		};
	}
	if(end-start <= 0) {
		return -1; // Not found
	}

	const compared = compareFunction(array[pivot]!, item);
	if(end-start === 1) {
		return compared === 0 ? pivot : -1;
	}
	if(compared === 0) {
		return pivot; // Found
	}
	if(compared === -1) {
		return indexOfSorted(item, array, compareFunction, pivot, end);
	} else{
		return indexOfSorted(item, array, compareFunction, start, pivot);
	}
}
/**
 * Find the bounds of an element
 * taking padding and margin into account
 * @param {element} el
 * @returns {{ width: Number, height: Number}}
 * @memberof Core
 */
export function bounds(el: Element): { width: number; height: number } {

	const style = window.getComputedStyle(el);
	const widthProps = ["width", "padding-right", "padding-left", "margin-right", "margin-left", "border-right-width", "border-left-width"];
	const heightProps = ["height", "padding-top", "padding-bottom", "margin-top", "margin-bottom", "border-top-width", "border-bottom-width"];

	let width = 0;
	let height = 0;

	widthProps.forEach(function(prop){
		width += parseFloat(style.getPropertyValue(prop)) || 0;
	});

	heightProps.forEach(function(prop){
		height += parseFloat(style.getPropertyValue(prop)) || 0;
	});

	return {
		height: height,
		width: width
	};

}

/**
 * Find the bounds of an element
 * taking padding, margin and borders into account
 * @param {element} el
 * @returns {{ width: Number, height: Number}}
 * @memberof Core
 */
export function borders(el: Element): { width: number; height: number } {

	const style = window.getComputedStyle(el);
	const widthProps = ["padding-right", "padding-left", "margin-right", "margin-left", "border-right-width", "border-left-width"];
	const heightProps = ["padding-top", "padding-bottom", "margin-top", "margin-bottom", "border-top-width", "border-bottom-width"];

	let width = 0;
	let height = 0;

	widthProps.forEach(function(prop){
		width += parseFloat(style.getPropertyValue(prop)) || 0;
	});

	heightProps.forEach(function(prop){
		height += parseFloat(style.getPropertyValue(prop)) || 0;
	});

	return {
		height: height,
		width: width
	};

}

/**
 * Find the bounds of any node
 * allows for getting bounds of text nodes by wrapping them in a range
 * @param {node} node
 * @returns {BoundingClientRect}
 * @memberof Core
 */
export function nodeBounds(node: Node): DOMRect {
	let elPos;
	const doc = node.ownerDocument;
	if(node.nodeType == Node.TEXT_NODE){
		const elRange = doc!.createRange();
		elRange.selectNodeContents(node);
		elPos = elRange.getBoundingClientRect();
	} else {
		elPos = (node as Element).getBoundingClientRect();
	}
	return elPos;
}

/**
 * Find the equivalent of getBoundingClientRect of a browser window
 * @returns {{ width: Number, height: Number, top: Number, left: Number, right: Number, bottom: Number }}
 * @memberof Core
 */
export function windowBounds(): { top: number; left: number; right: number; bottom: number; width: number; height: number } {

	const width = window.innerWidth;
	const height = window.innerHeight;

	return {
		top: 0,
		left: 0,
		right: width,
		bottom: height,
		width: width,
		height: height
	};

}

/**
 * Gets the index of a node in its parent
 * @param {Node} node
 * @param {string} typeId
 * @return {number} index
 * @memberof Core
 */
export function indexOfNode(node: Node, typeId: number): number {
	const parent = node.parentNode!;
	const children = parent.childNodes;
	let sib;
	let index = -1;
	for (let i = 0; i < children.length; i++) {
		sib = children[i]!;
		if (sib.nodeType === typeId) {
			index++;
		}
		if (sib == node) break;
	}

	return index;
}

/**
 * Gets the index of a text node in its parent
 * @param {node} textNode
 * @returns {number} index
 * @memberof Core
 */
export function indexOfTextNode(textNode: Node): number {
	return indexOfNode(textNode, TEXT_NODE);
}

/**
 * Gets the index of an element node in its parent
 * @param {element} elementNode
 * @returns {number} index
 * @memberof Core
 */
export function indexOfElementNode(elementNode: Node): number {
	return indexOfNode(elementNode, ELEMENT_NODE);
}

/**
 * Check if extension is xml
 * @param {string} ext
 * @returns {boolean}
 * @memberof Core
 */
export function isXml(ext: string): boolean {
	return ["xml", "opf", "ncx"].indexOf(ext) > -1;
}

/**
 * Create a new blob
 * @param {any} content
 * @param {string} mime
 * @returns {Blob}
 * @memberof Core
 */
export function createBlob(content: BlobPart, mime: string): Blob {
	return new Blob([content], {type : mime });
}

/**
 * Create a new blob url
 * @param {any} content
 * @param {string} mime
 * @returns {string} url
 * @memberof Core
 */
export function createBlobUrl(content: BlobPart, mime: string): string {
	const blob = createBlob(content, mime);

	const tempUrl = _URL.createObjectURL(blob);

	return tempUrl;
}

/**
 * Remove a blob url
 * @param {string} url
 * @memberof Core
 */
export function revokeBlobUrl(url: string): void {
	return _URL.revokeObjectURL(url);
}

/**
 * Create a new base64 encoded url
 * @param {any} content
 * @param {string} mime
 * @returns {string} url
 * @memberof Core
 */
export function createBase64Url(content: string, mime: string): string | undefined {
	if (typeof(content) !== "string") {
		// Only handles strings
		return;
	}

	const data = btoa(content);

	const datauri = "data:" + mime + ";base64," + data;

	return datauri;
}

/**
 * Get type of an object
 * @param {object} obj
 * @returns {string} type
 * @memberof Core
 */
export function type(obj: unknown): string {
	return Object.prototype.toString.call(obj).slice(8, -1);
}

/**
 * Parse xml (or html) markup
 * @param {string} markup
 * @param {string} mime
 * @returns {document} document
 * @memberof Core
 */
export function parse(markup: string, mime: string): Document {
	// Remove byte order mark before parsing
	// https://www.w3.org/International/questions/qa-byte-order-mark
	if(markup.charCodeAt(0) === 0xFEFF) {
		markup = markup.slice(1);
	}

	return new DOMParser().parseFromString(markup, mime as DOMParserSupportedType);
}

/**
 * querySelector wrapper
 * @param {element} el
 * @param {string} sel selector string
 * @returns {element} element
 * @memberof Core
 */
export function qs(el: Document | Element, sel: string): Element | null {
	if (!el) {
		throw new Error("No Element Provided");
	}
	return el.querySelector(sel);
}

/**
 * querySelectorAll wrapper
 * @param {element} el
 * @param {string} sel selector string
 * @returns {element[]} elements
 * @memberof Core
 */
export function qsa(el: Document | Element, sel: string): NodeListOf<Element> {
	return el.querySelectorAll(sel);
}

/**
 * querySelector by property
 * @param {element} el
 * @param {string} sel selector string
 * @param {object[]} props
 * @returns {element[]} elements
 * @memberof Core
 */
export function qsp(el: Document | Element, sel: string, props: Record<string, string>): Element | undefined {
	sel += "[";
	for (const prop in props) {
		sel += prop + "~='" + props[prop] + "'";
	}
	sel += "]";
	return el.querySelector(sel) ?? undefined;
}

/**
 * Sprint through all text nodes in a document
 * @memberof Core
 * @param  {element} root element to start with
 * @param  {function} func function to run on each element
 */
export function sprint(root: Node, func: (node: Node) => void): void {
	treeWalker(root, func, NodeFilter.SHOW_TEXT);
}

/**
 * Create a treeWalker
 * @memberof Core
 * @param  {element} root element to start with
 * @param  {function} func function to run on each element
 * @param  {function | object} filter function or object to filter with
 */
export function treeWalker(root: Node, func: (node: Node) => void, filter: number): void {
	const treeWalker = document.createTreeWalker(root, filter, null);
	let node;
	while ((node = treeWalker.nextNode())) {
		func(node);
	}
}

/**
 * @memberof Core
 * @param {node} node
 * @param {callback} return false for continue,true for break inside callback
 */
export function walk(node: Node, callback: (node: Node) => boolean, _unused?: boolean): boolean | undefined {
	if(callback(node)){
		return true;
	}
	let child: Node | null = node.firstChild;
	if(child){
		do{
			const walked = walk(child,callback);
			if(walked){
				return true;
			}
			child = child.nextSibling;
		} while(child);
	}
	return undefined;
}

/**
 * Convert a blob to a base64 encoded string
 * @param {Blog} blob
 * @returns {string}
 * @memberof Core
 */
export function blob2base64(blob: Blob): Promise<string | ArrayBuffer> {
	return new Promise(function(resolve, _reject) {
		const reader = new FileReader();
		reader.readAsDataURL(blob);
		reader.onloadend = function(): void {
			resolve(reader.result!);
		};
	});
}


/**
 * Creates a new pending promise and provides methods to resolve or reject it.
 * From: https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Deferred#backwards_forwards_compatible
 */
export class defer<T = unknown> {
	id: string;
	resolve!: (value: T | PromiseLike<T>) => void;
	reject!: (reason?: unknown) => void;
	promise: Promise<T>;

	constructor() {
		this.id = uuid();

		/* A newly created Promise object.
		 * Initially in pending state.
		 */
		this.promise = new Promise<T>((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
		Object.freeze(this);
	}
}

/**
 * querySelector with filter by epub type
 * @param {element} html
 * @param {string} element element type to find
 * @param {string} type epub type to find
 * @returns {element[]} elements
 * @memberof Core
 */
export function querySelectorByType(html: Document | Element, element: string, type: string): Element | undefined {
	let query: Element | null = null;
	try {
		query = html.querySelector(`${element}[*|type="${type}"]`);
	} catch {
		// Namespaced attribute selectors not supported (e.g. linkedom)
	}
	if (query) {
		return query;
	}
	// Fallback: walk elements and check epub:type via namespace or attribute
	const elements = html.querySelectorAll(element);
	for (let i = 0; i < elements.length; i++) {
		if(elements[i]!.getAttributeNS("http://www.idpf.org/2007/ops", "type") === type ||
			 elements[i]!.getAttribute("epub:type") === type) {
			return elements[i]!;
		}
	}
	return undefined;
}

/**
 * Find direct descendents of an element
 * @param {element} el
 * @returns {element[]} children
 * @memberof Core
 */
export function findChildren(el: Element): Element[] {
	const result = [];
	const childNodes = el.childNodes;
	for (let i = 0; i < childNodes.length; i++) {
		const node = childNodes[i]!;
		if (node.nodeType === 1) {
			result.push(node as Element);
		}
	}
	return result;
}

/**
 * Find all parents (ancestors) of an element
 * @param {element} node
 * @returns {element[]} parents
 * @memberof Core
 */
export function parents(node: Node | null | undefined): Node[] {
	const nodes: Node[] = [];
	for (let current: Node | null = node ?? null; current; current = current.parentNode) {
		nodes.unshift(current);
	}
	return nodes
}

/**
 * Find all direct descendents of a specific type
 * @param {element} el
 * @param {string} nodeName
 * @param {boolean} [single]
 * @returns {element[]} children
 * @memberof Core
 */
export function filterChildren(el: Element, nodeName: string, single?: boolean): Element | Element[] | undefined {
	const result = [];
	const childNodes = el.childNodes;
	for (let i = 0; i < childNodes.length; i++) {
		const node = childNodes[i]!;
		if (node.nodeType === 1 && node.nodeName.toLowerCase() === nodeName) {
			if (single) {
				return node as Element;
			} else {
				result.push(node as Element);
			}
		}
	}
	if (!single) {
		return result;
	}
	return undefined;
}

/**
 * Filter all parents (ancestors) with tag name
 * @param {element} node
 * @param {string} tagname
 * @returns {element[]} parents
 * @memberof Core
 */
export function getParentByTagName(node: Node, tagname: string): Element | undefined {
	let parent;
	if (node === null || tagname === "") return undefined;
	parent = node.parentNode;
	while (parent && parent.nodeType === 1) {
		if ((parent as Element).tagName.toLowerCase() === tagname) {
			return parent as Element;
		}
		parent = parent.parentNode;
	}
	return undefined;
}

/**
 * Lightweight Polyfill for DOM Range
 * @class
 * @memberof Core
 */
export class RangeObject {
	collapsed: boolean;
	commonAncestorContainer: Node | undefined;
	endContainer: Node | undefined;
	endOffset: number | undefined;
	startContainer: Node | undefined;
	startOffset: number | undefined;

	constructor() {
		this.collapsed = false;
		this.commonAncestorContainer = undefined;
		this.endContainer = undefined;
		this.endOffset = undefined;
		this.startContainer = undefined;
		this.startOffset = undefined;
	}

	setStart(startNode: Node, startOffset: number): void {
		this.startContainer = startNode;
		this.startOffset = startOffset;

		if (!this.endContainer) {
			this.collapse(true);
		} else {
			this.commonAncestorContainer = this._commonAncestorContainer();
		}

		this._checkCollapsed();
	}

	setEnd(endNode: Node, endOffset: number): void {
		this.endContainer = endNode;
		this.endOffset = endOffset;

		if (!this.startContainer) {
			this.collapse(false);
		} else {
			this.collapsed = false;
			this.commonAncestorContainer = this._commonAncestorContainer();
		}

		this._checkCollapsed();
	}

	collapse(toStart: boolean): void {
		this.collapsed = true;
		if (toStart) {
			this.endContainer = this.startContainer;
			this.endOffset = this.startOffset;
			this.commonAncestorContainer = this.startContainer?.parentNode ?? undefined;
		} else {
			this.startContainer = this.endContainer;
			this.startOffset = this.endOffset;
			this.commonAncestorContainer = this.endContainer?.parentNode ?? undefined;
		}
	}

	selectNode(referenceNode: Node): void {
		const parent = referenceNode.parentNode!;
		const index = Array.from(parent.childNodes as ArrayLike<Node>).indexOf(referenceNode);
		this.setStart(parent, index);
		this.setEnd(parent, index + 1);
	}

	selectNodeContents(referenceNode: Node): void {
		const endIndex = (referenceNode.nodeType === 3) ?
				(referenceNode.textContent ?? "").length : referenceNode.childNodes.length;
		this.setStart(referenceNode, 0);
		this.setEnd(referenceNode, endIndex);
	}

	_commonAncestorContainer(startContainer?: Node, endContainer?: Node): Node | undefined {
		const startParents = parents(startContainer ?? this.startContainer);
		const endParents = parents(endContainer ?? this.endContainer);

		if (startParents[0] != endParents[0]) return undefined;

		for (let i = 0; i < startParents.length; i++) {
			if (startParents[i] != endParents[i]) {
				return startParents[i - 1];
			}
		}
		return undefined;
	}

	_checkCollapsed(): void {
		if (this.startContainer === this.endContainer &&
				this.startOffset === this.endOffset) {
			this.collapsed = true;
		} else {
			this.collapsed = false;
		}
	}

	toString(): string {
		// TODO: implement walking between start and end to find text
		return "";
	}
}
