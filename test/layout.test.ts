import { describe, it, expect, vi } from "vitest";
import Layout, { sectionLayoutName } from "../src/layout";
import type Contents from "../src/contents";
import { sectionWith } from "./view-mocks";

function createMockContents(fits: boolean = true) {
	return {
		fit: vi.fn().mockReturnValue(fits),
		columns: vi.fn(),
		size: vi.fn(),
	};
}

describe("Layout", () => {

	describe("constructor defaults", () => {
		it("should default to reflowable layout", () => {
			const layout = new Layout({});
			expect(layout.name).toBe("reflowable");
		});

		it("should default to paginated flow", () => {
			const layout = new Layout({});
			expect(layout._flow).toBe("paginated");
		});

		it("should default spread to true", () => {
			const layout = new Layout({});
			expect(layout._spread).toBe(true);
		});

		it("should default minSpreadWidth to 800", () => {
			const layout = new Layout({});
			expect(layout._minSpreadWidth).toBe(800);
		});

		it("should set layout name from settings", () => {
			const layout = new Layout({ layout: "pre-paginated" });
			expect(layout.name).toBe("pre-paginated");
		});

		it("should set spread false when 'none'", () => {
			const layout = new Layout({ spread: "none" });
			expect(layout._spread).toBe(false);
		});
	});

	describe("flow()", () => {
		it("should return current flow when no argument", () => {
			const layout = new Layout({});
			expect(layout.flow()).toBe("paginated");
		});

		it("should set flow to scrolled for 'scrolled'", () => {
			const layout = new Layout({});
			layout.flow("scrolled");
			expect(layout.flow()).toBe("scrolled");
		});

		it("should normalize 'scrolled-continuous' to 'scrolled'", () => {
			const layout = new Layout({});
			layout.flow("scrolled-continuous");
			expect(layout.flow()).toBe("scrolled");
		});

		it("should normalize 'scrolled-doc' to 'scrolled'", () => {
			const layout = new Layout({});
			layout.flow("scrolled-doc");
			expect(layout.flow()).toBe("scrolled");
		});

		it("should set flow to paginated for other values", () => {
			const layout = new Layout({ flow: "scrolled" });
			layout.flow("paginated");
			expect(layout.flow()).toBe("paginated");
		});

		it("should normalize flow in constructor", () => {
			expect(new Layout({ flow: "scrolled" })._flow).toBe("scrolled");
			expect(new Layout({ flow: "scrolled-continuous" })._flow).toBe("scrolled");
			expect(new Layout({ flow: "scrolled-doc" })._flow).toBe("scrolled");
		});
	});

	describe("spread()", () => {
		it("should return current spread state when no argument", () => {
			const layout = new Layout({});
			expect(layout.spread()).toBe(true);
		});

		it("should set spread to false for 'none'", () => {
			const layout = new Layout({});
			layout.spread("none");
			expect(layout.spread()).toBe(false);
		});

		it("should set spread to true for 'always'", () => {
			const layout = new Layout({ spread: "none" });
			layout.spread("always");
			expect(layout.spread()).toBe(true);
		});

		it("should update minSpreadWidth", () => {
			const layout = new Layout({});
			layout.spread("auto", 1024);
			expect(layout._minSpreadWidth).toBe(1024);
		});
	});

	describe("calculate()", () => {
		it("should calculate single page (narrow width, no spread)", () => {
			const layout = new Layout({ spread: "none" });
			layout.calculate(600, 800);
			expect(layout.divisor).toBe(1);
			expect(layout.columnWidth).toBe(600);
			expect(layout.width).toBe(600);
			expect(layout.height).toBe(800);
		});

		it("should calculate double page spread", () => {
			const layout = new Layout({ spread: "auto", minSpreadWidth: 800 });
			layout.calculate(1200, 800, 20);
			expect(layout.divisor).toBe(2);
			expect(layout.columnWidth).toBe(580);
			expect(layout.gap).toBe(20);
			expect(layout.spreadWidth).toBe(1180);
		});

		it("should not spread when width < minSpreadWidth", () => {
			const layout = new Layout({ spread: "auto", minSpreadWidth: 800 });
			layout.calculate(600, 800, 20);
			expect(layout.divisor).toBe(1);
			expect(layout.columnWidth).toBe(600);
		});

		it("should set gap to 0 for pre-paginated", () => {
			const layout = new Layout({ layout: "pre-paginated" });
			layout.calculate(1024, 768);
			expect(layout.gap).toBe(0);
		});

		it("should auto-calculate gap for reflowable paginated without explicit gap", () => {
			const layout = new Layout({});
			layout.calculate(1200, 800);
			expect(layout.gap).toBeGreaterThan(0);
		});

		it("should use explicit gap when provided", () => {
			const layout = new Layout({ spread: "none" });
			layout.calculate(600, 800, 20);
			expect(layout.gap).toBe(20);
		});
	});

	describe("count()", () => {
		it("should return {spreads:1, pages:1} for pre-paginated", () => {
			const layout = new Layout({ layout: "pre-paginated" });
			const result = layout.count(5000);
			expect(result.spreads).toBe(1);
			expect(result.pages).toBe(1);
		});

		it("should calculate pages from totalLength/delta for paginated", () => {
			const layout = new Layout({ spread: "none" });
			layout.calculate(500, 800);
			const result = layout.count(2500);
			expect(result.spreads).toBe(5);
			expect(result.pages).toBe(5);
		});

		it("should calculate with divisor=2 for double spread", () => {
			const layout = new Layout({ spread: "auto", minSpreadWidth: 800 });
			layout.calculate(1200, 800, 20);
			const result = layout.count(6000);
			expect(result.spreads).toBe(5);
			expect(result.pages).toBe(10);
		});

		it("should use height for scrolled mode", () => {
			const layout = new Layout({ flow: "scrolled" });
			layout.calculate(600, 400);
			const result = layout.count(2000);
			expect(result.spreads).toBe(5);
			expect(result.pages).toBe(5);
		});
	});

	describe("sectionLayoutName()", () => {
		it("should fall back to the global layout without a section", () => {
			expect(sectionLayoutName(undefined, "reflowable")).toBe("reflowable");
			expect(sectionLayoutName(undefined, "pre-paginated")).toBe("pre-paginated");
		});

		it("should fall back to the global layout without rendition properties", () => {
			expect(sectionLayoutName(sectionWith(["page-spread-right"]), "reflowable")).toBe("reflowable");
		});

		it("should honor a per-itemref pre-paginated override", () => {
			const section = sectionWith(["rendition:layout-pre-paginated", "rendition:spread-none"]);
			expect(sectionLayoutName(section, "reflowable")).toBe("pre-paginated");
		});

		it("should honor a per-itemref reflowable override", () => {
			expect(sectionLayoutName(sectionWith(["rendition:layout-reflowable"]), "pre-paginated")).toBe("reflowable");
		});

		it("should tolerate a section with no properties", () => {
			expect(sectionLayoutName(sectionWith(), "reflowable")).toBe("reflowable");
		});
	});

	describe("format()", () => {
		it("should paginate a reflowable section of a reflowable book", () => {
			const layout = new Layout({});
			layout.calculate(800, 600, 20);
			const contents = createMockContents();
			layout.format(contents as unknown as Contents, sectionWith([]));

			expect(contents.columns).toHaveBeenCalled();
			expect(contents.fit).not.toHaveBeenCalled();
		});

		it("should fit a pre-paginated section of a reflowable book", () => {
			const layout = new Layout({});
			layout.calculate(800, 600, 20);
			const contents = createMockContents();
			const section = sectionWith(["rendition:layout-pre-paginated", "rendition:spread-none"]);
			layout.format(contents as unknown as Contents, section);

			expect(contents.fit).toHaveBeenCalledWith(layout.columnWidth, layout.height, section);
			expect(contents.columns).not.toHaveBeenCalled();
		});

		it("should paginate a reflowable section of a pre-paginated book", () => {
			const layout = new Layout({ layout: "pre-paginated" });
			layout.calculate(800, 600);
			const contents = createMockContents();
			layout.format(contents as unknown as Contents, sectionWith(["rendition:layout-reflowable"]));

			expect(contents.columns).toHaveBeenCalled();
			expect(contents.fit).not.toHaveBeenCalled();
		});

		it("should fall back to the global layout when no section is passed", () => {
			const layout = new Layout({ layout: "pre-paginated" });
			layout.calculate(800, 600);
			const contents = createMockContents();
			layout.format(contents as unknown as Contents);

			expect(contents.fit).toHaveBeenCalled();
			expect(contents.columns).not.toHaveBeenCalled();
		});

		it("should paginate when fit() declines for want of a viewport", () => {
			const layout = new Layout({});
			layout.calculate(800, 600, 20);
			const contents = createMockContents(false);
			layout.format(contents as unknown as Contents, sectionWith(["rendition:layout-pre-paginated"]));

			expect(contents.fit).toHaveBeenCalled();
			expect(contents.columns).toHaveBeenCalled();
		});

		it("should treat a void-returning fit() as fitted", () => {
			const layout = new Layout({ layout: "pre-paginated" });
			layout.calculate(800, 600);
			const contents = { fit: vi.fn(), columns: vi.fn(), size: vi.fn() };
			layout.format(contents as unknown as Contents);

			expect(contents.fit).toHaveBeenCalled();
			expect(contents.columns).not.toHaveBeenCalled();
		});

		it("should size instead of paginate in scrolled flow when fit() declines", () => {
			const layout = new Layout({ flow: "scrolled" });
			layout.calculate(800, 600);
			const contents = createMockContents(false);
			layout.format(contents as unknown as Contents, sectionWith(["rendition:layout-pre-paginated"]), "horizontal");

			expect(contents.size).toHaveBeenCalledWith(undefined, layout.height);
			expect(contents.columns).not.toHaveBeenCalled();
		});
	});
});
