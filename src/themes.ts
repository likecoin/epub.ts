import Url from "./utils/url";
import type Rendition from "./rendition";
import type Contents from "./contents";
import type { ThemeEntry } from "./types";

/**
 * Themes to apply to displayed content
 * @class
 * @param {Rendition} rendition
 */
class Themes {
	rendition: Rendition;
	_themes: Record<string, ThemeEntry>;
	_overrides: Record<string, { value: string; priority: boolean }>;
	_current: string;
	_injected: string[];

	constructor(rendition: Rendition) {
		this.rendition = rendition;
		this._themes = {
			"default" : {
				"rules" : {},
				"url" : "",
				"serialized" : ""
			}
		};
		this._overrides = {};
		this._current = "default";
		this._injected = [];
		this.rendition.hooks.content.register((contents: any) => this.inject(contents));
		this.rendition.hooks.content.register((contents: any) => this.overrides(contents));

	}

	/**
	 * Add themes to be used by a rendition
	 * @example themes.register("light", "http://example.com/light.css")
	 * @example themes.register("light", { "body": { "color": "purple"}})
	 * @example themes.register({ "light" : {...}, "dark" : {...}})
	 */
	register (...args: any[]): void {
		if (args.length === 0) {
			return;
		}
		if (args.length === 1 && typeof(args[0]) === "object") {
			return this.registerThemes(args[0]);
		}
		if (args.length === 1 && typeof(args[0]) === "string") {
			return this.default(args[0]);
		}
		if (args.length === 2 && typeof(args[1]) === "string") {
			return this.registerUrl(args[0], args[1]);
		}
		if (args.length === 2 && typeof(args[1]) === "object") {
			return this.registerRules(args[0], args[1]);
		}
	}

	/**
	 * Add a default theme to be used by a rendition
	 * @param {object | string} theme
	 * @example themes.register("http://example.com/default.css")
	 * @example themes.register({ "body": { "color": "purple"}})
	 */
	default (theme: string | Record<string, Record<string, string>>): void {
		if (!theme) {
			return;
		}
		if (typeof(theme) === "string") {
			return this.registerUrl("default", theme);
		}
		if (typeof(theme) === "object") {
			return this.registerRules("default", theme);
		}
	}

	/**
	 * Register themes object
	 * @param {object} themes
	 */
	registerThemes (themes: Record<string, string | Record<string, Record<string, string>>>): void {
		for (const theme in themes) {
			if (themes.hasOwnProperty(theme)) {
				const value = themes[theme]!;
				if (typeof(value) === "string") {
					this.registerUrl(theme, value);
				} else {
					this.registerRules(theme, value);
				}
			}
		}
	}

	/**
	 * Register a theme by passing its css as string
	 * @param {string} name 
	 * @param {string} css 
	 */
	registerCss (name: string, css: string): void {
		this._themes[name] = { "serialized" : css };
		if ((this._injected as unknown as Record<string, boolean>)[name] || name == "default") {
			this.update(name);
		}
	}

	/**
	 * Register a url
	 * @param {string} name
	 * @param {string} input
	 */
	registerUrl (name: string, input: string): void {
		const url = new Url(input);
		this._themes[name] = { "url": url.toString() };
		if ((this._injected as unknown as Record<string, boolean>)[name] || name == "default") {
			this.update(name);
		}
	}

	/**
	 * Register rule
	 * @param {string} name
	 * @param {object} rules
	 */
	registerRules (name: string, rules: Record<string, Record<string, string>>): void {
		this._themes[name] = { "rules": rules };
		// TODO: serialize css rules
		if ((this._injected as unknown as Record<string, boolean>)[name] || name == "default") {
			this.update(name);
		}
	}

	/**
	 * Select a theme
	 * @param {string} name
	 */
	select (name: string): void {
		const prev = this._current;

		this._current = name;
		this.update(name);

		const contents = this.rendition.getContents();
		contents.forEach( (content: Contents) => {
			content.removeClass(prev);
			content.addClass(name);
		});
	}

	/**
	 * Update a theme
	 * @param {string} name
	 */
	update (name: string): void {
		const contents = this.rendition.getContents();
		contents.forEach( (content: Contents) => {
			this.add(name, content);
		});
	}

	/**
	 * Inject all themes into contents
	 * @param {Contents} contents
	 */
	inject (contents: Contents): void {
		const links: string[] = [];
		const themes = this._themes;
		let theme;

		for (const name in themes) {
			if (themes.hasOwnProperty(name) && (name === this._current || name === "default")) {
				theme = themes[name]!;
				if((theme.rules && Object.keys(theme.rules).length > 0) || (theme.url && links.indexOf(theme.url) === -1)) {
					this.add(name, contents);
				}
				this._injected.push(name);
			}
		}

		if(this._current != "default") {
			contents.addClass(this._current);
		}
	}

	/**
	 * Add Theme to contents
	 * @param {string} name
	 * @param {Contents} contents
	 */
	add (name: string, contents: Contents): void {
		const theme = this._themes[name];

		if (!theme || !contents) {
			return;
		}

		if (theme.url) {
			contents.addStylesheet(theme.url);
		} else if (theme.serialized) {
			contents.addStylesheetCss(theme.serialized, name);
			theme.injected = true;
		} else if (theme.rules) {
			contents.addStylesheetRules(theme.rules, name);
			theme.injected = true;
		}
	}

	/**
	 * Add override
	 * @param {string} name
	 * @param {string} value
	 * @param {boolean} priority
	 */
	override (name: string, value: string, priority?: boolean): void {
		const contents = this.rendition.getContents();

		this._overrides[name] = {
			value: value,
			priority: priority === true
		};

		contents.forEach( (content: Contents) => {
			content.css(name, this._overrides[name]!.value, this._overrides[name]!.priority);
		});
	}

	removeOverride (name: string): void {
		const contents = this.rendition.getContents();

		delete this._overrides[name];

		contents.forEach( (content: Contents) => {
			content.css(name);
		});
	}

	/**
	 * Add all overrides
	 * @param contents - contents to apply overrides to
	 */
	overrides (contents: Contents): void {
		const overrides = this._overrides;

		for (const rule in overrides) {
			if (overrides.hasOwnProperty(rule)) {
				contents.css(rule, overrides[rule]!.value, overrides[rule]!.priority);
			}
		}
	}

	/**
	 * Adjust the font size of a rendition
	 * @param {number} size
	 */
	fontSize (size: string): void {
		this.override("font-size", size);
	}

	/**
	 * Adjust the font-family of a rendition
	 * @param {string} f
	 */
	font (f: string): void {
		this.override("font-family", f, true);
	}

	destroy(): void {
		(this as any).rendition = undefined;
		(this as any)._themes = undefined;
		(this as any)._overrides = undefined;
		(this as any)._current = undefined;
		(this as any)._injected = undefined;
	}

}

export default Themes;
