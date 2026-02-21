import { describe, it, expect, beforeAll } from "vitest";
import { Mark, Highlight, Underline, Pane } from "../src/marks-pane";

beforeAll(() => {
	if (!Range.prototype.getClientRects) {
		Range.prototype.getClientRects = function () {
			return [] as unknown as DOMRectList;
		};
	}
	if (!Range.prototype.getBoundingClientRect) {
		Range.prototype.getBoundingClientRect = function () {
			return { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0, toJSON: () => ({}) } as DOMRect;
		};
	}
});

function createMockRange(): Range {
	const range = document.createRange();
	const textNode = document.createTextNode("Hello World");
	const container = document.createElement("div");
	container.appendChild(textNode);
	document.body.appendChild(container);
	range.selectNodeContents(textNode);
	return range;
}

describe("marks-pane", () => {

	describe("Mark", () => {
		it("should initialize with element as null", () => {
			const mark = new Mark();
			expect(mark.element).toBeNull();
		});

		it("should bind element and container", () => {
			const mark = new Mark();
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "g");
			const container = document.createElement("div");
			mark.bind(svg, container);
			expect(mark.element).toBe(svg);
			expect(mark.container).toBe(container);
		});

		it("should unbind and return the element", () => {
			const mark = new Mark();
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "g");
			mark.bind(svg, document.createElement("div"));
			const result = mark.unbind();
			expect(result).toBe(svg);
			expect(mark.element).toBeNull();
		});

		it("should dispatch event on element", () => {
			const mark = new Mark();
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "g");
			mark.bind(svg, document.createElement("div"));
			let fired = false;
			svg.addEventListener("click", () => { fired = true; });
			mark.dispatchEvent(new MouseEvent("click"));
			expect(fired).toBe(true);
		});

		it("should not throw on dispatchEvent when element is null", () => {
			const mark = new Mark();
			expect(() => mark.dispatchEvent(new MouseEvent("click"))).not.toThrow();
		});

		it("should return bounding client rect from element", () => {
			const mark = new Mark();
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "g");
			document.body.appendChild(svg);
			mark.bind(svg, document.createElement("div"));
			const rect = mark.getBoundingClientRect();
			expect(rect).toBeDefined();
			expect(typeof rect.width).toBe("number");
			document.body.removeChild(svg);
		});

		it("should return client rects from child elements", () => {
			const mark = new Mark();
			const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
			const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			const rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			g.appendChild(rect1);
			g.appendChild(rect2);
			mark.bind(g, document.createElement("div"));
			const rects = mark.getClientRects();
			expect(rects.length).toBe(2);
		});
	});

	describe("Highlight", () => {
		it("should store range, className, data, and attributes", () => {
			const range = createMockRange();
			const data = { "note": "test" };
			const attrs = { "fill": "blue" };
			const hl = new Highlight(range, "my-hl", data, attrs);
			expect(hl.range).toBe(range);
			expect(hl.className).toBe("my-hl");
			expect(hl.data).toBe(data);
			expect(hl.attributes).toBe(attrs);
		});

		it("should default data and attributes to empty objects", () => {
			const range = createMockRange();
			const hl = new Highlight(range, "hl");
			expect(hl.data).toEqual({});
			expect(hl.attributes).toEqual({});
		});

		it("should set dataset and classList on bind", () => {
			const range = createMockRange();
			const data = { "note": "value" };
			const attrs = { "fill": "yellow" };
			const hl = new Highlight(range, "my-class", data, attrs);
			const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
			const container = document.createElement("div");
			hl.bind(g, container);
			expect(g.dataset["note"]).toBe("value");
			expect(g.getAttribute("fill")).toBe("yellow");
			expect(g.classList.contains("my-class")).toBe(true);
		});

		it("should clear existing children and call filteredRanges on render", () => {
			const range = createMockRange();
			const hl = new Highlight(range, "hl");
			const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
			const container = document.createElement("div");
			document.body.appendChild(container);
			container.appendChild(g);
			// Add a pre-existing child that should be cleared on render
			g.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "rect"));
			expect(g.childNodes.length).toBe(1);
			hl.bind(g, container);
			hl.render();
			// render() clears children then rebuilds from filteredRanges().
			// In jsdom, getClientRects returns [], so filteredRanges returns [],
			// meaning all old children are removed and none are added.
			expect(g.childNodes.length).toBe(0);
		});
	});

	describe("Underline", () => {
		it("should extend Highlight", () => {
			const range = createMockRange();
			const ul = new Underline(range, "my-ul");
			expect(ul).toBeInstanceOf(Highlight);
			expect(ul).toBeInstanceOf(Mark);
		});

		it("should store the same properties as Highlight", () => {
			const range = createMockRange();
			const data = { "id": "u1" };
			const attrs = { "stroke": "red" };
			const ul = new Underline(range, "ul-class", data, attrs);
			expect(ul.range).toBe(range);
			expect(ul.className).toBe("ul-class");
			expect(ul.data).toBe(data);
			expect(ul.attributes).toBe(attrs);
		});

		it("should clear existing children on render", () => {
			const range = createMockRange();
			const ul = new Underline(range, "ul");
			const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
			const container = document.createElement("div");
			document.body.appendChild(container);
			container.appendChild(g);
			// Add pre-existing child
			g.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "rect"));
			expect(g.childNodes.length).toBe(1);
			ul.bind(g, container);
			ul.render();
			// In jsdom, getClientRects returns [], so old children are cleared
			expect(g.childNodes.length).toBe(0);
		});
	});

	describe("Pane", () => {
		it("should create an SVG element with absolute positioning", () => {
			const target = document.createElement("div");
			const container = document.createElement("div");
			document.body.appendChild(container);
			container.appendChild(target);
			const pane = new Pane(target, container);
			expect(pane.element.tagName.toLowerCase()).toBe("svg");
			expect(pane.element.style.position).toBe("absolute");
		});

		it("should append SVG to container", () => {
			const target = document.createElement("div");
			const container = document.createElement("div");
			document.body.appendChild(container);
			container.appendChild(target);
			const pane = new Pane(target, container);
			expect(container.contains(pane.element)).toBe(true);
		});

		it("should start with empty marks array", () => {
			const target = document.createElement("div");
			const container = document.createElement("div");
			document.body.appendChild(container);
			container.appendChild(target);
			const pane = new Pane(target, container);
			expect(pane.marks).toEqual([]);
		});

		it("should addMark - create g element and call render", () => {
			const target = document.createElement("div");
			const container = document.createElement("div");
			document.body.appendChild(container);
			container.appendChild(target);
			const pane = new Pane(target, container);
			const mark = new Mark();
			const result = pane.addMark(mark);
			expect(result).toBe(mark);
			expect(pane.marks.length).toBe(1);
			expect(mark.element).not.toBeNull();
			expect(mark.element!.tagName.toLowerCase()).toBe("g");
		});

		it("should removeMark - unbind and remove from array", () => {
			const target = document.createElement("div");
			const container = document.createElement("div");
			document.body.appendChild(container);
			container.appendChild(target);
			const pane = new Pane(target, container);
			const mark = new Mark();
			pane.addMark(mark);
			expect(pane.marks.length).toBe(1);
			pane.removeMark(mark);
			expect(pane.marks.length).toBe(0);
			expect(mark.element).toBeNull();
		});

		it("should no-op removeMark for unknown mark", () => {
			const target = document.createElement("div");
			const container = document.createElement("div");
			document.body.appendChild(container);
			container.appendChild(target);
			const pane = new Pane(target, container);
			const mark = new Mark();
			expect(() => pane.removeMark(mark)).not.toThrow();
		});

		it("should render without throwing", () => {
			const target = document.createElement("div");
			const container = document.createElement("div");
			document.body.appendChild(container);
			container.appendChild(target);
			const pane = new Pane(target, container);
			expect(() => pane.render()).not.toThrow();
		});
	});
});
