import { describe, it, expect, vi } from "vitest";
import { replaceBase, replaceCanonical, replaceMeta, replaceLinks, substitute } from "../src/utils/replacements";

function makeDoc(bodyHtml = ""): Document {
	return new DOMParser().parseFromString(
		`<html><head></head><body>${bodyHtml}</body></html>`,
		"text/html"
	);
}

describe("replacements", () => {
	describe("replaceBase()", () => {
		it("should insert a <base> element when none exists", () => {
			const doc = makeDoc();
			replaceBase(doc, { url: "http://example.com/OPS/chapter.xhtml" });
			const base = doc.querySelector("base");
			expect(base).toBeTruthy();
			expect(base!.getAttribute("href")).toBe("http://example.com/OPS/chapter.xhtml");
		});

		it("should update existing <base> element", () => {
			const doc = makeDoc();
			const head = doc.querySelector("head")!;
			const existing = doc.createElement("base");
			existing.setAttribute("href", "http://old.com/");
			head.appendChild(existing);

			replaceBase(doc, { url: "http://new.com/OPS/ch.xhtml" });
			const bases = doc.querySelectorAll("base");
			expect(bases.length).toBe(1);
			expect(bases[0]!.getAttribute("href")).toBe("http://new.com/OPS/ch.xhtml");
		});

		it("should prepend window.location.origin for relative URLs", () => {
			const doc = makeDoc();
			replaceBase(doc, { url: "/OPS/chapter.xhtml" });
			const base = doc.querySelector("base");
			expect(base!.getAttribute("href")).toContain("/OPS/chapter.xhtml");
		});

		it("should no-op when doc is falsy", () => {
			expect(() => replaceBase(null as unknown as Document, { url: "http://x.com" })).not.toThrow();
		});
	});

	describe("replaceCanonical()", () => {
		it("should create a canonical link when none exists", () => {
			const doc = makeDoc();
			replaceCanonical(doc, { canonical: "http://example.com/ch1" });
			const link = doc.querySelector("link[rel='canonical']");
			expect(link).toBeTruthy();
			expect(link!.getAttribute("href")).toBe("http://example.com/ch1");
		});

		it("should update existing canonical link", () => {
			const doc = makeDoc();
			const head = doc.querySelector("head")!;
			const existing = doc.createElement("link");
			existing.setAttribute("rel", "canonical");
			existing.setAttribute("href", "http://old.com/");
			head.appendChild(existing);

			replaceCanonical(doc, { canonical: "http://new.com/ch2" });
			const links = doc.querySelectorAll("link[rel='canonical']");
			expect(links.length).toBe(1);
			expect(links[0]!.getAttribute("href")).toBe("http://new.com/ch2");
		});

		it("should no-op when doc is falsy", () => {
			expect(() => replaceCanonical(null as unknown as Document, { canonical: "x" })).not.toThrow();
		});
	});

	describe("replaceMeta()", () => {
		it("should create a meta element with dc.identifier when none exists", () => {
			const doc = makeDoc();
			replaceMeta(doc, { idref: "chapter-001" });
			const meta = doc.querySelector("meta[name='dc.identifier']");
			expect(meta).toBeTruthy();
			expect(meta!.getAttribute("content")).toBe("chapter-001");
		});

		it("should no-op when doc is falsy", () => {
			expect(() => replaceMeta(null as unknown as Document, { idref: "x" })).not.toThrow();
		});
	});

	describe("replaceLinks()", () => {
		it("should set target=_blank on absolute links", () => {
			const doc = makeDoc('<a href="http://example.com">Link</a>');
			const fn = vi.fn();
			replaceLinks(doc.body, fn);
			const link = doc.querySelector("a")!;
			expect(link.getAttribute("target")).toBe("_blank");
		});

		it("should strip javascript: hrefs (security fix)", () => {
			const doc = makeDoc('<a href="javascript:alert(1)">XSS</a>');
			const fn = vi.fn();
			replaceLinks(doc.body, fn);
			const link = doc.querySelector("a")!;
			expect(link.hasAttribute("href")).toBe(false);
		});

		it("should strip JavaScript: with mixed case", () => {
			const doc = makeDoc('<a href="  JavaScript:void(0)">XSS</a>');
			const fn = vi.fn();
			replaceLinks(doc.body, fn);
			const link = doc.querySelector("a")!;
			expect(link.hasAttribute("href")).toBe(false);
		});

		it("should strip data:text/html hrefs (security fix)", () => {
			const doc = makeDoc('<a href="data:text/html,<script>alert(1)</script>">XSS</a>');
			const fn = vi.fn();
			replaceLinks(doc.body, fn);
			const link = doc.querySelector("a")!;
			expect(link.hasAttribute("href")).toBe(false);
		});

		it("should leave mailto: links untouched", () => {
			const doc = makeDoc('<a href="mailto:user@example.com">Email</a>');
			const fn = vi.fn();
			replaceLinks(doc.body, fn);
			const link = doc.querySelector("a")!;
			expect(link.getAttribute("href")).toBe("mailto:user@example.com");
		});

		it("should attach onclick handler for relative links", () => {
			const doc = makeDoc('<a href="chapter2.xhtml">Next</a>');
			const fn = vi.fn();
			replaceLinks(doc.body, fn);
			const link = doc.querySelector("a") as HTMLAnchorElement;
			expect(link.onclick).toBeTypeOf("function");
			const result = link.onclick!(new MouseEvent("click"));
			expect(result).toBe(false);
			expect(fn).toHaveBeenCalled();
		});

		it("should no-op when there are no links", () => {
			const doc = makeDoc("<p>No links here</p>");
			const fn = vi.fn();
			expect(() => replaceLinks(doc.body, fn)).not.toThrow();
		});

		it("should handle relative link with hash", () => {
			const doc = makeDoc('<a href="chapter.xhtml#section1">Section</a>');
			const fn = vi.fn();
			replaceLinks(doc.body, fn);
			const link = doc.querySelector("a") as HTMLAnchorElement;
			link.onclick!(new MouseEvent("click"));
			const arg = fn.mock.calls[0]![0] as string;
			expect(arg).toContain("#section1");
		});
	});

	describe("substitute()", () => {
		it("should replace URLs in content", () => {
			const content = '<link href="style.css"/><img src="cover.jpg"/>';
			const result = substitute(content, ["style.css", "cover.jpg"], ["blob:1", "blob:2"]);
			expect(result).toContain("blob:1");
			expect(result).toContain("blob:2");
			expect(result).not.toContain('"style.css"');
		});

		it("should handle special regex characters in URLs", () => {
			const content = '<img src="file (1).jpg"/>';
			const result = substitute(content, ["file (1).jpg"], ["blob:replaced"]);
			expect(result).toContain("blob:replaced");
		});

		it("should skip replacement when URL or replacement is empty", () => {
			const content = '<img src="a.jpg"/>';
			const result = substitute(content, ["a.jpg", ""], ["", "blob:x"]);
			expect(result).toBe(content);
		});

		it("should replace percent-encoded URLs with decoded form", () => {
			const content = '<img src="\u4E2D\u6587.jpg"/>';
			const result = substitute(content, ["%E4%B8%AD%E6%96%87.jpg"], ["blob:cjk"]);
			expect(result).toContain("blob:cjk");
		});

		it("should replace all occurrences of same URL", () => {
			const content = '<img src="a.jpg"/> <img src="a.jpg"/>';
			const result = substitute(content, ["a.jpg"], ["blob:1"]);
			expect(result).toBe('<img src="blob:1"/> <img src="blob:1"/>');
		});

		it("should return content unchanged when urls array is empty", () => {
			const content = "<p>hello</p>";
			expect(substitute(content, [], [])).toBe(content);
		});
	});
});
