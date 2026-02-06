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
	settings: {
		replacements: string;
		archive: Archive;
		resolver: (href: string, absolute?: boolean) => string;
		request: RequestFunction;
	};
	manifest: PackagingManifestObject;
	resources: PackagingManifestItem[];
	replacementUrls: string[];
	html: PackagingManifestItem[];
	assets: PackagingManifestItem[];
	css: PackagingManifestItem[];
	urls: string[];
	cssUrls: string[];

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
				return manifest[key];
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
			});

		// Exclude HTML
		this.assets = this.resources.
			filter(function (item){
				if (item.type !== "application/xhtml+xml" &&
						item.type !== "text/html") {
					return true;
				}
			});

		// Only CSS
		this.css = this.resources.
			filter(function (item){
				if (item.type === "text/css") {
					return true;
				}
			});
	}

	/**
	 * Convert split resources into Urls
	 * @private
	 */
	splitUrls(): void {

		// All Assets Urls
		this.urls = this.assets.
			map(function(item: PackagingManifestItem) {
				return item.href;
			}.bind(this));

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
		var parsedUrl = new Url(url);
		var mimeType = mime.lookup(parsedUrl.filename);

		if (this.settings.archive) {
			return this.settings.archive.createUrl(url, {"base64": (this.settings.replacements === "base64")});
		} else {
			if (this.settings.replacements === "base64") {
				return this.settings.request(url, 'blob')
					.then((blob: Blob) => {
						return blob2base64(blob);
					})
					.then((base64: string) => {
						return createBase64Url(base64, mimeType)!;
					});
			} else {
				return this.settings.request(url, 'blob').then((blob: Blob) => {
					return createBlobUrl(blob, mimeType);
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
			return new Promise(function(resolve: (value: string[]) => void) {
				resolve(this.urls);
			}.bind(this));
		}

		var replacements = this.urls.map( (url) => {
				var absolute = this.settings.resolver(url);

				return this.createUrl(absolute).
					catch((err: Error): string | null => {
						console.error(err);
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
	replaceCss(archive?: Archive, resolver?: (href: string, absolute?: boolean) => string): Promise<(string | void)[]> {
		var replaced: Promise<string | void>[] = [];
		archive = archive || this.settings.archive;
		resolver = resolver || this.settings.resolver;
		this.cssUrls.forEach(function(href: string) {
			var replacement = this.createCssFile(href, archive, resolver)
				.then(function (replacementUrl: string) {
					// switch the url in the replacementUrls
					var indexInUrls = this.urls.indexOf(href);
					if (indexInUrls > -1) {
						this.replacementUrls[indexInUrls] = replacementUrl;
					}
				}.bind(this))


			replaced.push(replacement);
		}.bind(this));
		return Promise.all(replaced);
	}

	/**
	 * Create a new CSS file with the replaced URLs
	 * @private
	 * @param  {string} href the original css file
	 * @return {Promise}  returns a BlobUrl to the new CSS file or a data url
	 */
	createCssFile(href: string): Promise<string | void> {
		var newUrl;

		if (path.isAbsolute(href)) {
			return new Promise<void>(function(resolve){
				resolve();
			});
		}

		var absolute = this.settings.resolver(href);

		// Get the text of the css file from the archive
		var textResponse;

		if (this.settings.archive) {
			textResponse = this.settings.archive.getText(absolute);
		} else {
			textResponse = this.settings.request(absolute, "text");
		}

		// Get asset links relative to css file
		var relUrls = this.urls.map( (assetHref) => {
			var resolved = this.settings.resolver(assetHref);
			var relative = new Path(absolute).relative(resolved);

			return relative;
		});

		if (!textResponse) {
			// file not found, don't replace
			return new Promise<void>(function(resolve){
				resolve();
			});
		}

		return textResponse.then( (text: string) => {
			// Replacements in the css text
			text = substitute(text, relUrls, this.replacementUrls);

			// Get the new url
			if (this.settings.replacements === "base64") {
				newUrl = createBase64Url(text, "text/css");
			} else {
				newUrl = createBlobUrl(text, "text/css");
			}

			return newUrl;
		}, (err: Error) => {
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
			map(function(href: string) {
				var resolved = resolver(href);
				var relative = new Path(absolute).relative(resolved);
				return relative;
			}.bind(this));
	}

	/**
	 * Get a URL for a resource
	 * @param  {string} path
	 * @return {string} url
	 */
	get(path: string): Promise<string> | undefined {
		var indexInUrls = this.urls.indexOf(path);
		if (indexInUrls === -1) {
			return;
		}
		if (this.replacementUrls.length) {
			return new Promise(function(resolve: (value: string) => void, reject: (reason?: any) => void) {
				resolve(this.replacementUrls[indexInUrls]);
			}.bind(this));
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
		var relUrls;
		if (url) {
			relUrls = this.relativeTo(url);
		} else {
			relUrls = this.urls;
		}
		return substitute(content, relUrls, this.replacementUrls);
	}

	destroy(): void {
		(this as any).settings = undefined;
		(this as any).manifest = undefined;
		(this as any).resources = undefined;
		(this as any).replacementUrls = undefined;
		(this as any).html = undefined;
		(this as any).assets = undefined;
		(this as any).css = undefined;

		(this as any).urls = undefined;
		(this as any).cssUrls = undefined;
	}
}

export default Resources;
