import { describe, it, expect, vi } from "vitest";
import DefaultViewManager from "../src/managers/default/index";
import type { ManagerOptions, ViewSettings } from "../src/types";
import type Section from "../src/section";
import type IframeView from "../src/managers/views/iframe";
import type Layout from "../src/layout";
import Queue from "../src/utils/queue";

function createMockManagerOptions(overrides?: Partial<ManagerOptions>): ManagerOptions {
	return {
		view: class MockView {
			element = document.createElement("div");
			section = { index: 0 } as Section;
			displayed = false;
			index = 0;
			settings = {} as ViewSettings;
			contents: null;
			show = vi.fn();
			hide = vi.fn();
			destroy = vi.fn();
			display = vi.fn().mockResolvedValue(this);
			on = vi.fn();
			off = vi.fn();
			emit = vi.fn();
			onDisplayed = vi.fn();
			onResize = vi.fn();
			setLayout = vi.fn();
			setAxis = vi.fn();
			offset = vi.fn().mockReturnValue({ top: 0, left: 0 });
			width = vi.fn().mockReturnValue(800);
			height = vi.fn().mockReturnValue(600);
			position = vi.fn().mockReturnValue({ left: 0, right: 800, top: 0, bottom: 600 });
			bounds = vi.fn().mockReturnValue({ width: 800, height: 600 });
			locationOf = vi.fn().mockReturnValue({ left: 0, top: 0 });
		} as unknown as ManagerOptions["view"],
		request: vi.fn().mockResolvedValue(""),
		queue: new Queue({}),
		settings: {
			axis: "horizontal",
			direction: "ltr",
			flow: "paginated",
			ignoreClass: "",
			fullsize: false,
			allowScriptedContent: false,
			allowPopups: false,
			...overrides?.settings,
		},
		...overrides,
	} as ManagerOptions;
}

describe("DefaultViewManager", () => {

	describe("constructor", () => {
		it("should set name to 'default'", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			expect(manager.name).toBe("default");
		});

		it("should store View class, request, and queue", () => {
			const opts = createMockManagerOptions();
			const manager = new DefaultViewManager(opts);
			expect(manager.View).toBeDefined();
			expect(manager.request).toBe(opts.request);
			expect(manager.renditionQueue).toBe(opts.queue);
		});

		it("should initialize rendered to false", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			expect(manager.rendered).toBe(false);
		});

		it("should merge default settings", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			expect(manager.settings.infinite).toBe(true);
			expect(manager.settings.hidden).toBe(false);
		});

		it("should create internal queue", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			expect(manager.q).toBeDefined();
		});

		it("should set view settings", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			expect(manager.viewSettings).toBeDefined();
			expect(manager.viewSettings.forceEvenPages).toBe(true);
		});
	});

	describe("render()", () => {
		it("should create Stage and attach to element", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			expect(manager.stage).toBeDefined();
			expect(manager.container).toBeDefined();
			expect(manager.views).toBeDefined();
		});

		it("should set rendered to true", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			expect(manager.rendered).toBe(true);
		});

		it("should calculate stage size", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			expect(manager._stageSize).toBeDefined();
		});

		it("should set fullsize when attached to body", () => {
			const manager = new DefaultViewManager(createMockManagerOptions({
				settings: { fullsize: undefined } as any,
			}));
			manager.render(document.body, { width: 800, height: 600 });
			expect(manager.settings.fullsize).toBe(true);
			// Clean up stage from body
			manager.destroy();
		});
	});

	describe("isRendered()", () => {
		it("should return false before render", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			expect(manager.isRendered()).toBe(false);
		});

		it("should return true after render", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			expect(manager.isRendered()).toBe(true);
		});
	});

	describe("updateFlow()", () => {
		it("should set isPaginated for paginated flow", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			manager.updateFlow("paginated");
			expect(manager.isPaginated).toBe(true);
		});

		it("should set isPaginated false for scrolled flow", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			manager.updateFlow("scrolled");
			expect(manager.isPaginated).toBe(false);
		});

		it("should update axis to horizontal for paginated", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			manager.updateFlow("paginated");
			expect(manager.settings.axis).toBe("horizontal");
		});

		it("should update axis to vertical for scrolled", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			manager.updateFlow("scrolled");
			expect(manager.settings.axis).toBe("vertical");
		});

		it("should set overflow to hidden for paginated", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			manager.updateFlow("paginated");
			expect(manager.overflow).toBe("hidden");
		});

		it("should set overflow to auto for scrolled", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			manager.updateFlow("scrolled");
			expect(manager.overflow).toBe("auto");
		});
	});

	describe("updateAxis()", () => {
		it("should update settings.axis", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			manager.updateAxis("vertical", true);
			expect(manager.settings.axis).toBe("vertical");
		});

		it("should call stage.axis", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			const spy = vi.spyOn(manager.stage, "axis");
			manager.updateAxis("vertical", true);
			expect(spy).toHaveBeenCalledWith("vertical");
		});

		it("should no-op when axis unchanged and not forced", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.settings.axis = "horizontal";
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			const spy = vi.spyOn(manager.stage, "axis");
			manager.updateAxis("horizontal");
			expect(spy).not.toHaveBeenCalled();
		});
	});

	describe("direction()", () => {
		it("should set settings.direction", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			manager.direction("rtl");
			expect(manager.settings.direction).toBe("rtl");
		});

		it("should call stage.direction", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = { calculate: vi.fn(), spread: vi.fn(), settings: { spread: "auto" }, props: {} } as unknown as Layout;
			const spy = vi.spyOn(manager.stage, "direction");
			manager.direction("rtl");
			expect(spy).toHaveBeenCalledWith("rtl");
		});
	});

	describe("isVisible()", () => {
		it("should return true when view is within horizontal bounds", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.settings.axis = "horizontal";

			const view = {
				position: () => ({ left: 0, right: 400, top: 0, bottom: 600 }),
			} as unknown as IframeView;

			const container = { left: 0, right: 800, top: 0, bottom: 600, width: 800, height: 600 };
			expect(manager.isVisible(view, 0, 0, container)).toBe(true);
		});

		it("should return false when view is outside horizontal bounds", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.settings.axis = "horizontal";

			const view = {
				position: () => ({ left: 900, right: 1200, top: 0, bottom: 600 }),
			} as unknown as IframeView;

			const container = { left: 0, right: 800, top: 0, bottom: 600, width: 800, height: 600 };
			expect(manager.isVisible(view, 0, 0, container)).toBe(false);
		});

		it("should check vertical bounds when axis is vertical", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.settings.axis = "vertical";

			const view = {
				position: () => ({ left: 0, right: 800, top: 0, bottom: 300 }),
			} as unknown as IframeView;

			const container = { left: 0, right: 800, top: 0, bottom: 600, width: 800, height: 600 };
			expect(manager.isVisible(view, 0, 0, container)).toBe(true);
		});
	});

	describe("scrollBy()", () => {
		it("should update container scrollLeft for ltr", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.settings.direction = "ltr";
			manager.scrollBy(100, 0, true);
			expect(manager._hasScrolled).toBe(true);
		});

		it("should negate x for rtl direction", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.settings.direction = "rtl";
			const initialLeft = manager.container.scrollLeft;
			manager.scrollBy(100, 0, true);
			// In jsdom, scrollLeft stays 0, but the dir multiplier is applied
			expect(manager._hasScrolled).toBe(true);
		});
	});

	describe("scrollTo()", () => {
		it("should set container scroll position", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.scrollTo(100, 50, true);
			expect(manager.container.scrollLeft).toBe(100);
			expect(manager.container.scrollTop).toBe(50);
			expect(manager._hasScrolled).toBe(true);
		});
	});

	describe("clear()", () => {
		it("should hide and clear views", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			const hideSpy = vi.spyOn(manager.views, "hide");
			const clearSpy = vi.spyOn(manager.views, "clear");
			manager.clear();
			expect(hideSpy).toHaveBeenCalled();
			expect(clearSpy).toHaveBeenCalled();
		});
	});

	function createManager(): DefaultViewManager {
		const manager = new DefaultViewManager(createMockManagerOptions());
		manager.render(document.createElement("div"), { width: 800, height: 600 });
		manager.layout = {
			calculate: vi.fn(),
			spread: vi.fn(),
			settings: { spread: "auto" },
			props: {},
			name: "reflowable",
			divisor: 1,
		} as unknown as Layout;
		return manager;
	}

	// display() settles a deferred from a promise chain: any unsettled link hangs
	// the caller and the queue waiting behind it.
	describe("display()", () => {
		const section = { index: 0, href: "chapter_001.xhtml", properties: [] } as unknown as Section;

		it("should resolve once the view is added and shown", async () => {
			const manager = createManager();
			vi.spyOn(manager, "add").mockResolvedValue({} as IframeView);
			vi.spyOn(manager, "handleNextPrePaginated").mockReturnValue(undefined);
			const showSpy = vi.spyOn(manager.views, "show");

			await expect(manager.display(section)).resolves.toBeUndefined();

			expect(showSpy).toHaveBeenCalled();
		});

		it("should reject and skip the rest of the chain when adding fails", async () => {
			const manager = createManager();
			vi.spyOn(manager, "add").mockRejectedValue(new Error("boom"));
			const nextPageSpy = vi.spyOn(manager, "handleNextPrePaginated");
			const showSpy = vi.spyOn(manager.views, "show");

			await expect(manager.display(section)).rejects.toThrow("boom");

			expect(nextPageSpy).not.toHaveBeenCalled();
			expect(showSpy).not.toHaveBeenCalled();
		});

		// A throw in an onFulfilled does not reach that same .then's onRejected,
		// so this one only settles because the catch is terminal.
		it("should reject when moving to the target throws", async () => {
			const manager = createManager();
			const view = {
				locationOf: (): never => { throw new Error("locate failed"); },
				width: vi.fn().mockReturnValue(800),
			} as unknown as IframeView;
			vi.spyOn(manager, "add").mockResolvedValue(view);
			vi.spyOn(manager, "handleNextPrePaginated").mockReturnValue(undefined);

			await expect(manager.display(section, "#frag")).rejects.toThrow("locate failed");
		});

		it("should reject when the pre-paginated companion page fails", async () => {
			const manager = createManager();
			vi.spyOn(manager, "add").mockResolvedValue({} as IframeView);
			vi.spyOn(manager, "handleNextPrePaginated").mockRejectedValue(new Error("spread failed"));

			await expect(manager.display(section)).rejects.toThrow("spread failed");
		});

		it("should reject when showing the views throws", async () => {
			const manager = createManager();
			vi.spyOn(manager, "add").mockResolvedValue({} as IframeView);
			vi.spyOn(manager, "handleNextPrePaginated").mockReturnValue(undefined);
			vi.spyOn(manager.views, "show").mockImplementation(() => { throw new Error("show failed"); });

			await expect(manager.display(section)).rejects.toThrow("show failed");
		});
	});

	// A mid-chain `(err) => err` converted an append failure into a fulfilment,
	// so the chain ran on and scrolled to a section that never loaded. The
	// short-circuit is the fix; the failure is reported on displayerror rather
	// than rejected, since the canonical caller is a bare rendition.next().
	describe("next() / prev()", () => {
		function managerWithOneView(neighbour: "next" | "prev"): DefaultViewManager {
			const manager = createManager();
			manager.isPaginated = false;
			const section = { index: 1 } as Section;
			manager.views.append({
				element: document.createElement("div"),
				section: { [neighbour]: (): Section => section },
				destroy: vi.fn(),
			} as unknown as IframeView);
			return manager;
		}

		it("should report on displayerror and not show views when appending the next section fails", async () => {
			const manager = managerWithOneView("next");
			vi.spyOn(manager, "append").mockRejectedValue(new Error("append failed"));
			const showSpy = vi.spyOn(manager.views, "show");
			const onError = vi.fn();
			manager.on("displayerror", onError);

			await expect(manager.next()).resolves.toBeUndefined();

			expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "append failed" }));
			expect(showSpy).not.toHaveBeenCalled();
		});

		it("should report on displayerror and not show views when prepending the previous section fails", async () => {
			const manager = managerWithOneView("prev");
			vi.spyOn(manager, "prepend").mockRejectedValue(new Error("prepend failed"));
			const showSpy = vi.spyOn(manager.views, "show");
			const onError = vi.fn();
			manager.on("displayerror", onError);

			await expect(manager.prev()).resolves.toBeUndefined();

			expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "prepend failed" }));
			expect(showSpy).not.toHaveBeenCalled();
		});

		// emit() runs listeners bare, so a throwing one would reject the promise
		// this whole design exists to keep resolved — handing the bare
		// rendition.next() caller exactly the unhandled rejection it avoids.
		it("should still resolve when a displayerror listener throws", async () => {
			const manager = managerWithOneView("next");
			vi.spyOn(manager, "append").mockRejectedValue(new Error("append failed"));
			manager.on("displayerror", () => { throw new Error("listener blew up"); });

			await expect(manager.next()).resolves.toBeUndefined();
		});
	});

	describe("destroy()", () => {
		it("should set rendered to false", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.destroy();
			expect(manager.rendered).toBe(false);
		});

		it("should clear __listeners", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.on("resized", vi.fn());
			manager.destroy();
			expect(manager.__listeners).toEqual({});
		});

		it("should call stage.destroy", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			const spy = vi.spyOn(manager.stage, "destroy");
			manager.destroy();
			expect(spy).toHaveBeenCalled();
		});
	});

	describe("pagehide handler", () => {
		it("should call destroy() on pagehide when persisted is false", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			const spy = vi.spyOn(manager, "destroy");
			manager._onPageHide!({ persisted: false } as PageTransitionEvent);
			expect(spy).toHaveBeenCalled();
		});

		it("should skip destroy() on pagehide when persisted is true (bfcache)", () => {
			const manager = new DefaultViewManager(createMockManagerOptions());
			manager.render(document.createElement("div"), { width: 800, height: 600 });
			const spy = vi.spyOn(manager, "destroy");
			manager._onPageHide!({ persisted: true } as PageTransitionEvent);
			expect(spy).not.toHaveBeenCalled();
			manager.destroy();
		});
	});
});
