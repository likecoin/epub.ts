import { describe, it, expect } from "vitest";
import Resources from "../src/resources";
import type { PackagingManifestObject } from "../src/types";

const manifest: PackagingManifestObject = {
	"ch1": { href: "ch1.xhtml", type: "application/xhtml+xml", overlay: "", properties: [], fallback: "" },
	"ch2": { href: "ch2.xhtml", type: "text/html", overlay: "", properties: [], fallback: "" },
	"style": { href: "style.css", type: "text/css", overlay: "", properties: [], fallback: "" },
	"cover": { href: "cover.jpg", type: "image/jpeg", overlay: "", properties: [], fallback: "" },
	"font": { href: "font.woff", type: "font/woff", overlay: "", properties: [], fallback: "" },
};

function createResources(m?: PackagingManifestObject): Resources {
	return new Resources(m ?? manifest);
}

describe("Resources", () => {
	describe("constructor + process()", () => {
		const res = createResources();

		it("should populate html with only xhtml+xml and text/html items", () => {
			expect(res.html!.length).toBe(2);
			const hrefs = res.html!.map(i => i.href);
			expect(hrefs).toContain("ch1.xhtml");
			expect(hrefs).toContain("ch2.xhtml");
		});

		it("should populate assets with everything except html", () => {
			expect(res.assets!.length).toBe(3);
			const hrefs = res.assets!.map(i => i.href);
			expect(hrefs).toContain("style.css");
			expect(hrefs).toContain("cover.jpg");
			expect(hrefs).toContain("font.woff");
		});

		it("should populate css with only text/css items", () => {
			expect(res.css!.length).toBe(1);
			expect(res.css![0]!.href).toBe("style.css");
		});
	});

	describe("splitUrls()", () => {
		const res = createResources();

		it("should set urls to asset hrefs", () => {
			expect(res.urls).toContain("cover.jpg");
			expect(res.urls).toContain("font.woff");
			expect(res.urls).toContain("style.css");
		});

		it("should not include html hrefs in urls", () => {
			expect(res.urls).not.toContain("ch1.xhtml");
			expect(res.urls).not.toContain("ch2.xhtml");
		});

		it("should set cssUrls to only style.css", () => {
			expect(res.cssUrls).toEqual(["style.css"]);
		});
	});

	describe("relativeTo()", () => {
		it("should resolve asset hrefs relative to a section path", () => {
			const resolver = (href: string) => "/OPS/" + href;
			const res = new Resources(manifest, { resolver });
			const relatives = res.relativeTo("/OPS/chapters/ch1.xhtml");
			expect(relatives.length).toBe(res.urls!.length);
			relatives.forEach(rel => {
				expect(rel).toBeDefined();
				expect(typeof rel).toBe("string");
			});
		});
	});

	describe("get()", () => {
		const res = createResources();

		it("should return undefined for path not in urls", () => {
			expect(res.get("nonexistent.png")).toBeUndefined();
		});
	});

	describe("substitute()", () => {
		it("should replace asset URLs in content string with replacement URLs", () => {
			const res = createResources();
			res.replacementUrls = res.urls!.map(u => "blob:" + u);
			const content = '<link href="style.css"/><img src="cover.jpg"/>';
			const result = res.substitute(content);
			expect(result).toContain("blob:style.css");
			expect(result).toContain("blob:cover.jpg");
			expect(result).not.toContain('"style.css"');
			expect(result).not.toContain('"cover.jpg"');
		});
	});

	describe("destroy()", () => {
		it("should set all properties to undefined", () => {
			const res = createResources();
			res.destroy();
			expect(res.settings).toBeUndefined();
			expect(res.manifest).toBeUndefined();
			expect(res.resources).toBeUndefined();
			expect(res.replacementUrls).toBeUndefined();
			expect(res.html).toBeUndefined();
			expect(res.assets).toBeUndefined();
			expect(res.css).toBeUndefined();
			expect(res.urls).toBeUndefined();
			expect(res.cssUrls).toBeUndefined();
		});
	});
});
