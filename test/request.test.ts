import { describe, it, expect, vi, afterEach } from "vitest";
import request from "../src/utils/request";
import { EpubError } from "../src/utils/core";
import { getFixtureUrl } from "./helpers";

describe("request", () => {
	describe("AbortSignal", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		// jsdom's AbortSignal is a different realm than Node's undici fetch,
		// which rejects it with a TypeError before it can abort — so a real
		// aborted fetch can't be reproduced here. Stub fetch to reject with
		// the AbortError undici/browsers actually throw, then assert
		// request() surfaces it verbatim rather than wrapping it.
		it("should surface AbortError verbatim instead of wrapping it as EpubError", async () => {
			const abortError = new DOMException("The operation was aborted.", "AbortError");
			vi.spyOn(globalThis, "fetch").mockRejectedValue(abortError);

			const rejected = await request(
				getFixtureUrl("/alice/OPS/toc.xhtml")
			).then(() => undefined, (e: unknown) => e);

			expect(rejected).toBe(abortError);
			expect((rejected as Error).name).toBe("AbortError");
			expect(rejected).not.toBeInstanceOf(EpubError);
		});

		// That same realm mismatch used to fail the whole request: fetch refuses
		// the foreign signal, so the resource was lost rather than just becoming
		// uncancellable.
		it("should retry without the signal when fetch rejects it as foreign", async () => {
			const foreign = new TypeError('RequestInit: Expected signal ("AbortSignal {}") to be an instance of AbortSignal.');
			const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => {
				if (init && init.signal) {
					return Promise.reject(foreign);
				}
				return Promise.resolve(new Response("body {}", { status: 200 }));
			});

			const controller = new AbortController();
			const result = await request("http://localhost/style.css", "text", undefined, undefined, controller.signal);

			expect(result).toBe("body {}");
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});

		it("should not retry an already aborted request when the signal is rejected as foreign", async () => {
			const foreign = new TypeError('RequestInit: Expected signal ("AbortSignal {}") to be an instance of AbortSignal.');
			vi.spyOn(globalThis, "fetch").mockRejectedValue(foreign);

			const controller = new AbortController();
			controller.abort();

			const rejected = await request("http://localhost/style.css", "text", undefined, undefined, controller.signal)
				.then(() => undefined, (e: unknown) => e);

			expect((rejected as Error).name).toBe("AbortError");
		});
	});

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

	// fetch() cannot load file:// URLs, so those are routed through
	// XMLHttpRequest instead (which can, when the host grants file access).
	describe("file:// URLs (XHR fallback)", () => {
		const RealXHR = globalThis.XMLHttpRequest;

		afterEach(() => {
			globalThis.XMLHttpRequest = RealXHR;
			vi.restoreAllMocks();
		});

		function installFakeXhr(config: {
			status?: number;
			statusText?: string;
			responseText?: string;
			response?: unknown;
			// When false, send() leaves the request pending so the test can
			// drive abort()/completion itself (models an in-flight request).
			autoRespond?: boolean;
		}) {
			const instance = {
				responseType: "" as XMLHttpRequestResponseType,
				withCredentials: false,
				readyState: 0,
				status: config.status ?? 0,
				statusText: config.statusText ?? "",
				responseText: config.responseText ?? "",
				response: config.response,
				openedUrl: "",
				headers: {} as Record<string, string>,
				onreadystatechange: null as null | (() => void),
				onerror: null as null | (() => void),
				onabort: null as null | (() => void),
				open(_method: string, url: string) { this.openedUrl = url; },
				setRequestHeader(k: string, v: string) { this.headers[k] = v; },
				abort() {
					// Real XHR fires readystatechange (DONE, status 0) before abort.
					this.readyState = 4;
					this.status = 0;
					this.onreadystatechange?.();
					this.onabort?.();
				},
				send() {
					if (config.autoRespond === false) return;
					this.readyState = 4;
					this.onreadystatechange?.();
				},
			};
			const ctor = function () { return instance; } as unknown as typeof XMLHttpRequest;
			(ctor as unknown as { DONE: number }).DONE = 4;
			globalThis.XMLHttpRequest = ctor;
			return instance;
		}

		it("should route file:// through XHR, not fetch", async () => {
			const fetchSpy = vi.spyOn(globalThis, "fetch");
			const xhr = installFakeXhr({ status: 0, responseText: "hello" });

			const result = await request("file:///book/mimetype", "text");

			expect(result).toBe("hello");
			expect(xhr.openedUrl).toBe("file:///book/mimetype");
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("should treat status 0 as success for file:// reads", async () => {
			installFakeXhr({ status: 0, responseText: "<root/>" });
			const result = await request("file:///book/content.opf", "xml");
			expect(result).toBeInstanceOf(Document);
		});

		it("should request arraybuffer for binary type", async () => {
			const buffer = new ArrayBuffer(8);
			const xhr = installFakeXhr({ status: 0, response: buffer });
			const result = await request("file:///book/alice.epub", "binary");
			expect(xhr.responseType).toBe("arraybuffer");
			expect(result).toBe(buffer);
		});

		it("should reject non-2xx, non-zero statuses", async () => {
			installFakeXhr({ status: 404, statusText: "Not Found" });
			await expect(request("file:///missing.txt", "text")).rejects.toMatchObject({
				status: 404,
			});
		});

		it("should reject with a clear EpubError when XMLHttpRequest is unavailable", async () => {
			globalThis.XMLHttpRequest = undefined as unknown as typeof XMLHttpRequest;
			await expect(request("file:///x.txt", "text")).rejects.toThrow(/XMLHttpRequest is unavailable/i);
		});

		it("should reject immediately if the signal is already aborted", async () => {
			const controller = new AbortController();
			controller.abort();
			installFakeXhr({ status: 0, responseText: "hi" });
			await expect(
				request("file:///x.txt", "text", false, undefined, controller.signal)
			).rejects.toMatchObject({ name: "AbortError" });
		});

		it("should reject with AbortError when aborted mid-request, not resolve status 0", async () => {
			const controller = new AbortController();
			// autoRespond: false keeps the request pending until we abort — abort()
			// then fires readystatechange (status 0) before abort, so this asserts
			// onabort wins the race instead of resolving an empty body.
			installFakeXhr({ status: 0, responseText: "partial", autoRespond: false });
			const promise = request("file:///slow.xhtml", "text", false, undefined, controller.signal);
			controller.abort();
			await expect(promise).rejects.toMatchObject({ name: "AbortError" });
		});
	});
});
