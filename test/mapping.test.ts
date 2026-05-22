import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import Mapping from "../src/mapping";
import TextMeasurer from "../src/utils/text-measurer";
import type { LayoutProps } from "../src/types";
import type Contents from "../src/contents";
import type IframeView from "../src/managers/views/iframe";

beforeAll(() => {
	if (!Range.prototype.getBoundingClientRect) {
		Range.prototype.getBoundingClientRect = function () {
			return { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0, toJSON: () => ({}) } as DOMRect;
		};
	}
});

function createMockLayout(): LayoutProps {
	return {
		name: "reflowable",
		spread: true,
		flow: "paginated",
		width: 800,
		height: 600,
		spreadWidth: 800,
		columnWidth: 400,
		gap: 20,
		divisor: 2,
		delta: 800,
		pageWidth: 400,
	} as unknown as LayoutProps;
}

describe("Mapping", () => {

	afterEach(() => {
		vi.restoreAllMocks();
		const elements = document.body.querySelectorAll("div, p");
		elements.forEach(el => {
			if (el.parentNode === document.body) {
				document.body.removeChild(el);
			}
		});
	});

	describe("constructor", () => {
		it("should store layout, direction, horizontal, and dev", () => {
			const layout = createMockLayout();
			const mapping = new Mapping(layout, "rtl", "horizontal", true);
			expect(mapping.layout).toBe(layout);
			expect(mapping.direction).toBe("rtl");
			expect(mapping.horizontal).toBe(true);
			expect(mapping._dev).toBe(true);
		});

		it("should default direction to ltr", () => {
			const mapping = new Mapping(createMockLayout());
			expect(mapping.direction).toBe("ltr");
		});

		it("should default horizontal to false", () => {
			const mapping = new Mapping(createMockLayout());
			expect(mapping.horizontal).toBe(false);
		});

		it("should default dev to false", () => {
			const mapping = new Mapping(createMockLayout());
			expect(mapping._dev).toBe(false);
		});
	});

	describe("axis()", () => {
		it("should return current horizontal state when no argument", () => {
			const mapping = new Mapping(createMockLayout(), "ltr", "horizontal");
			expect(mapping.axis()).toBe(true);
		});

		it("should set horizontal to true for 'horizontal'", () => {
			const mapping = new Mapping(createMockLayout());
			mapping.axis("horizontal");
			expect(mapping.horizontal).toBe(true);
		});

		it("should set horizontal to false for 'vertical'", () => {
			const mapping = new Mapping(createMockLayout(), "ltr", "horizontal");
			mapping.axis("vertical");
			expect(mapping.horizontal).toBe(false);
		});
	});

	describe("splitTextNodeIntoRanges()", () => {
		it("should return a single range for text without spaces", () => {
			const textNode = document.createTextNode("hello");
			const container = document.createElement("div");
			container.appendChild(textNode);
			document.body.appendChild(container);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(textNode);
			expect(ranges.length).toBe(1);
		});

		it("should split text at spaces", () => {
			const textNode = document.createTextNode("hello world foo");
			const container = document.createElement("div");
			container.appendChild(textNode);
			document.body.appendChild(container);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(textNode);
			expect(ranges.length).toBeGreaterThan(1);
		});

		it("should return a single range for non-text nodes", () => {
			const el = document.createElement("div");
			el.textContent = "hello world";
			document.body.appendChild(el);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(el);
			expect(ranges.length).toBe(1);
		});

		it("should use custom splitter", () => {
			const textNode = document.createTextNode("a-b-c");
			const container = document.createElement("div");
			container.appendChild(textNode);
			document.body.appendChild(container);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(textNode, "-");
			expect(ranges.length).toBeGreaterThan(1);
		});

		it("should split spaceless CJK text per character", () => {
			const textNode = document.createTextNode("這些基礎");
			const container = document.createElement("div");
			container.appendChild(textNode);
			document.body.appendChild(container);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(textNode);
			expect(ranges.length).toBe(4);
			// Each range starts at a distinct, increasing character offset
			expect(ranges.map(r => r.startOffset)).toEqual([0, 1, 2, 3]);
			expect(ranges[1]!.toString()).toBe("些");
		});

		it("should keep Latin runs together when mixed with CJK", () => {
			const textNode = document.createTextNode("abc你好");
			const container = document.createElement("div");
			container.appendChild(textNode);
			document.body.appendChild(container);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(textNode);
			// "abc" stays one range; 你 and 好 split individually
			expect(ranges.map(r => r.toString())).toEqual(["abc", "你", "好"]);
		});

		it("should keep astral-plane CJK surrogate pairs intact", () => {
			const textNode = document.createTextNode("a𠀀b");
			const container = document.createElement("div");
			container.appendChild(textNode);
			document.body.appendChild(container);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(textNode);
			// 𠀀 (U+20000) is one code point but two UTF-16 units
			const cjkRange = ranges.find(r => r.toString() === "𠀀");
			expect(cjkRange).toBeDefined();
			expect(cjkRange!.endOffset - cjkRange!.startOffset).toBe(2);
		});
	});

	describe("rangePairToCfiPair()", () => {
		it("should collapse start range to true and end range to false", () => {
			const p = document.createElement("p");
			p.textContent = "Some text content";
			document.body.appendChild(p);
			const textNode = p.firstChild!;

			const startRange = document.createRange();
			startRange.setStart(textNode, 0);
			startRange.setEnd(textNode, 4);
			expect(startRange.collapsed).toBe(false);

			const endRange = document.createRange();
			endRange.setStart(textNode, 5);
			endRange.setEnd(textNode, 9);
			expect(endRange.collapsed).toBe(false);

			const mapping = new Mapping(createMockLayout());
			// rangePairToCfiPair calls collapse(true) on start, collapse(false) on end
			// then passes them to EpubCFI. The CFI toString() fails in jsdom due to
			// missing document structure, but we can verify the collapse side effects.
			try {
				mapping.rangePairToCfiPair("epubcfi(/6/2!)", { start: startRange, end: endRange });
			} catch {
				// EpubCFI.toString() fails in jsdom — expected
			}
			expect(startRange.collapsed).toBe(true);
			expect(endRange.collapsed).toBe(true);
		});
	});

	describe("rangeListToCfiList()", () => {
		it("should process each range pair in the list", () => {
			const mapping = new Mapping(createMockLayout());
			const spy = vi.spyOn(mapping, "rangePairToCfiPair").mockReturnValue({ start: "cfi1", end: "cfi2" });

			const pairs = [
				{ start: document.createRange(), end: document.createRange() },
				{ start: document.createRange(), end: document.createRange() },
			];

			const result = mapping.rangeListToCfiList("epubcfi(/6/2!)", pairs);

			expect(result.length).toBe(2);
			expect(spy).toHaveBeenCalledTimes(2);
			expect(result[0]).toEqual({ start: "cfi1", end: "cfi2" });
		});
	});

	describe("page()", () => {
		it("should return undefined for missing body", () => {
			const mapping = new Mapping(createMockLayout());
			const mockContents = {
				document: null
			} as unknown as Contents;
			const result = mapping.page(mockContents, "epubcfi(/6/2!)", 0, 800);
			expect(result).toBeUndefined();
		});

		it("should return undefined for empty document body", () => {
			const mapping = new Mapping(createMockLayout());
			const mockContents = {
				document: { body: null }
			} as unknown as Contents;
			const result = mapping.page(mockContents, "epubcfi(/6/2!)", 0, 800);
			expect(result).toBeUndefined();
		});
	});

	describe("section()", () => {
		it("should call findRanges and rangeListToCfiList", () => {
			const mapping = new Mapping(createMockLayout(), "ltr", "horizontal");
			const mockPairs = [{ start: document.createRange(), end: document.createRange() }];
			vi.spyOn(mapping, "findRanges" as any).mockReturnValue(mockPairs);
			const cfiSpy = vi.spyOn(mapping, "rangeListToCfiList").mockReturnValue([{ start: "a", end: "b" }]);

			const mockView = {
				section: { cfiBase: "epubcfi(/6/2!)" },
			} as unknown as IframeView;

			const result = mapping.section(mockView);
			expect(Array.isArray(result)).toBe(true);
			expect(cfiSpy).toHaveBeenCalledWith("epubcfi(/6/2!)", mockPairs);
		});

		it("should return empty array when findRanges returns empty", () => {
			const mapping = new Mapping(createMockLayout(), "ltr", "horizontal");
			vi.spyOn(mapping, "findRanges" as any).mockReturnValue([]);
			vi.spyOn(mapping, "rangeListToCfiList").mockReturnValue([]);

			const mockView = {
				section: { cfiBase: "epubcfi(/6/2!)" },
			} as unknown as IframeView;

			const result = mapping.section(mockView);
			expect(result).toEqual([]);
		});
	});

	describe("walk()", () => {
		it("should collect text nodes from a multi-level DOM tree", () => {
			const container = document.createElement("div");
			container.innerHTML = "<p>Hello <span>world</span></p><p>Foo</p>";
			document.body.appendChild(container);

			const mapping = new Mapping(createMockLayout());
			const collected: Node[] = [];
			mapping.walk(container, (node) => {
				collected.push(node);
				return undefined;
			});

			expect(collected.length).toBeGreaterThanOrEqual(2);
			expect(collected.every(n => n.nodeType === Node.TEXT_NODE)).toBe(true);
		});

		it("should return early when func returns a node", () => {
			const container = document.createElement("div");
			container.innerHTML = "<p>First</p><p>Second</p>";
			document.body.appendChild(container);

			const mapping = new Mapping(createMockLayout());
			let callCount = 0;
			const result = mapping.walk(container, (node) => {
				callCount++;
				return node;
			});

			expect(callCount).toBe(1);
			expect(result).toBeDefined();
			expect(result!.nodeType).toBe(Node.TEXT_NODE);
		});

		it("should return undefined for empty container", () => {
			const container = document.createElement("div");
			document.body.appendChild(container);

			const mapping = new Mapping(createMockLayout());
			const result = mapping.walk(container, (node) => node);

			expect(result).toBeUndefined();
		});

		it("should skip whitespace-only text nodes", () => {
			const container = document.createElement("div");
			container.innerHTML = "<p>  </p><p>Real text</p>";
			document.body.appendChild(container);

			const mapping = new Mapping(createMockLayout());
			const collected: Node[] = [];
			mapping.walk(container, (node) => {
				collected.push(node);
				return undefined;
			});

			expect(collected.length).toBe(1);
			expect(collected[0]!.textContent!.trim()).toBe("Real text");
		});
	});

	describe("splitTextNodeIntoRanges() edge cases", () => {
		it("should handle empty text node", () => {
			const textNode = document.createTextNode("");
			const container = document.createElement("div");
			container.appendChild(textNode);
			document.body.appendChild(container);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(textNode);
			expect(ranges.length).toBe(1);
		});

		it("should handle text with only whitespace", () => {
			const textNode = document.createTextNode("   ");
			const container = document.createElement("div");
			container.appendChild(textNode);
			document.body.appendChild(container);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(textNode);
			expect(ranges.length).toBe(1);
		});
	});

	describe("page() with body content", () => {
		it("should call findStart and findEnd and return a CFI pair", () => {
			const mapping = new Mapping(createMockLayout());

			const p = document.createElement("p");
			p.textContent = "Some test content here";
			document.body.appendChild(p);

			const startRange = document.createRange();
			startRange.selectNodeContents(p.firstChild!);
			const endRange = document.createRange();
			endRange.selectNodeContents(p.firstChild!);

			vi.spyOn(mapping, "findStart" as any).mockReturnValue(startRange);
			vi.spyOn(mapping, "findEnd" as any).mockReturnValue(endRange);
			vi.spyOn(mapping, "rangePairToCfiPair").mockReturnValue({ start: "epubcfi(/6/2!/4/1:0)", end: "epubcfi(/6/2!/4/1:22)" });

			const mockContents = {
				document: document
			} as unknown as Contents;

			const result = mapping.page(mockContents, "epubcfi(/6/2!)", 0, 800);
			expect(result).toBeDefined();
			expect(result).toHaveProperty("start");
			expect(result).toHaveProperty("end");
		});
	});

	describe("page() canvas-fast-path inversion guard", () => {
		const FAST_PAIR = { start: "epubcfi(fast-start)", end: "epubcfi(fast-end)" };
		const RECOMPUTED = { start: "epubcfi(walk-start)", end: "epubcfi(walk-end)" };

		// p1 precedes p2 in document order, so a range on p2 starts after a
		// range on p1 ends — the inversion the guard must detect.
		function setup() {
			const measurer = new TextMeasurer();
			const mapping = new Mapping(createMockLayout(), "ltr", "horizontal", false, measurer);
			const p1 = document.createElement("p");
			p1.textContent = "earlier";
			const p2 = document.createElement("p");
			p2.textContent = "later";
			document.body.appendChild(p1);
			document.body.appendChild(p2);
			const rangeOn = (p: HTMLParagraphElement) => {
				const r = document.createRange();
				r.selectNodeContents(p.firstChild!);
				return r;
			};
			const mockContents = { document } as unknown as Contents;
			return { mapping, rangeOn, p1, p2, mockContents };
		}

		it("recomputes with the DOM walk when the fast path inverts start/end", () => {
			const { mapping, rangeOn, p1, p2, mockContents } = setup();
			// noFast === true (5th arg) is the DOM-walk recompute: it returns
			// the ordered pair; the fast path returns the inverted one.
			const findStart = vi.spyOn(mapping, "findStart" as any).mockImplementation(
				(...a: unknown[]) => (a[4] === true ? rangeOn(p1) : rangeOn(p2))
			);
			const findEnd = vi.spyOn(mapping, "findEnd" as any).mockImplementation(
				(...a: unknown[]) => (a[4] === true ? rangeOn(p2) : rangeOn(p1))
			);
			vi.spyOn(mapping, "rangePairToCfiPair").mockReturnValue(RECOMPUTED);

			const result = mapping.page(mockContents, "epubcfi(/6/2!)", 0, 800)!;

			expect(result).toEqual(RECOMPUTED);
			expect(findStart).toHaveBeenCalledTimes(2);
			expect(findEnd).toHaveBeenCalledTimes(2);
			expect(findStart.mock.calls[1]![4]).toBe(true);
			expect(findEnd.mock.calls[1]![4]).toBe(true);
		});

		it("does not recompute when the fast path result is already ordered", () => {
			const { mapping, rangeOn, p1, p2, mockContents } = setup();
			const findStart = vi.spyOn(mapping, "findStart" as any).mockReturnValue(rangeOn(p1));
			const findEnd = vi.spyOn(mapping, "findEnd" as any).mockReturnValue(rangeOn(p2));
			const toCfi = vi.spyOn(mapping, "rangePairToCfiPair").mockReturnValue(FAST_PAIR);

			const result = mapping.page(mockContents, "epubcfi(/6/2!)", 0, 800)!;

			expect(result).toEqual(FAST_PAIR);
			expect(findStart).toHaveBeenCalledTimes(1);
			expect(findEnd).toHaveBeenCalledTimes(1);
			expect(toCfi).toHaveBeenCalledTimes(1);
		});
	});

	describe("_canvasFindNode fast path", () => {
		it("should return null when no measurer is set", () => {
			const mapping = new Mapping(createMockLayout(), "ltr", "horizontal");
			const container = document.createElement("div");
			container.textContent = "test";
			document.body.appendChild(container);

			// Access private method via any cast
			const result = (mapping as any)._canvasFindNode(container, 0, 400, "start");
			expect(result).toBeNull();
		});

		it("should return null when prepare returns empty", () => {
			const measurer = new TextMeasurer();
			const mapping = new Mapping(createMockLayout(), "ltr", "horizontal", false, measurer);
			// Empty container — no text nodes
			const container = document.createElement("div");
			document.body.appendChild(container);

			const result = (mapping as any)._canvasFindNode(container, 0, 400, "start");
			expect(result).toBeNull();
		});

		// Helper to stand up a mapping + measurer with controlled geometry in jsdom.
		// Stubs: Range.getBoundingClientRect (returns rects from data-left/right),
		// docEl.scrollWidth/scrollHeight (non-zero), and measurer.prepare (returns
		// one PreparedNode per text node with monotonic cumDocWidth).
		function setupFastPath(
			direction: "ltr" | "rtl",
			specs: { text: string; left: number; right: number }[],
			scrollWidth = 1000,
		): { mapping: Mapping; container: HTMLElement; textNodes: Text[]; restore: () => void } {
			const container = document.createElement("div");
			const textNodes: Text[] = [];
			for (const spec of specs) {
				const p = document.createElement("p");
				p.setAttribute("data-left", String(spec.left));
				p.setAttribute("data-right", String(spec.right));
				const t = document.createTextNode(spec.text);
				p.appendChild(t);
				container.appendChild(p);
				textNodes.push(t);
			}
			document.body.appendChild(container);

			const rectSpy = vi.spyOn(Range.prototype, "getBoundingClientRect").mockImplementation(function (this: Range): DOMRect {
				const node = this.startContainer;
				const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
				const left = Number(el?.getAttribute("data-left") ?? 0);
				const right = Number(el?.getAttribute("data-right") ?? left);
				return { x: left, y: 0, width: right - left, height: 0, top: 0, left, bottom: 0, right, toJSON: () => ({}) } as DOMRect;
			});
			const docEl = document.documentElement;
			const origW = Object.getOwnPropertyDescriptor(docEl, "scrollWidth");
			const origH = Object.getOwnPropertyDescriptor(docEl, "scrollHeight");
			Object.defineProperty(docEl, "scrollWidth", { get: () => scrollWidth, configurable: true });
			Object.defineProperty(docEl, "scrollHeight", { get: () => scrollWidth, configurable: true });

			const measurer = new TextMeasurer();
			const prepareSpy = vi.spyOn(measurer, "prepare").mockImplementation(() => {
				let cum = 0;
				return textNodes.map(node => {
					cum += 100;
					return { node, segments: [], totalWidth: 100, font: "16px serif", cumDocWidth: cum };
				});
			});

			const mapping = new Mapping(createMockLayout(), direction, "horizontal", false, measurer);

			return {
				mapping, container, textNodes,
				restore: (): void => {
					rectSpy.mockRestore();
					prepareSpy.mockRestore();
					if (origW) Object.defineProperty(docEl, "scrollWidth", origW);
					else delete (docEl as any).scrollWidth;
					if (origH) Object.defineProperty(docEl, "scrollHeight", origH);
					else delete (docEl as any).scrollHeight;
				},
			};
		}

		it("should find spanning node for LTR start mode", () => {
			const { mapping, container, textNodes, restore } = setupFastPath("ltr", [
				{ text: "first", left: 100, right: 180 },
				{ text: "second", left: 500, right: 580 },
			]);
			try {
				const result = (mapping as any)._canvasFindNode(container, 0, 400, "start");
				expect(result).not.toBeNull();
				expect(result.node).toBe(textNodes[0]);
			} finally {
				restore();
			}
		});

		it("should find spanning node for LTR end mode", () => {
			const { mapping, container, textNodes, restore } = setupFastPath("ltr", [
				{ text: "before", left: 50, right: 150 },
				{ text: "spans", left: 300, right: 450 },
				{ text: "after", left: 600, right: 700 },
			]);
			try {
				const result = (mapping as any)._canvasFindNode(container, 0, 400, "end");
				expect(result).not.toBeNull();
				expect(result.node).toBe(textNodes[1]);
			} finally {
				restore();
			}
		});

		it("should find spanning node for RTL start mode", () => {
			// RTL: reading order starts at the right edge of the column.
			// Document order: first node is visually rightmost.
			const { mapping, container, textNodes, restore } = setupFastPath("rtl", [
				{ text: "first", left: 350, right: 400 },
				{ text: "second", left: 100, right: 200 },
			]);
			try {
				const result = (mapping as any)._canvasFindNode(container, 0, 400, "start");
				expect(result).not.toBeNull();
				expect(result.node).toBe(textNodes[0]);
			} finally {
				restore();
			}
		});

		it("should find spanning node for RTL end mode", () => {
			// RTL: reading order ends at the left edge of the column.
			const { mapping, container, textNodes, restore } = setupFastPath("rtl", [
				{ text: "first", left: 350, right: 400 },
				{ text: "last", left: -50, right: 50 },
			]);
			try {
				const result = (mapping as any)._canvasFindNode(container, 0, 400, "end");
				expect(result).not.toBeNull();
				expect(result.node).toBe(textNodes[1]);
			} finally {
				restore();
			}
		});

		it("should not return overshoot node when no valid prev exists in end mode", () => {
			// All nodes are past the end boundary; no node fully precedes end
			const { mapping, container, restore } = setupFastPath("ltr", [
				{ text: "a", left: 500, right: 600 },
				{ text: "b", left: 700, right: 800 },
			]);
			try {
				const result = (mapping as any)._canvasFindNode(container, 0, 400, "end");
				expect(result).toBeNull();
			} finally {
				restore();
			}
		});

		it("should fall back to DOM walk when match lands at window left edge", () => {
			// Construct a scenario where the ratio-based estimate is distorted:
			// scrollWidth=2000 but actual rects live in a smaller range, so the
			// estimate for a column near pixel 900 lands at prepared index 4,
			// with window [1, 7]. An earlier node (idx 0) would also match in
			// the DOM walk, so the fast path must return null (fall back) rather
			// than returning the window-edge match and silently dropping idx 0.
			const { mapping, container, restore } = setupFastPath("ltr", [
				{ text: "n0", left: 850, right: 950 },
				{ text: "n1", left: 910, right: 990 },
				{ text: "n2", left: 920, right: 980 },
				{ text: "n3", left: 930, right: 970 },
				{ text: "n4", left: 940, right: 960 },
				{ text: "n5", left: 950, right: 955 },
				{ text: "n6", left: 960, right: 970 },
				{ text: "n7", left: 970, right: 980 },
				{ text: "n8", left: 980, right: 990 },
				{ text: "n9", left: 990, right: 1000 },
			], 2000);
			try {
				const result = (mapping as any)._canvasFindNode(container, 900, 1000, "start");
				expect(result).toBeNull();
			} finally {
				restore();
			}
		});

		it("should fall back gracefully when fast path is used in findStart", () => {
			const measurer = new TextMeasurer();
			const mapping = new Mapping(createMockLayout(), "ltr", "horizontal", false, measurer);

			const container = document.createElement("div");
			const p = document.createElement("p");
			p.textContent = "test content";
			container.appendChild(p);
			document.body.appendChild(container);

			// findStart should not throw regardless of whether fast path hits
			const range = mapping.findStart(container, 0, 400);
			expect(range).toBeDefined();
		});

		it("should fall back gracefully when fast path is used in findEnd", () => {
			const measurer = new TextMeasurer();
			const mapping = new Mapping(createMockLayout(), "ltr", "horizontal", false, measurer);

			const container = document.createElement("div");
			const p = document.createElement("p");
			p.textContent = "test content";
			container.appendChild(p);
			document.body.appendChild(container);

			// findEnd should not throw regardless of whether fast path hits
			const range = mapping.findEnd(container, 0, 400);
			expect(range).toBeDefined();
		});
	});
});
