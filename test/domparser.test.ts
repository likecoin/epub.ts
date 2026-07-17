import { describe, it, expect, afterEach } from "vitest";
import { parse, setDOMParser } from "../src/utils/core";

describe("setDOMParser", () => {
	afterEach(() => {
		// Reset process-global parser state so other tests use the environment default
		setDOMParser(undefined);
	});

	it("routes parse() through an injected DOMParser", () => {
		let called = false;
		class FakeParser {
			parseFromString(markup: string, mime: string): Document {
				called = true;
				return new DOMParser().parseFromString(markup, mime as DOMParserSupportedType);
			}
		}

		setDOMParser(FakeParser as unknown as Parameters<typeof setDOMParser>[0]);

		const doc = parse("<html><body><p>hi</p></body></html>", "text/html");

		expect(called).toBe(true);
		expect(doc.querySelector("p")?.textContent).toBe("hi");
	});

	it("falls back to the global DOMParser once cleared", () => {
		let called = false;
		class FakeParser {
			parseFromString(markup: string, mime: string): Document {
				called = true;
				return new DOMParser().parseFromString(markup, mime as DOMParserSupportedType);
			}
		}

		setDOMParser(FakeParser as unknown as Parameters<typeof setDOMParser>[0]);
		setDOMParser(undefined);

		const doc = parse("<html><body><p>bye</p></body></html>", "text/html");

		expect(called).toBe(false);
		expect(doc.querySelector("p")?.textContent).toBe("bye");
	});
});
