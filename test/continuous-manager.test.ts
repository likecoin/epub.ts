import { describe, it, expect, vi } from "vitest";
import ContinuousViewManager from "../src/managers/continuous/index";
import type { ManagerOptions, ViewSettings } from "../src/types";
import type Section from "../src/section";
import type Layout from "../src/layout";
import Queue from "../src/utils/queue";

function createMockManagerOptions(overrides?: Partial<ManagerOptions["settings"]>): ManagerOptions {
	return {
		view: class MockView {
			element = document.createElement("div");
			section = { index: 0, next: vi.fn(), prev: vi.fn() } as unknown as Section;
			displayed = false;
			expanded = false;
			index = 0;
			settings = {} as ViewSettings;
			contents = null;
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
			flow: "scrolled",
			ignoreClass: "",
			fullsize: false,
			allowScriptedContent: false,
			allowPopups: false,
			snap: false,
			...overrides,
		},
	} as ManagerOptions;
}

describe("ContinuousViewManager", () => {

	describe("constructor", () => {
		it("should set name to 'continuous'", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.name).toBe("continuous");
		});

		it("should set default offset to 500", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.settings.offset).toBe(500);
		});

		it("should set default afterScrolledTimeout to 10", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.settings.afterScrolledTimeout).toBe(10);
		});

		it("should handle gap=0", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions({ gap: 0 }));
			expect(manager.settings.gap).toBe(0);
		});

		it("should initialize scrollTop and scrollLeft to 0", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.scrollTop).toBe(0);
			expect(manager.scrollLeft).toBe(0);
		});

		it("should set forceEvenPages to false", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			expect(manager.viewSettings.forceEvenPages).toBe(false);
		});
	});

	describe("updateFlow()", () => {
		it("should destroy snapper on flow change", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			// Simulate an existing snapper
			manager.snapper = { destroy: vi.fn() } as any;
			manager.updateFlow("scrolled");
			expect(manager.snapper).toBeUndefined();
		});

		it("should call super.updateFlow with 'scroll' default overflow", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			manager.updateFlow("scrolled");
			expect(manager.overflow).toBe("scroll");
		});
	});

	describe("next()", () => {
		it("should return undefined when no views", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				height: 600,
			} as unknown as Layout;
			expect(manager.next()).toBeUndefined();
		});

		it("should scroll by delta horizontally when paginated horizontal", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			manager.isPaginated = true;
			manager.settings.axis = "horizontal";
			// Add a mock view so views.length > 0
			const mockView = { element: document.createElement("div"), section: { next: vi.fn() } };
			manager.views.append(mockView as any);
			const spy = vi.spyOn(manager, "scrollBy");
			manager.next();
			expect(spy).toHaveBeenCalledWith(800, 0, true);
		});

		it("should scroll by layout.height vertically when not paginated horizontal", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			manager.isPaginated = false;
			manager.settings.axis = "vertical";
			const mockView = { element: document.createElement("div"), section: { next: vi.fn() } };
			manager.views.append(mockView as any);
			const spy = vi.spyOn(manager, "scrollBy");
			manager.next();
			expect(spy).toHaveBeenCalledWith(0, 600, true);
		});
	});

	describe("prev()", () => {
		it("should return undefined when no views", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				props: { delta: 800, spread: false, name: "reflowable" },
				height: 600,
			} as unknown as Layout;
			expect(manager.prev()).toBeUndefined();
		});

		it("should scroll by negative delta horizontally when paginated", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			manager.isPaginated = true;
			manager.settings.axis = "horizontal";
			const mockView = { element: document.createElement("div"), section: { prev: vi.fn() } };
			manager.views.append(mockView as any);
			const spy = vi.spyOn(manager, "scrollBy");
			manager.prev();
			expect(spy).toHaveBeenCalledWith(-800, 0, true);
		});

		it("should scroll by negative layout.height vertically", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.layout = {
				calculate: vi.fn(),
				spread: vi.fn(),
				settings: { spread: "auto" },
				props: { delta: 800, spread: false, name: "reflowable" },
				width: 800,
				height: 600,
			} as unknown as Layout;
			manager.isPaginated = false;
			manager.settings.axis = "vertical";
			const mockView = { element: document.createElement("div"), section: { prev: vi.fn() } };
			manager.views.append(mockView as any);
			const spy = vi.spyOn(manager, "scrollBy");
			manager.prev();
			expect(spy).toHaveBeenCalledWith(0, -600, true);
		});
	});

	describe("destroy()", () => {
		it("should call super.destroy()", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			manager.destroy();
			expect(manager.rendered).toBe(false);
		});

		it("should destroy snapper if present", () => {
			const manager = new ContinuousViewManager(createMockManagerOptions());
			const el = document.createElement("div");
			manager.render(el, { width: 800, height: 600 });
			const destroySpy = vi.fn();
			manager.snapper = { destroy: destroySpy } as any;
			manager.destroy();
			expect(destroySpy).toHaveBeenCalled();
		});
	});
});
