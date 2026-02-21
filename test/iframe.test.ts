import { describe, it, expect, vi } from "vitest";
import IframeView from "../src/managers/views/iframe";
import type Section from "../src/section";
import type Layout from "../src/layout";
import type { ViewSettings } from "../src/types";

function createMockSection(index: number = 0): Section {
	return {
		index,
		href: "chapter1.xhtml",
		cfiBase: "epubcfi(/6/2!)",
		canonical: "http://example.com/chapter1.xhtml",
		properties: [],
		render: vi.fn().mockResolvedValue("<html><body>test</body></html>"),
		next: vi.fn(),
		prev: vi.fn(),
	} as unknown as Section;
}

function createMockLayout(): Layout {
	return {
		name: "reflowable",
		width: 800,
		height: 600,
		columnWidth: 400,
		pageWidth: 400,
		spreadWidth: 800,
		gap: 20,
		delta: 800,
		divisor: 2,
		format: vi.fn(),
		props: {
			name: "reflowable",
			spread: true,
			flow: "paginated",
			width: 800,
			height: 600,
			spreadWidth: 800,
			columnWidth: 400,
			gap: 20,
			divisor: 2,
			delta: 800,
			pageWidth: 400,
		},
	} as unknown as Layout;
}

function createView(section?: Section, options?: Partial<ViewSettings>): IframeView {
	const s = section || createMockSection();
	return new IframeView(s, {
		ignoreClass: "",
		axis: "horizontal",
		direction: "ltr",
		width: 800,
		height: 600,
		layout: createMockLayout() as unknown as undefined,
		forceRight: false,
		allowScriptedContent: false,
		allowPopups: false,
		...options,
	} as ViewSettings);
}

describe("IframeView", () => {

	describe("constructor", () => {
		it("should set section and index from section", () => {
			const section = createMockSection(3);
			const view = createView(section);
			expect(view.section).toBe(section);
			expect(view.index).toBe(3);
		});

		it("should generate unique id starting with epubjs-view-", () => {
			const view = createView();
			expect(view.id).toMatch(/^epubjs-view-/);
		});

		it("should initialize flags to false", () => {
			const view = createView();
			expect(view.added).toBe(false);
			expect(view.displayed).toBe(false);
			expect(view.rendered).toBe(false);
		});

		it("should initialize empty highlight/underline/mark records", () => {
			const view = createView();
			expect(view.highlights).toEqual({});
			expect(view.underlines).toEqual({});
			expect(view.marks).toEqual({});
		});

		it("should initialize fixedWidth and fixedHeight to 0", () => {
			const view = createView();
			expect(view.fixedWidth).toBe(0);
			expect(view.fixedHeight).toBe(0);
		});

		it("should set pane to undefined", () => {
			const view = createView();
			expect(view.pane).toBeUndefined();
		});

		it("should merge settings with defaults", () => {
			const view = createView(undefined, { allowScriptedContent: true });
			expect(view.settings.allowScriptedContent).toBe(true);
			expect(view.settings.ignoreClass).toBe("");
		});
	});

	describe("container (via constructor)", () => {
		it("should create a div element with epub-view class", () => {
			const view = createView();
			expect(view.element).toBeInstanceOf(HTMLDivElement);
			expect(view.element.classList.contains("epub-view")).toBe(true);
		});

		it("should set default styles on the element", () => {
			const view = createView();
			expect(view.element.style.height).toBe("0px");
			expect(view.element.style.width).toBe("0px");
			expect(view.element.style.overflow).toBe("hidden");
			expect(view.element.style.position).toBe("relative");
			expect(view.element.style.display).toBe("block");
		});

		it("should set flex none for horizontal axis", () => {
			const view = createView(undefined, { axis: "horizontal" });
			expect(view.element.style.flex).toContain("0");
		});

		it("should set flex initial for vertical axis", () => {
			const view = createView(undefined, { axis: "vertical" });
			expect(["initial", "0 1 auto", ""]).toContain(view.element.style.flex);
		});
	});

	describe("create()", () => {
		it("should create an iframe element", () => {
			const view = createView();
			const iframe = view.create();
			expect(iframe).toBeInstanceOf(HTMLIFrameElement);
			expect(view.iframe).toBe(iframe);
		});

		it("should set iframe id to view id", () => {
			const view = createView();
			const iframe = view.create();
			expect(iframe.id).toBe(view.id);
		});

		it("should set scrolling to no", () => {
			const view = createView();
			const iframe = view.create();
			expect(iframe.scrolling).toBe("no");
		});

		it("should set sandbox to allow-same-origin by default", () => {
			const view = createView();
			const iframe = view.create();
			const sandbox = iframe.getAttribute("sandbox") || iframe.sandbox.toString();
			expect(sandbox).toContain("allow-same-origin");
		});

		it("should add allow-scripts when allowScriptedContent", () => {
			const view = createView(undefined, { allowScriptedContent: true });
			const iframe = view.create();
			const sandbox = iframe.getAttribute("sandbox") || iframe.sandbox.toString();
			expect(sandbox).toContain("allow-scripts");
		});

		it("should add allow-popups when allowPopups", () => {
			const view = createView(undefined, { allowPopups: true });
			const iframe = view.create();
			const sandbox = iframe.getAttribute("sandbox") || iframe.sandbox.toString();
			expect(sandbox).toContain("allow-popups");
		});

		it("should detect srcdoc support", () => {
			const view = createView();
			view.create();
			expect(typeof view.supportsSrcdoc).toBe("boolean");
		});

		it("should return existing iframe if already created", () => {
			const view = createView();
			const first = view.create();
			const second = view.create();
			expect(first).toBe(second);
		});

		it("should set added to true", () => {
			const view = createView();
			view.create();
			expect(view.added).toBe(true);
		});

		it("should set initial dimensions to 0", () => {
			const view = createView();
			view.create();
			expect(view._width).toBe(0);
			expect(view._height).toBe(0);
		});

		it("should set element visibility to hidden", () => {
			const view = createView();
			view.create();
			expect(view.element.style.visibility).toBe("hidden");
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

		it("should lock width for non-horizontal axis", () => {
			const view = createView(undefined, { axis: "vertical" });
			view.create();
			view.size(800, 600);
			expect(view.lockedWidth).toBeDefined();
		});

		it("should update settings width and height", () => {
			const view = createView();
			view.create();
			view.size(1024, 768);
			expect(view.settings.width).toBe(1024);
			expect(view.settings.height).toBe(768);
		});
	});

	describe("lock()", () => {
		it("should set lockedWidth for width lock", () => {
			const view = createView();
			view.create();
			view.lock("width", 800, 600);
			expect(view.lockedWidth).toBeDefined();
			expect(typeof view.lockedWidth).toBe("number");
		});

		it("should set lockedHeight for height lock", () => {
			const view = createView();
			view.create();
			view.lock("height", 800, 600);
			expect(view.lockedHeight).toBeDefined();
			expect(typeof view.lockedHeight).toBe("number");
		});

		it("should set both for both lock", () => {
			const view = createView();
			view.create();
			view.lock("both", 800, 600);
			expect(view.lockedWidth).toBeDefined();
			expect(view.lockedHeight).toBeDefined();
		});
	});

	describe("setAxis()", () => {
		it("should update settings.axis", () => {
			const view = createView(undefined, { axis: "vertical" });
			view.create();
			view.setAxis("horizontal");
			expect(view.settings.axis).toBe("horizontal");
		});

		it("should set flex none for horizontal", () => {
			const view = createView(undefined, { axis: "vertical" });
			view.create();
			view.setAxis("horizontal");
			expect(view.element.style.flex).toContain("0");
		});

		it("should set flex initial for vertical", () => {
			const view = createView(undefined, { axis: "horizontal" });
			view.create();
			view.setAxis("vertical");
			expect(["initial", "0 1 auto", ""]).toContain(view.element.style.flex);
		});
	});

	describe("setWritingMode()", () => {
		it("should store the writing mode", () => {
			const view = createView();
			view.setWritingMode("vertical-rl");
			expect(view.writingMode).toBe("vertical-rl");
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

	describe("show()", () => {
		it("should set element visibility to visible", () => {
			const view = createView();
			view.create();
			view.element.style.visibility = "hidden";
			view.show();
			expect(view.element.style.visibility).toBe("visible");
		});

		it("should set iframe visibility to visible", () => {
			const view = createView();
			view.create();
			view.show();
			expect(view.iframe!.style.visibility).toBe("visible");
		});

		it("should emit shown event", () => {
			const view = createView();
			view.create();
			const handler = vi.fn();
			view.on("shown", handler);
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

		it("should emit hidden event", () => {
			const view = createView();
			view.create();
			const handler = vi.fn();
			view.on("hidden", handler);
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

	describe("offset()", () => {
		it("should return top and left from element", () => {
			const view = createView();
			const result = view.offset();
			expect(result).toHaveProperty("top");
			expect(result).toHaveProperty("left");
			expect(typeof result.top).toBe("number");
			expect(typeof result.left).toBe("number");
		});
	});

	describe("width() / height()", () => {
		it("should return stored _width", () => {
			const view = createView();
			view._width = 500;
			expect(view.width()).toBe(500);
		});

		it("should return stored _height", () => {
			const view = createView();
			view._height = 400;
			expect(view.height()).toBe(400);
		});
	});

	describe("reset()", () => {
		it("should reset dimensions to 0/undefined", () => {
			const view = createView();
			view.create();
			view._width = 800;
			view._height = 600;
			view._textWidth = 100;
			view._contentWidth = 200;
			view.reset();
			expect(view._width).toBe(0);
			expect(view._height).toBe(0);
			expect(view._textWidth).toBeUndefined();
			expect(view._contentWidth).toBeUndefined();
			expect(view._textHeight).toBeUndefined();
			expect(view._contentHeight).toBeUndefined();
			expect(view._needsReframe).toBe(true);
		});
	});

	describe("reframe()", () => {
		it("should set element and iframe dimensions", () => {
			const view = createView();
			view.create();
			view.reframe(500, 400);
			expect(view.element.style.width).toBe("500px");
			expect(view.element.style.height).toBe("400px");
			expect(view.iframe!.style.width).toBe("500px");
			expect(view.iframe!.style.height).toBe("400px");
			expect(view._width).toBe(500);
			expect(view._height).toBe(400);
		});

		it("should emit resized event", () => {
			const view = createView();
			view.create();
			const handler = vi.fn();
			view.on("resized", handler);
			view.reframe(500, 400);
			expect(handler).toHaveBeenCalled();
			const arg = handler.mock.calls[0][0];
			expect(arg.width).toBe(500);
			expect(arg.height).toBe(400);
		});

		it("should track prevBounds", () => {
			const view = createView();
			view.create();
			view.reframe(500, 400);
			expect(view.prevBounds).toBeDefined();
			expect(view.prevBounds!.width).toBe(500);
			expect(view.prevBounds!.height).toBe(400);
		});
	});

	describe("destroy()", () => {
		it("should not throw when not displayed", () => {
			const view = createView();
			expect(() => view.destroy()).not.toThrow();
		});

		it("should clear __listeners", () => {
			const view = createView();
			view.on("shown", vi.fn());
			view.destroy();
			expect(view.__listeners).toEqual({});
		});
	});
});
