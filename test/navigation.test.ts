import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import Navigation from "../src/navigation";
import { parseXML } from "./helpers";

const fixturesDir = resolve(__dirname, "fixtures");
const tocXhtml = readFileSync(join(fixturesDir, "alice/OPS/toc.xhtml"), "utf-8");

function loadAliceNav(): Navigation {
	const doc = parseXML(tocXhtml, "application/xhtml+xml");
	return new Navigation(doc);
}

describe("Navigation", () => {

	describe("alice toc.xhtml", () => {
		const nav = loadAliceNav();

		it("should parse 11 TOC entries", () => {
			expect(nav.toc.length).toBe(11);
		});

		it("should count 11 total items via length", () => {
			expect(nav.length).toBe(11);
		});

		it("should have Title Page as first entry", () => {
			expect(nav.toc[0]!.label).toBe("Title Page");
			expect(nav.toc[0]!.href).toBe("titlepage.xhtml");
		});

		it("should have Down The Rabbit-Hole as second entry", () => {
			expect(nav.toc[1]!.label).toBe("Down The Rabbit-Hole");
			expect(nav.toc[1]!.href).toBe("chapter_001.xhtml");
		});

		it("should have Alice's Evidence as last entry", () => {
			expect(nav.toc[10]!.label).toBe("Alice's Evidence");
			expect(nav.toc[10]!.href).toBe("chapter_010.xhtml");
		});

		it("should have all correct chapter labels", () => {
			const labels = nav.toc.map(item => item.label);
			expect(labels).toEqual([
				"Title Page",
				"Down The Rabbit-Hole",
				"The Pool Of Tears",
				"A Caucus-Race And A Long Tale",
				"The Rabbit Sends In A Little Bill",
				"Advice From A Caterpillar",
				"Pig And Pepper",
				"A Mad Tea-Party",
				"The Queen's Croquet Ground",
				"Who Stole The Tarts?",
				"Alice's Evidence",
			]);
		});

		it("should have flat structure (no subitems)", () => {
			nav.toc.forEach(item => {
				expect(item.subitems).toEqual([]);
			});
		});
	});

	describe("get()", () => {
		const nav = loadAliceNav();

		it("should return all toc entries with no argument", () => {
			const all = nav.get();
			expect(Array.isArray(all)).toBe(true);
			expect((all as any[]).length).toBe(11);
		});

		it("should get item by href", () => {
			const item = nav.get("chapter_001.xhtml");
			expect(item).toBeDefined();
			expect((item as any).label).toBe("Down The Rabbit-Hole");
		});

		it("should get item by id with # prefix", () => {
			const item = nav.get("#chapter_001.xhtml");
			expect(item).toBeDefined();
			expect((item as any).label).toBe("Down The Rabbit-Hole");
		});

		it("should return undefined for unknown href", () => {
			const item = nav.get("nonexistent.xhtml");
			expect(item).toBeUndefined();
		});
	});

	describe("forEach()", () => {
		it("should iterate all top-level items", () => {
			const nav = loadAliceNav();
			const labels: string[] = [];
			nav.forEach(item => labels.push(item.label));
			expect(labels.length).toBe(11);
			expect(labels[0]).toBe("Title Page");
		});
	});

	describe("NCX parsing", () => {
		it("should parse NCX with flat navPoints", () => {
			const ncxXml = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <navMap>
    <navPoint id="ch1" playOrder="1">
      <navLabel><text>Chapter 1</text></navLabel>
      <content src="ch1.html"/>
    </navPoint>
    <navPoint id="ch2" playOrder="2">
      <navLabel><text>Chapter 2</text></navLabel>
      <content src="ch2.html"/>
    </navPoint>
  </navMap>
</ncx>`;
			const nav = new Navigation(parseXML(ncxXml));
			expect(nav.toc.length).toBe(2);
			expect(nav.toc[0]!.id).toBe("ch1");
			expect(nav.toc[0]!.label).toBe("Chapter 1");
			expect(nav.toc[0]!.href).toBe("ch1.html");
			expect(nav.toc[1]!.id).toBe("ch2");
			expect(nav.toc[1]!.label).toBe("Chapter 2");
			expect(nav.length).toBe(2);
		});

		it("should parse nested NCX navPoints", () => {
			const ncxXml = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <navMap>
    <navPoint id="part1" playOrder="1">
      <navLabel><text>Part 1</text></navLabel>
      <content src="part1.html"/>
      <navPoint id="ch1" playOrder="2">
        <navLabel><text>Chapter 1</text></navLabel>
        <content src="ch1.html"/>
      </navPoint>
      <navPoint id="ch2" playOrder="3">
        <navLabel><text>Chapter 2</text></navLabel>
        <content src="ch2.html"/>
      </navPoint>
    </navPoint>
  </navMap>
</ncx>`;
			const nav = new Navigation(parseXML(ncxXml));
			expect(nav.toc.length).toBe(1);
			expect(nav.toc[0]!.id).toBe("part1");
			expect(nav.toc[0]!.subitems!.length).toBe(2);
			expect(nav.toc[0]!.subitems![0]!.id).toBe("ch1");
			expect(nav.toc[0]!.subitems![0]!.parent).toBe("part1");
			expect(nav.toc[0]!.subitems![1]!.id).toBe("ch2");
			expect(nav.length).toBe(3);
		});
	});

	describe("nested nav HTML", () => {
		it("should parse nested ol structure with parent links", () => {
			const html = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>TOC</title></head>
<body>
  <nav epub:type="toc">
    <ol>
      <li id="part1"><a href="part1.html">Part 1</a>
        <ol>
          <li id="ch1"><a href="ch1.html">Chapter 1</a></li>
          <li id="ch2"><a href="ch2.html">Chapter 2</a></li>
        </ol>
      </li>
      <li id="part2"><a href="part2.html">Part 2</a></li>
    </ol>
  </nav>
</body>
</html>`;
			const nav = new Navigation(parseXML(html, "application/xhtml+xml"));
			expect(nav.toc.length).toBe(2);
			expect(nav.toc[0]!.id).toBe("part1");
			expect(nav.toc[0]!.subitems!.length).toBe(2);
			expect(nav.toc[0]!.subitems![0]!.id).toBe("ch1");
			expect(nav.toc[0]!.subitems![0]!.parent).toBe("part1");
			expect(nav.toc[0]!.subitems![1]!.id).toBe("ch2");
			expect(nav.toc[1]!.id).toBe("part2");
			expect(nav.toc[1]!.subitems).toEqual([]);
			expect(nav.length).toBe(4);
		});
	});

	describe("landmarks", () => {
		it("should parse landmarks nav", () => {
			const html = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>TOC</title></head>
<body>
  <nav epub:type="toc">
    <ol><li><a href="ch1.html">Ch 1</a></li></ol>
  </nav>
  <nav epub:type="landmarks">
    <ol>
      <li><a epub:type="toc" href="toc.html">Table of Contents</a></li>
      <li><a epub:type="bodymatter" href="ch1.html">Start Reading</a></li>
    </ol>
  </nav>
</body>
</html>`;
			const nav = new Navigation(parseXML(html, "application/xhtml+xml"));
			expect(nav.landmarks.length).toBe(2);
			expect(nav.landmarks[0]!.type).toBe("toc");
			expect(nav.landmarks[0]!.href).toBe("toc.html");
			expect(nav.landmarks[0]!.label).toBe("Table of Contents");
			expect(nav.landmarks[1]!.type).toBe("bodymatter");
		});

		it("should get landmark by type", () => {
			const html = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>TOC</title></head>
<body>
  <nav epub:type="toc"><ol><li><a href="ch1.html">Ch 1</a></li></ol></nav>
  <nav epub:type="landmarks">
    <ol>
      <li><a epub:type="toc" href="toc.html">TOC</a></li>
      <li><a epub:type="bodymatter" href="ch1.html">Start</a></li>
    </ol>
  </nav>
</body>
</html>`;
			const nav = new Navigation(parseXML(html, "application/xhtml+xml"));
			const lm = nav.landmark("toc");
			expect(lm).toBeDefined();
			expect((lm as any).href).toBe("toc.html");
		});

		it("should return all landmarks with no argument", () => {
			const html = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>TOC</title></head>
<body>
  <nav epub:type="toc"><ol><li><a href="ch1.html">Ch 1</a></li></ol></nav>
  <nav epub:type="landmarks">
    <ol><li><a epub:type="toc" href="toc.html">TOC</a></li></ol>
  </nav>
</body>
</html>`;
			const nav = new Navigation(parseXML(html, "application/xhtml+xml"));
			const all = nav.landmark();
			expect(Array.isArray(all)).toBe(true);
			expect((all as any[]).length).toBe(1);
		});

		it("should return undefined for unknown landmark type", () => {
			const nav = loadAliceNav();
			expect(nav.landmark("nonexistent")).toBeUndefined();
		});
	});

	describe("empty navigation", () => {
		it("should handle constructor with no argument", () => {
			const nav = new Navigation();
			expect(nav.toc).toEqual([]);
			expect(nav.length).toBe(0);
			expect(nav.landmarks).toEqual([]);
		});
	});
});
