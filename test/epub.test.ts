import { describe, it, expect } from "vitest";
import ePub from "../src/epub";
import { getFixtureUrl } from "./helpers";

describe("ePub", () => {
	it("should open a epub", async () => {
		var book = ePub(getFixtureUrl("/alice/OPS/package.opf"));

		await book.opened;
		expect(book.isOpen).toBe(true);
		expect(book.url.toString()).toBe(getFixtureUrl("/alice/OPS/package.opf"));
	});

	it("should open a archived epub", async () => {
		var book = ePub(getFixtureUrl("/alice.epub"));

		await book.opened;
		expect(book.isOpen).toBe(true);
		expect(book.archive).toBeTruthy();
		await book.replacementsReady;
	});
});
