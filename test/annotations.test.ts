import { describe, it, expect, vi } from "vitest";
import Annotations from "../src/annotations";
import type Rendition from "../src/rendition";

// Annotation is not exported separately, so we extract the type from the return of add()
type Annotation = ReturnType<Annotations["add"]>;

function createMockRendition() {
	return {
		hooks: {
			render: { register: vi.fn() },
			unloaded: { register: vi.fn() },
		},
		views: () => [],
	} as unknown as Rendition;
}

describe("Annotations", () => {
	// Use a real-ish CFI that EpubCFI can parse (spinePos = 2)
	const testCfi = "epubcfi(/6/4!/4/2,/1:0,/1:22)";

	describe("constructor", () => {
		it("should register render and unloaded hooks", () => {
			const mock = createMockRendition();
			new Annotations(mock);
			expect(mock.hooks.render.register).toHaveBeenCalledOnce();
			expect(mock.hooks.unloaded.register).toHaveBeenCalledOnce();
		});

		it("should initialize empty collections", () => {
			const ann = new Annotations(createMockRendition());
			expect(ann.highlights).toEqual([]);
			expect(ann.underlines).toEqual([]);
			expect(ann.marks).toEqual([]);
			expect(ann._annotations).toEqual({});
		});
	});

	describe("add()", () => {
		it("should store a highlight annotation with correct type, cfiRange, and sectionIndex", () => {
			const ann = new Annotations(createMockRendition());
			const result = ann.add("highlight", testCfi, { note: "test" });
			expect(result.type).toBe("highlight");
			expect(result.cfiRange).toBe(testCfi);
			expect(result.data).toEqual({ note: "test" });
			expect(typeof result.sectionIndex).toBe("number");
		});

		it("should store an underline annotation", () => {
			const ann = new Annotations(createMockRendition());
			const result = ann.add("underline", testCfi);
			expect(result.type).toBe("underline");
			expect(result.cfiRange).toBe(testCfi);
		});

		it("should store a mark annotation", () => {
			const ann = new Annotations(createMockRendition());
			const result = ann.add("mark", testCfi);
			expect(result.type).toBe("mark");
		});
	});

	describe("convenience wrappers", () => {
		it("highlight() should call add with type highlight", () => {
			const ann = new Annotations(createMockRendition());
			const result = ann.highlight(testCfi, { note: "hl" });
			expect(result.type).toBe("highlight");
			expect(result.data).toEqual({ note: "hl" });
		});

		it("underline() should call add with type underline", () => {
			const ann = new Annotations(createMockRendition());
			const result = ann.underline(testCfi);
			expect(result.type).toBe("underline");
		});

		it("mark() should call add with type mark", () => {
			const ann = new Annotations(createMockRendition());
			const result = ann.mark(testCfi);
			expect(result.type).toBe("mark");
		});
	});

	describe("remove()", () => {
		it("should remove annotation from _annotations", () => {
			const ann = new Annotations(createMockRendition());
			ann.add("highlight", testCfi);
			const hash = encodeURI(testCfi + "highlight");
			expect(ann._annotations[hash]).toBeDefined();
			ann.remove(testCfi, "highlight");
			expect(ann._annotations[hash]).toBeUndefined();
		});

		it("should no-op without error for non-existent annotation", () => {
			const ann = new Annotations(createMockRendition());
			expect(() => ann.remove("epubcfi(/6/99)", "highlight")).not.toThrow();
		});
	});

	describe("each()", () => {
		it("should iterate all stored annotations", () => {
			const ann = new Annotations(createMockRendition());
			ann.add("highlight", testCfi);
			const cfi2 = "epubcfi(/6/6!/4/2,/1:0,/1:10)";
			ann.add("underline", cfi2);

			const collected: Annotation[] = [];
			ann.each((annotation) => collected.push(annotation));
			expect(collected.length).toBe(2);
			const types = collected.map(a => a.type).sort();
			expect(types).toEqual(["highlight", "underline"]);
		});
	});

	describe("Annotation class", () => {
		it("should set type, cfiRange, data, sectionIndex, className, styles", () => {
			const ann = new Annotations(createMockRendition());
			const result = ann.add("highlight", testCfi, { color: "yellow" }, undefined, "my-class", { background: "yellow" });
			expect(result.type).toBe("highlight");
			expect(result.cfiRange).toBe(testCfi);
			expect(result.data).toEqual({ color: "yellow" });
			expect(result.className).toBe("my-class");
			expect(result.styles).toEqual({ background: "yellow" });
		});

		it("update() should replace data", () => {
			const ann = new Annotations(createMockRendition());
			const result = ann.add("highlight", testCfi, { old: true });
			result.update({ new: true });
			expect(result.data).toEqual({ new: true });
		});
	});
});
