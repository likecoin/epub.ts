import { describe, it, expect } from "vitest";
import request from "../src/utils/request";
import { getFixtureUrl } from "./helpers";

describe("request", () => {
	describe("type inference from extension", () => {
		it("should fetch .opf as XML Document", async () => {
			const result = await request(getFixtureUrl("/alice/OPS/package.opf"));
			expect(result).toBeInstanceOf(Document);
			const doc = result as Document;
			const title = doc.getElementsByTagName("dc:title")[0];
			expect(title?.textContent).toBe("Alice's Adventures in Wonderland");
		});

		it("should fetch .xhtml as Document", async () => {
			const result = await request(getFixtureUrl("/alice/OPS/toc.xhtml"));
			expect(result).toBeInstanceOf(Document);
		});

		it("should fetch .ncx as XML Document", async () => {
			const result = await request(getFixtureUrl("/alice/OPS/toc.ncx"));
			expect(result).toBeInstanceOf(Document);
		});
	});

	describe("explicit type parameter", () => {
		it("should fetch as binary ArrayBuffer", async () => {
			const result = await request(getFixtureUrl("/alice.epub"), "binary");
			expect(result).toBeInstanceOf(ArrayBuffer);
			expect((result as ArrayBuffer).byteLength).toBeGreaterThan(0);
		});

		it("should fetch as blob", async () => {
			const result = await request(getFixtureUrl("/alice/OPS/images/cover_th.jpg"), "blob");
			expect(result).toBeInstanceOf(Blob);
			expect((result as Blob).size).toBeGreaterThan(0);
		});
	});

	describe("error handling", () => {
		it("should reject for 404", async () => {
			// Use .txt extension — XML extensions (.opf) resolve via responseXML even on 404
			await expect(request(getFixtureUrl("/nonexistent.txt"))).rejects.toMatchObject({
				status: 404,
			});
		});
	});
});
