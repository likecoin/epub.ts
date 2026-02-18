import { describe, it, expect, beforeAll } from "vitest";
import Archive from "../src/archive";
import { getFixtureUrl } from "./helpers";

describe("Archive", () => {
	let archive: Archive;

	describe("constructor", () => {
		it("should create a JSZip instance", () => {
			const a = new Archive();
			expect(a.zip).toBeDefined();
		});

		it("should have an empty urlCache", () => {
			const a = new Archive();
			expect(a.urlCache).toEqual({});
		});
	});

	describe("with alice.epub loaded", () => {
		beforeAll(async () => {
			archive = new Archive();
			const response = await fetch(getFixtureUrl("/alice.epub"));
			const buffer = await response.arrayBuffer();
			await archive.open(buffer);
		});

		describe("getText()", () => {
			it("should retrieve package.opf containing epubcheck ground-truth title", async () => {
				const text = await archive.getText("/OPS/package.opf");
				expect(text).toContain("<dc:title>Alice's Adventures in Wonderland</dc:title>");
			});

			it("should retrieve package.opf containing epubcheck ground-truth creator", async () => {
				const text = await archive.getText("/OPS/package.opf");
				expect(text).toContain("<dc:creator");
				expect(text).toContain("Lewis Carroll");
			});

			it("should retrieve toc.xhtml containing nav element", async () => {
				const text = await archive.getText("/OPS/toc.xhtml");
				expect(text).toContain("<nav");
			});

			it("should return undefined for nonexistent file", () => {
				const result = archive.getText("/nonexistent.xml");
				expect(result).toBeUndefined();
			});
		});

		describe("getBlob()", () => {
			it("should retrieve cover image as Blob with correct type and non-zero size", async () => {
				const blob = await archive.getBlob("/OPS/images/cover_th.jpg");
				expect(blob).toBeInstanceOf(Blob);
				expect(blob!.type).toBe("image/jpeg");
				expect(blob!.size).toBeGreaterThan(0);
			});

			it("should return undefined for nonexistent file", () => {
				const result = archive.getBlob("/nonexistent.jpg");
				expect(result).toBeUndefined();
			});
		});

		describe("getBase64()", () => {
			it("should retrieve an image as data URI with correct prefix", async () => {
				const dataUri = await archive.getBase64("/OPS/images/cover_th.jpg");
				expect(dataUri).toMatch(/^data:image\/jpeg;base64,/);
			});

			it("should return undefined for nonexistent file", () => {
				const result = archive.getBase64("/nonexistent.jpg");
				expect(result).toBeUndefined();
			});
		});

		describe("request()", () => {
			it("should auto-detect XML type for .opf and return Document with correct title", async () => {
				const doc = await archive.request("/OPS/package.opf") as Document;
				expect(doc).toBeDefined();
				const titleEl = doc.getElementsByTagName("dc:title")[0];
				expect(titleEl?.textContent).toBe("Alice's Adventures in Wonderland");
			});

			it("should reject for missing file", async () => {
				await expect(archive.request("/nonexistent.opf")).rejects.toMatchObject({
					message: expect.stringContaining("File not found"),
				});
			});
		});

		describe("handleResponse()", () => {
			it("should parse JSON string into object", () => {
				const result = archive.handleResponse('{"key":"value"}', "json");
				expect(result).toEqual({ key: "value" });
			});

			it("should parse XML string into Document", () => {
				const result = archive.handleResponse("<root><item/></root>", "xml") as Document;
				expect(result.documentElement.tagName).toBe("root");
			});

			it("should parse XHTML string into Document", () => {
				const result = archive.handleResponse(
					'<html xmlns="http://www.w3.org/1999/xhtml"><body></body></html>',
					"xhtml"
				) as Document;
				expect(result.documentElement.tagName).toBe("html");
			});

			it("should parse HTML string into Document", () => {
				const result = archive.handleResponse("<html><body></body></html>", "html") as Document;
				expect(result.querySelector("body")).toBeTruthy();
			});

			it("should passthrough string for unknown type", () => {
				const result = archive.handleResponse("plain text", "txt");
				expect(result).toBe("plain text");
			});
		});

		describe("createUrl()", () => {
			it("should return a data URI in base64 mode and cache it", async () => {
				const url = await archive.createUrl("/OPS/images/cover_th.jpg", { base64: true });
				expect(url).toMatch(/^data:image\/jpeg;base64,/);
				expect(archive.urlCache["/OPS/images/cover_th.jpg"]).toBe(url);
			});

			it("should return cached URL on second call (same reference)", async () => {
				const url1 = await archive.createUrl("/OPS/images/cover_th.jpg", { base64: true });
				const url2 = await archive.createUrl("/OPS/images/cover_th.jpg", { base64: true });
				expect(url1).toBe(url2);
			});

			it("should reject for missing file", async () => {
				await expect(archive.createUrl("/nonexistent.jpg")).rejects.toMatchObject({
					message: expect.stringContaining("File not found"),
				});
			});
		});

		describe("revokeUrl()", () => {
			it("should no-op without error for known URL", () => {
				expect(() => archive.revokeUrl("/OPS/images/cover_th.jpg")).not.toThrow();
			});
		});

		describe("destroy()", () => {
			it("should clear zip and urlCache", () => {
				const a = new Archive();
				a.urlCache["test"] = "blob:http://localhost/1";
				a.destroy();
				expect(a.zip).toBeUndefined();
				expect(a.urlCache).toEqual({});
			});
		});
	});
});
