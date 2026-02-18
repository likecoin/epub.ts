// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Import the Node.js entry point which shims DOMParser/XMLSerializer/document
import { Book } from "../src/node";

const ALICE_PATH = resolve(__dirname, "fixtures/alice.epub");

describe("Node.js entry point", () => {
	let book: Book;

	beforeAll(async () => {
		const buffer = readFileSync(ALICE_PATH);
		const arrayBuffer = buffer.buffer.slice(
			buffer.byteOffset,
			buffer.byteOffset + buffer.byteLength
		);
		book = new Book(arrayBuffer);
		await book.opened;
	});

	it("should open an epub from ArrayBuffer", () => {
		expect(book.isOpen).toBe(true);
	});

	it("should have correct metadata title", () => {
		expect(book.packaging.metadata.title).toBe("Alice's Adventures in Wonderland");
	});

	it("should have correct metadata creator", () => {
		expect(book.packaging.metadata.creator).toBe("Lewis Carroll");
	});

	it("should have correct metadata language", () => {
		expect(book.packaging.metadata.language).toBe("en-US");
	});

	it("should have correct metadata identifier", () => {
		expect(book.packaging.metadata.identifier).toBe(
			"edu.nyu.itp.future-of-publishing.alice-in-wonderland"
		);
	});

	it("should have 13 spine items", () => {
		expect(book.spine.length).toBe(13);
	});

	it("should have titlepage as first spine item", () => {
		const first = book.spine.first();
		expect(first).toBeDefined();
		expect(first!.idref).toBe("titlepage");
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

	it("should render a section via XMLSerializer", async () => {
		const section = book.spine.first();
		expect(section).toBeDefined();
		const html = await section!.render(book.archive!.request.bind(book.archive));
		expect(html).toContain("Alice");
		expect(typeof html).toBe("string");
		expect(html.length).toBeGreaterThan(0);
	});
});
