import { describe, it, expect, beforeEach } from "vitest";
import TextMeasurer from "../src/utils/text-measurer";

describe("TextMeasurer", () => {
	let measurer: TextMeasurer;

	beforeEach(() => {
		measurer = new TextMeasurer();
	});

	describe("segmentText()", () => {
		it("should split Latin text on spaces", () => {
			const segments = measurer.segmentText("hello world");
			const texts = segments.map(s => s.text);
			expect(texts).toContain("hello");
			expect(texts).toContain(" ");
			expect(texts).toContain("world");
		});

		it("should segment CJK text", () => {
			const segments = measurer.segmentText("你好世界");
			expect(segments.length).toBeGreaterThan(0);
			// All original text should be accounted for
			expect(segments.map(s => s.text).join("")).toBe("你好世界");
		});

		it("should handle mixed Latin and CJK", () => {
			const segments = measurer.segmentText("hi你好");
			const joined = segments.map(s => s.text).join("");
			expect(joined).toBe("hi你好");
			// Latin part should be its own segment
			expect(segments[0]!.text).toBe("hi");
		});

		it("should return correct character offsets", () => {
			const segments = measurer.segmentText("ab cd");
			expect(segments[0]).toEqual({ text: "ab", index: 0 });
			expect(segments[1]).toEqual({ text: " ", index: 2 });
			expect(segments[2]).toEqual({ text: "cd", index: 3 });
		});

		it("should handle empty string", () => {
			expect(measurer.segmentText("")).toEqual([]);
		});

		it("should handle astral-plane CJK (surrogate pairs) with correct UTF-16 offsets", () => {
			// U+20000 is 𠀀 (CJK Unified Ideographs Extension B), encoded as 2 UTF-16 code units
			const text = "a𠀀b";
			const segments = measurer.segmentText(text);
			const joined = segments.map(s => s.text).join("");
			expect(joined).toBe(text);
			// "a" starts at UTF-16 index 0
			expect(segments[0]!.index).toBe(0);
			// 𠀀 is 2 code units, so "b" should start at index 3
			const lastSeg = segments[segments.length - 1]!;
			expect(lastSeg.text).toContain("b");
			expect(lastSeg.index).toBe(3);
		});
	});

	describe("findSegmentIndex()", () => {
		const segments = [
			{ node: null as any, charOffset: 0, text: "hello", width: 50, cumWidth: 50 },
			{ node: null as any, charOffset: 5, text: " ", width: 10, cumWidth: 60 },
			{ node: null as any, charOffset: 6, text: "world", width: 50, cumWidth: 110 },
		];

		it("should return 0 for position at start", () => {
			expect(measurer.findSegmentIndex(segments, 0)).toBe(0);
		});

		it("should find segment at exact boundary", () => {
			expect(measurer.findSegmentIndex(segments, 50)).toBe(0);
		});

		it("should find segment past first boundary", () => {
			expect(measurer.findSegmentIndex(segments, 51)).toBe(1);
		});

		it("should find last segment for large position", () => {
			expect(measurer.findSegmentIndex(segments, 200)).toBe(2);
		});

		it("should return 0 for empty segments", () => {
			expect(measurer.findSegmentIndex([], 100)).toBe(0);
		});
	});

	describe("cumDocWidth", () => {
		function prepareMockNodes(measurer: TextMeasurer, texts: string[]): import("../src/utils/text-measurer").PreparedNode[] {
			// Build PreparedNode array manually since jsdom lacks getComputedStyle.font
			const nodes = texts.map((t) => {
				const segments = measurer.segmentText(t);
				let cumWidth = 0;
				const measured = segments.map(s => {
					const w = s.text.length * 10; // mock: 10px per char
					cumWidth += w;
					return { node: null as any, charOffset: s.index, text: s.text, width: w, cumWidth };
				});
				return { node: null as any, segments: measured, totalWidth: cumWidth, font: "16px serif", cumDocWidth: 0 };
			});
			// Simulate what prepare() does: compute cumDocWidth
			let docCum = 0;
			for (let i = 0; i < nodes.length; i++) {
				docCum += nodes[i]!.totalWidth;
				nodes[i]!.cumDocWidth = docCum;
			}
			return nodes;
		}

		it("should compute monotonically increasing cumDocWidth", () => {
			const nodes = prepareMockNodes(measurer, ["hello", "world", "foo bar"]);
			expect(nodes.length).toBe(3);

			for (let i = 0; i < nodes.length; i++) {
				if (i > 0) {
					expect(nodes[i]!.cumDocWidth).toBeGreaterThan(nodes[i - 1]!.cumDocWidth);
				}
			}

			const totalSum = nodes.reduce((sum, n) => sum + n.totalWidth, 0);
			expect(nodes[nodes.length - 1]!.cumDocWidth).toBeCloseTo(totalSum, 5);
		});

		it("should set cumDocWidth to totalWidth for single node", () => {
			const nodes = prepareMockNodes(measurer, ["test"]);
			expect(nodes.length).toBe(1);
			expect(nodes[0]!.cumDocWidth).toBe(nodes[0]!.totalWidth);
		});
	});

	describe("findNodeIndex()", () => {
		it("should return 0 for empty array", () => {
			expect(measurer.findNodeIndex([], 100)).toBe(0);
		});

		it("should find node at exact cumDocWidth boundary", () => {
			const prepared = [
				{ cumDocWidth: 50 },
				{ cumDocWidth: 120 },
				{ cumDocWidth: 200 },
			] as any[];

			expect(measurer.findNodeIndex(prepared, 50)).toBe(0);
			expect(measurer.findNodeIndex(prepared, 120)).toBe(1);
		});

		it("should find first node whose cumDocWidth exceeds target", () => {
			const prepared = [
				{ cumDocWidth: 50 },
				{ cumDocWidth: 120 },
				{ cumDocWidth: 200 },
			] as any[];

			expect(measurer.findNodeIndex(prepared, 51)).toBe(1);
			expect(measurer.findNodeIndex(prepared, 121)).toBe(2);
		});

		it("should return last index for target beyond total", () => {
			const prepared = [
				{ cumDocWidth: 50 },
				{ cumDocWidth: 120 },
			] as any[];

			expect(measurer.findNodeIndex(prepared, 999)).toBe(1);
		});

		it("should return 0 for target at start", () => {
			const prepared = [
				{ cumDocWidth: 50 },
				{ cumDocWidth: 120 },
			] as any[];

			expect(measurer.findNodeIndex(prepared, 0)).toBe(0);
		});
	});

	describe("getPreparedNode()", () => {
		it("should return null for unprepared nodes", () => {
			const textNode = document.createTextNode("test");
			expect(measurer.getPreparedNode(textNode)).toBeNull();
		});
	});

	describe("hasExoticCSS()", () => {
		it("should return true for orphan text node", () => {
			const textNode = document.createTextNode("test");
			expect(measurer.hasExoticCSS(textNode, window)).toBe(true);
		});

		it("should return false for normal text in a paragraph", () => {
			const p = document.createElement("p");
			const text = document.createTextNode("hello");
			p.appendChild(text);
			document.body.appendChild(p);
			try {
				expect(measurer.hasExoticCSS(text, window)).toBe(false);
			} finally {
				document.body.removeChild(p);
			}
		});
	});

	describe("invalidate()", () => {
		it("should clear cached preparation for root", () => {
			const root = document.createElement("div");
			const text = document.createTextNode("hello");
			root.appendChild(text);
			document.body.appendChild(root);

			try {
				const result1 = measurer.prepare(root, window);
				const result2 = measurer.prepare(root, window);
				expect(result2).toBe(result1); // same reference = cached

				measurer.invalidate(root);
				const result3 = measurer.prepare(root, window);
				expect(result3).not.toBe(result1); // new array = re-prepared
			} finally {
				document.body.removeChild(root);
			}
		});
	});

	describe("destroy()", () => {
		it("should not throw", () => {
			expect(() => measurer.destroy()).not.toThrow();
		});

		it("should clear internal state", () => {
			measurer.destroy();
			// Should still work after destroy (re-initializes lazily)
			const segments = measurer.segmentText("test");
			expect(segments.length).toBeGreaterThan(0);
		});
	});
});
