import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import Contents from "../src/contents";

beforeAll(() => {
	if (!Range.prototype.getBoundingClientRect) {
		Range.prototype.getBoundingClientRect = function () {
			return { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0, toJSON: () => ({}) } as DOMRect;
		};
	}
});

function createContents(bodyHtml?: string): { contents: Contents; container: HTMLElement } {
	const container = document.createElement("div");
	if (bodyHtml) {
		container.innerHTML = bodyHtml;
	}
	document.body.appendChild(container);
	const contents = new Contents(document, container, "epubcfi(/6/2!)", 0);
	return { contents, container };
}

describe("Contents", () => {

	afterEach(() => {
		// Clean up any appended elements
		const containers = document.querySelectorAll("div");
		containers.forEach(el => {
			if (el.parentNode === document.body) {
				document.body.removeChild(el);
			}
		});
	});

	describe("constructor", () => {
		it("should set document, content, cfiBase, sectionIndex", () => {
			const { contents, container } = createContents();
			expect(contents.document).toBe(document);
			expect(contents.content).toBe(container);
			expect(contents.cfiBase).toBe("epubcfi(/6/2!)");
			expect(contents.sectionIndex).toBe(0);
		});

		it("should default sectionIndex to 0", () => {
			const container = document.createElement("div");
			document.body.appendChild(container);
			const contents = new Contents(document, container);
			expect(contents.sectionIndex).toBe(0);
			expect(contents.cfiBase).toBe("");
		});

		it("should set active to true and called to 0", () => {
			const { contents } = createContents();
			expect(contents.active).toBe(true);
			expect(contents.called).toBe(0);
		});

		it("should set the window from document.defaultView", () => {
			const { contents } = createContents();
			expect(contents.window).toBe(window);
		});
	});

	describe("width()", () => {
		it("should set width in px when given a number", () => {
			const { contents, container } = createContents();
			contents.width(300);
			expect(container.style.width).toBe("300px");
		});

		it("should set width as string directly", () => {
			const { contents, container } = createContents();
			contents.width("50%");
			expect(container.style.width).toBe("50%");
		});

		it("should return computed width as number", () => {
			const { contents } = createContents();
			const w = contents.width();
			expect(typeof w).toBe("number");
		});
	});

	describe("height()", () => {
		it("should set height in px when given a number", () => {
			const { contents, container } = createContents();
			contents.height(400);
			expect(container.style.height).toBe("400px");
		});

		it("should return computed height as number", () => {
			const { contents } = createContents();
			const h = contents.height();
			expect(typeof h).toBe("number");
		});
	});

	describe("contentWidth() / contentHeight()", () => {
		it("should set and get content width", () => {
			const { contents, container } = createContents();
			contents.contentWidth(500);
			expect(container.style.width).toBe("500px");
			const w = contents.contentWidth();
			expect(typeof w).toBe("number");
		});

		it("should set and get content height", () => {
			const { contents, container } = createContents();
			contents.contentHeight(700);
			expect(container.style.height).toBe("700px");
			const h = contents.contentHeight();
			expect(typeof h).toBe("number");
		});
	});

	describe("scrollWidth() / scrollHeight()", () => {
		it("should return documentElement scrollWidth", () => {
			const { contents } = createContents();
			const sw = contents.scrollWidth();
			expect(typeof sw).toBe("number");
		});

		it("should return documentElement scrollHeight", () => {
			const { contents } = createContents();
			const sh = contents.scrollHeight();
			expect(typeof sh).toBe("number");
		});
	});

	describe("overflow() / overflowX() / overflowY()", () => {
		it("should set and return overflow on documentElement", () => {
			const { contents } = createContents();
			contents.overflow("hidden");
			expect(contents.documentElement.style.overflow).toBe("hidden");
		});

		it("should set and return overflowX", () => {
			const { contents } = createContents();
			contents.overflowX("scroll");
			expect(contents.documentElement.style.overflowX).toBe("scroll");
		});

		it("should set and return overflowY", () => {
			const { contents } = createContents();
			contents.overflowY("auto");
			expect(contents.documentElement.style.overflowY).toBe("auto");
		});
	});

	describe("css()", () => {
		it("should set a CSS property on content element", () => {
			const { contents, container } = createContents();
			contents.css("color", "red");
			expect(container.style.getPropertyValue("color")).toBe("red");
		});

		it("should set with important priority", () => {
			const { contents, container } = createContents();
			contents.css("color", "blue", true);
			expect(container.style.getPropertyPriority("color")).toBe("important");
		});

		it("should remove property when value is not provided", () => {
			const { contents, container } = createContents();
			contents.css("color", "red");
			contents.css("color");
			expect(container.style.getPropertyValue("color")).toBe("");
		});
	});

	describe("viewport()", () => {
		it("should return viewport settings", () => {
			const { contents } = createContents();
			const vp = contents.viewport();
			expect(vp).toHaveProperty("width");
			expect(vp).toHaveProperty("height");
		});

		it("should create meta viewport tag when setting options", () => {
			const { contents } = createContents();
			contents.viewport({ width: 1024, height: 768 });
			const meta = document.querySelector("meta[name='viewport']");
			expect(meta).not.toBeNull();
			const contentAttr = meta!.getAttribute("content")!;
			expect(contentAttr).toContain("width=1024");
			expect(contentAttr).toContain("height=768");
			// cleanup
			meta!.remove();
		});

		it("should update existing meta viewport tag", () => {
			const { contents } = createContents();
			contents.viewport({ width: 800 });
			contents.viewport({ width: 1024 });
			const metas = document.querySelectorAll("meta[name='viewport']");
			expect(metas.length).toBe(1);
			// cleanup
			metas[0]!.remove();
		});
	});

	describe("addClass() / removeClass()", () => {
		it("should add class to content element", () => {
			const { contents, container } = createContents();
			contents.addClass("test-class");
			expect(container.classList.contains("test-class")).toBe(true);
		});

		it("should remove class from content element", () => {
			const { contents, container } = createContents();
			contents.addClass("test-class");
			contents.removeClass("test-class");
			expect(container.classList.contains("test-class")).toBe(false);
		});
	});

	describe("addStylesheet()", () => {
		it("should append a link element to document head", async () => {
			const { contents } = createContents();
			const promise = contents.addStylesheet("http://example.com/style.css");
			const link = document.querySelector("link[href='http://example.com/style.css']");
			expect(link).not.toBeNull();
			expect(link!.getAttribute("rel")).toBe("stylesheet");
			// cleanup
			link!.remove();
		});

		it("should not add duplicate link element", () => {
			const { contents } = createContents();
			// Manually create the link to simulate it already existing
			const link = document.createElement("link");
			link.setAttribute("type", "text/css");
			link.setAttribute("rel", "stylesheet");
			link.setAttribute("href", "http://example.com/dup.css");
			document.head.appendChild(link);

			// Second call should detect existing link
			const promise = contents.addStylesheet("http://example.com/dup.css");
			expect(promise).toBeInstanceOf(Promise);
			// cleanup
			document.querySelectorAll("link[href='http://example.com/dup.css']").forEach(el => el.remove());
		});
	});

	describe("addStylesheetCss()", () => {
		it("should create a style element with textContent", () => {
			const { contents } = createContents();
			const result = contents.addStylesheetCss("body { color: red; }", "test-key");
			expect(result).toBe(true);
			const styleEl = document.getElementById("epubjs-inserted-css-test-key");
			expect(styleEl).not.toBeNull();
			expect(styleEl!.textContent).toBe("body { color: red; }");
			styleEl!.remove();
		});

		it("should replace CSS on same key", () => {
			const { contents } = createContents();
			contents.addStylesheetCss("body { color: red; }", "replace-key");
			contents.addStylesheetCss("body { color: blue; }", "replace-key");
			const styleEl = document.getElementById("epubjs-inserted-css-replace-key");
			expect(styleEl!.textContent).toBe("body { color: blue; }");
			styleEl!.remove();
		});

		it("should return false when serializedCss is empty", () => {
			const { contents } = createContents();
			expect(contents.addStylesheetCss("")).toBe(false);
		});
	});

	describe("addStylesheetRules()", () => {
		it("should insert CSS rules from object format", () => {
			const { contents } = createContents();
			contents.addStylesheetRules({
				"body": { "color": "green", "font-size": "14px" }
			}, "rules-key");
			const styleEl = document.getElementById("epubjs-inserted-css-rules-key") as HTMLStyleElement;
			expect(styleEl).not.toBeNull();
			expect(styleEl.sheet!.cssRules.length).toBeGreaterThan(0);
			styleEl.remove();
		});

		it("should handle array format rules", () => {
			const { contents } = createContents();
			contents.addStylesheetRules([
				["p", ["color", "red"]],
			], "arr-key");
			const styleEl = document.getElementById("epubjs-inserted-css-arr-key") as HTMLStyleElement;
			expect(styleEl).not.toBeNull();
			expect(styleEl.sheet!.cssRules.length).toBeGreaterThan(0);
			styleEl.remove();
		});

		it("should no-op with empty array", () => {
			const { contents } = createContents();
			expect(() => contents.addStylesheetRules([])).not.toThrow();
		});
	});

	describe("addScript()", () => {
		it("should create a script element in document head", async () => {
			const { contents } = createContents();
			contents.addScript("http://example.com/script.js");
			const script = document.querySelector("script[src='http://example.com/script.js']");
			expect(script).not.toBeNull();
			expect(script!.getAttribute("type")).toBe("text/javascript");
			script!.remove();
		});
	});

	describe("direction()", () => {
		it("should set direction on documentElement", () => {
			const { contents } = createContents();
			contents.direction("rtl");
			expect(contents.documentElement.style.direction).toBe("rtl");
		});
	});

	describe("writingMode()", () => {
		it("should return a string", () => {
			const { contents } = createContents();
			const wm = contents.writingMode();
			expect(typeof wm).toBe("string");
		});
	});

	describe("layoutStyle()", () => {
		it("should return default paginated when no style set", () => {
			const { contents } = createContents();
			expect(contents.layoutStyle()).toBe("paginated");
		});

		it("should set and return layoutStyle", () => {
			const { contents } = createContents();
			contents.layoutStyle("scrolling");
			expect(contents.layoutStyle()).toBe("scrolling");
		});

		it("should update navigator.epubReadingSystem.layoutStyle", () => {
			const { contents } = createContents();
			contents.layoutStyle("scrolling");
			expect(navigator.epubReadingSystem!.layoutStyle).toBe("scrolling");
		});
	});

	describe("event listeners", () => {
		it("should emit DOM events through triggerEvent", () => {
			const { contents } = createContents();
			const handler = vi.fn();
			contents.on("click", handler);
			const event = new MouseEvent("click", { bubbles: true });
			contents.document.dispatchEvent(event);
			expect(handler).toHaveBeenCalled();
		});
	});

	describe("destroy()", () => {
		it("should remove listeners and clear __listeners", () => {
			const { contents } = createContents();
			contents.destroy();
			expect(contents.__listeners).toEqual({});
		});

		it("should clear _triggerEvent", () => {
			const { contents } = createContents();
			contents.destroy();
			expect(contents._triggerEvent).toBeUndefined();
		});
	});
});
