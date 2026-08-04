import "fake-indexeddb/auto";
import { describe, it, expect, vi } from "vitest";
import Book from "../src/book";
import request from "../src/utils/request";
import { getFixtureUrl } from "./helpers";
import type { RequestFunction } from "../src/types";

describe("Book.store()", () => {
	const opfUrl = (): string => getFixtureUrl("/alice/OPS/package.opf");
	let storeName = 0;
	const uniqueName = (): string => `book-store-test-${++storeName}`;

	const passThrough = (): ReturnType<typeof vi.fn<RequestFunction>> =>
		vi.fn<RequestFunction>((...args) => request(...args));

	const recordRequests = (calls: Parameters<RequestFunction>[]): RequestFunction =>
		(...args) => {
			calls.push(args);
			return request(...args);
		};

	it("should route the book's requests through the store", async () => {
		const requestMethod = passThrough();
		const book = new Book(opfUrl(), { store: uniqueName(), requestMethod });

		await book.opened;

		expect(book.storage).toBeDefined();
		// the opf itself went through the store
		expect(requestMethod).toHaveBeenCalled();

		book.destroy();
	});

	it("should send the book's credentials and headers through the store", async () => {
		const calls: Parameters<RequestFunction>[] = [];
		const headers = { "X-Test": "1" };
		const book = new Book(opfUrl(), {
			store: uniqueName(),
			requestMethod: recordRequests(calls),
			requestCredentials: true,
			requestHeaders: headers
		});

		await book.opened;

		expect(calls.length).toBeGreaterThan(0);
		calls.forEach(([, , withCredentials, sentHeaders]) => {
			expect(withCredentials).toBe(true);
			expect(sentHeaders).toEqual(headers);
		});

		book.destroy();
	});

	// add() pre-caches a whole book for offline use and takes no credentials of
	// its own, so it has to inherit the book's
	it("should send the book's credentials and headers from store.add()", async () => {
		const calls: Parameters<RequestFunction>[] = [];
		const headers = { "X-Test": "1" };
		const book = new Book(opfUrl(), {
			store: uniqueName(),
			requestMethod: recordRequests(calls),
			requestCredentials: true,
			requestHeaders: headers
		});

		await book.opened;
		calls.length = 0;
		await book.storage!.add(book.resources);

		expect(calls.length).toBeGreaterThan(0);
		calls.forEach(([, , withCredentials, sentHeaders]) => {
			expect(withCredentials).toBe(true);
			expect(sentHeaders).toEqual(headers);
		});

		book.destroy();
	});

});
