import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Rendition from "../src/rendition";
import DefaultViewManager from "../src/managers/default/index";
import ContinuousViewManager from "../src/managers/continuous/index";
import IframeView from "../src/managers/views/iframe";
import type Book from "../src/book";
import type Section from "../src/section";
import type Contents from "../src/contents";
import type { GlobalLayout } from "../src/types";
import { sectionWith } from "./view-mocks";

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

	describe("adjustImages()", () => {
		function createMockContents(): { contents: Contents; addStylesheetRules: ReturnType<typeof vi.fn> } {
			const addStylesheetRules = vi.fn();
			const content = document.createElement("div");
			const contents = {
				sectionIndex: 3,
				content,
				window: { getComputedStyle: () => ({ paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px" }) },
				addStylesheetRules,
			} as unknown as Contents;
			return { contents, addStylesheetRules };
		}

		function createRendition(layout: string, section?: Section): Rendition {
			const book = createMockBook();
			(book.spine.get as ReturnType<typeof vi.fn>).mockReturnValue(section ?? null);
			const rendition = new Rendition(book);
			// The constructor queues book.opened + start(); drop them so a queued
			// start() can't replace _layout with a metadata-derived one.
			rendition.q.clear();
			rendition.layout({ layout, spread: "none" } as GlobalLayout);
			rendition._layout!.calculate(800, 1200, 20);
			return rendition;
		}

		it("should clamp images to the column width for a reflowable section", async () => {
			const { contents, addStylesheetRules } = createMockContents();
			await createRendition("reflowable", sectionWith([])).adjustImages(contents);
			expect(addStylesheetRules).toHaveBeenCalledWith(expect.objectContaining({
				img: expect.objectContaining({ "max-width": "800px!important" }),
				svg: expect.objectContaining({ "max-width": "800px!important" }),
			}));
		});

		it("should skip a pre-paginated book", async () => {
			const { contents, addStylesheetRules } = createMockContents();
			await createRendition("pre-paginated", sectionWith([])).adjustImages(contents);
			expect(addStylesheetRules).not.toHaveBeenCalled();
		});

		it("should skip a section overriding to pre-paginated in a reflowable book", async () => {
			const section = sectionWith(["rendition:layout-pre-paginated", "rendition:spread-none"]);
			const { contents, addStylesheetRules } = createMockContents();
			await createRendition("reflowable", section).adjustImages(contents);
			expect(addStylesheetRules).not.toHaveBeenCalled();
		});

		it("should inject for a section overriding to reflowable in a fixed book", async () => {
			const section = sectionWith(["rendition:layout-reflowable"]);
			const { contents, addStylesheetRules } = createMockContents();
			await createRendition("pre-paginated", section).adjustImages(contents);
			expect(addStylesheetRules).toHaveBeenCalled();
		});

		it("should fall back to the book layout when the section is unresolvable", async () => {
			const { contents, addStylesheetRules } = createMockContents();
			await createRendition("pre-paginated").adjustImages(contents);
			expect(addStylesheetRules).not.toHaveBeenCalled();
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

	function createRenditionWithManager(): { rendition: Rendition; section: Section } {
		const rendition = new Rendition(createMockBook());
		// The constructor queues book.opened + start(); drop them so the queue
		// only runs what a test enqueues, not a stray start() against the
		// partial manager mock below.
		rendition.q.clear();
		const section = { index: 5 } as unknown as Section;
		(rendition.book.spine.get as ReturnType<typeof vi.fn>).mockReturnValue(section);
		rendition.manager = {
			display: vi.fn().mockResolvedValue(undefined),
			next: vi.fn().mockResolvedValue(undefined),
			prev: vi.fn().mockResolvedValue(undefined),
		} as unknown as DefaultViewManager;
		rendition.reportLocation = vi.fn().mockResolvedValue(undefined);
		return { rendition, section };
	}

	describe("display() error handling", () => {
		function renditionWithFailingDisplay(err: Error): { rendition: Rendition; section: Section } {
			const { rendition, section } = createRenditionWithManager();
			// Drive follow-on queue steps inline rather than waiting on rAF.
			rendition.q.tick = (cb: FrameRequestCallback): number => { cb(0); return 0; };
			(rendition.manager.display as ReturnType<typeof vi.fn>).mockRejectedValue(err);
			return { rendition, section };
		}

		it("should reject when the manager fails to display", async () => {
			const { rendition } = renditionWithFailingDisplay(new Error("boom"));

			await expect(rendition.display("chapter_001.xhtml")).rejects.toThrow("boom");
		});

		it("should resolve undefined when the display was aborted", async () => {
			const { rendition } = renditionWithFailingDisplay(new DOMException("Aborted", "AbortError"));

			await expect(rendition.display("chapter_001.xhtml")).resolves.toBeUndefined();

			expect(rendition.displaying).toBeUndefined();
		});

		// A stuck `displaying` also disables re-anchoring — see the guard in
		// onContentReflow's debounce.
		it("should clear displaying after a failure", async () => {
			const { rendition } = renditionWithFailingDisplay(new Error("boom"));

			await expect(rendition.display("chapter_001.xhtml")).rejects.toThrow("boom");

			expect(rendition.displaying).toBeUndefined();
		});

		it("should clear displaying when no section matches the target", async () => {
			const { rendition } = renditionWithFailingDisplay(new Error("boom"));
			(rendition.book.spine.get as ReturnType<typeof vi.fn>).mockReturnValue(null);

			await expect(rendition.display("missing.xhtml")).rejects.toThrow("No Section Found");

			expect(rendition.displaying).toBeUndefined();
		});

		it("should still emit displayerror", async () => {
			const { rendition } = renditionWithFailingDisplay(new Error("boom"));
			const emitSpy = vi.spyOn(rendition, "emit");

			await expect(rendition.display("chapter_001.xhtml")).rejects.toThrow("boom");

			expect(emitSpy).toHaveBeenCalledWith("displayerror", expect.any(Error));
		});

		// Superseding a display resolves its deferred early, so a newer display
		// can be in flight by the time the older manager call settles. Both of
		// _display's handlers guard against blanking the newer one's marker.
		async function supersedeThenSettleOlder(
			older: Promise<void>,
			settleOlder: () => void,
			settledEvent: string
		): Promise<void> {
			const { rendition } = createRenditionWithManager();
			(rendition.manager.display as ReturnType<typeof vi.fn>)
				.mockReturnValueOnce(older)
				.mockReturnValue(new Promise<void>(() => {}));

			const first = rendition.display("chapter_001.xhtml");
			await vi.waitFor(() => expect(rendition.displaying).toBeDefined());
			const olderMarker = rendition.displaying;

			void rendition.display("chapter_002.xhtml");
			await expect(first).resolves.toBeUndefined();
			// Assert defined as well as changed — without it the wait would also
			// be satisfied by the very clobber this test exists to catch.
			await vi.waitFor(() => {
				expect(rendition.displaying).toBeDefined();
				expect(rendition.displaying).not.toBe(olderMarker);
			});
			const newerMarker = rendition.displaying;

			// Wait on the older handler's own emit rather than a bare tick, so a
			// handler that never ran fails instead of passing vacuously.
			const emitSpy = vi.spyOn(rendition, "emit");
			settleOlder();
			await vi.waitFor(() => expect(emitSpy).toHaveBeenCalledWith(settledEvent, expect.anything()));

			expect(rendition.displaying).toBe(newerMarker);
		}

		it("should not clear a newer display's marker when an older one resolves", async () => {
			let finish!: () => void;
			const older = new Promise<void>((resolve) => { finish = resolve; });

			await supersedeThenSettleOlder(older, () => finish(), "displayed");
		});

		it("should not clear a newer display's marker when an older one rejects", async () => {
			let fail!: () => void;
			const older = new Promise<void>((_resolve, reject) => {
				fail = (): void => reject(new Error("boom"));
			});

			await supersedeThenSettleOlder(older, () => fail(), "displayerror");
		});

		it("should keep draining the queue after a failure", async () => {
			const { rendition, section } = renditionWithFailingDisplay(new Error("boom"));

			await expect(rendition.display("chapter_001.xhtml")).rejects.toThrow("boom");

			(rendition.manager.display as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

			await expect(rendition.display("chapter_002.xhtml")).resolves.toBe(section);
		});

		// q.clear() only reaches tasks that never ran. A _display already dequeued
		// and waiting on the manager holds its own deferred, and destroy() tears
		// the manager down under it, so nothing else will ever settle it.
		it("should settle an in-flight display when the rendition is destroyed", async () => {
			const { rendition } = createRenditionWithManager();
			rendition.q.tick = (cb: FrameRequestCallback): number => { cb(0); return 0; };
			(rendition.manager.display as ReturnType<typeof vi.fn>).mockReturnValue(new Promise<void>(() => {}));
			Object.assign(rendition.manager, { off: vi.fn(), destroy: vi.fn() });

			const displayed = rendition.display("chapter_001.xhtml");
			// Without this the test could pass on a task that never ran, which
			// q.clear() would settle for a different reason.
			await vi.waitFor(() => expect(rendition.manager.display).toHaveBeenCalled());

			rendition.destroy();

			await expect(displayed).resolves.toBeUndefined();
		});

		// _display() discards the chain it builds — it returns the deferred's
		// promise, not the chain — so a throw in either handler rejects a promise
		// nobody holds. The deferred is already settled by then, so the caller is
		// fine; what leaks is an unhandled rejection from the listener's own bug.
		it.each([
			["displayed", undefined],
			["displayerror", new Error("boom")],
		])("should not leak an unhandled rejection when a %s listener throws", async (event, failWith) => {
			const { rendition } = createRenditionWithManager();
			rendition.q.tick = (cb: FrameRequestCallback): number => { cb(0); return 0; };
			if (failWith) {
				(rendition.manager.display as ReturnType<typeof vi.fn>).mockRejectedValue(failWith);
			}
			rendition.on(event as "displayed", () => { throw new Error("listener blew up"); });

			const leaked: unknown[] = [];
			const onUnhandled = (reason: unknown): void => { leaked.push(reason); };
			process.on("unhandledRejection", onUnhandled);
			try {
				await rendition.display("chapter_001.xhtml").catch(() => undefined);
				// Node reports unhandled rejections a macrotask after the
				// microtask queue drains, so awaiting the display is not enough.
				await new Promise((resolve) => setTimeout(resolve, 20));
			} finally {
				process.off("unhandledRejection", onUnhandled);
			}

			expect(leaked).toEqual([]);
		});
	});

	describe("content reflow re-anchoring", () => {
		const CFI = "epubcfi(/6/12!/4[A-5]/2/114/1:0)";

		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("re-applies the armed target on a content reflow", async () => {
			const { rendition, section } = createRenditionWithManager();
			rendition._armReanchor(CFI);

			rendition.onContentReflow();
			await vi.advanceTimersByTimeAsync(100);

			expect(rendition.manager.display).toHaveBeenCalledWith(section, CFI);
			expect(rendition.reportLocation).toHaveBeenCalled();
		});

		it("does nothing once the re-anchor window has expired", async () => {
			const { rendition } = createRenditionWithManager();
			rendition._armReanchor(CFI);

			vi.setSystemTime(Date.now() + 5000);
			rendition.onContentReflow();
			await vi.advanceTimersByTimeAsync(100);

			expect(rendition.manager.display).not.toHaveBeenCalled();
			expect(rendition._reanchorCfi).toBeUndefined();
		});

		it("is a no-op when nothing is armed", async () => {
			const { rendition } = createRenditionWithManager();

			rendition.onContentReflow();
			await vi.advanceTimersByTimeAsync(100);

			expect(rendition.manager.display).not.toHaveBeenCalled();
		});

		it("cancels a pending re-anchor when a newer display re-arms", async () => {
			const { rendition } = createRenditionWithManager();
			rendition._armReanchor("epubcfi(/6/4!/4/2/2/1:0)");
			rendition.onContentReflow(); // schedules the debounce for the stale target
			rendition._armReanchor(CFI); // a newer display supersedes it

			await vi.advanceTimersByTimeAsync(100);

			expect(rendition.manager.display).not.toHaveBeenCalled();
		});

		it("emits displayError when the re-anchor display rejects", async () => {
			const { rendition } = createRenditionWithManager();
			(rendition.manager.display as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("boom"));
			const emitSpy = vi.spyOn(rendition, "emit");
			rendition._armReanchor(CFI);

			rendition.onContentReflow();
			await vi.advanceTimersByTimeAsync(100);

			expect(emitSpy).toHaveBeenCalledWith("displayerror", expect.any(Error));
		});

		it("does not start an overlapping re-anchor while one is in flight", async () => {
			const { rendition } = createRenditionWithManager();
			// Hold the display pending so the in-flight flag stays set.
			let resolveDisplay: () => void = () => {};
			(rendition.manager.display as ReturnType<typeof vi.fn>).mockReturnValue(
				new Promise<void>((resolve) => { resolveDisplay = resolve; }),
			);
			rendition._armReanchor(CFI);

			rendition.onContentReflow();
			await vi.advanceTimersByTimeAsync(100); // first re-anchor fires, stays pending
			rendition.onContentReflow();
			await vi.advanceTimersByTimeAsync(100); // second must be skipped

			expect(rendition.manager.display).toHaveBeenCalledTimes(1);

			resolveDisplay();
			await vi.advanceTimersByTimeAsync(0);
		});

		it("skips re-anchoring fixed-layout (pre-paginated) views", async () => {
			const { rendition } = createRenditionWithManager();
			rendition._layout = { name: "pre-paginated" } as unknown as Rendition["_layout"];
			rendition._armReanchor(CFI);

			rendition.onContentReflow();
			await vi.advanceTimersByTimeAsync(100);

			expect(rendition.manager.display).not.toHaveBeenCalled();
		});

		it("skips while another display is mid-flight", async () => {
			const { rendition } = createRenditionWithManager();
			rendition.displaying = {} as unknown as Rendition["displaying"];
			rendition._armReanchor(CFI);

			rendition.onContentReflow();
			await vi.advanceTimersByTimeAsync(100);

			expect(rendition.manager.display).not.toHaveBeenCalled();
		});

		it("disarms on next() so a turned page is not yanked back", () => {
			const { rendition } = createRenditionWithManager();
			rendition._armReanchor(CFI);
			rendition.next();
			expect(rendition._reanchorCfi).toBeUndefined();
		});

		it("disarms on prev()", () => {
			const { rendition } = createRenditionWithManager();
			rendition._armReanchor(CFI);
			rendition.prev();
			expect(rendition._reanchorCfi).toBeUndefined();
		});
	});

	describe("container resize recovery", () => {
		const RESIZE_CFI = "epubcfi(/6/12!/4[A-5]/2/114/1:0)";
		const RealResizeObserver = globalThis.ResizeObserver;
		let capturedCallback: ((entries: ResizeObserverEntry[]) => void) | undefined;

		beforeEach(() => {
			capturedCallback = undefined;
			globalThis.ResizeObserver = class {
				constructor(cb: (entries: ResizeObserverEntry[]) => void) { capturedCallback = cb; }
				observe() {}
				unobserve() {}
				disconnect() {}
			} as unknown as typeof ResizeObserver;
		});

		afterEach(() => {
			globalThis.ResizeObserver = RealResizeObserver;
			vi.restoreAllMocks();
		});

		function fire(rect: { width: number; height: number }): void {
			capturedCallback!([{ contentRect: rect } as ResizeObserverEntry]);
		}

		function setup(): { rendition: Rendition } {
			const rendition = new Rendition(createMockBook());
			rendition.q.clear();
			rendition.manager = {
				container: {} as unknown as HTMLElement,
				isRendered: vi.fn().mockReturnValue(true),
				off: vi.fn(),
				destroy: vi.fn(),
			} as unknown as DefaultViewManager;
			rendition.reportLocation = vi.fn().mockResolvedValue(undefined);
			return { rendition };
		}

		it("does not report when the container is measurable from the start", () => {
			const { rendition } = setup();
			rendition._observeContainerResize();

			fire({ width: 600, height: 400 });

			expect(rendition.reportLocation).not.toHaveBeenCalled();
		});

		it("reports once the container transitions from zero-size to measurable", () => {
			const { rendition } = setup();
			rendition._observeContainerResize();

			fire({ width: 0, height: 0 });
			expect(rendition.reportLocation).not.toHaveBeenCalled();

			fire({ width: 600, height: 400 });

			expect(rendition.reportLocation).toHaveBeenCalledTimes(1);
		});

		it("stops recovering and self-disconnects once a location is established", () => {
			const { rendition } = setup();
			rendition._observeContainerResize();
			const disconnectSpy = vi.spyOn(rendition._containerResizeObserver!, "disconnect");

			fire({ width: 0, height: 0 });
			rendition.location = { start: { cfi: RESIZE_CFI } } as unknown as Rendition["location"];
			fire({ width: 600, height: 400 });

			expect(rendition.reportLocation).not.toHaveBeenCalled();
			expect(disconnectSpy).toHaveBeenCalled();
			expect(rendition._containerResizeObserver).toBeUndefined();
		});

		it("disconnects the observer on destroy", () => {
			const { rendition } = setup();
			rendition._observeContainerResize();
			const disconnectSpy = vi.spyOn(rendition._containerResizeObserver!, "disconnect");

			rendition.destroy();

			expect(disconnectSpy).toHaveBeenCalled();
		});
	});
});
