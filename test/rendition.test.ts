import { describe, it, expect, vi } from "vitest";
import Rendition from "../src/rendition";
import DefaultViewManager from "../src/managers/default/index";
import ContinuousViewManager from "../src/managers/continuous/index";
import IframeView from "../src/managers/views/iframe";
import type Book from "../src/book";
import type Section from "../src/section";

function createMockBook(): Book {
	return {
		opened: Promise.resolve(),
		spine: {
			hooks: {
				content: { register: vi.fn() },
			},
			get: vi.fn(),
			first: vi.fn().mockReturnValue({ index: 0 }),
			last: vi.fn().mockReturnValue({ index: 10 }),
		},
		package: {
			metadata: {
				layout: "",
				spread: "",
				orientation: "",
				flow: "",
				viewport: "",
				direction: "",
			},
		},
		packaging: {
			metadata: {
				identifier: "test-id-123",
			},
		},
		displayOptions: {
			fixedLayout: "false",
		},
		locations: {
			length: vi.fn().mockReturnValue(0),
			locationFromCfi: vi.fn().mockReturnValue(null),
			percentageFromLocation: vi.fn().mockReturnValue(0),
			cfiFromPercentage: vi.fn(),
		},
		pageList: {
			pageFromCfi: vi.fn().mockReturnValue(-1),
		},
		path: {
			relative: vi.fn((href: string) => href),
		},
		load: vi.fn(),
	} as unknown as Book;
}

describe("Rendition", () => {

	describe("constructor", () => {
		it("should set default options", () => {
			const rendition = new Rendition(createMockBook());
			expect(rendition.settings.manager).toBe("default");
			expect(rendition.settings.view).toBe("iframe");
			expect(rendition.settings.minSpreadWidth).toBe(800);
			expect(rendition.settings.snap).toBe(false);
			expect(rendition.settings.defaultDirection).toBe("ltr");
			expect(rendition.settings.allowScriptedContent).toBe(false);
			expect(rendition.settings.allowPopups).toBe(false);
		});

		it("should merge custom options", () => {
			const rendition = new Rendition(createMockBook(), {
				width: 1024,
				height: 768,
				minSpreadWidth: 1200,
			});
			expect(rendition.settings.width).toBe(1024);
			expect(rendition.settings.height).toBe(768);
			expect(rendition.settings.minSpreadWidth).toBe(1200);
		});

		it("should create hooks", () => {
			const rendition = new Rendition(createMockBook());
			expect(rendition.hooks.display).toBeDefined();
			expect(rendition.hooks.serialize).toBeDefined();
			expect(rendition.hooks.content).toBeDefined();
			expect(rendition.hooks.unloaded).toBeDefined();
			expect(rendition.hooks.layout).toBeDefined();
			expect(rendition.hooks.render).toBeDefined();
			expect(rendition.hooks.show).toBeDefined();
		});

		it("should create Themes instance", () => {
			const rendition = new Rendition(createMockBook());
			expect(rendition.themes).toBeDefined();
		});

		it("should create Annotations instance", () => {
			const rendition = new Rendition(createMockBook());
			expect(rendition.annotations).toBeDefined();
		});

		it("should create Queue", () => {
			const rendition = new Rendition(createMockBook());
			expect(rendition.q).toBeDefined();
		});

		it("should register content hooks for handleLinks, passEvents, adjustImages", () => {
			const book = createMockBook();
			const rendition = new Rendition(book);
			// content hook has 3 handlers registered (handleLinks, passEvents, adjustImages)
			expect(rendition.hooks.content).toBeDefined();
		});

		it("should register spine content hook for injectIdentifier", () => {
			const book = createMockBook();
			new Rendition(book);
			expect(book.spine.hooks.content.register).toHaveBeenCalled();
		});

		it("should register stylesheet hook when stylesheet option set", () => {
			const book = createMockBook();
			new Rendition(book, { stylesheet: "http://example.com/style.css" });
			// One call for injectIdentifier + one for injectStylesheet
			expect(book.spine.hooks.content.register).toHaveBeenCalledTimes(2);
		});

		it("should register script hook when script option set", () => {
			const book = createMockBook();
			new Rendition(book, { script: "http://example.com/script.js" });
			// One call for injectIdentifier + one for injectScript
			expect(book.spine.hooks.content.register).toHaveBeenCalledTimes(2);
		});

		it("should initialize location as undefined", () => {
			const rendition = new Rendition(createMockBook());
			expect(rendition.location).toBeUndefined();
		});

		it("should create started promise", () => {
			const rendition = new Rendition(createMockBook());
			expect(rendition.started).toBeInstanceOf(Promise);
		});
	});

	describe("requireManager()", () => {
		it("should return DefaultViewManager for 'default'", () => {
			const rendition = new Rendition(createMockBook());
			const Manager = rendition.requireManager("default");
			expect(Manager).toBe(DefaultViewManager);
		});

		it("should return ContinuousViewManager for 'continuous'", () => {
			const rendition = new Rendition(createMockBook());
			const Manager = rendition.requireManager("continuous");
			expect(Manager).toBe(ContinuousViewManager);
		});

		it("should pass through a class function", () => {
			const rendition = new Rendition(createMockBook());
			const CustomManager = class {};
			const result = rendition.requireManager(CustomManager as any);
			expect(result).toBe(CustomManager);
		});
	});

	describe("requireView()", () => {
		it("should return IframeView for 'iframe'", () => {
			const rendition = new Rendition(createMockBook());
			const View = rendition.requireView("iframe");
			expect(View).toBe(IframeView);
		});

		it("should pass through a class function", () => {
			const rendition = new Rendition(createMockBook());
			const CustomView = class {};
			const result = rendition.requireView(CustomView as any);
			expect(result).toBe(CustomView);
		});
	});

	describe("flow()", () => {
		it("should normalize 'scrolled' variants to 'scrolled'", () => {
			const rendition = new Rendition(createMockBook());
			rendition.flow("scrolled");
			expect(rendition.settings.flow).toBe("scrolled");

			rendition.flow("scrolled-doc");
			expect(rendition.settings.flow).toBe("scrolled-doc");

			rendition.flow("scrolled-continuous");
			expect(rendition.settings.flow).toBe("scrolled-continuous");
		});

		it("should normalize 'auto' and 'paginated' to 'paginated'", () => {
			const rendition = new Rendition(createMockBook());
			rendition.flow("auto");
			expect(rendition.settings.flow).toBe("auto");

			rendition.flow("paginated");
			expect(rendition.settings.flow).toBe("paginated");
		});

		it("should store the original flow string in settings", () => {
			const rendition = new Rendition(createMockBook());
			rendition.flow("scrolled-continuous");
			expect(rendition.settings.flow).toBe("scrolled-continuous");
		});
	});

	describe("spread()", () => {
		it("should update settings.spread", () => {
			const rendition = new Rendition(createMockBook());
			rendition.spread("none");
			expect(rendition.settings.spread).toBe("none");
		});

		it("should update minSpreadWidth when provided", () => {
			const rendition = new Rendition(createMockBook());
			rendition.spread("auto", 1024);
			expect(rendition.settings.minSpreadWidth).toBe(1024);
		});
	});

	describe("direction()", () => {
		it("should update settings.direction", () => {
			const rendition = new Rendition(createMockBook());
			rendition.direction("rtl");
			expect(rendition.settings.direction).toBe("rtl");
		});

		it("should default to ltr when undefined", () => {
			const rendition = new Rendition(createMockBook());
			rendition.direction();
			expect(rendition.settings.direction).toBe("ltr");
		});
	});

	describe("determineLayoutProperties()", () => {
		it("should use settings as overrides over metadata", () => {
			const rendition = new Rendition(createMockBook(), {
				layout: "pre-paginated",
				spread: "none",
			});
			const result = rendition.determineLayoutProperties({
				layout: "reflowable",
				spread: "auto",
			} as any);
			expect(result.layout).toBe("pre-paginated");
			expect(result.spread).toBe("none");
		});

		it("should fallback to metadata when settings are not set", () => {
			const rendition = new Rendition(createMockBook());
			const result = rendition.determineLayoutProperties({
				layout: "pre-paginated",
				spread: "both",
				orientation: "landscape",
				flow: "scrolled",
				viewport: "width=1024,height=768",
				direction: "rtl",
			} as any);
			expect(result.layout).toBe("pre-paginated");
			expect(result.spread).toBe("both");
			expect(result.orientation).toBe("landscape");
			expect(result.flow).toBe("scrolled");
			expect(result.viewport).toBe("width=1024,height=768");
			expect(result.direction).toBe("rtl");
		});

		it("should apply defaults when neither settings nor metadata are set", () => {
			const rendition = new Rendition(createMockBook());
			const result = rendition.determineLayoutProperties({} as any);
			expect(result.layout).toBe("reflowable");
			expect(result.spread).toBe("auto");
			expect(result.orientation).toBe("auto");
			expect(result.flow).toBe("auto");
			expect(result.viewport).toBe("");
			expect(result.minSpreadWidth).toBe(800);
			expect(result.direction).toBe("ltr");
		});
	});

	describe("located()", () => {
		it("should return undefined for empty location array", () => {
			const rendition = new Rendition(createMockBook());
			expect(rendition.located([])).toBeUndefined();
		});

		it("should build Location from ViewLocation array", () => {
			const rendition = new Rendition(createMockBook());
			const locations = [
				{
					index: 0,
					href: "chapter1.xhtml",
					pages: [1],
					totalPages: 5,
					mapping: { start: "epubcfi(/6/2!/4/2,/1:0,/1:10)", end: "epubcfi(/6/2!/4/2,/1:10,/1:20)" },
				},
			];
			const result = rendition.located(locations as any);
			expect(result).toBeDefined();
			expect(result!.start.index).toBe(0);
			expect(result!.start.href).toBe("chapter1.xhtml");
			expect(result!.start.cfi).toBe("epubcfi(/6/2!/4/2,/1:0,/1:10)");
			expect(result!.start.displayed.page).toBe(1);
			expect(result!.start.displayed.total).toBe(5);
			expect(result!.end.cfi).toBe("epubcfi(/6/2!/4/2,/1:10,/1:20)");
		});

		it("should set atStart when at first spine item page 1", () => {
			const book = createMockBook();
			book.spine.first = vi.fn().mockReturnValue({ index: 0 });
			book.spine.last = vi.fn().mockReturnValue({ index: 10 });
			const rendition = new Rendition(book);
			const locations = [
				{
					index: 0,
					href: "chapter1.xhtml",
					pages: [1],
					totalPages: 5,
					mapping: { start: "epubcfi(/6/2!/4/2,/1:0,/1:10)", end: "epubcfi(/6/2!/4/2,/1:10,/1:20)" },
				},
			];
			const result = rendition.located(locations as any);
			expect(result!.atStart).toBe(true);
		});

		it("should set atEnd when at last spine item and last page", () => {
			const book = createMockBook();
			book.spine.first = vi.fn().mockReturnValue({ index: 0 });
			book.spine.last = vi.fn().mockReturnValue({ index: 5 });
			const rendition = new Rendition(book);
			const locations = [
				{
					index: 5,
					href: "chapter6.xhtml",
					pages: [3],
					totalPages: 3,
					mapping: { start: "epubcfi(/6/12!/4/2,/1:0,/1:10)", end: "epubcfi(/6/12!/4/2,/1:10,/1:20)" },
				},
			];
			const result = rendition.located(locations as any);
			expect(result!.atEnd).toBe(true);
		});
	});

	describe("getContents()", () => {
		it("should return empty array when no manager", () => {
			const rendition = new Rendition(createMockBook());
			expect(rendition.getContents()).toEqual([]);
		});
	});

	describe("views()", () => {
		it("should return empty array when no manager", () => {
			const rendition = new Rendition(createMockBook());
			expect(rendition.views()).toEqual([]);
		});
	});

	describe("injectStylesheet()", () => {
		it("should append a link element to doc head", () => {
			const rendition = new Rendition(createMockBook(), {
				stylesheet: "http://example.com/test.css",
			});
			const doc = document.implementation.createHTMLDocument("test");
			rendition.injectStylesheet(doc, {} as Section);
			const link = doc.querySelector("link[href='http://example.com/test.css']");
			expect(link).not.toBeNull();
			expect(link!.getAttribute("rel")).toBe("stylesheet");
			expect(link!.getAttribute("type")).toBe("text/css");
		});
	});

	describe("injectScript()", () => {
		it("should append a script element to doc head", () => {
			const rendition = new Rendition(createMockBook(), {
				script: "http://example.com/test.js",
			});
			const doc = document.implementation.createHTMLDocument("test");
			rendition.injectScript(doc, {} as Section);
			const script = doc.querySelector("script[src='http://example.com/test.js']");
			expect(script).not.toBeNull();
			expect(script!.getAttribute("type")).toBe("text/javascript");
			expect(script!.textContent).toBe(" ");
		});
	});

	describe("injectIdentifier()", () => {
		it("should append a meta element with dc.relation.ispartof", () => {
			const rendition = new Rendition(createMockBook());
			const doc = document.implementation.createHTMLDocument("test");
			rendition.injectIdentifier(doc, {} as Section);
			const meta = doc.querySelector("meta[name='dc.relation.ispartof']");
			expect(meta).not.toBeNull();
			expect(meta!.getAttribute("content")).toBe("test-id-123");
		});
	});

	describe("destroy()", () => {
		it("should clear queue", () => {
			const rendition = new Rendition(createMockBook());
			const clearSpy = vi.spyOn(rendition.q, "clear");
			rendition.destroy();
			expect(clearSpy).toHaveBeenCalled();
		});

		it("should destroy themes", () => {
			const rendition = new Rendition(createMockBook());
			const destroySpy = vi.spyOn(rendition.themes, "destroy");
			rendition.destroy();
			expect(destroySpy).toHaveBeenCalled();
		});

		it("should null references", () => {
			const rendition = new Rendition(createMockBook());
			rendition.destroy();
			expect(rendition.book).toBeUndefined();
			expect(rendition._layout).toBeUndefined();
			expect(rendition.location).toBeUndefined();
		});

		it("should clear all hooks", () => {
			const rendition = new Rendition(createMockBook());
			rendition.destroy();
			expect(rendition.hooks.display.list()).toEqual([]);
			expect(rendition.hooks.serialize.list()).toEqual([]);
			expect(rendition.hooks.content.list()).toEqual([]);
			expect(rendition.hooks.unloaded.list()).toEqual([]);
			expect(rendition.hooks.layout.list()).toEqual([]);
			expect(rendition.hooks.render.list()).toEqual([]);
			expect(rendition.hooks.show.list()).toEqual([]);
		});
	});
});
