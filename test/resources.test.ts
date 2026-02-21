import { describe, it, expect, vi } from "vitest";
import Resources from "../src/resources";
import type { PackagingManifestObject, RequestFunction } from "../src/types";
import type Archive from "../src/archive";

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
			expect(relatives).toEqual(["../style.css", "../cover.jpg", "../font.woff"]);
		});

		it("should accept an explicit resolver argument", () => {
			const res = createResources();
			const resolver = (href: string) => "/content/" + href;
			const relatives = res.relativeTo("/content/text/ch1.xhtml", resolver);
			expect(relatives).toEqual(["../style.css", "../cover.jpg", "../font.woff"]);
		});
	});

	describe("get()", () => {
		it("should return undefined for path not in urls", () => {
			const res = createResources();
			expect(res.get("nonexistent.png")).toBeUndefined();
		});

		it("should return replacement URL when replacementUrls populated", async () => {
			const res = createResources();
			res.replacementUrls = res.urls!.map(u => "blob:" + u);
			const result = await res.get("cover.jpg");
			expect(result).toBe("blob:cover.jpg");
		});

		it("should fall back to createUrl when no replacementUrls", async () => {
			const request = vi.fn(() => Promise.resolve(new Blob(["test"]))) as unknown as RequestFunction;
			const resolver = (href: string) => href;
			const res = new Resources(manifest, { replacements: "blobUrl", request, resolver });
			res.replacementUrls = [];

			const result = await res.get("cover.jpg");
			expect(typeof result).toBe("string");
			// createUrl was invoked via the request mock
			expect(request).toHaveBeenCalled();
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

		it("should use relativeTo when url argument is provided", () => {
			const resolver = (href: string) => "/OPS/" + href;
			const res = new Resources(manifest, { resolver });
			res.replacementUrls = res.urls!.map(u => "blob:" + u);
			const content = '<link href="../style.css"/><img src="../cover.jpg"/>';
			const result = res.substitute(content, "/OPS/chapters/ch1.xhtml");
			expect(result).toContain("blob:style.css");
			expect(result).toContain("blob:cover.jpg");
		});
	});

	describe("replacements()", () => {
		it("should return urls as-is when mode is 'none'", async () => {
			const res = new Resources(manifest, { replacements: "none" });
			const result = await res.replacements();
			expect(result).toEqual(["style.css", "cover.jpg", "font.woff"]);
		});

		it("should populate replacementUrls with blob URLs in blobUrl mode", async () => {
			const request = vi.fn(() => Promise.resolve(new Blob(["data"]))) as unknown as RequestFunction;
			const resolver = (href: string) => "/resolved/" + href;
			const res = new Resources(manifest, { replacements: "blobUrl", request, resolver });

			const result = await res.replacements();
			expect(result.length).toBe(3);
			result.forEach((url) => {
				expect(typeof url).toBe("string");
				expect(url).toMatch(/^blob:/);
			});
			expect(res.replacementUrls.length).toBe(3);
		});

		it("should populate replacementUrls with data URLs in base64 mode", async () => {
			const request = vi.fn(() => Promise.resolve(new Blob(["data"]))) as unknown as RequestFunction;
			const resolver = (href: string) => "/resolved/" + href;
			const res = new Resources(manifest, { replacements: "base64", request, resolver });

			const result = await res.replacements();
			expect(result.length).toBe(3);
			result.forEach((url) => {
				expect(typeof url).toBe("string");
				expect(url).toMatch(/^data:/);
			});
			expect(res.replacementUrls.length).toBe(3);
		});

		it("should filter out null and log errors on request failure", async () => {
			const error = new Error("fetch failed");
			const request = vi.fn(() => Promise.reject(error)) as unknown as RequestFunction;
			const resolver = (href: string) => "/resolved/" + href;
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
			const res = new Resources(manifest, { replacements: "blobUrl", request, resolver });

			const result = await res.replacements();
			expect(errorSpy).toHaveBeenCalled();
			// null entries are filtered from replacementUrls
			expect(res.replacementUrls.length).toBe(0);
			errorSpy.mockRestore();
		});
	});

	describe("createUrl()", () => {
		it("should delegate to archive.createUrl when archive is set", async () => {
			const archive = {
				createUrl: vi.fn(() => Promise.resolve("blob:archive-url")),
			} as unknown as Archive;
			const res = new Resources(manifest, { archive, replacements: "blobUrl" });

			const result = await res.createUrl("cover.jpg");
			expect(archive.createUrl).toHaveBeenCalledWith("cover.jpg", { "base64": false });
			expect(result).toBe("blob:archive-url");
		});

		it("should delegate to archive with base64 flag when replacements is base64", async () => {
			const archive = {
				createUrl: vi.fn(() => Promise.resolve("data:archive-url")),
			} as unknown as Archive;
			const res = new Resources(manifest, { archive, replacements: "base64" });

			const result = await res.createUrl("cover.jpg");
			expect(archive.createUrl).toHaveBeenCalledWith("cover.jpg", { "base64": true });
			expect(result).toBe("data:archive-url");
		});

		it("should create blob URL with request when no archive (blobUrl mode)", async () => {
			const request = vi.fn(() => Promise.resolve(new Blob(["img-data"]))) as unknown as RequestFunction;
			const res = new Resources(manifest, { replacements: "blobUrl", request });

			const result = await res.createUrl("cover.jpg");
			expect(request).toHaveBeenCalledWith("cover.jpg", "blob");
			expect(typeof result).toBe("string");
			expect(result).toMatch(/^blob:/);
		});

		it("should create data URL with request when no archive (base64 mode)", async () => {
			const request = vi.fn(() => Promise.resolve(new Blob(["img-data"]))) as unknown as RequestFunction;
			const res = new Resources(manifest, { replacements: "base64", request });

			const result = await res.createUrl("cover.jpg");
			expect(request).toHaveBeenCalledWith("cover.jpg", "blob");
			expect(typeof result).toBe("string");
			expect(result).toMatch(/^data:/);
		});
	});

	describe("createCssFile()", () => {
		it("should return void for absolute paths", async () => {
			const res = createResources();
			const result = await res.createCssFile("/absolute/path/style.css");
			expect(result).toBeUndefined();
		});

		it("should fetch CSS text and substitute URLs", async () => {
			const cssText = 'body { background: url("cover.jpg"); }';
			const request = vi.fn(() => Promise.resolve(cssText)) as unknown as RequestFunction;
			const resolver = (href: string) => "/OPS/" + href;
			const res = new Resources(manifest, { replacements: "blobUrl", request, resolver });
			res.replacementUrls = res.urls!.map(u => "replaced-" + u);

			const result = await res.createCssFile("style.css");
			expect(typeof result).toBe("string");
			expect(request).toHaveBeenCalledWith("/OPS/style.css", "text");
		});
	});

	describe("replaceCss()", () => {
		it("should process each cssUrl and update replacementUrls at correct index", async () => {
			const cssText = "body { color: red; }";
			const request = vi.fn(() => Promise.resolve(cssText)) as unknown as RequestFunction;
			const resolver = (href: string) => "/OPS/" + href;
			const res = new Resources(manifest, { replacements: "blobUrl", request, resolver });
			res.replacementUrls = res.urls!.map(u => "blob:" + u);

			const cssIndex = res.urls!.indexOf("style.css");
			const originalCssReplacement = res.replacementUrls[cssIndex];
			await res.replaceCss();

			// replaceCss creates a new blob URL for the css, replacing the original
			expect(res.replacementUrls[cssIndex]).not.toBe(originalCssReplacement);
			expect(res.replacementUrls[cssIndex]).toMatch(/^blob:/);
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
