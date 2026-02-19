import { describe, it, expect, vi } from "vitest";
import Themes from "../src/themes";
import type Rendition from "../src/rendition";
import type Contents from "../src/contents";

function createMockContents(): Contents {
	return {
		addStylesheet: vi.fn(),
		addStylesheetCss: vi.fn(),
		addStylesheetRules: vi.fn(),
		addClass: vi.fn(),
		removeClass: vi.fn(),
		css: vi.fn(),
	} as unknown as Contents;
}

function createMockRendition(contents: Contents[] = []): Rendition {
	return {
		hooks: {
			content: { register: vi.fn() },
		},
		getContents: () => contents,
	} as unknown as Rendition;
}

describe("Themes", () => {
	describe("constructor", () => {
		it("should register content hooks", () => {
			const mock = createMockRendition();
			new Themes(mock);
			expect(mock.hooks.content.register).toHaveBeenCalledTimes(2);
		});

		it("should initialize with default theme and empty overrides", () => {
			const themes = new Themes(createMockRendition());
			expect(themes._themes!["default"]).toBeDefined();
			expect(themes._current).toBe("default");
			expect(themes._overrides).toEqual({});
			expect(themes._injected).toEqual([]);
		});
	});

	describe("registerUrl()", () => {
		it("should store a URL-based theme", () => {
			const themes = new Themes(createMockRendition());
			themes.registerUrl("dark", "http://example.com/dark.css");
			expect(themes._themes!["dark"]).toBeDefined();
			expect(themes._themes!["dark"]!.url).toBe("http://example.com/dark.css");
		});
	});

	describe("registerRules()", () => {
		it("should store a rules-based theme", () => {
			const themes = new Themes(createMockRendition());
			const rules = { "body": { "color": "white", "background": "black" } };
			themes.registerRules("dark", rules);
			expect(themes._themes!["dark"]!.rules).toBe(rules);
		});
	});

	describe("registerCss()", () => {
		it("should store serialized CSS string", () => {
			const themes = new Themes(createMockRendition());
			themes.registerCss("custom", "body { color: red; }");
			expect(themes._themes!["custom"]!.serialized).toBe("body { color: red; }");
		});
	});

	describe("register() dispatch", () => {
		it("should register URL theme with two string args", () => {
			const themes = new Themes(createMockRendition());
			themes.register("light", "http://example.com/light.css");
			expect(themes._themes!["light"]!.url).toBe("http://example.com/light.css");
		});

		it("should register rules theme with string + object args", () => {
			const themes = new Themes(createMockRendition());
			const rules = { "body": { "color": "purple" } };
			themes.register("light", rules);
			expect(themes._themes!["light"]!.rules).toBe(rules);
		});

		it("should register multiple themes with single object arg", () => {
			const themes = new Themes(createMockRendition());
			themes.register({
				"light": "http://example.com/light.css",
				"dark": { "body": { "color": "white" } },
			});
			expect(themes._themes!["light"]!.url).toBe("http://example.com/light.css");
			expect(themes._themes!["dark"]!.rules).toBeDefined();
		});

		it("should set default theme with single string arg", () => {
			const themes = new Themes(createMockRendition());
			themes.register("http://example.com/default.css");
			expect(themes._themes!["default"]!.url).toBe("http://example.com/default.css");
		});

		it("should no-op with no args", () => {
			const themes = new Themes(createMockRendition());
			expect(() => themes.register()).not.toThrow();
		});
	});

	describe("select()", () => {
		it("should update _current and add/remove class on contents", () => {
			const contents = createMockContents();
			const themes = new Themes(createMockRendition([contents]));
			themes.registerRules("dark", { "body": { "color": "white" } });
			themes.select("dark");
			expect(themes._current).toBe("dark");
			expect(contents.removeClass).toHaveBeenCalledWith("default");
			expect(contents.addClass).toHaveBeenCalledWith("dark");
		});
	});

	describe("add()", () => {
		it("should call addStylesheet for URL theme", () => {
			const contents = createMockContents();
			const themes = new Themes(createMockRendition());
			themes.registerUrl("dark", "http://example.com/dark.css");
			themes.add("dark", contents);
			expect(contents.addStylesheet).toHaveBeenCalledWith("http://example.com/dark.css");
		});

		it("should call addStylesheetCss for serialized theme", () => {
			const contents = createMockContents();
			const themes = new Themes(createMockRendition());
			themes.registerCss("custom", "body { color: red; }");
			themes.add("custom", contents);
			expect(contents.addStylesheetCss).toHaveBeenCalledWith("body { color: red; }", "custom");
		});

		it("should call addStylesheetRules for rules theme", () => {
			const contents = createMockContents();
			const themes = new Themes(createMockRendition());
			const rules = { "body": { "color": "green" } };
			themes.registerRules("green", rules);
			themes.add("green", contents);
			expect(contents.addStylesheetRules).toHaveBeenCalledWith(rules, "green");
		});

		it("should no-op for unknown theme name", () => {
			const contents = createMockContents();
			const themes = new Themes(createMockRendition());
			expect(() => themes.add("nonexistent", contents)).not.toThrow();
		});
	});

	describe("override() / removeOverride()", () => {
		it("should store override and apply via contents.css()", () => {
			const contents = createMockContents();
			const themes = new Themes(createMockRendition([contents]));
			themes.override("font-size", "18px");
			expect(themes._overrides!["font-size"]).toEqual({ value: "18px", priority: false });
			expect(contents.css).toHaveBeenCalledWith("font-size", "18px", false);
		});

		it("should store priority override", () => {
			const contents = createMockContents();
			const themes = new Themes(createMockRendition([contents]));
			themes.override("font-family", "serif", true);
			expect(themes._overrides!["font-family"]).toEqual({ value: "serif", priority: true });
			expect(contents.css).toHaveBeenCalledWith("font-family", "serif", true);
		});

		it("should remove override and reset via contents.css()", () => {
			const contents = createMockContents();
			const themes = new Themes(createMockRendition([contents]));
			themes.override("font-size", "18px");
			themes.removeOverride("font-size");
			expect(themes._overrides!["font-size"]).toBeUndefined();
			expect(contents.css).toHaveBeenCalledWith("font-size");
		});
	});

	describe("fontSize() / font()", () => {
		it("fontSize should call override with font-size", () => {
			const contents = createMockContents();
			const themes = new Themes(createMockRendition([contents]));
			themes.fontSize("20px");
			expect(themes._overrides!["font-size"]).toEqual({ value: "20px", priority: false });
		});

		it("font should call override with font-family and priority", () => {
			const contents = createMockContents();
			const themes = new Themes(createMockRendition([contents]));
			themes.font("Georgia");
			expect(themes._overrides!["font-family"]).toEqual({ value: "Georgia", priority: true });
		});
	});

	describe("destroy()", () => {
		it("should set all properties to undefined", () => {
			const themes = new Themes(createMockRendition());
			themes.destroy();
			expect(themes.rendition).toBeUndefined();
			expect(themes._themes).toBeUndefined();
			expect(themes._overrides).toBeUndefined();
			expect(themes._current).toBeUndefined();
			expect(themes._injected).toBeUndefined();
		});
	});
});
