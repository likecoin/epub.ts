import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Store from "../src/store";

describe("Store", () => {

	describe("constructor", () => {
		it("should set name", () => {
			const store = new Store("test-store");
			expect(store.name).toBe("test-store");
		});

		it("should set online to true", () => {
			const store = new Store("test-store");
			expect(store.online).toBe(true);
		});

		it("should initialize empty urlCache", () => {
			const store = new Store("test-store");
			expect(store.urlCache).toEqual({});
		});

		it("should use default requester when none provided", () => {
			const store = new Store("test-store");
			expect(typeof store.requester).toBe("function");
		});

		it("should use custom requester when provided", () => {
			const customReq = vi.fn();
			const store = new Store("test-store", customReq);
			expect(store.requester).toBe(customReq);
		});

		it("should create storage", () => {
			const store = new Store("test-store");
			expect(store.storage).toBeDefined();
		});
	});

	describe("checkRequirements()", () => {
		it("should create storage when indexedDB is available", () => {
			const store = new Store("test-check");
			expect(store.storage).toBeDefined();
			expect(store.storage.getItem).toBeDefined();
			expect(store.storage.setItem).toBeDefined();
		});
	});

	describe("addListeners() / removeListeners()", () => {
		it("should register _status handler", () => {
			const store = new Store("test-listeners");
			expect(store._status).toBeDefined();
		});

		it("should clear _status on removeListeners", () => {
			const store = new Store("test-listeners");
			store.removeListeners();
			expect(store._status).toBeUndefined();
		});
	});

	describe("status()", () => {
		it("should update online flag based on navigator.onLine", () => {
			const store = new Store("test-status");
			// In jsdom, navigator.onLine is typically true
			store.status(new Event("online"));
			expect(store.online).toBe(navigator.onLine);
		});

		it("should emit online event when online", () => {
			const store = new Store("test-status-online");
			const handler = vi.fn();
			store.on("online", handler);
			// Force navigator.onLine = true (default in jsdom)
			store.status(new Event("online"));
			if (navigator.onLine) {
				expect(handler).toHaveBeenCalledWith(store);
			}
		});
	});

	describe("handleResponse()", () => {
		it("should parse JSON", () => {
			const store = new Store("test-handle");
			const result = store.handleResponse('{"key":"value"}', "json");
			expect(result).toEqual({ key: "value" });
		});

		it("should parse XML", () => {
			const store = new Store("test-handle");
			const result = store.handleResponse("<root><item/></root>", "xml") as Document;
			expect(result).toBeDefined();
			expect(result.documentElement.tagName).toBe("root");
		});

		it("should parse XHTML", () => {
			const store = new Store("test-handle");
			const result = store.handleResponse("<html xmlns='http://www.w3.org/1999/xhtml'><body/></html>", "xhtml") as Document;
			expect(result).toBeDefined();
		});

		it("should parse HTML", () => {
			const store = new Store("test-handle");
			const result = store.handleResponse("<html><body>hello</body></html>", "html") as Document;
			expect(result).toBeDefined();
		});

		it("should pass through other types", () => {
			const store = new Store("test-handle");
			const result = store.handleResponse("plain text", "txt");
			expect(result).toBe("plain text");
		});
	});

	describe("put()", () => {
		it("should store data and return it", async () => {
			const requester = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
			const store = new Store("test-put", requester);
			const result = await store.put("http://example.com/file.txt");
			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("should skip request if already present", async () => {
			const requester = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
			const store = new Store("test-put-dup", requester);
			await store.put("http://example.com/file2.txt");
			requester.mockClear();
			const result = await store.put("http://example.com/file2.txt");
			expect(requester).not.toHaveBeenCalled();
			// IndexedDB may return a different realm's Uint8Array, so check structurally
			expect(result).toBeDefined();
			expect(ArrayBuffer.isView(result)).toBe(true);
		});
	});

	describe("request()", () => {
		it("should delegate to requester when online", async () => {
			const requester = vi.fn().mockResolvedValue("response data");
			const store = new Store("test-request", requester);
			store.online = true;
			const result = await store.request("http://example.com/data.json", "json");
			expect(requester).toHaveBeenCalledWith("http://example.com/data.json", "json", undefined, undefined);
			expect(result).toBe("response data");
		});

		it("should retrieve from storage when offline", async () => {
			const requester = vi.fn().mockResolvedValue(new Uint8Array([65, 66, 67]));
			const store = new Store("test-request-offline", requester);
			// First, put something in storage
			await store.put("http://example.com/offline.txt");
			// Now go offline
			store.online = false;
			// This should retrieve from storage
			const result = await store.retrieve("http://example.com/offline.txt", "blob");
			expect(result).toBeDefined();
		});
	});

	describe("retrieve()", () => {
		it("should reject for missing file", async () => {
			const store = new Store("test-retrieve-missing");
			await expect(store.retrieve("http://example.com/nonexistent.txt")).rejects.toBeDefined();
		});
	});

	describe("getBlob()", () => {
		it("should return a Blob from stored Uint8Array", async () => {
			const requester = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
			const store = new Store("test-getblob", requester);
			await store.put("http://example.com/blob.bin");
			const blob = await store.getBlob("http://example.com/blob.bin");
			expect(blob).toBeInstanceOf(Blob);
		});

		it("should return undefined when not stored", async () => {
			const store = new Store("test-getblob-empty");
			const blob = await store.getBlob("http://example.com/nope.bin");
			expect(blob).toBeUndefined();
		});
	});

	describe("getText()", () => {
		it("should return text from stored Uint8Array", async () => {
			const data = new TextEncoder().encode("Hello World");
			const requester = vi.fn().mockResolvedValue(data);
			const store = new Store("test-gettext", requester);
			await store.put("http://example.com/text.txt");
			const text = await store.getText("http://example.com/text.txt");
			expect(text).toBe("Hello World");
		});

		it("should return undefined when not stored", async () => {
			const store = new Store("test-gettext-empty");
			const text = await store.getText("http://example.com/nope.txt");
			expect(text).toBeUndefined();
		});
	});

	describe("getBase64()", () => {
		it("should return a data URL from stored Uint8Array", async () => {
			const data = new TextEncoder().encode("Hello");
			const requester = vi.fn().mockResolvedValue(data);
			const store = new Store("test-getbase64", requester);
			await store.put("http://example.com/b64.txt");
			const result = await store.getBase64("http://example.com/b64.txt");
			expect(result).toContain("data:");
		});

		it("should return undefined when not stored", async () => {
			const store = new Store("test-getbase64-empty");
			const result = await store.getBase64("http://example.com/nope.txt");
			expect(result).toBeUndefined();
		});
	});

	describe("createUrl()", () => {
		it("should create a blob URL and cache it", async () => {
			const data = new Uint8Array([1, 2, 3]);
			const requester = vi.fn().mockResolvedValue(data);
			const store = new Store("test-createurl", requester);
			await store.put("http://example.com/url.bin");
			const url = await store.createUrl("http://example.com/url.bin");
			expect(typeof url).toBe("string");
			expect(store.urlCache["http://example.com/url.bin"]).toBe(url);
		});

		it("should return cached URL on subsequent calls", async () => {
			const data = new Uint8Array([1, 2, 3]);
			const requester = vi.fn().mockResolvedValue(data);
			const store = new Store("test-createurl-cache", requester);
			await store.put("http://example.com/cached.bin");
			const url1 = await store.createUrl("http://example.com/cached.bin");
			const url2 = await store.createUrl("http://example.com/cached.bin");
			expect(url1).toBe(url2);
		});

		it("should support base64 option", async () => {
			const data = new TextEncoder().encode("Hello");
			const requester = vi.fn().mockResolvedValue(data);
			const store = new Store("test-createurl-b64", requester);
			await store.put("http://example.com/b64url.txt");
			const url = await store.createUrl("http://example.com/b64url.txt", { base64: true });
			expect(url).toContain("data:");
		});
	});

	describe("revokeUrl()", () => {
		it("should not throw for non-cached URL", () => {
			const store = new Store("test-revoke");
			expect(() => store.revokeUrl("http://example.com/nope")).not.toThrow();
		});
	});

	describe("destroy()", () => {
		it("should clear urlCache", () => {
			const store = new Store("test-destroy");
			store.urlCache["test"] = "blob:test";
			store.destroy();
			expect(store.urlCache).toEqual({});
		});

		it("should remove listeners", () => {
			const store = new Store("test-destroy-listeners");
			store.destroy();
			expect(store._status).toBeUndefined();
		});
	});
});
