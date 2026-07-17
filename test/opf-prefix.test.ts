// @vitest-environment node
// Importing the Node entry installs linkedom's DOMParser, which has no XML
// namespace support — the exact parser that fails on prefixed OPF elements.
import { describe, it, expect } from "vitest";
import { Packaging } from "../src/node";

const PREFIXED_OPF = `<?xml version="1.0" encoding="utf-8"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" version="2.0" unique-identifier="pub-id">
  <opf:metadata>
    <dc:title>Legacy Prefixed Book</dc:title>
    <dc:creator>Ada Lovelace</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="pub-id">urn:uuid:prefixed-123</dc:identifier>
    <meta name="cover" content="cover-img"/>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="cover-img" href="cover.png" media-type="image/png" properties="cover-image"/>
    <opf:item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
    <opf:item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </opf:manifest>
  <opf:spine toc="ncx">
    <opf:itemref idref="ch1"/>
  </opf:spine>
</opf:package>`;

describe("Legacy opf: element prefixes (linkedom compatibility)", () => {
	const doc = new DOMParser().parseFromString(PREFIXED_OPF, "text/xml");
	const packaging = new Packaging(doc as unknown as Document);

	it("parses metadata from prefixed <opf:metadata> without throwing", () => {
		expect(packaging.metadata.title).toBe("Legacy Prefixed Book");
		expect(packaging.metadata.creator).toBe("Ada Lovelace");
		expect(packaging.metadata.language).toBe("en");
	});

	it("parses the manifest from prefixed <opf:item> elements", () => {
		expect(Object.keys(packaging.manifest)).toEqual(["cover-img", "ch1", "ncx"]);
		expect(packaging.manifest["ch1"]!.href).toBe("ch1.xhtml");
	});

	it("parses the spine from prefixed <opf:itemref> elements", () => {
		expect(packaging.spine.length).toBe(1);
		expect(packaging.spine[0]!.idref).toBe("ch1");
	});

	it("resolves cover and ncx paths from prefixed items", () => {
		expect(packaging.coverPath).toBe("cover.png");
		expect(packaging.ncxPath).toBe("toc.ncx");
	});

	it("resolves the unique identifier from a prefixed dc:identifier", () => {
		expect(packaging.uniqueIdentifier).toBe("urn:uuid:prefixed-123");
	});
});
