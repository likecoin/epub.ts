/**
 * Inlined from marks-pane v1.0.9 (https://github.com/fchasen/marks)
 * SVG-based text annotation marks (highlights, underlines) for iframes.
 */

// -- SVG helpers --

function svgCreate(name: string): SVGElement {
	return document.createElementNS("http://www.w3.org/2000/svg", name);
}

// -- Mouse event proxying --

function proxyMouse(target: HTMLElement | HTMLIFrameElement, tracked: Mark[]): void {
	function dispatch(e: any): void {
		for (let i = tracked.length - 1; i >= 0; i--) {
			const t = tracked[i];
			let x = e.clientX;
			let y = e.clientY;

			if (e.touches && e.touches.length) {
				x = e.touches[0].clientX;
				y = e.touches[0].clientY;
			}

			if (!hitTest(t, target, x, y)) {
				continue;
			}

			t.dispatchEvent(cloneEvent(e));
			break;
		}
	}

	let eventTarget;
	if (target.nodeName === "iframe" || target.nodeName === "IFRAME") {
		try {
			eventTarget = (target as HTMLIFrameElement).contentDocument;
		} catch (_err) {
			eventTarget = target;
		}
	} else {
		eventTarget = target;
	}

	for (const ev of ["mouseup", "mousedown", "click", "touchstart"]) {
		eventTarget!.addEventListener(ev, (e) => dispatch(e), false);
	}
}

function cloneEvent(e: any): MouseEvent {
	const opts = Object.assign({}, e, { bubbles: false });
	try {
		return new MouseEvent(e.type, opts);
	} catch (_err) {
		const copy = document.createEvent("MouseEvents");
		copy.initMouseEvent(e.type, false, opts.cancelable, opts.view,
			opts.detail, opts.screenX, opts.screenY,
			opts.clientX, opts.clientY, opts.ctrlKey,
			opts.altKey, opts.shiftKey, opts.metaKey,
			opts.button, opts.relatedTarget);
		return copy;
	}
}

function hitTest(item: Mark, target: HTMLElement | HTMLIFrameElement, x: number, y: number): boolean {
	const offset = target.getBoundingClientRect();

	function rectContains(r: DOMRect, x: number, y: number): boolean {
		const top = r.top - offset.top;
		const left = r.left - offset.left;
		const bottom = top + r.height;
		const right = left + r.width;
		return (top <= y && left <= x && bottom > y && right > x);
	}

	const rect = item.getBoundingClientRect();
	if (!rectContains(rect, x, y)) {
		return false;
	}

	const rects = item.getClientRects();
	for (let i = 0, len = rects.length; i < len; i++) {
		if (rectContains(rects[i], x, y)) {
			return true;
		}
	}
	return false;
}

// -- Geometry helpers --

function coords(el: Element, container: Element): { top: number; left: number; height: number; width: number } {
	const offset = container.getBoundingClientRect();
	const rect = el.getBoundingClientRect();

	return {
		top: rect.top - offset.top,
		left: rect.left - offset.left,
		height: el.scrollHeight,
		width: el.scrollWidth
	};
}

function setCoords(el: any, c: { top: number; left: number; height: number; width: number }): void {
	el.style.setProperty("top", `${c.top}px`, "important");
	el.style.setProperty("left", `${c.left}px`, "important");
	el.style.setProperty("height", `${c.height}px`, "important");
	el.style.setProperty("width", `${c.width}px`, "important");
}

function containsRect(rect1: DOMRect, rect2: DOMRect): boolean {
	return (
		(rect2.right <= rect1.right) &&
		(rect2.left >= rect1.left) &&
		(rect2.top >= rect1.top) &&
		(rect2.bottom <= rect1.bottom)
	);
}

// -- Classes --

export class Pane {
	target: HTMLElement | HTMLIFrameElement;
	element: SVGElement;
	marks: Mark[];
	container: HTMLElement;

	constructor(target: HTMLElement | HTMLIFrameElement, container: HTMLElement = document.body) {
		this.target = target;
		this.element = svgCreate("svg");
		this.marks = [];

		this.element.style.position = "absolute";
		this.element.setAttribute("pointer-events", "none");

		proxyMouse(this.target, this.marks);

		this.container = container;
		this.container.appendChild(this.element);

		this.render();
	}

	addMark(mark: Mark): Mark {
		const g = svgCreate("g");
		this.element.appendChild(g);
		mark.bind(g, this.container);

		this.marks.push(mark);

		mark.render();
		return mark;
	}

	removeMark(mark: Mark): void {
		const idx = this.marks.indexOf(mark);
		if (idx === -1) {
			return;
		}
		const el = mark.unbind();
		this.element.removeChild(el!);
		this.marks.splice(idx, 1);
	}

	render(): void {
		setCoords(this.element, coords(this.target, this.container));
		for (const m of this.marks) {
			m.render();
		}
	}
}

export class Mark {
	element: SVGElement | null;
	container!: HTMLElement;
	range!: Range;

	constructor() {
		this.element = null;
	}

	bind(element: SVGElement, container: HTMLElement): void {
		this.element = element;
		this.container = container;
	}

	unbind(): SVGElement | null {
		const el = this.element;
		this.element = null;
		return el;
	}

	render(): void {}

	dispatchEvent(e: Event): void {
		if (!this.element) return;
		this.element.dispatchEvent(e);
	}

	getBoundingClientRect(): DOMRect {
		return this.element!.getBoundingClientRect();
	}

	getClientRects(): DOMRect[] {
		const rects: DOMRect[] = [];
		let el = this.element!.firstChild as any;
		while (el) {
			rects.push(el.getBoundingClientRect());
			el = el.nextSibling;
		}
		return rects;
	}

	filteredRanges(): DOMRect[] {
		const rects = Array.from(this.range.getClientRects());

		return rects.filter((box) => {
			for (let i = 0; i < rects.length; i++) {
				if (rects[i] === box) {
					return true;
				}
				if (containsRect(rects[i], box)) {
					return false;
				}
			}
			return true;
		});
	}
}

export class Highlight extends Mark {
	range: Range;
	className: string;
	data: Record<string, string>;
	attributes: Record<string, string>;

	constructor(range: Range, className: string, data?: Record<string, string>, attributes?: Record<string, string>) {
		super();
		this.range = range;
		this.className = className;
		this.data = data || {};
		this.attributes = attributes || {};
	}

	bind(element: SVGElement, container: HTMLElement): void {
		super.bind(element, container);

		for (const attr in this.data) {
			if (this.data.hasOwnProperty(attr)) {
				this.element!.dataset[attr] = this.data[attr];
			}
		}

		for (const attr in this.attributes) {
			if (this.attributes.hasOwnProperty(attr)) {
				this.element!.setAttribute(attr, this.attributes[attr]);
			}
		}

		if (this.className) {
			this.element!.classList.add(this.className);
		}
	}

	render(): void {
		while (this.element!.firstChild) {
			this.element!.removeChild(this.element!.firstChild);
		}

		const docFrag = this.element!.ownerDocument!.createDocumentFragment();
		const filtered = this.filteredRanges();
		const offset = this.element!.getBoundingClientRect();
		const container = this.container.getBoundingClientRect();

		for (let i = 0, len = filtered.length; i < len; i++) {
			const r = filtered[i];
			const el = svgCreate("rect");
			el.setAttribute("x", (r.left - offset.left + container.left) as any);
			el.setAttribute("y", (r.top - offset.top + container.top) as any);
			el.setAttribute("height", r.height as any);
			el.setAttribute("width", r.width as any);
			docFrag.appendChild(el);
		}

		this.element!.appendChild(docFrag);
	}
}

export class Underline extends Highlight {
	constructor(range: Range, className: string, data?: Record<string, string>, attributes?: Record<string, string>) {
		super(range, className, data, attributes);
	}

	render(): void {
		while (this.element!.firstChild) {
			this.element!.removeChild(this.element!.firstChild);
		}

		const docFrag = this.element!.ownerDocument!.createDocumentFragment();
		const filtered = this.filteredRanges();
		const offset = this.element!.getBoundingClientRect();
		const container = this.container.getBoundingClientRect();

		for (let i = 0, len = filtered.length; i < len; i++) {
			const r = filtered[i];

			const rect = svgCreate("rect");
			rect.setAttribute("x", (r.left - offset.left + container.left) as any);
			rect.setAttribute("y", (r.top - offset.top + container.top) as any);
			rect.setAttribute("height", r.height as any);
			rect.setAttribute("width", r.width as any);
			rect.setAttribute("fill", "none");

			const line = svgCreate("line");
			line.setAttribute("x1", (r.left - offset.left + container.left) as any);
			line.setAttribute("x2", (r.left - offset.left + container.left + r.width) as any);
			line.setAttribute("y1", (r.top - offset.top + container.top + r.height - 1) as any);
			line.setAttribute("y2", (r.top - offset.top + container.top + r.height - 1) as any);

			line.setAttribute("stroke-width", 1 as any);
			line.setAttribute("stroke", "black");
			line.setAttribute("stroke-linecap", "square");

			docFrag.appendChild(rect);
			docFrag.appendChild(line);
		}

		this.element!.appendChild(docFrag);
	}
}
