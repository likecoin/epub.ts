import { describe, it, expect, beforeAll } from "vitest";
import Book from "../src/book";
import { getFixtureUrl } from "./helpers";

describe("Book", () => {
	describe("Unarchived", () => {
		var book = new Book(getFixtureUrl("/alice/OPS/package.opf"));

		it("should open a epub", async () => {
			await book.opened;
			expect(book.isOpen).toBe(true);
			expect(book.url.toString()).toBe(getFixtureUrl("/alice/OPS/package.opf"));
		});

		it("should have a local coverUrl", async () => {
			expect(await book.coverUrl()).toBe(getFixtureUrl("/alice/OPS/images/cover_th.jpg"));
		});
	});

	describe("Archived epub", () => {
		var book = new Book(getFixtureUrl("/alice.epub"));

		it("should open a archived epub", async () => {
			await book.opened;
			expect(book.isOpen).toBe(true);
			expect(book.archive).toBeTruthy();
		});

		it("should have a blob coverUrl", async () => {
			let coverUrl = await book.coverUrl();
			expect(coverUrl).toMatch(/^blob:/);
		});
	});

	describe("Archived epub in array buffer", () => {
		let book: Book;

		beforeAll(async () => {
			const response = await fetch(getFixtureUrl("/alice.epub"));
			const buffer = await response.arrayBuffer();
			book = new Book(buffer);
		});

		it("should open a archived epub", async () => {
			await book.opened;
			expect(book.isOpen).toBe(true);
			expect(book.archive).toBeTruthy();
		});

		it("should have a blob coverUrl", async () => {
			let coverUrl = await book.coverUrl();
			expect(coverUrl).toMatch(/^blob:/);
		});
	});

	describe("Archived epub without cover", () => {
		var book = new Book(getFixtureUrl("/alice_without_cover.epub"));

		it("should open a archived epub", async () => {
			await book.opened;
			expect(book.isOpen).toBe(true);
			expect(book.archive).toBeTruthy();
		});

		it("should have a empty coverUrl", async () => {
			let coverUrl = await book.coverUrl();
			expect(coverUrl).toBeNull();
		});
	});

	describe("Sub-object parity (archived epub)", () => {
		let book: Book;

		beforeAll(async () => {
			book = new Book(getFixtureUrl("/alice.epub"));
			await book.opened;
		});

		it("should have correct packaging metadata title", () => {
			expect(book.packaging.metadata.title).toBe("Alice's Adventures in Wonderland");
		});

		it("should have correct packaging metadata creator", () => {
			expect(book.packaging.metadata.creator).toBe("Lewis Carroll");
		});

		it("should have correct packaging metadata language", () => {
			expect(book.packaging.metadata.language).toBe("en-US");
		});

		it("should have correct packaging metadata identifier", () => {
			expect(book.packaging.metadata.identifier).toBe(
				"edu.nyu.itp.future-of-publishing.alice-in-wonderland"
			);
		});

		it("should have correct packaging metadata rights", () => {
			expect(book.packaging.metadata.rights).toBe("Public domain in the USA.");
		});

		it("should have 11 navigation toc entries", () => {
			expect(book.navigation.toc.length).toBe(11);
		});

		it("should have correct navigation toc labels", () => {
			const labels = book.navigation.toc.map(item => item.label);
			expect(labels[0]).toBe("Title Page");
			expect(labels[1]).toBe("Down The Rabbit-Hole");
			expect(labels[10]).toBe("Alice's Evidence");
		});

		it("should have 13 spine items", () => {
			expect(book.spine.length).toBe(13);
		});

		it("should have titlepage as first linear spine item", () => {
			const first = book.spine.first();
			expect(first).toBeDefined();
			expect(first!.idref).toBe("titlepage");
		});

		it("should have chapter_010 as last linear spine item", () => {
			const last = book.spine.last();
			expect(last).toBeDefined();
			expect(last!.idref).toBe("chapter_010");
		});
	});
});
