// Default jsdom environment: a namespace-aware parser (like the browser), so
// the "dc:" prefix lives off localName. This pins that the namespace-blind
// fallback in findUniqueIdentifier does not loosen the strict browser path.
import { describe, it, expect } from "vitest";
import Packaging from "../src/packaging";

function findUid(opf: string): string {
	const doc = new DOMParser().parseFromString(opf, "text/xml");
	return new Packaging().findUniqueIdentifier(doc as unknown as Document);
}

describe("findUniqueIdentifier (namespace-aware parser)", () => {
	it("resolves a dc:identifier in the real Dublin Core namespace", () => {
		expect(findUid(
			`<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" unique-identifier="uid">
				<metadata><dc:identifier id="uid">urn:uuid:real</dc:identifier></metadata>
			</package>`
		)).toBe("urn:uuid:real");
	});

	it("rejects a dc:-prefixed identifier bound to a non-DC namespace", () => {
		expect(findUid(
			`<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://example.com/not-dc" unique-identifier="uid">
				<metadata><dc:identifier id="uid">should-be-ignored</dc:identifier></metadata>
			</package>`
		)).toBe("");
	});
});
