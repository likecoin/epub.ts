import { describe, it, expect } from "vitest";
import Url from "../src/utils/url";

describe("Url", () => {
	describe("constructor with absolute URL", () => {
		const url = new Url("http://example.com/OPS/chapter.xhtml");

		it("should parse href", () => {
			expect(url.href).toBe("http://example.com/OPS/chapter.xhtml");
		});

		it("should parse protocol", () => {
			expect(url.protocol).toBe("http:");
		});

		it("should parse origin", () => {
			expect(url.origin).toBe("http://example.com");
		});

		it("should parse directory and filename", () => {
			expect(url.directory).toBe("/OPS/");
			expect(url.filename).toBe("chapter.xhtml");
			expect(url.extension).toBe("xhtml");
		});
	});

	describe("constructor with relative path and baseString=false", () => {
		const url = new Url("OPS/chapter.xhtml", false);

		it("should use the path as-is without base resolution", () => {
			expect(url.filename).toBe("chapter.xhtml");
			expect(url.directory).toBe("OPS/");
		});

		it("should have empty protocol and origin", () => {
			expect(url.protocol).toBe("");
			expect(url.origin).toBe("");
		});
	});

	describe("constructor with explicit base string", () => {
		const url = new Url("chapter.xhtml", "http://example.com/OPS/");

		it("should resolve against the base", () => {
			expect(url.href).toBe("http://example.com/OPS/chapter.xhtml");
			expect(url.origin).toBe("http://example.com");
		});

		it("should parse filename from resolved URL", () => {
			expect(url.filename).toBe("chapter.xhtml");
		});
	});

	describe("constructor with hash and search", () => {
		const url = new Url("http://example.com/page.html?q=1#section");

		it("should capture hash", () => {
			expect(url.hash).toBe("#section");
		});

		it("should capture search", () => {
			expect(url.search).toBe("?q=1");
		});
	});

	describe("resolve()", () => {
		it("should resolve relative path to absolute URL", () => {
			const url = new Url("http://example.com/OPS/text/");
			expect(url.resolve("chapter.xhtml")).toBe("http://example.com/OPS/text/chapter.xhtml");
		});

		it("should resolve .. traversal", () => {
			const url = new Url("http://example.com/OPS/text/");
			expect(url.resolve("../images/cover.jpg")).toBe("http://example.com/OPS/images/cover.jpg");
		});

		it("should return absolute URL unchanged", () => {
			const url = new Url("http://example.com/OPS/");
			const abs = "https://other.com/resource.css";
			expect(url.resolve(abs)).toBe(abs);
		});
	});

	describe("relative()", () => {
		it("should return path relative to the url directory", () => {
			const url = new Url("http://example.com/OPS/text/ch1.xhtml");
			const result = url.relative("/OPS/images/cover.jpg");
			expect(typeof result).toBe("string");
		});
	});

	describe("path()", () => {
		it("should return the Path object", () => {
			const url = new Url("http://example.com/OPS/chapter.xhtml");
			const p = url.path();
			expect(p.filename).toBe("chapter.xhtml");
			expect(p.directory).toBe("/OPS/");
		});
	});

	describe("toString()", () => {
		it("should return the href", () => {
			const url = new Url("http://example.com/foo.html");
			expect(url.toString()).toBe("http://example.com/foo.html");
		});

		it("should return relative path when no base", () => {
			const url = new Url("foo/bar.html", false);
			expect(url.toString()).toBe("foo/bar.html");
		});
	});
});
