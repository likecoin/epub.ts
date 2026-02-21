import { describe, it, expect, vi } from "vitest";
import Snap from "../src/managers/helpers/snap";
import type DefaultViewManager from "../src/managers/default/index";
import type Layout from "../src/layout";

function createMockManager(): DefaultViewManager {
	return {
		layout: {
			width: 800,
			height: 600,
			pageWidth: 400,
			divisor: 2,
			delta: 800,
		} as unknown as Layout,
		settings: {
			fullsize: false,
			axis: "horizontal",
			offset: 0,
			afterScrolledTimeout: 10,
			snap: false,
		},
		isPaginated: true,
		stage: {
			element: document.createElement("div"),
			container: document.createElement("div"),
		},
		on: vi.fn(),
		off: vi.fn(),
	} as unknown as DefaultViewManager;
}

describe("Snap", () => {

	describe("constructor", () => {
		it("should set default settings", () => {
			const snap = new Snap(createMockManager());
			expect(snap.settings.duration).toBe(80);
			expect(snap.settings.minVelocity).toBe(0.2);
			expect(snap.settings.minDistance).toBe(10);
			expect(typeof snap.settings.easing).toBe("function");
		});

		it("should merge custom options", () => {
			const snap = new Snap(createMockManager(), { duration: 200, minDistance: 20 });
			expect(snap.settings.duration).toBe(200);
			expect(snap.settings.minDistance).toBe(20);
		});

		it("should detect touch support", () => {
			const snap = new Snap(createMockManager());
			expect(typeof snap._supportsTouch).toBe("boolean");
		});
	});

	describe("supportsTouch()", () => {
		it("should return a boolean", () => {
			const snap = new Snap(createMockManager());
			expect(typeof snap.supportsTouch()).toBe("boolean");
		});
	});

	describe("needsSnap()", () => {
		it("should return true when not aligned to snap width", () => {
			const snap = new Snap(createMockManager());
			snap.layout = createMockManager().layout;
			snap.scrollLeft = 100; // not aligned to 400 * 2 = 800
			expect(snap.needsSnap()).toBe(true);
		});

		it("should return false when aligned to snap width", () => {
			const snap = new Snap(createMockManager());
			snap.layout = createMockManager().layout;
			snap.scrollLeft = 800; // aligned to 400 * 2 = 800
			expect(snap.needsSnap()).toBe(false);
		});

		it("should return false at position 0", () => {
			const snap = new Snap(createMockManager());
			snap.layout = createMockManager().layout;
			snap.scrollLeft = 0;
			expect(snap.needsSnap()).toBe(false);
		});
	});

	describe("wasSwiped()", () => {
		it("should return 0 when distance is below minDistance", () => {
			const snap = new Snap(createMockManager());
			snap.layout = createMockManager().layout;
			snap.startTouchX = 100;
			snap.endTouchX = 105; // distance = 5 < 10
			snap.startTime = 0;
			snap.endTime = 100;
			expect(snap.wasSwiped()).toBe(0);
		});

		it("should return -1 for fast positive swipe (previous)", () => {
			const snap = new Snap(createMockManager());
			snap.layout = createMockManager().layout;
			snap.startTouchX = 100;
			snap.endTouchX = 200; // distance = 100
			snap.startTime = 0;
			snap.endTime = 100; // velocity = 1.0 > 0.2
			expect(snap.wasSwiped()).toBe(-1);
		});

		it("should return 1 for fast negative swipe (next)", () => {
			const snap = new Snap(createMockManager());
			snap.layout = createMockManager().layout;
			snap.startTouchX = 200;
			snap.endTouchX = 100; // distance = -100
			snap.startTime = 0;
			snap.endTime = 100; // velocity = -1.0 < -0.2
			expect(snap.wasSwiped()).toBe(1);
		});

		it("should return 0 when velocity is below threshold", () => {
			const snap = new Snap(createMockManager());
			snap.layout = createMockManager().layout;
			snap.startTouchX = 100;
			snap.endTouchX = 120; // distance = 20
			snap.startTime = 0;
			snap.endTime = 1000; // velocity = 0.02 < 0.2
			expect(snap.wasSwiped()).toBe(0);
		});

		it("should return 0 when distance exceeds snap width", () => {
			const snap = new Snap(createMockManager());
			snap.layout = createMockManager().layout;
			snap.startTouchX = 0;
			snap.endTouchX = 900; // distance = 900 >= snapWidth 800
			snap.startTime = 0;
			snap.endTime = 100;
			expect(snap.wasSwiped()).toBe(0);
		});
	});

	describe("EASING_EQUATIONS", () => {
		it("should produce correct values for easing function at boundaries", () => {
			const snap = new Snap(createMockManager());
			// Default easing is easeInCubic: pos^3
			expect(snap.settings.easing(0)).toBe(0);
			expect(snap.settings.easing(1)).toBe(1);
			expect(snap.settings.easing(0.5)).toBeCloseTo(0.125);
		});
	});

	describe("now()", () => {
		it("should return a number", () => {
			const snap = new Snap(createMockManager());
			expect(typeof snap.now()).toBe("number");
		});
	});

	describe("destroy()", () => {
		it("should set scroller to undefined", () => {
			const snap = new Snap(createMockManager());
			// scroller is not set when touch is not supported, so destroy is a no-op
			expect(() => snap.destroy()).not.toThrow();
			expect(snap.scroller).toBeUndefined();
		});
	});
});
