import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import Book from "../src/book";
import { EpubError } from "../src/utils/core";
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
		afterAll(async () => { await book.replacementsReady; });

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
		afterAll(async () => { await book.replacementsReady; });

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

	describe("Lazy replacements (archived epub)", () => {
		it("should expose replacementsReady promise on archived epub", async () => {
			const book = new Book(getFixtureUrl("/alice.epub"));
			await book.opened;
			expect(book.replacementsReady).toBeInstanceOf(Promise);
			await book.replacementsReady;
		});

		it("book.opened should not be gated on replacementsReady", async () => {
			const book = new Book(getFixtureUrl("/alice.epub"));
			await book.opened;
			// replacementsReady must be a separate promise, not the same as opened
			expect(book.replacementsReady).not.toBe(book.opened);
			// It must still resolve independently
			await book.replacementsReady;
		});

		it("coverUrl() should still work immediately after book.opened", async () => {
			const book = new Book(getFixtureUrl("/alice.epub"));
			await book.opened;
			const coverUrl = await book.coverUrl();
			expect(coverUrl).toMatch(/^blob:/);
			await book.replacementsReady;
		});

		it("should not expose replacementsReady for unarchived epub", async () => {
			const book = new Book(getFixtureUrl("/alice/OPS/package.opf"));
			await book.opened;
			expect(book.replacementsReady).toBeUndefined();
		});
	});

	describe("Archived epub without cover", () => {
		var book = new Book(getFixtureUrl("/alice_without_cover.epub"));
		afterAll(async () => { await book.replacementsReady; });

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

	describe("load() type forwarding", () => {
		it("should forward the type to the request function (unarchived)", async () => {
			const book = new Book(getFixtureUrl("/alice/OPS/package.opf"));
			await book.opened;
			const spy = vi.spyOn(book, "request").mockResolvedValue("stub");

			await book.load("chapter_001.xhtml", "xhtml");

			expect(spy.mock.calls[0]![1]).toBe("xhtml");
		});

		it("should forward the type to the archive (archived)", async () => {
			const book = new Book(getFixtureUrl("/alice.epub"));
			await book.opened;
			const spy = vi.spyOn(book.archive!, "request").mockResolvedValue("stub");

			await book.load("chapter_001.xhtml", "xhtml");

			expect(spy.mock.calls[0]![1]).toBe("xhtml");
			await book.replacementsReady;
		});
	});

	describe("Sub-object parity (archived epub)", () => {
		let book: Book;

		beforeAll(async () => {
			book = new Book(getFixtureUrl("/alice.epub"));
			await book.opened;
		});
		afterAll(async () => { await book.replacementsReady; });

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

	describe("Open failure", () => {
		const badUrl = getFixtureUrl("/does-not-exist.opf");

		// A failed open rejects every pending promise (opened, ready and each
		// loaded.* deferred). A real consumer awaits only one of them, so the
		// siblings would surface as unhandled rejections; swallow them here so
		// the suite asserts one promise at a time without noisy warnings.
		const silenceSiblings = (book: Book) => {
			book.opened.catch(() => {});
			book.ready.catch(() => {});
			Object.values(book.loaded).forEach((p) => p.catch(() => {}));
		};

		it("should reject book.opened with an EpubError instead of hanging", async () => {
			const book = new Book(badUrl);
			silenceSiblings(book);
			await expect(book.opened).rejects.toBeInstanceOf(EpubError);
		});

		it("should reject book.ready fast rather than hanging forever", async () => {
			const book = new Book(badUrl);
			silenceSiblings(book);
			await expect(book.ready).rejects.toBeInstanceOf(EpubError);
		});

		it("should emit openFailed with the surfaced cause", async () => {
			const book = new Book(badUrl);
			silenceSiblings(book);
			const err = await new Promise<EpubError>((resolve) => {
				book.on("openFailed", (e: EpubError) => resolve(e));
			});
			expect(err).toBeInstanceOf(EpubError);
			expect(err.message).toContain("Cannot load book at");
			expect(err.cause).toBeDefined();
		});

		it("should propagate the HTTP status from the underlying cause", async () => {
			const book = new Book(badUrl);
			silenceSiblings(book);
			await expect(book.opened).rejects.toMatchObject({ status: 404 });
		});

		// The open() setup runs synchronously before the promise chain is built
		// (e.g. Archive construction throws "JSZip lib not loaded"), so such a
		// throw must fail fast like an async error rather than escape the caller.
		describe("synchronous setup throw", () => {
			const mockOpenEpubThrow = () =>
				vi.spyOn(Book.prototype, "openEpub").mockImplementation(() => {
					throw new Error("JSZip lib not loaded");
				});
			let spy: ReturnType<typeof mockOpenEpubThrow>;
			beforeEach(() => { spy = mockOpenEpubThrow(); });
			afterEach(() => spy.mockRestore());

			it("should not throw from the constructor", async () => {
				let book!: Book;
				expect(() => { book = new Book(new ArrayBuffer(8)); }).not.toThrow();
				silenceSiblings(book);
				await expect(book.opened).rejects.toThrow("JSZip lib not loaded");
			});

			it("should reject rather than throw when open() is called directly", async () => {
				const book = new Book();
				silenceSiblings(book);
				let opening!: Promise<void>;
				expect(() => { opening = book.open(new ArrayBuffer(8), "binary"); }).not.toThrow();
				await expect(opening).rejects.toBeInstanceOf(EpubError);
			});
		});
	});
});
