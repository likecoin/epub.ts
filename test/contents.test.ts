import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import Contents from "../src/contents";
import EpubCFI from "../src/epubcfi";
import { DOM_EVENTS } from "../src/utils/constants";

beforeAll(() => {
	if (!Range.prototype.getBoundingClientRect) {
		Range.prototype.getBoundingClientRect = function () {
			return { x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, bottom: 0, right: 0, toJSON: () => ({}) } as DOMRect;
		};
	}
});

const activeInstances: Contents[] = [];

function createContents(bodyHtml?: string): { contents: Contents; container: HTMLElement } {
	const container = document.createElement("div");
	if (bodyHtml) {
		container.innerHTML = bodyHtml;
	}
	document.body.appendChild(container);
	const contents = new Contents(document, container, "epubcfi(/6/2!)", 0);
	activeInstances.push(contents);
	return { contents, container };
}

describe("Contents", () => {

	afterEach(() => {
		while (activeInstances.length) {
			activeInstances.pop()!.destroy();
		}
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
			activeInstances.push(contents);
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

	describe("fit()", () => {
		afterEach(() => {
			document.querySelectorAll("meta[name='viewport']").forEach(el => el.remove());
		});

		function setViewport(content: string): void {
			const meta = document.createElement("meta");
			meta.setAttribute("name", "viewport");
			meta.setAttribute("content", content);
			document.head.appendChild(meta);
		}

		it("should scale contents when the viewport declares dimensions", () => {
			setViewport("width=1400, height=1986");
			const { contents, container } = createContents();
			expect(contents.fit(700, 993)).toBe(true);
			expect(container.style.transform).toContain("scale(0.5)");
		});

		it("should decline without a viewport meta", () => {
			const { contents, container } = createContents();
			expect(contents.fit(700, 993)).toBe(false);
			expect(container.style.transform).toBe("");
		});

		it("should decline when the viewport declares no usable dimensions", () => {
			setViewport("width=device-width, initial-scale=1");
			const { contents, container } = createContents();
			expect(contents.fit(700, 993)).toBe(false);
			expect(container.style.transform).toBe("");
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

		it("should replace the link registered under the same key", () => {
			const { contents } = createContents();
			contents.addStylesheet("http://example.com/night-v1.css", "night");
			contents.addStylesheet("http://example.com/night-v2.css", "night");

			const links = document.querySelectorAll("#epubjs-inserted-link-night");
			expect(links.length).toBe(1);
			expect(links[0]!.getAttribute("href")).toBe("http://example.com/night-v2.css");
			// The superseded stylesheet is gone, so it can't keep applying every
			// rule the new one doesn't override.
			expect(document.querySelector("link[href='http://example.com/night-v1.css']")).toBeNull();
			links[0]!.remove();
		});

		it("should still create the keyed link when another link holds the url", () => {
			const { contents } = createContents();
			// The book's own stylesheet, which we must neither adopt nor remove.
			const foreign = document.createElement("link");
			foreign.setAttribute("rel", "stylesheet");
			foreign.setAttribute("href", "http://example.com/shared.css");
			document.head.appendChild(foreign);

			contents.addStylesheet("http://example.com/shared.css", "night");
			expect(document.getElementById("epubjs-inserted-link-night")).not.toBeNull();

			// Without the keyed node above, this would stack rather than swap.
			contents.addStylesheet("http://example.com/night-v2.css", "night");
			const keyed = document.querySelectorAll("#epubjs-inserted-link-night");
			expect(keyed.length).toBe(1);
			expect(keyed[0]!.getAttribute("href")).toBe("http://example.com/night-v2.css");
			expect(document.querySelector("link[href='http://example.com/shared.css']")).toBe(foreign);

			keyed[0]!.remove();
			foreign.remove();
		});

		it("should not replace the keyed link when the url is unchanged", () => {
			const { contents } = createContents();
			contents.addStylesheet("http://example.com/same.css", "day");
			const first = document.querySelector("#epubjs-inserted-link-day");
			contents.addStylesheet("http://example.com/same.css", "day");

			expect(document.querySelectorAll("#epubjs-inserted-link-day").length).toBe(1);
			expect(document.querySelector("#epubjs-inserted-link-day")).toBe(first);
			first!.remove();
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

		it("should replace rules rather than stack them for the same key", () => {
			const { contents } = createContents();
			contents.addStylesheetRules({ "body": { "color": "green" } }, "same-key");
			const styleEl = document.getElementById("epubjs-inserted-css-same-key") as HTMLStyleElement;
			const first = styleEl.sheet!.cssRules.length;

			contents.addStylesheetRules({ "body": { "color": "red" } }, "same-key");

			expect(styleEl.sheet!.cssRules.length).toBe(first);
			expect(styleEl.sheet!.cssRules[0]!.cssText).toContain("red");
			styleEl.remove();
		});

		it("should keep rules from other callers when no key is given", () => {
			const { contents } = createContents();
			// Every keyless caller shares one node — Rendition.adjustImages()
			// writes its column-fitting rules there before any content hook runs.
			contents.addStylesheetRules({ "img": { "max-width": "100%" } });
			contents.addStylesheetRules({ "p": { "color": "red" } });

			const styleEl = document.getElementById("epubjs-inserted-css-") as HTMLStyleElement;
			const cssText = Array.from(styleEl.sheet!.cssRules).map(rule => rule.cssText).join(" ");
			expect(cssText).toContain("img");
			expect(cssText).toContain("max-width");
			expect(cssText).toContain("color: red");
			styleEl.remove();
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

		it("should detect a mode declared on the content element", () => {
			const { contents, container } = createContents();
			container.style.writingMode = "vertical-rl";
			expect(contents.writingMode()).toBe("vertical-rl");
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

	describe("textWidth()", () => {
		it("should return a number", () => {
			const { contents } = createContents("<p>Hello world</p>");
			const tw = contents.textWidth();
			expect(typeof tw).toBe("number");
		});
	});

	describe("textHeight()", () => {
		it("should return a number", () => {
			const { contents } = createContents("<p>Hello world</p>");
			const th = contents.textHeight();
			expect(typeof th).toBe("number");
		});
	});

	describe("root()", () => {
		it("should return documentElement", () => {
			const { contents } = createContents();
			expect(contents.root()).toBe(document.documentElement);
		});
	});

	describe("expand()", () => {
		it("should emit expand event", () => {
			const { contents } = createContents();
			const handler = vi.fn();
			contents.on("expand", handler);
			contents.expand();
			expect(handler).toHaveBeenCalledTimes(1);
		});
	});

	describe("resizeCheck()", () => {
		it("should emit resize event when size changes", () => {
			const { contents } = createContents();
			contents._size = { width: 100, height: 200 };
			const handler = vi.fn();
			contents.on("resize", handler);
			contents.resizeCheck();
			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith(expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) }));
		});

		it("should not emit resize when size is unchanged", () => {
			const { contents } = createContents();
			// Set _size to current text dimensions so no change is detected
			contents._size = { width: contents.textWidth(), height: contents.textHeight() };
			const handler = vi.fn();
			contents.on("resize", handler);
			contents.resizeCheck();
			expect(handler).not.toHaveBeenCalled();
		});

		it("should call onResize callback when size changes", () => {
			const { contents } = createContents();
			contents._size = { width: 999, height: 999 };
			const callback = vi.fn();
			contents.onResize = callback;
			contents.resizeCheck();
			expect(callback).toHaveBeenCalledTimes(1);
		});
	});

	describe("locationOf()", () => {
		it("should return {left, top} for an #id target", () => {
			const { contents } = createContents('<p id="target">Hello</p>');
			const pos = contents.locationOf("#target");
			expect(pos).toHaveProperty("left");
			expect(pos).toHaveProperty("top");
			expect(typeof pos.left).toBe("number");
			expect(typeof pos.top).toBe("number");
		});

		it("should return default {left: 0, top: 0} for missing id", () => {
			const { contents } = createContents("<p>Hello</p>");
			const pos = contents.locationOf("#nonexistent");
			expect(pos).toEqual({ left: 0, top: 0 });
		});

		it("should return default for plain string without hash", () => {
			const { contents } = createContents("<p>Hello</p>");
			const pos = contents.locationOf("no-hash");
			expect(pos).toEqual({ left: 0, top: 0 });
		});

		it("should not throw for a CFI that resolves to an element container", () => {
			const { contents, container } = createContents(
				'<p id="element-target"><span>Hello there friend</span> and <em>some more words here too</em></p>'
			);
			const target = container.querySelector("#element-target") as HTMLElement;
			target.getBoundingClientRect = (): DOMRect => ({ left: 42, top: 7 }) as DOMRect;
			const cfi = new EpubCFI(target, "/6/2!").toString();
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

			const pos = contents.locationOf(cfi);

			expect(errorSpy).not.toHaveBeenCalled();
			expect(pos).toEqual({ left: 42, top: 7 });
			errorSpy.mockRestore();
		});

		it("should still extend a collapsed range that lands in a text node", () => {
			const { contents, container } = createContents('<p id="text-target">Hello there friend</p>');
			const textNode = container.querySelector("#text-target")!.firstChild!;
			const cfi = new EpubCFI(textNode, "/6/2!").toString();
			const setEnd = vi.spyOn(Range.prototype, "setEnd");
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

			contents.locationOf(cfi);

			expect(errorSpy).not.toHaveBeenCalled();
			expect(setEnd).toHaveBeenCalledWith(textNode, "Hello".length);
			setEnd.mockRestore();
			errorSpy.mockRestore();
		});
	});

	describe("size()", () => {
		it("should set layoutStyle to scrolling", () => {
			const { contents } = createContents();
			contents.size(800, 600);
			expect(contents.layoutStyle()).toBe("scrolling");
		});

		it("should set width and height", () => {
			const { contents, container } = createContents();
			contents.size(800, 600);
			expect(container.style.width).toBe("800px");
			expect(container.style.height).toBe("600px");
		});
	});

	describe("columns()", () => {
		it("should set layoutStyle to paginated", () => {
			const { contents } = createContents();
			contents.columns(800, 600, 400, 20);
			expect(contents.layoutStyle()).toBe("paginated");
		});

		it("should set column CSS properties", () => {
			const { contents, container } = createContents();
			contents.columns(800, 600, 400, 20);
			expect(container.style.columnWidth).toBe("400px");
			expect(container.style.columnGap).toBe("20px");
		});

		it("should set all layout properties for horizontal axis", () => {
			const { contents, container } = createContents();
			contents.columns(800, 600, 400, 20);
			expect(container.style.display).toBe("inline-block");
			expect(container.style.overflowY).toBe("hidden");
			expect(container.style.getPropertyValue("margin")).toBe("0px");
			expect(container.style.getPropertyPriority("margin")).toBe("important");
			expect(container.style.paddingTop).toBe("20px");
			expect(container.style.paddingBottom).toBe("20px");
			expect(container.style.getPropertyValue("padding-left")).toBe("10px");
			expect(container.style.getPropertyValue("padding-right")).toBe("10px");
			expect(container.style.boxSizing).toBe("border-box");
			expect(container.style.maxWidth).toBe("inherit");
			expect(container.style.columnFill).toBe("auto");
		});
	});

	describe("scaler()", () => {
		it("should set transform and transform-origin CSS", () => {
			const { contents, container } = createContents();
			contents.scaler(2);
			expect(container.style.transformOrigin).toBe("top left");
			expect(container.style.transform).toBe("scale(2)");
		});

		it("should include translate when offsets are provided", () => {
			const { contents, container } = createContents();
			contents.scaler(1.5, 10, 20);
			expect(container.style.transform).toContain("scale(1.5)");
			expect(container.style.transform).toContain("translate(10px, 20px");
		});
	});

	describe("epubReadingSystem()", () => {
		it("should set navigator.epubReadingSystem", () => {
			createContents();
			expect(navigator.epubReadingSystem).toBeDefined();
			expect(navigator.epubReadingSystem!.name).toBe("epub.js");
		});

		it("hasFeature() should return true for known features", () => {
			createContents();
			const ers = navigator.epubReadingSystem!;
			expect(ers.hasFeature("dom-manipulation")).toBe(true);
			expect(ers.hasFeature("layout-changes")).toBe(true);
			expect(ers.hasFeature("touch-events")).toBe(true);
			expect(ers.hasFeature("mouse-events")).toBe(true);
			expect(ers.hasFeature("keyboard-events")).toBe(true);
		});

		it("hasFeature() should return false for unknown features", () => {
			createContents();
			const ers = navigator.epubReadingSystem!;
			expect(ers.hasFeature("spine-scripting")).toBe(false);
			expect(ers.hasFeature("unknown-feature")).toBe(false);
		});
	});

	describe("listenedEvents", () => {
		it("should return DOM_EVENTS array", () => {
			expect(Contents.listenedEvents).toBe(DOM_EVENTS);
			expect(Contents.listenedEvents).toContain("click");
			expect(Contents.listenedEvents).toContain("keydown");
		});
	});

	describe("mediaQueryListeners()", () => {
		it("should keep scanning after a stylesheet that throws", () => {
			const { contents } = createContents();
			contents._mediaQueryHandlers = [];

			const sheets = [
				{ get cssRules(): unknown { throw new Error("cross-origin"); } },
				{ cssRules: null },
				{ cssRules: [{ media: { mediaText: "(min-width: 500px)" } }] },
			];

			const originalMatchMedia = contents.window.matchMedia;
			contents.window.matchMedia = vi.fn(() => ({
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
			})) as unknown as typeof window.matchMedia;
			Object.defineProperty(contents.document, "styleSheets", { value: sheets, configurable: true });

			try {
				contents.mediaQueryListeners();
				// The throwing sheet and the null-rules sheet are skipped, not
				// treated as the end of the list
				expect(contents._mediaQueryHandlers).toHaveLength(1);
			} finally {
				delete (contents.document as unknown as Record<string, unknown>)["styleSheets"];
				contents.window.matchMedia = originalMatchMedia;
			}
		});
	});

	describe("removeSelectionListeners()", () => {
		it("should clear a pending selection timer when the document is already gone", () => {
			vi.useFakeTimers();
			try {
				const { contents } = createContents();
				const doc = contents.document;
				const spy = vi.spyOn(contents, "triggerSelectedEvent");

				contents.onSelectionChange(new Event("selectionchange"));
				expect(contents.selectionEndTimeout).toBeDefined();

				// Teardown ordering that already dropped the document is exactly
				// when a surviving timer fires against a detached window.
				(contents as unknown as { document: Document | undefined }).document = undefined;
				contents.removeSelectionListeners();

				vi.advanceTimersByTime(300);
				expect(spy).not.toHaveBeenCalled();
				expect(contents.selectionEndTimeout).toBeUndefined();

				contents.document = doc;
			} finally {
				vi.useRealTimers();
			}
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

		it("should set active to false", () => {
			const { contents } = createContents();
			contents.destroy();
			expect(contents.active).toBe(false);
		});

		it("should clear a pending selection timeout", () => {
			vi.useFakeTimers();
			try {
				const { contents } = createContents("<p>Hello world</p>");
				const handler = vi.fn();
				contents.on("selected", handler);

				contents.onSelectionChange(new Event("selectionchange"));
				expect(contents.selectionEndTimeout).toBeDefined();

				contents.destroy();
				expect(contents.selectionEndTimeout).toBeUndefined();

				// The 250ms selection timer must not fire against a torn-down view
				vi.advanceTimersByTime(500);
				expect(handler).not.toHaveBeenCalled();
			} finally {
				vi.useRealTimers();
			}
		});

		it("should stop resizeCheck from emitting after destroy", () => {
			// A ResizeObserver callback already queued on rAF, or the fonts.ready
			// continuation, can still reach resizeCheck after teardown.
			const { contents } = createContents("<p>Hello world</p>");
			contents.destroy();

			const handler = vi.fn();
			contents.on("resize", handler);
			contents.onResize = vi.fn();
			contents._size = { width: 999, height: 999 };

			contents.resizeCheck();

			expect(handler).not.toHaveBeenCalled();
			expect(contents.onResize).not.toHaveBeenCalled();
		});
	});
});
