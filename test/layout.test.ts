import { describe, it, expect } from "vitest";
import Layout from "../src/layout";

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
});
