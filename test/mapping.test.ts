import { describe, it, expect, vi, beforeAll } from "vitest";
import Mapping from "../src/mapping";
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
			document.body.removeChild(container);
		});

		it("should split text at spaces", () => {
			const textNode = document.createTextNode("hello world foo");
			const container = document.createElement("div");
			container.appendChild(textNode);
			document.body.appendChild(container);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(textNode);
			expect(ranges.length).toBeGreaterThan(1);
			document.body.removeChild(container);
		});

		it("should return a single range for non-text nodes", () => {
			const el = document.createElement("div");
			el.textContent = "hello world";
			document.body.appendChild(el);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(el);
			expect(ranges.length).toBe(1);
			document.body.removeChild(el);
		});

		it("should use custom splitter", () => {
			const textNode = document.createTextNode("a-b-c");
			const container = document.createElement("div");
			container.appendChild(textNode);
			document.body.appendChild(container);
			const mapping = new Mapping(createMockLayout());
			const ranges = mapping.splitTextNodeIntoRanges(textNode, "-");
			expect(ranges.length).toBeGreaterThan(1);
			document.body.removeChild(container);
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
			document.body.removeChild(p);
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
			spy.mockRestore();
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
			cfiSpy.mockRestore();
		});
	});
});
