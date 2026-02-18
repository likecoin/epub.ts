import {defer, isXml, parse} from "./utils/core";
import request from "./utils/request";
import mime from "./utils/mime";
import Path from "./utils/path";
import JSZip from "jszip";

/**
 * Handles Unzipping a requesting files from an Epub Archive
 * @class
 */
class Archive {
	zip: JSZip | undefined;
	urlCache: Record<string, string>;

	constructor() {
		this.zip = undefined!;
		this.urlCache = {};

		this.checkRequirements();

	}

	/**
	 * Checks to see if JSZip exists in global namspace,
	 * Requires JSZip if it isn't there
	 * @private
	 */
	checkRequirements(): void {
		try {
			this.zip = new JSZip();
		} catch (_e) {
			throw new Error("JSZip lib not loaded");
		}
	}

	/**
	 * Open an archive
	 * @param  {binary} input
	 * @param  {boolean} [isBase64] tells JSZip if the input data is base64 encoded
	 * @return {Promise} zipfile
	 */
	open(input: ArrayBuffer | string | Blob, isBase64?: boolean): Promise<JSZip> {
		return this.zip!.loadAsync(input, {"base64": isBase64});
	}

	/**
	 * Load and Open an archive
	 * @param  {string} zipUrl
	 * @param  {boolean} [isBase64] tells JSZip if the input data is base64 encoded
	 * @return {Promise} zipfile
	 */
	openUrl(zipUrl: string, isBase64?: boolean): Promise<JSZip> {
		return request(zipUrl, "binary")
			.then((data) => {
				return this.zip!.loadAsync(data as ArrayBuffer, {"base64": isBase64});
			});
	}

	/**
	 * Request a url from the archive
	 * @param  {string} url  a url to request from the archive
	 * @param  {string} [type] specify the type of the returned result
	 * @return {Promise<Blob | string | JSON | Document | XMLDocument>}
	 */
	request(url: string, type?: string): Promise<unknown> {
		const deferred = new defer<unknown>();
		let response;
		const path = new Path(url);

		// If type isn't set, determine it from the file extension
		if(!type) {
			type = path.extension;
		}

		if(type == "blob"){
			response = this.getBlob(url);
		} else {
			response = this.getText(url);
		}

		if (response) {
			response.then((r: string | Blob) => {
				const result = this.handleResponse(r, type);
				deferred.resolve(result);
			});
		} else {
			deferred.reject({
				message : "File not found in the epub: " + url,
				stack : new Error().stack
			});
		}
		return deferred.promise;
	}

	/**
	 * Handle the response from request
	 * @private
	 * @param  {any} response
	 * @param  {string} [type]
	 * @return {any} the parsed result
	 */
	handleResponse(response: string | Blob, type?: string): Document | object | Blob | string {
		let r;

		if(type == "json") {
			r = JSON.parse(response as string);
		}
		else
		if(isXml(type!)) {
			r = parse(response as string, "text/xml");
		}
		else
		if(type == "xhtml") {
			r = parse(response as string, "application/xhtml+xml");
		}
		else
		if(type == "html" || type == "htm") {
			r = parse(response as string, "text/html");
		 } else {
			 r = response;
		 }

		return r;
	}

	/**
	 * Get a Blob from Archive by Url
	 * @param  {string} url
	 * @param  {string} [mimeType]
	 * @return {Blob}
	 */
	getBlob(url: string, mimeType?: string): Promise<Blob> | undefined {
		const decodedUrl = decodeURIComponent(url.substr(1)); // Remove first slash
		const entry = this.zip!.file(decodedUrl);

		if(entry) {
			mimeType = mimeType || mime.lookup(entry.name);
			return entry.async("uint8array").then(function(uint8array: Uint8Array) {
				return new Blob([uint8array as BlobPart], {type : mimeType});
			});
		}
		return undefined;
	}

	/**
	 * Get Text from Archive by Url
	 * @param url
	 * @param _encoding
	 * @return text content
	 */
	getText(url: string, _encoding?: string): Promise<string> | undefined {
		const decodedUrl = decodeURIComponent(url.substr(1)); // Remove first slash
		const entry = this.zip!.file(decodedUrl);

		if(entry) {
			return entry.async("string").then(function(text: string) {
				return text;
			});
		}
		return undefined;
	}

	/**
	 * Get a base64 encoded result from Archive by Url
	 * @param  {string} url
	 * @param  {string} [mimeType]
	 * @return {string} base64 encoded
	 */
	getBase64(url: string, mimeType?: string): Promise<string> | undefined {
		const decodedUrl = decodeURIComponent(url.substr(1)); // Remove first slash
		const entry = this.zip!.file(decodedUrl);

		if(entry) {
			mimeType = mimeType || mime.lookup(entry.name);
			return entry.async("base64").then(function(data: string) {
				return "data:" + mimeType + ";base64," + data;
			});
		}
		return undefined;
	}

	/**
	 * Create a Url from an unarchived item
	 * @param  {string} url
	 * @param  {object} [options.base64] use base64 encoding or blob url
	 * @return {Promise} url promise with Url string
	 */
	createUrl(url: string, options?: { base64?: boolean }): Promise<string> {
		const deferred = new defer<string>();
		const _URL = typeof window !== "undefined" ? (window.URL || window.webkitURL || window.mozURL) : URL;
		let tempUrl;
		let response;
		const useBase64 = options && options.base64;

		if(url in this.urlCache) {
			deferred.resolve(this.urlCache[url]!);
			return deferred.promise;
		}

		if (useBase64) {
			response = this.getBase64(url);

			if (response) {
				response.then((tempUrl: string) => {

					this.urlCache[url] = tempUrl;
					deferred.resolve(tempUrl);

				});

			}

		} else {

			response = this.getBlob(url);

			if (response) {
				response.then((blob: Blob) => {

					tempUrl = _URL.createObjectURL(blob);
					this.urlCache[url] = tempUrl;
					deferred.resolve(tempUrl);

				});

			}
		}


		if (!response) {
			deferred.reject({
				message : "File not found in the epub: " + url,
				stack : new Error().stack
			});
		}

		return deferred.promise;
	}

	/**
	 * Revoke Temp Url for a archive item
	 * @param  {string} url url of the item in the archive
	 */
	revokeUrl(url: string): void {
		const _URL = typeof window !== "undefined" ? (window.URL || window.webkitURL || window.mozURL) : URL;
		const fromCache = this.urlCache[url];
		if(fromCache) _URL.revokeObjectURL(fromCache);
	}

	destroy(): void {
		const _URL = typeof window !== "undefined" ? (window.URL || window.webkitURL || window.mozURL) : URL;
		for (const key in this.urlCache) {
			const cachedUrl = this.urlCache[key];
			if (cachedUrl) _URL.revokeObjectURL(cachedUrl);
		}
		this.zip = undefined;
		this.urlCache = {};
	}
}

export default Archive;
