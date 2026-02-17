import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import Packaging from "../src/packaging";
import { parseXML } from "./helpers";

const fixturesDir = resolve(__dirname, "fixtures");
const opfXml = readFileSync(join(fixturesDir, "alice/OPS/package.opf"), "utf-8");

function loadAlicePackaging(): Packaging {
	const doc = parseXML(opfXml);
	return new Packaging(doc);
}

describe("Packaging", () => {

	describe("metadata", () => {
		const pkg = loadAlicePackaging();

		it("should parse title", () => {
			expect(pkg.metadata.title).toBe("Alice's Adventures in Wonderland");
		});

		it("should parse creator", () => {
			expect(pkg.metadata.creator).toBe("Lewis Carroll");
		});

		it("should parse language", () => {
			expect(pkg.metadata.language).toBe("en-US");
		});

		it("should parse identifier", () => {
			expect(pkg.metadata.identifier).toBe("edu.nyu.itp.future-of-publishing.alice-in-wonderland");
		});

		it("should parse rights", () => {
			expect(pkg.metadata.rights).toBe("Public domain in the USA.");
		});

		it("should parse modified_date", () => {
			expect(pkg.metadata.modified_date).toBe("2012-01-18T12:47:00Z");
		});

		it("should parse direction from spine", () => {
			expect(pkg.metadata.direction).toBe("");
		});

		it("should return empty string for missing description", () => {
			expect(pkg.metadata.description).toBe("");
		});
	});

	describe("manifest", () => {
		const pkg = loadAlicePackaging();

		it("should have 42 manifest items", () => {
			expect(Object.keys(pkg.manifest).length).toBe(42);
		});

		it("should have toc item with nav property", () => {
			const toc = pkg.manifest["toc"];
			expect(toc).toBeDefined();
			expect(toc.href).toBe("toc.xhtml");
			expect(toc.type).toBe("application/xhtml+xml");
			expect(toc.properties).toContain("nav");
		});

		it("should have cover-image item with cover-image property", () => {
			const cover = pkg.manifest["cover-image"];
			expect(cover).toBeDefined();
			expect(cover.href).toBe("images/cover_th.jpg");
			expect(cover.type).toBe("image/jpeg");
			expect(cover.properties).toContain("cover-image");
		});

		it("should have chapter_001 item", () => {
			const ch = pkg.manifest["chapter_001"];
			expect(ch).toBeDefined();
			expect(ch.href).toBe("chapter_001.xhtml");
			expect(ch.type).toBe("application/xhtml+xml");
		});

		it("should have titlepage item", () => {
			const tp = pkg.manifest["titlepage"];
			expect(tp).toBeDefined();
			expect(tp.href).toBe("titlepage.xhtml");
		});
	});

	describe("spine", () => {
		const pkg = loadAlicePackaging();

		it("should have 13 spine items", () => {
			expect(pkg.spine.length).toBe(13);
		});

		it("should have cover as first spine item (non-linear)", () => {
			expect(pkg.spine[0]!.idref).toBe("cover");
			expect(pkg.spine[0]!.linear).toBe("no");
			expect(pkg.spine[0]!.index).toBe(0);
		});

		it("should have toc as second spine item (non-linear)", () => {
			expect(pkg.spine[1]!.idref).toBe("toc");
			expect(pkg.spine[1]!.linear).toBe("no");
			expect(pkg.spine[1]!.index).toBe(1);
		});

		it("should have titlepage as third spine item (linear)", () => {
			expect(pkg.spine[2]!.idref).toBe("titlepage");
			expect(pkg.spine[2]!.linear).toBe("yes");
		});

		it("should have chapters 001-010 in order (linear)", () => {
			for (let i = 3; i <= 12; i++) {
				const num = String(i - 2).padStart(3, "0");
				expect(pkg.spine[i]!.idref).toBe(`chapter_${num}`);
				expect(pkg.spine[i]!.linear).toBe("yes");
			}
		});
	});

	describe("paths", () => {
		const pkg = loadAlicePackaging();

		it("should find navPath", () => {
			expect(pkg.navPath).toBe("toc.xhtml");
		});

		it("should find coverPath", () => {
			expect(pkg.coverPath).toBe("images/cover_th.jpg");
		});

		it("should find ncxPath (empty for EPUB3)", () => {
			expect(pkg.ncxPath).toBe("");
		});
	});

	describe("uniqueIdentifier", () => {
		it("should find unique identifier", () => {
			const pkg = loadAlicePackaging();
			expect(pkg.uniqueIdentifier).toBe("edu.nyu.itp.future-of-publishing.alice-in-wonderland");
		});
	});

	describe("constructor without document", () => {
		it("should create empty packaging", () => {
			const pkg = new Packaging();
			expect(pkg.manifest).toEqual({});
			expect(pkg.spine).toEqual([]);
			expect(pkg.navPath).toBe("");
			expect(pkg.ncxPath).toBe("");
			expect(pkg.coverPath).toBe("");
		});
	});

	describe("error handling", () => {
		it("should throw on missing metadata", () => {
			const xml = `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"><manifest><item id="a" href="a.html" media-type="text/html"/></manifest><spine><itemref idref="a"/></spine></package>`;
			expect(() => new Packaging(parseXML(xml))).toThrow("No Metadata Found");
		});

		it("should throw on missing manifest", () => {
			const xml = `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>T</dc:title></metadata><spine><itemref idref="a"/></spine></package>`;
			expect(() => new Packaging(parseXML(xml))).toThrow("No Manifest Found");
		});

		it("should throw on missing spine", () => {
			const xml = `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>T</dc:title></metadata><manifest><item id="a" href="a.html" media-type="text/html"/></manifest></package>`;
			expect(() => new Packaging(parseXML(xml))).toThrow("No Spine Found");
		});
	});

	describe("destroy", () => {
		it("should clear all fields", () => {
			const pkg = loadAlicePackaging();
			pkg.destroy();
			expect(pkg.manifest).toBeUndefined();
			expect(pkg.spine).toBeUndefined();
			expect(pkg.metadata).toBeUndefined();
			expect(pkg.navPath).toBeUndefined();
			expect(pkg.ncxPath).toBeUndefined();
			expect(pkg.coverPath).toBeUndefined();
		});
	});

	describe("EPUB2 cover fallback", () => {
		it("should find cover via meta name=cover fallback", () => {
			const xml = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Test</dc:title>
    <dc:identifier id="uid">test-id</dc:identifier>
    <meta name="cover" content="cover-img"/>
  </metadata>
  <manifest>
    <item id="cover-img" href="cover.jpg" media-type="image/jpeg"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="ch1" href="ch1.html" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="ch1"/>
  </spine>
</package>`;
			const pkg = new Packaging(parseXML(xml));
			expect(pkg.coverPath).toBe("cover.jpg");
		});
	});

	describe("NCX path via spine toc attribute", () => {
		it("should find ncxPath via spine toc attribute", () => {
			const xml = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Test</dc:title>
    <dc:identifier id="uid">test-id</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="ch1" href="ch1.html" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="ch1"/>
  </spine>
</package>`;
			const pkg = new Packaging(parseXML(xml));
			expect(pkg.ncxPath).toBe("toc.ncx");
		});
	});
});
