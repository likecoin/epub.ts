import { describe, it, expect } from "vitest";
import mime from "../src/utils/mime";

describe("mime", () => {
	describe("lookup()", () => {
		it("should return application/xhtml+xml for .xhtml", () => {
			expect(mime.lookup("chapter.xhtml")).toBe("application/xhtml+xml");
		});

		it("should return application/xhtml+xml for .xht", () => {
			expect(mime.lookup("file.xht")).toBe("application/xhtml+xml");
		});

		it("should return text/html for .html", () => {
			expect(mime.lookup("index.html")).toBe("text/html");
		});

		it("should return text/html for .htm", () => {
			expect(mime.lookup("index.htm")).toBe("text/html");
		});

		it("should return text/css for .css", () => {
			expect(mime.lookup("style.css")).toBe("text/css");
		});

		it("should return image/jpeg for .jpg", () => {
			expect(mime.lookup("cover.jpg")).toBe("image/jpeg");
		});

		it("should return image/jpeg for .jpeg", () => {
			expect(mime.lookup("cover.jpeg")).toBe("image/jpeg");
		});

		it("should return image/png for .png", () => {
			expect(mime.lookup("image.png")).toBe("image/png");
		});

		it("should return image/gif for .gif", () => {
			expect(mime.lookup("anim.gif")).toBe("image/gif");
		});

		it("should return image/svg+xml for .svg", () => {
			expect(mime.lookup("icon.svg")).toBe("image/svg+xml");
		});

		it("should return application/xml for .xml", () => {
			expect(mime.lookup("data.xml")).toBe("application/xml");
		});

		it("should return application/xml for .opf", () => {
			expect(mime.lookup("package.opf")).toBe("application/xml");
		});

		it("should return application/xml for .ncx", () => {
			expect(mime.lookup("toc.ncx")).toBe("application/xml");
		});

		it("should return application/json for .json", () => {
			expect(mime.lookup("data.json")).toBe("application/json");
		});

		it("should return application/epub+zip for .epub", () => {
			expect(mime.lookup("book.epub")).toBe("application/epub+zip");
		});

		it("should return application/x-font-woff for .woff", () => {
			expect(mime.lookup("font.woff")).toBe("application/x-font-woff");
		});

		it("should return application/x-font-otf for .otf", () => {
			expect(mime.lookup("font.otf")).toBe("application/x-font-otf");
		});

		it("should return application/x-font-ttf for .ttf", () => {
			expect(mime.lookup("font.ttf")).toBe("application/x-font-ttf");
		});

		it("should return audio/mpeg for .mp3", () => {
			expect(mime.lookup("audio.mp3")).toBe("audio/mpeg");
		});

		it("should return video/mp4 for .mp4", () => {
			expect(mime.lookup("video.mp4")).toBe("video/mp4");
		});

		it("should be case-insensitive", () => {
			expect(mime.lookup("IMAGE.PNG")).toBe("image/png");
			expect(mime.lookup("Style.CSS")).toBe("text/css");
		});

		it("should return text/plain for unknown extension", () => {
			expect(mime.lookup("file.xyz123")).toBe("text/plain");
		});

		it("should handle full paths with directories", () => {
			expect(mime.lookup("/OPS/images/cover_th.jpg")).toBe("image/jpeg");
		});

		it("should return text/plain for empty string", () => {
			expect(mime.lookup("")).toBe("text/plain");
		});
	});
});
