import { describe, it, expect } from "vitest";
import Section from "../src/section";
import { handleResponse, mediaTypeToRequestType, isKnownRequestType } from "../src/utils/core";
import type { SpineItem } from "../src/types";

function makeSection(href: string, mediaType?: string): Section {
	const item = {
		idref: "id", linear: "yes", properties: [], index: 0,
		href, url: href, canonical: "", cfiBase: "",
		mediaType, next: (): undefined => undefined, prev: (): undefined => undefined,
	} as unknown as SpineItem;
	return new Section(item);
}

// A request that parses its argument exactly like the real request layer does,
// so we exercise the type token Section.load() actually chooses.
const requestReturning = (body: string) =>
	(_url: string, type?: string): Promise<unknown> => Promise.resolve(handleResponse(body, type));

const XHTML = `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body><p id="c">hi</p></body></html>`;
// Invalid XML (bare "&", unclosed <br>) but valid, lenient HTML.
const LOOSE_HTML = `<html><body><p id="c">A & B<br></p></body></html>`;

describe("mediaTypeToRequestType", () => {
	it("maps document media-types to parse tokens", () => {
		expect(mediaTypeToRequestType("application/xhtml+xml")).toBe("xhtml");
		expect(mediaTypeToRequestType("text/html")).toBe("html");
		expect(mediaTypeToRequestType("application/x-dtbncx+xml")).toBe("xml");
		expect(mediaTypeToRequestType("application/oebps-package+xml")).toBe("xml");
		expect(mediaTypeToRequestType("text/html; charset=utf-8")).toBe("html");
		expect(mediaTypeToRequestType("image/png")).toBeUndefined();
		expect(mediaTypeToRequestType(undefined)).toBeUndefined();
	});

	it("recognizes known extension tokens", () => {
		expect(isKnownRequestType("xhtml")).toBe(true);
		expect(isKnownRequestType("html")).toBe(true);
		expect(isKnownRequestType("html_split_001")).toBe(false);
		expect(isKnownRequestType(undefined)).toBe(false);
	});
});

describe("Section.load resource typing", () => {
	it("parses an extensionless resource by its manifest media-type", async () => {
		const section = makeSection("chapter.html_split_001", "application/xhtml+xml");
		const el = await section.load(requestReturning(XHTML));
		expect(el.nodeType).toBe(1);
		expect(el.querySelector("#c")?.textContent).toBe("hi");
	});

	it("still fails (raw string) for an unknown extension with no media-type", async () => {
		const section = makeSection("chapter.html_split_001");
		const el = await section.load(requestReturning(XHTML));
		expect(el).toBeUndefined();
	});

	it("prefers a known extension over the media-type (lenient html parse preserved)", async () => {
		const section = makeSection("chapter.html", "application/xhtml+xml");
		const el = await section.load(requestReturning(LOOSE_HTML));
		expect(el.querySelector("parsererror")).toBeNull();
		expect(el.querySelector("#c")?.textContent).toContain("A & B");
	});
});
