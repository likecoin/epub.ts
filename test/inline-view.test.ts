import { describe, it, expect, vi } from "vitest";
import InlineView from "../src/managers/views/inline";
import { EVENTS } from "../src/utils/constants";
import type Section from "../src/section";
import { createMockSection, createMockLayout } from "./view-mocks";
import type { ViewSettings } from "../src/types";

function createView(section?: Section, options?: Partial<ViewSettings>): InlineView {
	const s = section || createMockSection();
	return new InlineView(s, {
		ignoreClass: "",
		axis: "horizontal",
		width: 800,
		height: 600,
		layout: createMockLayout() as unknown as undefined,
		...options,
	} as ViewSettings);
}

describe("InlineView", () => {

	describe("constructor", () => {
		it("should set section and index from section", () => {
			const section = createMockSection(3);
			const view = createView(section);
			expect(view.section).toBe(section);
			expect(view.index).toBe(3);
		});

		it("should generate unique id starting with epubjs-view:", () => {
			const view = createView();
			expect(view.id).toMatch(/^epubjs-view:/);
		});

		it("should initialize flags to false", () => {
			const view = createView();
			expect(view.added).toBe(false);
			expect(view.displayed).toBe(false);
			expect(view.rendered).toBe(false);
		});

		it("should store width and height from settings", () => {
			const view = createView(undefined, { width: 1024, height: 768 });
			expect(view.width).toBe(1024);
			expect(view.height).toBe(768);
		});

		it("should initialize fixedWidth and fixedHeight to 0", () => {
			const view = createView();
			expect(view.fixedWidth).toBe(0);
			expect(view.fixedHeight).toBe(0);
		});

		it("should merge settings with defaults", () => {
			const view = createView(undefined, { ignoreClass: "skip" });
			expect(view.settings.ignoreClass).toBe("skip");
			expect(view.settings.axis).toBe("horizontal");
		});

		it("should set layout from settings", () => {
			const view = createView();
			expect(view.layout).toBeDefined();
		});
	});

	describe("container (via constructor)", () => {
		it("should create a div element with epub-view class", () => {
			const view = createView();
			expect(view.element).toBeInstanceOf(HTMLDivElement);
			expect(view.element.classList.contains("epub-view")).toBe(true);
		});

		it("should set overflow hidden", () => {
			const view = createView();
			expect(view.element.style.overflow).toBe("hidden");
		});

		it("should set display inline-block for horizontal axis", () => {
			const view = createView(undefined, { axis: "horizontal" });
			expect(view.element.style.display).toBe("inline-block");
		});

		it("should set display block for vertical axis", () => {
			const view = createView(undefined, { axis: "vertical" });
			expect(view.element.style.display).toBe("block");
		});
	});

	describe("create()", () => {
		it("should create a div frame (not an iframe)", () => {
			const view = createView();
			const frame = view.create();
			expect(frame).toBeInstanceOf(HTMLDivElement);
			expect(view.frame).toBe(frame);
		});

		it("should set frame id to view id", () => {
			const view = createView();
			const frame = view.create();
			expect(frame.id).toBe(view.id);
		});

		it("should set added to true", () => {
			const view = createView();
			view.create();
			expect(view.added).toBe(true);
		});

		it("should return existing frame on second call", () => {
			const view = createView();
			const first = view.create();
			const second = view.create();
			expect(first).toBe(second);
		});

		it("should set initial styles on frame", () => {
			const view = createView();
			const frame = view.create();
			expect(frame.style.overflow).toBe("hidden");
			expect(frame.style.wordSpacing).toBe("initial");
			expect(frame.style.lineHeight).toBe("initial");
		});

		it("should set visibility hidden on element and frame", () => {
			const view = createView();
			view.create();
			expect(view.element.style.visibility).toBe("hidden");
			expect(view.frame!.style.visibility).toBe("hidden");
		});

		it("should set initial dimensions to 0", () => {
			const view = createView();
			view.create();
			expect(view._width).toBe(0);
			expect(view._height).toBe(0);
		});

		it("should append frame to element", () => {
			const view = createView();
			view.create();
			expect(view.element.contains(view.frame!)).toBe(true);
		});

		it("should set width auto and height 0 for horizontal axis", () => {
			const view = createView(undefined, { axis: "horizontal" });
			const frame = view.create();
			expect(frame.style.width).toBe("auto");
			expect(frame.style.height).toBe("0px");
		});

		it("should set width 0 and height auto for vertical axis", () => {
			const view = createView(undefined, { axis: "vertical" });
			const frame = view.create();
			expect(frame.style.width).toBe("0px");
			expect(frame.style.height).toBe("auto");
		});
	});

	describe("size()", () => {
		it("should lock both for pre-paginated layout", () => {
			const layout = createMockLayout();
			layout.name = "pre-paginated";
			const view = createView(undefined, { layout: layout as unknown as undefined });
			view.layout = layout;
			view.create();
			view.size(800, 600);
			expect(view.lockedWidth).toBeDefined();
			expect(view.lockedHeight).toBeDefined();
		});

		it("should lock height for horizontal axis", () => {
			const view = createView(undefined, { axis: "horizontal" });
			view.create();
			view.size(800, 600);
			expect(view.lockedHeight).toBeDefined();
		});

		it("should lock width for vertical axis", () => {
			const view = createView(undefined, { axis: "vertical" });
			view.create();
			view.size(800, 600);
			expect(view.lockedWidth).toBeDefined();
		});

		it("should use settings dimensions when no args given", () => {
			const view = createView(undefined, { width: 1024, height: 768, axis: "horizontal" });
			view.create();
			view.size();
			expect(view.lockedHeight).toBeDefined();
		});
	});

	describe("lock()", () => {
		it("should set lockedWidth for width lock", () => {
			const view = createView();
			view.create();
			view.lock("width", 800, 600);
			expect(view.lockedWidth).toBeTypeOf("number");
		});

		it("should set lockedHeight for height lock", () => {
			const view = createView();
			view.create();
			view.lock("height", 800, 600);
			expect(view.lockedHeight).toBeTypeOf("number");
		});

		it("should set both for both lock", () => {
			const view = createView();
			view.create();
			view.lock("both", 800, 600);
			expect(view.lockedWidth).toBeTypeOf("number");
			expect(view.lockedHeight).toBeTypeOf("number");
		});

		it("should call resize after locking", () => {
			const view = createView();
			view.create();
			const handler = vi.fn();
			view.on(EVENTS.VIEWS.RESIZED, handler);
			view.lock("width", 800, 600);
			expect(handler).toHaveBeenCalled();
		});
	});

	describe("expand()", () => {
		it("should return early if no frame", () => {
			const view = createView();
			expect(() => view.expand()).not.toThrow();
		});

		it("should set _expanding guard during execution", () => {
			const view = createView();
			view.create();
			view.lockedWidth = 800;
			view.lockedHeight = 600;
			view.expand();
			expect(view._expanding).toBe(false);
		});

		it("should not re-enter when already expanding", () => {
			const view = createView();
			view.create();
			view._expanding = true;
			const originalWidth = view._width;
			view.expand();
			expect(view._width).toBe(originalWidth);
		});
	});

	describe("contentWidth() / contentHeight()", () => {
		it("should return frame scrollWidth", () => {
			const view = createView();
			view.create();
			expect(view.contentWidth()).toBe(view.frame!.scrollWidth);
		});

		it("should return frame scrollHeight", () => {
			const view = createView();
			view.create();
			expect(view.contentHeight()).toBe(view.frame!.scrollHeight);
		});
	});

	describe("resize()", () => {
		it("should set frame width and height styles", () => {
			const view = createView();
			view.create();
			view.resize(500, 400);
			expect(view.frame!.style.width).toBe("500px");
			expect(view.frame!.style.height).toBe("400px");
		});

		it("should track _width and _height", () => {
			const view = createView();
			view.create();
			view.resize(500, 400);
			expect(view._width).toBe(500);
			expect(view._height).toBe(400);
		});

		it("should emit resized event", () => {
			const view = createView();
			view.create();
			const handler = vi.fn();
			view.on(EVENTS.VIEWS.RESIZED, handler);
			view.resize(500, 400);
			expect(handler).toHaveBeenCalled();
		});

		it("should track prevBounds", () => {
			const view = createView();
			view.create();
			view.resize(500, 400);
			expect(view.prevBounds).toBeDefined();
		});

		it("should handle width-only resize (height = false)", () => {
			const view = createView();
			view.create();
			view.resize(500, false);
			expect(view.frame!.style.width).toBe("500px");
			expect(view._width).toBe(500);
		});

		it("should handle height-only resize (width = false)", () => {
			const view = createView();
			view.create();
			view.resize(false, 400);
			expect(view.frame!.style.height).toBe("400px");
			expect(view._height).toBe(400);
		});

		it("should return early if no frame", () => {
			const view = createView();
			expect(() => view.resize(500, 400)).not.toThrow();
		});
	});

	describe("load()", () => {
		it("should inject body content into frame", async () => {
			const view = createView();
			view.create();
			await view.load("<html><body><p>hello</p></body></html>");
			expect(view.frame!.innerHTML).toContain("<p>hello</p>");
		});

		it("should create Contents instance", async () => {
			const view = createView();
			view.create();
			const contents = await view.load("<html><body>test</body></html>");
			expect(view.contents).toBeDefined();
			expect(view.contents).toBe(contents);
		});

		it("should set document and window from frame owner", async () => {
			const view = createView();
			view.create();
			await view.load("<html><body>test</body></html>");
			expect(view.document).toBe(view.frame!.ownerDocument);
			expect(view.window).toBe(view.document.defaultView);
		});

		it("should set rendering to false", async () => {
			const view = createView();
			view.create();
			await view.load("<html><body>test</body></html>");
			expect(view.rendering).toBe(false);
		});
	});

	describe("display()", () => {
		it("should call render and set displayed to true", async () => {
			const view = createView();
			await view.display(vi.fn());
			expect(view.displayed).toBe(true);
		});

		it("should emit displayed event", async () => {
			const view = createView();
			const handler = vi.fn();
			view.on(EVENTS.VIEWS.DISPLAYED, handler);
			await view.display(vi.fn());
			expect(handler).toHaveBeenCalledWith(view);
		});

		it("should resolve immediately if already displayed", async () => {
			const view = createView();
			await view.display(vi.fn());
			const section = view.section as unknown as { render: ReturnType<typeof vi.fn> };
			section.render.mockClear();
			const result = await view.display(vi.fn());
			expect(result).toBe(view);
			expect(section.render).not.toHaveBeenCalled();
		});
	});

	describe("show()", () => {
		it("should set element visibility to visible", () => {
			const view = createView();
			view.create();
			view.element.style.visibility = "hidden";
			view.show();
			expect(view.element.style.visibility).toBe("visible");
		});

		it("should set frame visibility to visible", () => {
			const view = createView();
			view.create();
			view.show();
			expect(view.frame!.style.visibility).toBe("visible");
		});

		it("should emit shown event", () => {
			const view = createView();
			view.create();
			const handler = vi.fn();
			view.on(EVENTS.VIEWS.SHOWN, handler);
			view.show();
			expect(handler).toHaveBeenCalledWith(view);
		});
	});

	describe("hide()", () => {
		it("should set element visibility to hidden", () => {
			const view = createView();
			view.create();
			view.element.style.visibility = "visible";
			view.hide();
			expect(view.element.style.visibility).toBe("hidden");
		});

		it("should set frame visibility to hidden", () => {
			const view = createView();
			view.create();
			view.hide();
			expect(view.frame!.style.visibility).toBe("hidden");
		});

		it("should emit hidden event", () => {
			const view = createView();
			view.create();
			const handler = vi.fn();
			view.on(EVENTS.VIEWS.HIDDEN, handler);
			view.hide();
			expect(handler).toHaveBeenCalledWith(view);
		});

		it("should set stopExpanding to true", () => {
			const view = createView();
			view.create();
			view.hide();
			expect(view.stopExpanding).toBe(true);
		});
	});

	describe("position()", () => {
		it("should return a rect with position properties", () => {
			const view = createView();
			const rect = view.position();
			expect(rect).toHaveProperty("left");
			expect(rect).toHaveProperty("top");
			expect(rect).toHaveProperty("width");
			expect(rect).toHaveProperty("height");
		});
	});

	describe("bounds()", () => {
		it("should return element bounds", () => {
			const view = createView();
			const b = view.bounds();
			expect(b).toHaveProperty("width");
			expect(b).toHaveProperty("height");
		});

		it("should cache elementBounds", () => {
			const view = createView();
			const first = view.bounds();
			const second = view.bounds();
			expect(first).toBe(second);
		});
	});

	describe("setLayout()", () => {
		it("should update layout reference", () => {
			const view = createView();
			const newLayout = createMockLayout();
			view.setLayout(newLayout);
			expect(view.layout).toBe(newLayout);
		});
	});

	describe("destroy()", () => {
		it("should not throw when not displayed", () => {
			const view = createView();
			expect(() => view.destroy()).not.toThrow();
		});

		it("should remove frame and clear fields when displayed", () => {
			const view = createView();
			view.create();
			view.displayed = true;
			view.destroy();
			expect(view.displayed).toBe(false);
			expect(view.frame).toBeUndefined();
			expect(view._width).toBeUndefined();
			expect(view._height).toBeUndefined();
			expect(view._textWidth).toBeUndefined();
			expect(view._textHeight).toBeUndefined();
		});

		it("should set stopExpanding to true when displayed", () => {
			const view = createView();
			view.create();
			view.displayed = true;
			view.destroy();
			expect(view.stopExpanding).toBe(true);
		});
	});

	describe("onDisplayed() / onResize()", () => {
		it("should be callable stubs", () => {
			const view = createView();
			expect(() => view.onDisplayed(view)).not.toThrow();
			expect(() => view.onResize(view)).not.toThrow();
		});
	});

	describe("render()", () => {
		it("should call section.render with the request function", async () => {
			const section = createMockSection();
			const view = createView(section);
			const request = vi.fn();
			await view.render(request);
			expect((section as unknown as { render: ReturnType<typeof vi.fn> }).render).toHaveBeenCalledWith(request);
		});

		it("should emit rendered event", async () => {
			const view = createView();
			const handler = vi.fn();
			view.on(EVENTS.VIEWS.RENDERED, handler);
			await view.render(vi.fn());
			expect(handler).toHaveBeenCalledWith(view.section);
		});

		it("should call layout.format on contents", async () => {
			const view = createView();
			await view.render(vi.fn());
			expect((view.layout as unknown as { format: ReturnType<typeof vi.fn> }).format).toHaveBeenCalledWith(view.contents);
		});

		it("should show the view by default", async () => {
			const view = createView();
			await view.render(vi.fn());
			expect(view.element.style.visibility).toBe("visible");
		});

		it("should not show if show parameter is false", async () => {
			const view = createView();
			await view.render(vi.fn(), false);
			expect(view.element.style.visibility).toBe("hidden");
		});

		it("should emit loaderror on render failure", async () => {
			const section = createMockSection();
			(section as unknown as { render: ReturnType<typeof vi.fn> }).render.mockRejectedValue(new Error("fail"));
			const view = createView(section);
			const handler = vi.fn();
			view.on(EVENTS.VIEWS.LOAD_ERROR, handler);
			await view.render(vi.fn());
			expect(handler).toHaveBeenCalled();
		});
	});
});
