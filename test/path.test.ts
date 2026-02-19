import { describe, it, expect } from "vitest";
import Path from "../src/utils/path";

describe("Path", () => {
	describe("constructor", () => {
		it("should parse a file path into directory, filename, extension", () => {
			const p = new Path("/OPS/chapter_001.xhtml");
			expect(p.path).toBe("/OPS/chapter_001.xhtml");
			expect(p.directory).toBe("/OPS/");
			expect(p.filename).toBe("chapter_001.xhtml");
			expect(p.extension).toBe("xhtml");
		});

		it("should handle a directory path (trailing slash)", () => {
			const p = new Path("/OPS/images/");
			expect(p.directory).toBe("/OPS/images/");
			expect(p.filename).toBe("");
			expect(p.extension).toBe("");
		});

		it("should strip protocol from URL and parse pathname", () => {
			const p = new Path("http://example.com/OPS/chapter.xhtml");
			expect(p.directory).toBe("/OPS/");
			expect(p.filename).toBe("chapter.xhtml");
			expect(p.extension).toBe("xhtml");
		});

		it("should handle root path", () => {
			const p = new Path("/");
			expect(p.directory).toBe("/");
			expect(p.filename).toBe("");
		});

		it("should handle bare filename", () => {
			const p = new Path("cover.jpg");
			expect(p.filename).toBe("cover.jpg");
			expect(p.extension).toBe("jpg");
		});
	});

	describe("isAbsolute()", () => {
		it("should return true for absolute path", () => {
			const p = new Path("/foo/bar.txt");
			expect(p.isAbsolute()).toBe(true);
		});

		it("should return false for relative path", () => {
			const p = new Path("foo/bar.txt");
			expect(p.isAbsolute()).toBe(false);
		});

		it("should accept an argument to check instead of this.path", () => {
			const p = new Path("relative.txt");
			expect(p.isAbsolute("/absolute")).toBe(true);
		});
	});

	describe("isDirectory()", () => {
		it("should return true for path ending with /", () => {
			const p = new Path("/foo/");
			expect(p.isDirectory("/foo/")).toBe(true);
		});

		it("should return false for file path", () => {
			const p = new Path("/foo/bar.txt");
			expect(p.isDirectory("/foo/bar.txt")).toBe(false);
		});
	});

	describe("resolve()", () => {
		it("should resolve a relative path against the directory", () => {
			const p = new Path("/OPS/chapter_001.xhtml");
			expect(p.resolve("images/cover.jpg")).toBe("/OPS/images/cover.jpg");
		});

		it("should resolve .. traversal", () => {
			const p = new Path("/OPS/text/ch1.xhtml");
			expect(p.resolve("../images/cover.jpg")).toBe("/OPS/images/cover.jpg");
		});

		it("should resolve absolute path as-is", () => {
			const p = new Path("/OPS/chapter.xhtml");
			expect(p.resolve("/other/file.css")).toBe("/other/file.css");
		});
	});

	describe("relative()", () => {
		it("should return relative path from directory to target", () => {
			const p = new Path("/OPS/text/ch1.xhtml");
			const result = p.relative("/OPS/images/cover.jpg");
			expect(result).toBe("../images/cover.jpg");
		});

		it("should return absolute URL unchanged", () => {
			const p = new Path("/OPS/chapter.xhtml");
			const url = "http://example.com/resource.css";
			expect(p.relative(url)).toBe(url);
		});
	});

	describe("toString()", () => {
		it("should return the original path string", () => {
			const p = new Path("/OPS/chapter.xhtml");
			expect(p.toString()).toBe("/OPS/chapter.xhtml");
		});
	});

	describe("parse()", () => {
		it("should delegate to path-utils parse", () => {
			const p = new Path("/foo/bar.txt");
			const parsed = p.parse("/foo/bar.txt");
			expect(parsed.dir).toBe("/foo");
			expect(parsed.base).toBe("bar.txt");
			expect(parsed.ext).toBe(".txt");
		});
	});
});
