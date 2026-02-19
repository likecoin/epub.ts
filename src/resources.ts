import {substitute} from "./utils/replacements";
import {createBase64Url, createBlobUrl, blob2base64} from "./utils/core";
import Url from "./utils/url";
import mime from "./utils/mime";
import Path from "./utils/path";
import path from "./utils/path-utils";
import type { PackagingManifestObject, PackagingManifestItem, RequestFunction } from "./types";
import type Archive from "./archive";

/**
 * Handle Package Resources
 * @class
 * @param {Manifest} manifest
 * @param {object} [options]
 * @param {string} [options.replacements="base64"]
 * @param {Archive} [options.archive]
 * @param {method} [options.resolver]
 */
class Resources {
	settings!: {
		replacements: string;
		archive: Archive;
		resolver: (href: string, absolute?: boolean) => string;
		request: RequestFunction;
	};
	manifest!: PackagingManifestObject;
	resources!: PackagingManifestItem[];
	replacementUrls!: string[];
	html!: PackagingManifestItem[];
	assets!: PackagingManifestItem[];
	css!: PackagingManifestItem[];
	urls!: string[];
	cssUrls!: string[];

	constructor(manifest: PackagingManifestObject, options?: { replacements?: string; archive?: Archive; resolver?: (href: string, absolute?: boolean) => string; request?: RequestFunction }) {
		this.settings = {
			replacements: (options && options.replacements) || "base64",
			archive: (options && options.archive)!,
			resolver: (options && options.resolver)!,
			request: (options && options.request)!
		};

		this.process(manifest);
	}

	/**
	 * Process resources
	 * @param {Manifest} manifest
	 */
	process(manifest: PackagingManifestObject): void {
		this.manifest = manifest;
		this.resources = Object.keys(manifest).
			map(function (key){
				return manifest[key]!;
			});

		this.replacementUrls = [];

		this.html = [];
		this.assets = [];
		this.css = [];

		this.urls = [];
		this.cssUrls = [];

		this.split();
		this.splitUrls();
	}

	/**
	 * Split resources by type
	 * @private
	 */
	split(): void {

		// HTML
		this.html = this.resources.
			filter(function (item){
				if (item.type === "application/xhtml+xml" ||
						item.type === "text/html") {
					return true;
				}
				return false;
			});

		// Exclude HTML
		this.assets = this.resources.
			filter(function (item){
				if (item.type !== "application/xhtml+xml" &&
						item.type !== "text/html") {
					return true;
				}
				return false;
			});

		// Only CSS
		this.css = this.resources.
			filter(function (item){
				if (item.type === "text/css") {
					return true;
				}
				return false;
			});
	}

	/**
	 * Convert split resources into Urls
	 * @private
	 */
	splitUrls(): void {

		// All Assets Urls
		this.urls = this.assets.
			map((item: PackagingManifestItem): string => {
				return item.href;
			});

		// Css Urls
		this.cssUrls = this.css.map(function(item) {
			return item.href;
		});

	}

	/**
	 * Create a url to a resource
	 * @param {string} url
	 * @return {Promise<string>} Promise resolves with url string
	 */
	createUrl (url: string): Promise<string> {
		const parsedUrl = new Url(url);
		const mimeType = mime.lookup(parsedUrl.filename);

		if (this.settings.archive) {
			return this.settings.archive.createUrl(url, {"base64": (this.settings.replacements === "base64")});
		} else {
			if (this.settings.replacements === "base64") {
				return this.settings.request(url, "blob")
					.then((blob) => {
						return blob2base64(blob as Blob);
					})
					.then((base64: string | ArrayBuffer) => {
						return createBase64Url(base64 as string, mimeType)!;
					});
			} else {
				return this.settings.request(url, "blob").then((blob) => {
					return createBlobUrl(blob as Blob, mimeType);
				})
			}
		}
	}

	/**
	 * Create blob urls for all the assets
	 * @return {Promise}         returns replacement urls
	 */
	replacements(): Promise<string[]> {
		if (this.settings.replacements === "none") {
			return new Promise((resolve: (value: string[]) => void) => {
				resolve(this.urls);
			});
		}

		const replacements = this.urls.map( (url) => {
				const absolute = this.settings.resolver(url);

				return this.createUrl(absolute).
					catch((_err: Error): string | null => {
						// eslint-disable-next-line no-console
						console.error(_err);
						return null;
					});
			});

		return Promise.all(replacements)
			.then( (replacementUrls) => {
				this.replacementUrls = replacementUrls.filter((url): url is string => {
					return (typeof(url) === "string");
				});
				return replacementUrls as string[];
			});
	}

	/**
	 * Replace URLs in CSS resources
	 * @private
	 * @param  {Archive} [archive]
	 * @param  {method} [resolver]
	 * @return {Promise}
	 */
	replaceCss(_archive?: Archive, _resolver?: (href: string, absolute?: boolean) => string): Promise<(string | void)[]> {
		const replaced: Promise<string | void>[] = [];
		this.cssUrls.forEach((href: string) => {
			const replacement = this.createCssFile(href)
				.then((replacementUrl) => {
					// switch the url in the replacementUrls
					const indexInUrls = this.urls.indexOf(href);
					if (replacementUrl && indexInUrls > -1) {
						this.replacementUrls[indexInUrls] = replacementUrl;
					}
				})


			replaced.push(replacement);
		});
		return Promise.all(replaced);
	}

	/**
	 * Create a new CSS file with the replaced URLs
	 * @private
	 * @param  {string} href the original css file
	 * @return {Promise}  returns a BlobUrl to the new CSS file or a data url
	 */
	createCssFile(href: string): Promise<string | void> {
		let newUrl;

		if (path.isAbsolute(href)) {
			return new Promise<void>(function(resolve){
				resolve();
			});
		}

		const absolute = this.settings.resolver(href);

		// Get the text of the css file from the archive
		let textResponse;

		if (this.settings.archive) {
			textResponse = this.settings.archive.getText(absolute);
		} else {
			textResponse = this.settings.request(absolute, "text");
		}

		// Get asset links relative to css file
		const relUrls = this.urls.map( (assetHref) => {
			const resolved = this.settings.resolver(assetHref);
			const relative = new Path(absolute).relative(resolved);

			return relative;
		});

		if (!textResponse) {
			// file not found, don't replace
			return new Promise<void>(function(resolve){
				resolve();
			});
		}

		return textResponse.then( (rawText) => {
			// Replacements in the css text
			const text = substitute(rawText as string, relUrls, this.replacementUrls);

			// Get the new url
			if (this.settings.replacements === "base64") {
				newUrl = createBase64Url(text, "text/css");
			} else {
				newUrl = createBlobUrl(text, "text/css");
			}

			return newUrl;
		}, (_err: Error) => {
			// handle response errors
			return new Promise<void>(function(resolve){
				resolve();
			});
		});

	}

	/**
	 * Resolve all resources URLs relative to an absolute URL
	 * @param  {string} absolute to be resolved to
	 * @param  {resolver} [resolver]
	 * @return {string[]} array with relative Urls
	 */
	relativeTo(absolute: string, resolver?: (href: string, absolute?: boolean) => string): string[] {
		resolver = resolver || this.settings.resolver;

		// Get Urls relative to current sections
		return this.urls.
			map((href: string): string => {
				const resolved = resolver(href);
				const relative = new Path(absolute).relative(resolved);
				return relative;
			});
	}

	/**
	 * Get a URL for a resource
	 * @param  {string} path
	 * @return {string} url
	 */
	get(path: string): Promise<string> | undefined {
		const indexInUrls = this.urls.indexOf(path);
		if (indexInUrls === -1) {
			return;
		}
		if (this.replacementUrls.length) {
			return new Promise((resolve: (value: string) => void, _reject: (reason?: unknown) => void) => {
				resolve(this.replacementUrls[indexInUrls]!);
			});
		} else {
			return this.createUrl(path);
		}
	}

	/**
	 * Substitute urls in content, with replacements,
	 * relative to a url if provided
	 * @param  {string} content
	 * @param  {string} [url]   url to resolve to
	 * @return {string}         content with urls substituted
	 */
	substitute(content: string, url?: string): string {
		let relUrls;
		if (url) {
			relUrls = this.relativeTo(url);
		} else {
			relUrls = this.urls;
		}
		return substitute(content, relUrls, this.replacementUrls);
	}

	destroy(): void {
		this.settings = undefined!;
		this.manifest = undefined!;
		this.resources = undefined!;
		this.replacementUrls = undefined!;
		this.html = undefined!;
		this.assets = undefined!;
		this.css = undefined!;

		this.urls = undefined!;
		this.cssUrls = undefined!;
	}
}

export default Resources;
