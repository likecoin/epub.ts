import { describe, it, expect } from "vitest";
import Url from "../src/utils/url";
import Path from "../src/utils/path";
import { blob2base64 } from "../src/utils/core";

describe("Core", () => {

	describe("Url", () => {

		it("Url()", () => {
			var url = new Url("http://example.com/fred/chasen/derf.html");

			expect(url.href).toBe("http://example.com/fred/chasen/derf.html");
			expect(url.directory).toBe("/fred/chasen/");
			expect(url.extension).toBe("html");
			expect(url.filename).toBe("derf.html");
			expect(url.origin).toBe("http://example.com");
			expect(url.protocol).toBe("http:");
			expect(url.search).toBe("");
		});

		describe("#resolve()", () => {
			it("should join subfolders", () => {
				var a = "http://example.com/fred/chasen/";
				var b = "ops/derf.html";

				var resolved = new Url(a).resolve(b);
				expect(resolved).toBe("http://example.com/fred/chasen/ops/derf.html");
			});

			it("should resolve up a level", () => {
				var a = "http://example.com/fred/chasen/index.html";
				var b = "../derf.html";

				var resolved = new Url(a).resolve(b);
				expect(resolved).toBe("http://example.com/fred/derf.html");
			});

			it("should resolve absolute", () => {
				var a = "http://example.com/fred/chasen/index.html";
				var b = "/derf.html";

				var resolved = new Url(a).resolve(b);
				expect(resolved).toBe("http://example.com/derf.html");
			});

			it("should resolve with search strings", () => {
				var a = "http://example.com/fred/chasen/index.html?debug=true";
				var b = "/derf.html";

				var resolved = new Url(a).resolve(b);
				expect(resolved).toBe("http://example.com/derf.html");
			});

			it("should handle directory with a dot", () => {
				var a = "http://example.com/fred/chasen/index.epub/";

				var url = new Url(a);
				expect(url.directory).toBe("/fred/chasen/index.epub/");
				expect(url.extension).toBe("");
			});

			it("should handle file urls", () => {
				var url = new Url("file:///var/mobile/Containers/Data/Application/F47E4434-9B98-4654-93F1-702336B08EE6/Documents/books/moby-dick/derf.html");

				expect(url.href).toBe("file:///var/mobile/Containers/Data/Application/F47E4434-9B98-4654-93F1-702336B08EE6/Documents/books/moby-dick/derf.html");
				expect(url.directory).toBe("/var/mobile/Containers/Data/Application/F47E4434-9B98-4654-93F1-702336B08EE6/Documents/books/moby-dick/");
				expect(url.extension).toBe("html");
				expect(url.filename).toBe("derf.html");
				expect(url.origin).toBe("file://"); // origin should be blank
				expect(url.protocol).toBe("file:");
				expect(url.search).toBe("");
			});

			it("should resolve with file urls", () => {
				var a = "file:///var/mobile/Containers/Data/Application/books/";
				var b = "derf.html";

				var resolved = new Url(a).resolve(b);
				expect(resolved).toBe("file:///var/mobile/Containers/Data/Application/books/derf.html");
			});

		});
	});

	describe("Path", () => {

		it("Path()", () => {
			var path = new Path("/fred/chasen/derf.html");

			expect(path.path).toBe("/fred/chasen/derf.html");
			expect(path.directory).toBe("/fred/chasen/");
			expect(path.extension).toBe("html");
			expect(path.filename).toBe("derf.html");
		});

		it("Strip out url", () => {
			var path = new Path("http://example.com/fred/chasen/derf.html");

			expect(path.path).toBe("/fred/chasen/derf.html");
			expect(path.directory).toBe("/fred/chasen/");
			expect(path.extension).toBe("html");
			expect(path.filename).toBe("derf.html");
		});

		describe("#parse()", () => {
			it("should parse a path", () => {
				var path = Path.prototype.parse("/fred/chasen/derf.html");

				expect(path.dir).toBe("/fred/chasen");
				expect(path.base).toBe("derf.html");
				expect(path.ext).toBe(".html");
			});

			it("should parse a relative path", () => {
				var path = Path.prototype.parse("fred/chasen/derf.html");

				expect(path.dir).toBe("fred/chasen");
				expect(path.base).toBe("derf.html");
				expect(path.ext).toBe(".html");
			});
		});

		describe("#isDirectory()", () => {
			it("should recognize a directory", () => {
				var directory = Path.prototype.isDirectory("/fred/chasen/");
				var notDirectory = Path.prototype.isDirectory("/fred/chasen/derf.html");

				expect(directory).toBe(true);
				expect(notDirectory).toBe(false);
			});
		});

		describe("#resolve()", () => {

			it("should resolve a path", () => {
				var a = "/fred/chasen/index.html";
				var b = "derf.html";

				var resolved = new Path(a).resolve(b);
				expect(resolved).toBe("/fred/chasen/derf.html");
			});

			it("should resolve a relative path", () => {
				var a = "fred/chasen/index.html";
				var b = "derf.html";

				var resolved = new Path(a).resolve(b);
				expect(resolved).toBe("/fred/chasen/derf.html");
			});

			it("should resolve a level up", () => {
				var a = "/fred/chasen/index.html";
				var b = "../derf.html";

				var resolved = new Path(a).resolve(b);
				expect(resolved).toBe("/fred/derf.html");
			});

		});

		describe("#relative()", () => {

			it("should find a relative path at the same level", () => {
				var a = "/fred/chasen/index.html";
				var b = "/fred/chasen/derf.html";

				var relative = new Path(a).relative(b);
				expect(relative).toBe("derf.html");
			});

			it("should find a relative path down a level", () => {
				var a = "/fred/chasen/index.html";
				var b = "/fred/chasen/ops/derf.html";

				var relative = new Path(a).relative(b);
				expect(relative).toBe("ops/derf.html");
			});

			it("should resolve a level up", () => {
				var a = "/fred/chasen/index.html";
				var b = "/fred/derf.html";

				var relative = new Path(a).relative(b);
				expect(relative).toBe("../derf.html");
			});

		});

	});


	describe("blob2base64()", () => {

		it("should resolve with a data url", async () => {
			const result = await blob2base64(new Blob(["hi"], { type: "text/plain" }));
			expect(String(result)).toMatch(/^data:text\/plain;base64,/);
		});

		it("should reject when the read fails", async () => {
			const OriginalFileReader = globalThis.FileReader;
			class FailingFileReader {
				error = new Error("boom");
				result = null;
				onerror: (() => void) | null = null;
				onloadend: (() => void) | null = null;
				readAsDataURL(): void {
					setTimeout(() => {
						this.onerror?.();
						this.onloadend?.();
					}, 0);
				}
			}
			globalThis.FileReader = FailingFileReader as unknown as typeof FileReader;

			try {
				await expect(blob2base64(new Blob(["hi"]))).rejects.toThrow("boom");
			} finally {
				globalThis.FileReader = OriginalFileReader;
			}
		});

		it("should reject when the read is aborted", async () => {
			// abort fires abort then loadend with a null result, so resolving on
			// loadend would have reported the abort as a successful empty read.
			const OriginalFileReader = globalThis.FileReader;
			class AbortingFileReader {
				error = new Error("aborted");
				result = null;
				onload: (() => void) | null = null;
				onerror: (() => void) | null = null;
				onabort: (() => void) | null = null;
				onloadend: (() => void) | null = null;
				readAsDataURL(): void {
					setTimeout(() => {
						this.onabort?.();
						this.onloadend?.();
					}, 0);
				}
			}
			globalThis.FileReader = AbortingFileReader as unknown as typeof FileReader;

			try {
				await expect(blob2base64(new Blob(["hi"]))).rejects.toThrow("aborted");
			} finally {
				globalThis.FileReader = OriginalFileReader;
			}
		});

	});

});
