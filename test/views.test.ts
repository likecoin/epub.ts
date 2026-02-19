import { describe, it, expect, vi } from "vitest";
import Views from "../src/managers/helpers/views";
import type IframeView from "../src/managers/views/iframe";
import type Section from "../src/section";

function createMockView(index: number, displayed = true): IframeView {
	return {
		element: document.createElement("div"),
		displayed,
		index,
		section: { index } as Section,
		show: vi.fn(),
		hide: vi.fn(),
		destroy: vi.fn(),
	} as unknown as IframeView;
}

describe("Views", () => {
	function createViews(): Views {
		const container = document.createElement("div");
		return new Views(container);
	}

	describe("constructor", () => {
		it("should initialize with empty views and length 0", () => {
			const views = createViews();
			expect(views.all()).toEqual([]);
			expect(views.length).toBe(0);
			expect(views.hidden).toBe(false);
		});
	});

	describe("append()", () => {
		it("should add view to end and increment length", () => {
			const views = createViews();
			const v = createMockView(0);
			views.append(v);
			expect(views.length).toBe(1);
			expect(views.all()[0]).toBe(v);
		});

		it("should append element to container DOM", () => {
			const views = createViews();
			const v = createMockView(0);
			views.append(v);
			expect(views.container.children.length).toBe(1);
			expect(views.container.children[0]).toBe(v.element);
		});

		it("should return the appended view", () => {
			const views = createViews();
			const v = createMockView(0);
			expect(views.append(v)).toBe(v);
		});
	});

	describe("prepend()", () => {
		it("should add view to beginning and increment length", () => {
			const views = createViews();
			const v1 = createMockView(0);
			const v2 = createMockView(1);
			views.append(v1);
			views.prepend(v2);
			expect(views.length).toBe(2);
			expect(views.all()[0]).toBe(v2);
			expect(views.all()[1]).toBe(v1);
		});

		it("should prepend element to container DOM", () => {
			const views = createViews();
			const v1 = createMockView(0);
			const v2 = createMockView(1);
			views.append(v1);
			views.prepend(v2);
			expect(views.container.children[0]).toBe(v2.element);
		});
	});

	describe("insert()", () => {
		it("should insert view at specified index", () => {
			const views = createViews();
			const v1 = createMockView(0);
			const v2 = createMockView(1);
			const v3 = createMockView(2);
			views.append(v1);
			views.append(v3);
			views.insert(v2, 1);
			expect(views.length).toBe(3);
			expect(views.all()[1]).toBe(v2);
		});

		it("should insert element at correct DOM position", () => {
			const views = createViews();
			const v1 = createMockView(0);
			const v2 = createMockView(1);
			const v3 = createMockView(2);
			views.append(v1);
			views.append(v3);
			views.insert(v2, 1);
			expect(views.container.children[1]).toBe(v2.element);
		});

		it("should append to DOM when index exceeds children count", () => {
			const views = createViews();
			const v = createMockView(0);
			views.insert(v, 99);
			expect(views.container.children[0]).toBe(v.element);
		});
	});

	describe("remove()", () => {
		it("should remove view and decrement length", () => {
			const views = createViews();
			const v = createMockView(0);
			views.append(v);
			views.remove(v);
			expect(views.length).toBe(0);
			expect(views.all()).toEqual([]);
		});

		it("should call destroy on the view and remove from DOM", () => {
			const views = createViews();
			const v = createMockView(0);
			views.append(v);
			views.remove(v);
			expect(v.destroy).toHaveBeenCalled();
			expect(views.container.children.length).toBe(0);
		});
	});

	describe("first() / last()", () => {
		it("should return first and last views", () => {
			const views = createViews();
			const v1 = createMockView(0);
			const v2 = createMockView(1);
			views.append(v1);
			views.append(v2);
			expect(views.first()).toBe(v1);
			expect(views.last()).toBe(v2);
		});

		it("should return undefined when empty", () => {
			const views = createViews();
			expect(views.first()).toBeUndefined();
			expect(views.last()).toBeUndefined();
		});
	});

	describe("indexOf()", () => {
		it("should return index of view", () => {
			const views = createViews();
			const v1 = createMockView(0);
			const v2 = createMockView(1);
			views.append(v1);
			views.append(v2);
			expect(views.indexOf(v1)).toBe(0);
			expect(views.indexOf(v2)).toBe(1);
		});

		it("should return -1 for unknown view", () => {
			const views = createViews();
			expect(views.indexOf(createMockView(99))).toBe(-1);
		});
	});

	describe("get()", () => {
		it("should return view by index", () => {
			const views = createViews();
			const v = createMockView(0);
			views.append(v);
			expect(views.get(0)).toBe(v);
		});

		it("should return undefined for out-of-bounds index", () => {
			const views = createViews();
			expect(views.get(5)).toBeUndefined();
		});
	});

	describe("slice()", () => {
		it("should return a slice of views", () => {
			const views = createViews();
			const v1 = createMockView(0);
			const v2 = createMockView(1);
			const v3 = createMockView(2);
			views.append(v1);
			views.append(v2);
			views.append(v3);
			expect(views.slice(1, 3)).toEqual([v2, v3]);
		});
	});

	describe("forEach()", () => {
		it("should iterate all views", () => {
			const views = createViews();
			views.append(createMockView(0));
			views.append(createMockView(1));
			const indices: number[] = [];
			views.forEach((_v, i) => indices.push(i));
			expect(indices).toEqual([0, 1]);
		});
	});

	describe("find()", () => {
		it("should find view by section index", () => {
			const views = createViews();
			const v1 = createMockView(0);
			const v2 = createMockView(5);
			views.append(v1);
			views.append(v2);
			expect(views.find({ index: 5 } as Section)).toBe(v2);
		});

		it("should return undefined when not found", () => {
			const views = createViews();
			views.append(createMockView(0));
			expect(views.find({ index: 99 } as Section)).toBeUndefined();
		});

		it("should skip non-displayed views", () => {
			const views = createViews();
			const v = createMockView(0, false);
			views.append(v);
			expect(views.find({ index: 0 } as Section)).toBeUndefined();
		});
	});

	describe("displayed()", () => {
		it("should return only displayed views", () => {
			const views = createViews();
			const v1 = createMockView(0, true);
			const v2 = createMockView(1, false);
			const v3 = createMockView(2, true);
			views.append(v1);
			views.append(v2);
			views.append(v3);
			expect(views.displayed()).toEqual([v1, v3]);
		});
	});

	describe("show() / hide()", () => {
		it("should call show on all displayed views and set hidden=false", () => {
			const views = createViews();
			const v1 = createMockView(0, true);
			const v2 = createMockView(1, false);
			views.append(v1);
			views.append(v2);
			views.hidden = true;
			views.show();
			expect(v1.show).toHaveBeenCalled();
			expect(v2.show).not.toHaveBeenCalled();
			expect(views.hidden).toBe(false);
		});

		it("should call hide on all displayed views and set hidden=true", () => {
			const views = createViews();
			const v1 = createMockView(0, true);
			const v2 = createMockView(1, false);
			views.append(v1);
			views.append(v2);
			views.hide();
			expect(v1.hide).toHaveBeenCalled();
			expect(v2.hide).not.toHaveBeenCalled();
			expect(views.hidden).toBe(true);
		});
	});

	describe("clear()", () => {
		it("should destroy all views and reset length to 0", () => {
			const views = createViews();
			const v1 = createMockView(0);
			const v2 = createMockView(1);
			views.append(v1);
			views.append(v2);
			views.clear();
			expect(views.length).toBe(0);
			expect(views.all()).toEqual([]);
			expect(v1.destroy).toHaveBeenCalled();
			expect(v2.destroy).toHaveBeenCalled();
		});

		it("should no-op when already empty", () => {
			const views = createViews();
			expect(() => views.clear()).not.toThrow();
		});
	});
});
