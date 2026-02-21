import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import Locations from "../src/locations";
import * as core from "../src/utils/core";
import { EVENTS } from "../src/utils/constants";
import type Spine from "../src/spine";
import type { RequestFunction } from "../src/types";

const fixturesDir = path.resolve(__dirname, "fixtures");

function createMockSpine(): Spine {
	return {
		each: vi.fn(),
	} as unknown as Spine;
}

function createMockRequest(): RequestFunction {
	return vi.fn(() => Promise.resolve({})) as unknown as RequestFunction;
}

function createLocations(): Locations {
	return new Locations(createMockSpine(), createMockRequest(), 50);
}

describe("Locations", () => {

	describe("#parse", () => {
		var chapter = fs.readFileSync(path.join(fixturesDir, "locations.xhtml"), "utf8");

		it("parse locations from a document", () => {
			var doc = core.parse(chapter, "application/xhtml+xml");
			var contents = doc.documentElement;
			var locations = new Locations();
			var result = locations.parse(contents, "/6/4[chap01ref]", 100);
			expect(result.length).toBe(15);
		});

	});

	describe("constructor", () => {
		it("stores spine, request, and pause", () => {
			const spine = createMockSpine();
			const request = createMockRequest();
			const loc = new Locations(spine, request, 200);
			expect(loc.spine).toBe(spine);
			expect(loc.request).toBe(request);
			expect(loc.pause).toBe(200);
		});

		it("defaults pause to 100", () => {
			const loc = new Locations(createMockSpine(), createMockRequest());
			expect(loc.pause).toBe(100);
		});

		it("initializes _locations, _locationsWords, total, break, _current, _wordCounter", () => {
			const loc = createLocations();
			expect(loc._locations).toEqual([]);
			expect(loc._locationsWords).toEqual([]);
			expect(loc.total).toBe(0);
			expect(loc.break).toBe(150);
			expect(loc._current).toBe(0);
			expect(loc._wordCounter).toBe(0);
		});
	});

	describe("load()", () => {
		it("loads from a JSON string", () => {
			const loc = createLocations();
			const arr = ["cfi1", "cfi2", "cfi3"];
			const result = loc.load(JSON.stringify(arr));
			expect(result).toEqual(arr);
			expect(loc._locations).toEqual(arr);
			expect(loc.total).toBe(2);
		});

		it("loads from a string array", () => {
			const loc = createLocations();
			const arr = ["cfi1", "cfi2"];
			const result = loc.load(arr);
			expect(result).toEqual(arr);
			expect(loc._locations).toEqual(arr);
			expect(loc.total).toBe(1);
		});

		it("sets total to length - 1", () => {
			const loc = createLocations();
			loc.load(["a", "b", "c", "d", "e"]);
			expect(loc.total).toBe(4);
		});
	});

	describe("save()", () => {
		it("returns JSON stringified _locations", () => {
			const loc = createLocations();
			const arr = ["cfi1", "cfi2", "cfi3"];
			loc.load(arr);
			expect(loc.save()).toBe(JSON.stringify(arr));
		});
	});

	describe("load→save round-trip", () => {
		it("round-trips locations through load and save", () => {
			const loc = createLocations();
			const arr = ["epubcfi(/6/4!/4/2/1:0)", "epubcfi(/6/4!/4/2/1:150)", "epubcfi(/6/4!/4/2/3:50)"];
			loc.load(arr);
			const saved = loc.save();
			expect(JSON.parse(saved)).toEqual(arr);
		});
	});

	describe("length()", () => {
		it("returns _locations length", () => {
			const loc = createLocations();
			loc.load(["a", "b", "c"]);
			expect(loc.length()).toBe(3);
		});

		it("returns 0 for empty locations", () => {
			const loc = createLocations();
			expect(loc.length()).toBe(0);
		});
	});

	describe("locationFromCfi()", () => {
		it("returns -1 when _locations is empty", () => {
			const loc = createLocations();
			expect(loc.locationFromCfi("epubcfi(/6/4!/4/2/1:0)")).toBe(-1);
		});

		it("returns a valid index for populated locations", () => {
			const loc = createLocations();
			loc.load(["epubcfi(/6/2!/4/2/1:0)", "epubcfi(/6/4!/4/2/1:0)", "epubcfi(/6/6!/4/2/1:0)"]);
			const result = loc.locationFromCfi("epubcfi(/6/4!/4/2/1:0)");
			expect(result).toBe(1);
		});
	});

	describe("percentageFromLocation()", () => {
		it("returns 0 for loc=0", () => {
			const loc = createLocations();
			loc.load(["a", "b", "c"]);
			expect(loc.percentageFromLocation(0)).toBe(0);
		});

		it("returns 0 when total is 0", () => {
			const loc = createLocations();
			expect(loc.percentageFromLocation(5)).toBe(0);
		});

		it("returns loc/total for valid inputs", () => {
			const loc = createLocations();
			loc.load(["a", "b", "c", "d", "e"]); // total = 4
			expect(loc.percentageFromLocation(2)).toBe(0.5);
			expect(loc.percentageFromLocation(4)).toBe(1);
		});
	});

	describe("percentageFromCfi()", () => {
		it("returns null when _locations is empty", () => {
			const loc = createLocations();
			expect(loc.percentageFromCfi("epubcfi(/6/4!/4/2/1:0)")).toBeNull();
		});

		it("returns a number for populated locations", () => {
			const loc = createLocations();
			loc.load(["epubcfi(/6/2!/4/2/1:0)", "epubcfi(/6/4!/4/2/1:0)", "epubcfi(/6/6!/4/2/1:0)"]);
			// total = 2, locationFromCfi returns 1 → 1/2 = 0.5
			const result = loc.percentageFromCfi("epubcfi(/6/4!/4/2/1:0)");
			expect(result).toBe(0.5);
		});
	});

	describe("cfiFromLocation()", () => {
		it("returns -1 for out-of-range index", () => {
			const loc = createLocations();
			loc.load(["cfi1", "cfi2"]);
			expect(loc.cfiFromLocation(5)).toBe(-1);
			expect(loc.cfiFromLocation(-1)).toBe(-1);
		});

		it("returns cfi string for valid index", () => {
			const loc = createLocations();
			loc.load(["cfi0", "cfi1", "cfi2"]);
			expect(loc.cfiFromLocation(0)).toBe("cfi0");
			expect(loc.cfiFromLocation(1)).toBe("cfi1");
			expect(loc.cfiFromLocation(2)).toBe("cfi2");
		});

		it("parses string loc to int", () => {
			const loc = createLocations();
			loc.load(["cfi0", "cfi1", "cfi2"]);
			expect(loc.cfiFromLocation("1" as unknown as number)).toBe("cfi1");
		});
	});

	describe("cfiFromPercentage()", () => {
		it("returns cfi for percentage in range", () => {
			const loc = createLocations();
			loc.load(["cfi0", "cfi1", "cfi2", "cfi3", "cfi4"]);
			// total = 4, 0.5 → ceil(4 * 0.5) = 2 → cfi2
			expect(loc.cfiFromPercentage(0.5)).toBe("cfi2");
		});

		it("warns for percentage > 1", () => {
			const loc = createLocations();
			loc.load(["epubcfi(/6/2!/4/2/1:0)", "epubcfi(/6/4!/4/2/1:0)", "epubcfi(/6/6!/4/2/1:0)"]);
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			loc.cfiFromPercentage(1.5);
			expect(warnSpy).toHaveBeenCalledWith("Normalize cfiFromPercentage value to between 0 - 1");
			warnSpy.mockRestore();
		});

		it("returns cfi for percentage = 0", () => {
			const loc = createLocations();
			loc.load(["cfi0", "cfi1", "cfi2"]);
			// total = 2, 0 → ceil(0) = 0 → cfi0
			expect(loc.cfiFromPercentage(0)).toBe("cfi0");
		});
	});

	describe("setCurrent()", () => {
		it("sets _currentCfi for string input", () => {
			const loc = createLocations();
			loc.load(["epubcfi(/6/2!/4/2/1:0)", "epubcfi(/6/4!/4/2/1:0)", "epubcfi(/6/6!/4/2/1:0)"]);
			loc.setCurrent("epubcfi(/6/4!/4/2/1:0)");
			expect(loc._currentCfi).toBe("epubcfi(/6/4!/4/2/1:0)");
		});

		it("sets _current for number input", () => {
			const loc = createLocations();
			loc.load(["cfi0", "cfi1", "cfi2"]);
			loc.setCurrent(1);
			expect(loc._current).toBe(1);
		});

		it("emits EVENTS.LOCATIONS.CHANGED with percentage", () => {
			const loc = createLocations();
			loc.load(["cfi0", "cfi1", "cfi2", "cfi3", "cfi4"]); // total = 4
			const handler = vi.fn();
			loc.on(EVENTS.LOCATIONS.CHANGED, handler);
			loc.setCurrent(2);
			expect(handler).toHaveBeenCalledWith({ percentage: 0.5 });
		});

		it("is a no-op for undefined", () => {
			const loc = createLocations();
			loc.load(["cfi0", "cfi1"]);
			const handler = vi.fn();
			loc.on(EVENTS.LOCATIONS.CHANGED, handler);
			loc.setCurrent(undefined);
			expect(handler).not.toHaveBeenCalled();
		});

		it("does not emit when _locations is empty", () => {
			const loc = createLocations();
			const handler = vi.fn();
			loc.on(EVENTS.LOCATIONS.CHANGED, handler);
			loc.setCurrent(2);
			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe("getCurrent()", () => {
		it("returns _current", () => {
			const loc = createLocations();
			loc.load(["cfi0", "cfi1", "cfi2"]);
			loc.setCurrent(2);
			expect(loc.getCurrent()).toBe(2);
		});
	});

	describe("currentLocation getter/setter", () => {
		it("getter returns _current", () => {
			const loc = createLocations();
			expect(loc.currentLocation).toBe(0);
		});

		it("setter delegates to setCurrent", () => {
			const loc = createLocations();
			loc.load(["cfi0", "cfi1", "cfi2"]);
			loc.currentLocation = 1;
			expect(loc._current).toBe(1);
		});
	});

	describe("countWords()", () => {
		it("counts words in a normal string", () => {
			const loc = createLocations();
			expect(loc.countWords("hello world foo")).toBe(3);
		});

		it("handles extra whitespace", () => {
			const loc = createLocations();
			expect(loc.countWords("  hello   world  ")).toBe(2);
		});

		it("counts a single word", () => {
			const loc = createLocations();
			expect(loc.countWords("word")).toBe(1);
		});

		it("does not split on newlines alone", () => {
			const loc = createLocations();
			// countWords splits on spaces only; bare newlines are not word boundaries
			expect(loc.countWords("hello\nworld")).toBe(1);
		});
	});

	describe("createRange()", () => {
		it("returns object with undefined start/end container/offset", () => {
			const loc = createLocations();
			const range = loc.createRange();
			expect(range.startContainer).toBeUndefined();
			expect(range.startOffset).toBeUndefined();
			expect(range.endContainer).toBeUndefined();
			expect(range.endOffset).toBeUndefined();
		});
	});

	describe("destroy()", () => {
		it("clears all references", () => {
			const loc = createLocations();
			loc.load(["cfi0", "cfi1"]);
			loc.destroy();
			expect(loc.spine).toBeUndefined();
			expect(loc.request).toBeUndefined();
			expect(loc.pause).toBeUndefined();
			expect(loc.q).toBeUndefined();
			expect(loc.epubcfi).toBeUndefined();
			expect(loc._locations).toBeUndefined();
			expect(loc.total).toBeUndefined();
			expect(loc.break).toBeUndefined();
			expect(loc._current).toBeUndefined();
			expect(loc._currentCfi).toBeUndefined();
		});
	});

});
