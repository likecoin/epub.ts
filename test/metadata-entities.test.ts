// @vitest-environment node
// The Node entry installs linkedom's DOMParser, which represents an entity
// reference as its own child node — splitting "A &amp; B" into three children.
// Reading only childNodes[0] truncated metadata at the first entity; these tests
// pin the textContent-based extraction that decodes the whole value.
import { describe, it, expect } from "vitest";
import { Packaging } from "../src/node";

const OPF = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" version="3.0" unique-identifier="pub-id">
  <metadata>
    <dc:title>Bookshops &amp; Bonedust</dc:title>
    <dc:creator>Travis Baldree&#x2019;s Legends &amp; Lattes</dc:creator>
    <dc:identifier id="pub-id">urn:uuid:abc</dc:identifier>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">2026-01-02T00:00:00Z &amp; later</meta>
  </metadata>
  <manifest>
    <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="ch1"/>
  </spine>
</package>`;

describe("Metadata entity references (linkedom)", () => {
	const doc = new DOMParser().parseFromString(OPF, "text/xml");
	const packaging = new Packaging(doc as unknown as Document);

	it("does not truncate a dc: element at a '&' entity", () => {
		expect(packaging.metadata.title).toBe("Bookshops & Bonedust");
	});

	it("decodes numeric and named entities in the same value", () => {
		expect(packaging.metadata.creator).toBe("Travis Baldree’s Legends & Lattes");
	});

	it("does not truncate a <meta property> value at an entity", () => {
		expect(packaging.metadata.modified_date).toBe("2026-01-02T00:00:00Z & later");
	});
});
