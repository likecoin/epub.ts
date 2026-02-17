import { describe, it, expect } from "vitest";
import Spine from "../src/spine";
import Packaging from "../src/packaging";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { parseXML } from "./helpers";

const fixturesDir = resolve(__dirname, "fixtures");
const opfXml = readFileSync(join(fixturesDir, "alice/OPS/package.opf"), "utf-8");

function loadAliceSpine(): Spine {
	const doc = parseXML(opfXml);
	const pkg = new Packaging(doc);
	const spine = new Spine();
	const resolver = (href: string) => `http://example.com/${href}`;
	const canonical = (href: string) => href;
	spine.unpack(pkg, resolver, canonical);
	return spine;
}

describe("Spine", () => {

	describe("unpack()", () => {
		const spine = loadAliceSpine();

		it("should have 13 spine items", () => {
			expect(spine.length).toBe(13);
			expect(spine.spineItems.length).toBe(13);
		});

		it("should mark loaded as true", () => {
			expect(spine.loaded).toBe(true);
		});

		it("should resolve hrefs from manifest", () => {
			const ch1 = spine.get(3);
			expect(ch1).not.toBeNull();
			expect(ch1!.href).toBe("chapter_001.xhtml");
		});

		it("should set url via resolver", () => {
			const ch1 = spine.get(3);
			expect(ch1!.url).toBe("http://example.com/chapter_001.xhtml");
		});

		it("should generate cfiBase for each item", () => {
			const ch1 = spine.get(3);
			expect(ch1!.cfiBase).toBeTruthy();
		});

		it("should set linear flags from spine data", () => {
			const cover = spine.get(0);
			expect(cover!.linear).toBe(false);
			const titlepage = spine.get(2);
			expect(titlepage!.linear).toBe(true);
		});
	});

	describe("get()", () => {
		const spine = loadAliceSpine();

		it("should get by index (number)", () => {
			const item = spine.get(0);
			expect(item).not.toBeNull();
			expect(item!.idref).toBe("cover");
		});

		it("should get by href", () => {
			const item = spine.get("chapter_001.xhtml");
			expect(item).not.toBeNull();
			expect(item!.idref).toBe("chapter_001");
		});

		it("should get by id with # prefix", () => {
			const item = spine.get("#chapter_001");
			expect(item).not.toBeNull();
			expect(item!.href).toBe("chapter_001.xhtml");
		});

		it("should return null for out-of-range index", () => {
			expect(spine.get(99)).toBeNull();
		});

		it("should return null for unknown href", () => {
			expect(spine.get("nonexistent.xhtml")).toBeNull();
		});

		it("should return first linear item with no argument", () => {
			const item = spine.get();
			expect(item).not.toBeNull();
			expect(item!.idref).toBe("titlepage");
			expect(item!.linear).toBe(true);
		});
	});

	describe("first() / last()", () => {
		const spine = loadAliceSpine();

		it("should return first linear item (titlepage)", () => {
			const first = spine.first();
			expect(first).toBeDefined();
			expect(first!.idref).toBe("titlepage");
			expect(first!.linear).toBe(true);
		});

		it("should return last linear item (chapter_010)", () => {
			const last = spine.last();
			expect(last).toBeDefined();
			expect(last!.idref).toBe("chapter_010");
			expect(last!.linear).toBe(true);
		});
	});

	describe("each()", () => {
		it("should iterate all spine items", () => {
			const spine = loadAliceSpine();
			const idrefs: string[] = [];
			spine.each(section => idrefs.push(section.idref!));
			expect(idrefs.length).toBe(13);
			expect(idrefs[0]).toBe("cover");
			expect(idrefs[12]).toBe("chapter_010");
		});
	});

	describe("append() / remove()", () => {
		it("should track items by href and idref after unpack", () => {
			const spine = loadAliceSpine();
			const item = spine.get("titlepage.xhtml");
			expect(item).not.toBeNull();
			expect(item!.idref).toBe("titlepage");
		});

		it("should remove a section and update lookups", () => {
			const spine = loadAliceSpine();
			const item = spine.get("chapter_001.xhtml")!;
			const removed = spine.remove(item);
			expect(removed).toBeDefined();
			expect(removed!.length).toBe(1);
			expect(spine.get("chapter_001.xhtml")).toBeNull();
		});

		it("should return undefined when removing non-existent section", () => {
			const spine = loadAliceSpine();
			const item = spine.get("chapter_001.xhtml")!;
			spine.remove(item);
			const result = spine.remove(item);
			expect(result).toBeUndefined();
		});
	});

	describe("constructor defaults", () => {
		it("should start empty", () => {
			const spine = new Spine();
			expect(spine.spineItems).toEqual([]);
			expect(spine.loaded).toBe(false);
			expect(spine.length).toBe(0);
		});
	});
});
