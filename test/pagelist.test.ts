import { describe, it, expect } from "vitest";
import PageList from "../src/pagelist";
import { parseXML } from "./helpers";

function makeNavHtml(pageListContent: string): Document {
	return parseXML(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Pages</title></head>
<body>
  <nav epub:type="toc"><ol><li><a href="ch1.html">Ch 1</a></li></ol></nav>
  ${pageListContent}
</body>
</html>`, "application/xhtml+xml");
}

function makeNcx(pageListContent: string): Document {
	return parseXML(`<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <navMap>
    <navPoint id="ch1" playOrder="1">
      <navLabel><text>Chapter 1</text></navLabel>
      <content src="ch1.html"/>
    </navPoint>
  </navMap>
  ${pageListContent}
</ncx>`);
}

describe("PageList", () => {
	describe("constructor with no args", () => {
		it("should have empty pages and locations", () => {
			const pl = new PageList();
			expect(pl.pages).toEqual([]);
			expect(pl.locations).toEqual([]);
		});

		it("should have zero totals", () => {
			const pl = new PageList();
			expect(pl.firstPage).toBe(0);
			expect(pl.lastPage).toBe(0);
			expect(pl.totalPages).toBe(0);
		});
	});

	describe("Nav HTML with page-list", () => {
		const doc = makeNavHtml(`
			<nav epub:type="page-list">
				<ol>
					<li><a href="ch1.html#p1">1</a></li>
					<li><a href="ch1.html#p2">2</a></li>
					<li><a href="ch2.html#p3">3</a></li>
				</ol>
			</nav>`);
		const pl = new PageList(doc);

		it("should parse 3 pages", () => {
			expect(pl.pages).toEqual([1, 2, 3]);
		});

		it("should set firstPage and lastPage", () => {
			expect(pl.firstPage).toBe(1);
			expect(pl.lastPage).toBe(3);
		});

		it("should calculate totalPages as lastPage - firstPage", () => {
			expect(pl.totalPages).toBe(2);
		});
	});

	describe("Nav HTML with CFI hrefs", () => {
		const doc = makeNavHtml(`
			<nav epub:type="page-list">
				<ol>
					<li><a href="ch1.html#epubcfi(/6/4)">1</a></li>
					<li><a href="ch2.html#epubcfi(/6/8)">2</a></li>
				</ol>
			</nav>`);
		const pl = new PageList(doc);

		it("should split packageUrl and cfi from href", () => {
			expect(pl.pageList![0]!.packageUrl).toBe("ch1.html");
			expect(pl.pageList![0]!.cfi).toBe("epubcfi(/6/4)");
			expect(pl.pageList![1]!.packageUrl).toBe("ch2.html");
			expect(pl.pageList![1]!.cfi).toBe("epubcfi(/6/8)");
		});

		it("should populate locations from CFIs", () => {
			expect(pl.locations).toEqual(["epubcfi(/6/4)", "epubcfi(/6/8)"]);
		});
	});

	describe("Nav HTML with no page-list nav", () => {
		const doc = makeNavHtml("");
		const pl = new PageList(doc);

		it("should return empty pageList", () => {
			expect(pl.pageList).toEqual([]);
		});
	});

	describe("NCX with pageList/pageTarget", () => {
		const doc = makeNcx(`
			<pageList>
				<pageTarget id="p1" type="normal" value="1">
					<navLabel><text>1</text></navLabel>
					<content src="ch1.html#p1"/>
				</pageTarget>
				<pageTarget id="p2" type="normal" value="2">
					<navLabel><text>2</text></navLabel>
					<content src="ch1.html#p2"/>
				</pageTarget>
			</pageList>`);
		const pl = new PageList(doc);

		it("should parse NCX pageTargets", () => {
			expect(pl.pages).toEqual([1, 2]);
			expect(pl.pageList!.length).toBe(2);
			expect(pl.pageList![0]!.href).toBe("ch1.html#p1");
		});
	});

	describe("NCX with no pageList", () => {
		const doc = makeNcx("");
		const pl = new PageList(doc);

		it("should return empty pageList", () => {
			expect(pl.pageList).toEqual([]);
		});
	});

	describe("process()", () => {
		const doc = makeNavHtml(`
			<nav epub:type="page-list">
				<ol>
					<li><a href="ch1.html#p5">5</a></li>
					<li><a href="ch1.html#p10">10</a></li>
					<li><a href="ch2.html#p15">15</a></li>
				</ol>
			</nav>`);
		const pl = new PageList(doc);

		it("should set firstPage, lastPage, totalPages correctly", () => {
			expect(pl.firstPage).toBe(5);
			expect(pl.lastPage).toBe(15);
			expect(pl.totalPages).toBe(10);
		});
	});

	describe("pageFromCfi()", () => {
		it("should return -1 when locations are empty", () => {
			const pl = new PageList();
			expect(pl.pageFromCfi("epubcfi(/6/4)")).toBe(-1);
		});

		it("should return page number for exact CFI match", () => {
			const doc = makeNavHtml(`
				<nav epub:type="page-list">
					<ol>
						<li><a href="ch1.html#epubcfi(/6/4!/4/2)">1</a></li>
						<li><a href="ch2.html#epubcfi(/6/8!/4/2)">2</a></li>
					</ol>
				</nav>`);
			const pl = new PageList(doc);
			expect(pl.pageFromCfi("epubcfi(/6/8!/4/2)")).toBe(2);
		});
	});

	describe("cfiFromPage()", () => {
		const doc = makeNavHtml(`
			<nav epub:type="page-list">
				<ol>
					<li><a href="ch1.html#epubcfi(/6/4)">1</a></li>
					<li><a href="ch2.html#epubcfi(/6/8)">2</a></li>
				</ol>
			</nav>`);
		const pl = new PageList(doc);

		it("should return CFI string for known page", () => {
			expect(pl.cfiFromPage(1)).toBe("epubcfi(/6/4)");
		});

		it("should return -1 for unknown page", () => {
			expect(pl.cfiFromPage(99)).toBe(-1);
		});
	});

	describe("pageFromPercentage()", () => {
		const doc = makeNavHtml(`
			<nav epub:type="page-list">
				<ol>
					<li><a href="ch1.html#p1">1</a></li>
					<li><a href="ch2.html#p11">11</a></li>
				</ol>
			</nav>`);
		const pl = new PageList(doc);

		it("should round correctly for 0.5", () => {
			// totalPages = 11 - 1 = 10, 0.5 * 10 = 5
			expect(pl.pageFromPercentage(0.5)).toBe(5);
		});
	});

	describe("percentageFromPage()", () => {
		const doc = makeNavHtml(`
			<nav epub:type="page-list">
				<ol>
					<li><a href="ch1.html#p1">1</a></li>
					<li><a href="ch2.html#p11">11</a></li>
				</ol>
			</nav>`);
		const pl = new PageList(doc);

		it("should calculate percentage with 3-decimal rounding", () => {
			// (6 - 1) / 10 = 0.5
			expect(pl.percentageFromPage(6)).toBe(0.5);
		});
	});

	describe("percentageFromCfi()", () => {
		it("should chain pageFromCfi and percentageFromPage", () => {
			const doc = makeNavHtml(`
				<nav epub:type="page-list">
					<ol>
						<li><a href="ch1.html#epubcfi(/6/4!/4/2)">1</a></li>
						<li><a href="ch2.html#epubcfi(/6/8!/4/2)">11</a></li>
					</ol>
				</nav>`);
			const pl = new PageList(doc);
			// pageFromCfi("epubcfi(/6/4!/4/2)") → 1, percentageFromPage(1) → (1-1)/10 = 0
			expect(pl.percentageFromCfi("epubcfi(/6/4!/4/2)")).toBe(0);
		});
	});

	describe("destroy()", () => {
		it("should set all properties to undefined", () => {
			const pl = new PageList();
			pl.destroy();
			expect(pl.pages).toBeUndefined();
			expect(pl.locations).toBeUndefined();
			expect(pl.epubcfi).toBeUndefined();
			expect(pl.pageList).toBeUndefined();
			expect(pl.toc).toBeUndefined();
			expect(pl.ncx).toBeUndefined();
		});
	});
});
