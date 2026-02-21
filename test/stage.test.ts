import { describe, it, expect } from "vitest";
import Stage from "../src/managers/helpers/stage";

describe("Stage", () => {

	describe("constructor", () => {
		it("should create a container div", () => {
			const stage = new Stage();
			expect(stage.container).toBeInstanceOf(HTMLDivElement);
		});

		it("should assign a unique id starting with epubjs-container-", () => {
			const stage = new Stage();
			expect(stage.id).toMatch(/^epubjs-container-/);
			expect(stage.container.id).toBe(stage.id);
		});

		it("should add epub-container class", () => {
			const stage = new Stage();
			expect(stage.container.classList.contains("epub-container")).toBe(true);
		});

		it("should set default styles on the container", () => {
			const stage = new Stage();
			const s = stage.container.style;
			expect(s.wordSpacing).toBe("0");
			expect(s.lineHeight).toBe("0");
			expect(s.verticalAlign).toBe("top");
			expect(s.position).toBe("relative");
		});

		it("should create a hidden wrapper when settings.hidden is true", () => {
			const stage = new Stage({ hidden: true });
			expect(stage.wrapper).toBeInstanceOf(HTMLDivElement);
			expect(stage.wrapper.style.visibility).toBe("hidden");
			expect(stage.wrapper.style.overflow).toBe("hidden");
			expect(stage.wrapper.contains(stage.container)).toBe(true);
		});

		it("should not create a wrapper when hidden is false", () => {
			const stage = new Stage({ hidden: false });
			expect(stage.wrapper).toBeUndefined();
		});

		it("should generate unique ids for different instances", () => {
			const a = new Stage();
			const b = new Stage();
			expect(a.id).not.toBe(b.id);
		});
	});

	describe("create()", () => {
		it("should set flex-direction row for horizontal axis", () => {
			const stage = new Stage({ axis: "horizontal" });
			expect(stage.container.style.display).toBe("flex");
			expect(stage.container.style.flexDirection).toBe("row");
			expect(stage.container.style.flexWrap).toBe("nowrap");
		});

		it("should not set flex display for vertical axis", () => {
			const stage = new Stage({ axis: "vertical" });
			expect(stage.container.style.display).not.toBe("flex");
		});

		it("should set width from options as px when number", () => {
			const stage = new Stage({ width: 800 });
			expect(stage.container.style.width).toBe("800px");
		});

		it("should set width from options as-is when string", () => {
			const stage = new Stage({ width: "50%" });
			expect(stage.container.style.width).toBe("50%");
		});

		it("should set height from options as px when number", () => {
			const stage = new Stage({ height: 600 });
			expect(stage.container.style.height).toBe("600px");
		});

		it("should set overflowY scroll for vertical scroll overflow", () => {
			const stage = new Stage({ overflow: "scroll", axis: "vertical" });
			expect(stage.container.style.overflowY).toBe("scroll");
			expect(stage.container.style.overflowX).toBe("hidden");
		});

		it("should set overflowX scroll for horizontal scroll overflow", () => {
			const stage = new Stage({ overflow: "scroll", axis: "horizontal" });
			expect(stage.container.style.overflowX).toBe("scroll");
			expect(stage.container.style.overflowY).toBe("hidden");
		});

		it("should set generic overflow for non-scroll values", () => {
			const stage = new Stage({ overflow: "hidden" });
			expect(stage.container.style.overflow).toBe("hidden");
		});

		it("should set direction on container", () => {
			const stage = new Stage({ direction: "rtl" });
			expect(stage.container.dir).toBe("rtl");
			expect(stage.container.style.direction).toBe("rtl");
		});
	});

	describe("attachTo()", () => {
		it("should append container to a DOM element", () => {
			const stage = new Stage();
			const parent = document.createElement("div");
			stage.attachTo(parent);
			expect(parent.contains(stage.container)).toBe(true);
			expect(stage.element).toBe(parent);
		});

		it("should append wrapper when hidden", () => {
			const stage = new Stage({ hidden: true });
			const parent = document.createElement("div");
			stage.attachTo(parent);
			expect(parent.contains(stage.wrapper)).toBe(true);
		});

		it("should find element by id string", () => {
			const stage = new Stage();
			const parent = document.createElement("div");
			parent.id = "test-stage-parent";
			document.body.appendChild(parent);
			stage.attachTo("test-stage-parent");
			expect(parent.contains(stage.container)).toBe(true);
			document.body.removeChild(parent);
		});

		it("should throw for non-existent string id", () => {
			const stage = new Stage();
			expect(() => stage.attachTo("nonexistent-id-12345")).toThrow("Not an Element");
		});
	});

	describe("getElement()", () => {
		it("should return the element when passed an HTMLElement", () => {
			const stage = new Stage();
			const el = document.createElement("div");
			expect(stage.getElement(el)).toBe(el);
		});

		it("should find element by string id", () => {
			const stage = new Stage();
			const el = document.createElement("div");
			el.id = "test-get-element";
			document.body.appendChild(el);
			expect(stage.getElement("test-get-element")).toBe(el);
			document.body.removeChild(el);
		});

		it("should throw for non-existent element", () => {
			const stage = new Stage();
			expect(() => stage.getElement("nope-does-not-exist")).toThrow("Not an Element");
		});
	});

	describe("size()", () => {
		it("should set container width as px for number input", () => {
			const stage = new Stage({ width: 100, height: 100 });
			const parent = document.createElement("div");
			stage.attachTo(parent);
			stage.size(800, 600);
			expect(stage.container.style.width).toBe("800px");
			expect(stage.container.style.height).toBe("600px");
		});

		it("should set container dimensions from string values", () => {
			const stage = new Stage({ width: 100, height: 100 });
			const parent = document.createElement("div");
			stage.attachTo(parent);
			stage.size("50%", "100vh");
			expect(stage.container.style.width).toBe("50%");
			expect(stage.container.style.height).toBe("100vh");
		});

		it("should return width and height object", () => {
			const stage = new Stage({ width: 100, height: 100 });
			const parent = document.createElement("div");
			stage.attachTo(parent);
			const result = stage.size(800, 600);
			expect(result).toHaveProperty("width");
			expect(result).toHaveProperty("height");
		});
	});

	describe("bounds()", () => {
		it("should return an object with width and height", () => {
			const stage = new Stage();
			const result = stage.bounds();
			expect(result).toHaveProperty("width");
			expect(result).toHaveProperty("height");
		});
	});

	describe("axis()", () => {
		it("should set flex-direction row for horizontal", () => {
			const stage = new Stage();
			stage.axis("horizontal");
			expect(stage.container.style.display).toBe("flex");
			expect(stage.container.style.flexDirection).toBe("row");
			expect(stage.container.style.flexWrap).toBe("nowrap");
			expect(stage.settings.axis).toBe("horizontal");
		});

		it("should set display block for vertical", () => {
			const stage = new Stage({ axis: "horizontal" });
			stage.axis("vertical");
			expect(stage.container.style.display).toBe("block");
			expect(stage.settings.axis).toBe("vertical");
		});
	});

	describe("direction()", () => {
		it("should set dir attribute and style on container", () => {
			const stage = new Stage();
			stage.direction("rtl");
			expect(stage.container.dir).toBe("rtl");
			expect(stage.container.style.direction).toBe("rtl");
			expect(stage.settings.dir).toBe("rtl");
		});

		it("should update body direction when fullsize", () => {
			const stage = new Stage({ fullsize: true });
			stage.direction("rtl");
			expect(document.body.style.direction).toBe("rtl");
			// Reset
			document.body.style.direction = "";
		});
	});

	describe("overflow()", () => {
		it("should set overflowY scroll for vertical axis", () => {
			const stage = new Stage({ axis: "vertical" });
			stage.overflow("scroll");
			expect(stage.container.style.overflowY).toBe("scroll");
			expect(stage.container.style.overflowX).toBe("hidden");
			expect(stage.settings.overflow).toBe("scroll");
		});

		it("should set overflowX scroll for horizontal axis", () => {
			const stage = new Stage({ axis: "horizontal" });
			stage.overflow("scroll");
			expect(stage.container.style.overflowX).toBe("scroll");
			expect(stage.container.style.overflowY).toBe("hidden");
		});

		it("should set generic overflow for non-scroll values", () => {
			const stage = new Stage();
			stage.overflow("hidden");
			expect(stage.container.style.overflow).toBe("hidden");
		});
	});

	describe("getSheet()", () => {
		it("should return a CSSStyleSheet", () => {
			const stage = new Stage();
			const sheet = stage.getSheet();
			expect(sheet).toBeDefined();
		});
	});

	describe("addStyleRules()", () => {
		it("should insert a scoped rule into the sheet", () => {
			const stage = new Stage();
			stage.addStyleRules("p", [{ "color": "red" }]);
			expect(stage.sheet).toBeDefined();
			expect(stage.sheet.cssRules.length).toBe(1);
			const rule = stage.sheet.cssRules[0] as CSSStyleRule;
			expect(rule.selectorText).toContain("#" + stage.id);
		});

		it("should reuse existing sheet on multiple calls", () => {
			const stage = new Stage();
			stage.addStyleRules("p", [{ "color": "red" }]);
			const sheet = stage.sheet;
			stage.addStyleRules("span", [{ "font-size": "14px" }]);
			expect(stage.sheet).toBe(sheet);
			expect(stage.sheet.cssRules.length).toBe(2);
		});
	});

	describe("destroy()", () => {
		it("should remove container from parent element", () => {
			const stage = new Stage();
			const parent = document.createElement("div");
			stage.attachTo(parent);
			expect(parent.contains(stage.container)).toBe(true);
			stage.destroy();
			expect(parent.contains(stage.container)).toBe(false);
		});

		it("should not throw when element is not set", () => {
			const stage = new Stage();
			expect(() => stage.destroy()).not.toThrow();
		});
	});
});
