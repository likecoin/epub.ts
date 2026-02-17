import { describe, it, expect } from "vitest";
import Container from "../src/container";
import { parseXML } from "./helpers";

describe("Container", () => {

	it("should parse standard container.xml", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
		const container = new Container(parseXML(xml));
		expect(container.packagePath).toBe("OPS/package.opf");
		expect(container.directory).toBe("OPS");
	});

	it("should parse nested OEBPS path", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
		const container = new Container(parseXML(xml));
		expect(container.packagePath).toBe("OEBPS/content.opf");
		expect(container.directory).toBe("OEBPS");
	});

	it("should handle root-level OPF", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
		const container = new Container(parseXML(xml));
		expect(container.packagePath).toBe("package.opf");
		expect(container.directory).toBe(".");
	});

	it("should pick first rootfile when multiple exist", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/>
    <rootfile full-path="OPS/alt.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
		const container = new Container(parseXML(xml));
		expect(container.packagePath).toBe("OPS/package.opf");
	});

	it("should throw 'Container File Not Found' when no document", () => {
		expect(() => {
			const container = new Container();
			container.parse(null as unknown as Document);
		}).toThrow("Container File Not Found");
	});

	it("should throw 'No RootFile Found' when rootfile is missing", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles></rootfiles>
</container>`;
		expect(() => new Container(parseXML(xml))).toThrow("No RootFile Found");
	});

	it("should create empty container without argument", () => {
		const container = new Container();
		expect(container.packagePath).toBe("");
		expect(container.directory).toBe("");
	});

	it("should clear fields on destroy", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
		const container = new Container(parseXML(xml));
		container.destroy();
		expect(container.packagePath).toBeUndefined();
		expect(container.directory).toBeUndefined();
		expect(container.encoding).toBeUndefined();
	});
});
