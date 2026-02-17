import { describe, it, expect } from "vitest";
import DisplayOptions from "../src/displayoptions";
import { parseXML } from "./helpers";

describe("DisplayOptions", () => {

	it("should parse all four fields", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<display_options>
  <platform name="*">
    <option name="interactive">true</option>
    <option name="fixed-layout">true</option>
    <option name="open-to-spread">false</option>
    <option name="orientation-lock">landscape-only</option>
  </platform>
</display_options>`;
		const opts = new DisplayOptions(parseXML(xml));
		expect(opts.interactive).toBe("true");
		expect(opts.fixedLayout).toBe("true");
		expect(opts.openToSpread).toBe("false");
		expect(opts.orientationLock).toBe("landscape-only");
	});

	it("should handle partial options", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<display_options>
  <platform name="*">
    <option name="fixed-layout">true</option>
  </platform>
</display_options>`;
		const opts = new DisplayOptions(parseXML(xml));
		expect(opts.fixedLayout).toBe("true");
		expect(opts.interactive).toBe("");
		expect(opts.openToSpread).toBe("");
		expect(opts.orientationLock).toBe("");
	});

	it("should handle missing display_options node", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?><root></root>`;
		const opts = new DisplayOptions(parseXML(xml));
		expect(opts.interactive).toBe("");
		expect(opts.fixedLayout).toBe("");
	});

	it("should handle no document argument", () => {
		const opts = new DisplayOptions();
		expect(opts.interactive).toBe("");
		expect(opts.fixedLayout).toBe("");
		expect(opts.openToSpread).toBe("");
		expect(opts.orientationLock).toBe("");
	});

	it("should return self from parse()", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<display_options>
  <platform name="*">
    <option name="interactive">true</option>
  </platform>
</display_options>`;
		const opts = new DisplayOptions();
		const result = opts.parse(parseXML(xml));
		expect(result).toBe(opts);
	});

	it("should return self when parse called with falsy", () => {
		const opts = new DisplayOptions();
		const result = opts.parse(null as unknown as Document);
		expect(result).toBe(opts);
	});

	it("should handle empty option elements", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<display_options>
  <platform name="*">
    <option name="fixed-layout"></option>
  </platform>
</display_options>`;
		const opts = new DisplayOptions(parseXML(xml));
		expect(opts.fixedLayout).toBe("");
	});

	it("should clear fields on destroy", () => {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<display_options>
  <platform name="*">
    <option name="interactive">true</option>
    <option name="fixed-layout">true</option>
    <option name="open-to-spread">true</option>
    <option name="orientation-lock">portrait-only</option>
  </platform>
</display_options>`;
		const opts = new DisplayOptions(parseXML(xml));
		opts.destroy();
		expect(opts.interactive).toBeUndefined();
		expect(opts.fixedLayout).toBeUndefined();
		expect(opts.openToSpread).toBeUndefined();
		expect(opts.orientationLock).toBeUndefined();
	});
});
