import { describe, it, expect } from "vitest";
import { resolve, relative, dirname, isAbsolute, parse } from "../src/utils/path-utils";

describe("path-utils", () => {
	describe("resolve()", () => {
		it("should resolve absolute path unchanged", () => {
			expect(resolve("/foo/bar")).toBe("/foo/bar");
		});

		it("should resolve two relative segments", () => {
			expect(resolve("foo", "bar")).toBe("/foo/bar");
		});

		it("should resolve with .. traversal", () => {
			expect(resolve("/foo/bar", "../baz")).toBe("/foo/baz");
		});

		it("should resolve with . current dir", () => {
			expect(resolve("/foo/bar", "./baz")).toBe("/foo/bar/baz");
		});

		it("should resolve later absolute path overriding earlier", () => {
			expect(resolve("/foo", "/bar")).toBe("/bar");
		});

		it("should normalize trailing slashes", () => {
			expect(resolve("/foo/bar/")).toBe("/foo/bar");
		});

		it("should resolve empty args to /", () => {
			// With no meaningful segments, falls back to cwd prefix "/"
			expect(resolve("/")).toBe("/");
		});

		it("should handle multiple .. segments", () => {
			expect(resolve("/a/b/c", "../../d")).toBe("/a/d");
		});
	});

	describe("relative()", () => {
		it("should return empty string for identical paths", () => {
			expect(relative("/foo/bar", "/foo/bar")).toBe("");
		});

		it("should return relative path between siblings", () => {
			expect(relative("/foo/bar", "/foo/baz")).toBe("../baz");
		});

		it("should return child path", () => {
			expect(relative("/foo", "/foo/bar")).toBe("bar");
		});

		it("should return parent traversal", () => {
			expect(relative("/foo/bar", "/foo")).toBe("..");
		});

		it("should handle deeply nested relative paths", () => {
			expect(relative("/a/b/c", "/a/d/e")).toBe("../../d/e");
		});
	});

	describe("dirname()", () => {
		it("should return directory of file path", () => {
			expect(dirname("/foo/bar/baz.txt")).toBe("/foo/bar");
		});

		it("should return / for root-level file", () => {
			expect(dirname("/foo")).toBe("/");
		});

		it("should return . for empty path", () => {
			expect(dirname("")).toBe(".");
		});

		it("should return . for bare filename", () => {
			expect(dirname("file.txt")).toBe(".");
		});

		it("should handle path with trailing slash", () => {
			expect(dirname("/foo/bar/")).toBe("/foo");
		});
	});

	describe("isAbsolute()", () => {
		it("should return true for paths starting with /", () => {
			expect(isAbsolute("/foo/bar")).toBe(true);
		});

		it("should return false for relative paths", () => {
			expect(isAbsolute("foo/bar")).toBe(false);
		});

		it("should return false for empty string", () => {
			expect(isAbsolute("")).toBe(false);
		});

		it("should return true for root /", () => {
			expect(isAbsolute("/")).toBe(true);
		});
	});

	describe("parse()", () => {
		it("should parse a full absolute path", () => {
			const result = parse("/foo/bar/baz.txt");
			expect(result.root).toBe("/");
			expect(result.dir).toBe("/foo/bar");
			expect(result.base).toBe("baz.txt");
			expect(result.ext).toBe(".txt");
			expect(result.name).toBe("baz");
		});

		it("should parse a relative path", () => {
			const result = parse("foo/bar.js");
			expect(result.root).toBe("");
			expect(result.dir).toBe("foo");
			expect(result.base).toBe("bar.js");
			expect(result.ext).toBe(".js");
			expect(result.name).toBe("bar");
		});

		it("should parse a bare filename", () => {
			const result = parse("file.txt");
			expect(result.root).toBe("");
			expect(result.dir).toBe("");
			expect(result.base).toBe("file.txt");
			expect(result.ext).toBe(".txt");
			expect(result.name).toBe("file");
		});

		it("should parse a file with no extension", () => {
			const result = parse("/foo/bar/Makefile");
			expect(result.base).toBe("Makefile");
			expect(result.ext).toBe("");
			expect(result.name).toBe("Makefile");
		});

		it("should parse empty string", () => {
			const result = parse("");
			expect(result.root).toBe("");
			expect(result.dir).toBe("");
			expect(result.base).toBe("");
			expect(result.ext).toBe("");
			expect(result.name).toBe("");
		});

		it("should parse EPUB-typical paths", () => {
			const result = parse("/OPS/chapter_001.xhtml");
			expect(result.dir).toBe("/OPS");
			expect(result.base).toBe("chapter_001.xhtml");
			expect(result.ext).toBe(".xhtml");
			expect(result.name).toBe("chapter_001");
		});

		it("should parse dotfile", () => {
			const result = parse("/foo/.hidden");
			expect(result.base).toBe(".hidden");
			expect(result.ext).toBe("");
			expect(result.name).toBe(".hidden");
		});
	});
});
