import {defer, isXml, parse} from "./utils/core";
import httpRequest from "./utils/request";
import mime from "./utils/mime";
import Path from "./utils/path";
import EventEmitter from "./utils/event-emitter";
import localforage from "localforage";
import type { IEventEmitter, RequestFunction } from "./types";

/**
 * Handles saving and requesting files from local storage
 * @class
 * @param {string} name This should be the name of the application for modals
 * @param {function} [requester]
 * @param {function} [resolver]
 */
class Store implements IEventEmitter {
	declare on: (type: string, fn: (...args: any[]) => void) => this;
	declare off: (type: string, fn?: (...args: any[]) => void) => this;
	declare emit: (type: string, ...args: any[]) => void;

	urlCache: Record<string, string>;
	storage!: LocalForage;
	name: string;
	requester: RequestFunction;
	resolver: (href: string) => string;
	online: boolean;
	_status: ((event: Event) => void) | undefined;

	constructor(name: string, requester?: RequestFunction, resolver?: (href: string) => string) {
		this.urlCache = {};

		// storage is set in checkRequirements() called below

		this.name = name;
		this.requester = requester || httpRequest;
		this.resolver = resolver!;

		this.online = true;

		this.checkRequirements();

		this.addListeners();
	}

	/**
	 * Checks to see if localForage exists in global namspace,
	 * Requires localForage if it isn't there
	 * @private
	 */
	checkRequirements(): void {
		try {
			if (typeof localforage === "undefined") {
				throw new Error("localForage lib not loaded");
			}
			this.storage = localforage.createInstance({
				name: this.name
			});
		} catch (_e) {
			throw new Error("localForage lib not loaded");
		}
	}

	/**
	 * Add online and offline event listeners
	 * @private
	 */
	addListeners(): void {
		this._status = this.status.bind(this);
		window.addEventListener("online",  this._status as EventListener);
	  window.addEventListener("offline", this._status as EventListener);
	}

	/**
	 * Remove online and offline event listeners
	 * @private
	 */
	removeListeners(): void {
		window.removeEventListener("online",  this._status as EventListener);
	  window.removeEventListener("offline", this._status as EventListener);
		this._status = undefined;
	}

	/**
	 * Update the online / offline status
	 * @private
	 */
	status(_event: Event): void {
		const online = navigator.onLine;
		this.online = online;
		if (online) {
			this.emit("online", this);
		} else {
			this.emit("offline", this);
		}
	}

	/**
	 * Add all of a book resources to the store
	 * @param  {Resources} resources  book resources
	 * @param  {boolean} [force] force resaving resources
	 * @return {Promise<object>} store objects
	 */
	add(resources: { resources: Array<{ href: string }> }, force?: boolean): Promise<any[]> {
		const mapped = resources.resources.map((item: { href: string }) => {
			const { href } = item;
			const url = this.resolver(href);
			const encodedUrl = window.encodeURIComponent(url);

			return this.storage.getItem(encodedUrl).then((item: any) => {
				if (!item || force) {
					return this.requester(url, "binary")
						.then((data: any) => {
							return this.storage.setItem(encodedUrl, data);
						});
				} else {
					return item;
				}
			});

		});
		return Promise.all(mapped);
	}

	/**
	 * Put binary data from a url to storage
	 * @param  {string} url  a url to request from storage
	 * @param  {boolean} [withCredentials]
	 * @param  {object} [headers]
	 * @return {Promise<Blob>}
	 */
	put(url: string, withCredentials?: boolean, headers?: Record<string, string>): Promise<any> {
		const encodedUrl = window.encodeURIComponent(url);

		return this.storage.getItem(encodedUrl).then((result: any) => {
			if (!result) {
				return this.requester(url, "binary", withCredentials, headers).then((data: any) => {
					return this.storage.setItem(encodedUrl, data);
				});
			}
			return result;
		});
	}

	/**
	 * Request a url
	 * @param  {string} url  a url to request from storage
	 * @param  {string} [type] specify the type of the returned result
	 * @param  {boolean} [withCredentials]
	 * @param  {object} [headers]
	 * @return {Promise<Blob | string | JSON | Document | XMLDocument>}
	 */
	request(url: string, type?: string, withCredentials?: boolean, headers?: Record<string, string>): Promise<any> {
		if (this.online) {
			// From network
			return this.requester(url, type, withCredentials, headers).then((data: any) => {
				// save to store if not present
				this.put(url);
				return data;
			})
		} else {
			// From store
			return this.retrieve(url, type);
		}

	}

	/**
	 * Request a url from storage
	 * @param  {string} url  a url to request from storage
	 * @param  {string} [type] specify the type of the returned result
	 * @return {Promise<Blob | string | JSON | Document | XMLDocument>}
	 */
	retrieve(url: string, type?: string): Promise<any> {
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


		return response.then((r) => {
			const deferred = new defer();
			let result;
			if (r) {
				result = this.handleResponse(r, type);
				deferred.resolve(result);
			} else {
				deferred.reject({
					message : "File not found in storage: " + url,
					stack : new Error().stack
				});
			}
			return deferred.promise;
		});
	}

	/**
	 * Handle the response from request
	 * @private
	 * @param  {any} response
	 * @param  {string} [type]
	 * @return {any} the parsed result
	 */
	handleResponse(response: any, type?: string): any {
		let r;

		if(type == "json") {
			r = JSON.parse(response);
		}
		else
		if(isXml(type!)) {
			r = parse(response, "text/xml");
		}
		else
		if(type == "xhtml") {
			r = parse(response, "application/xhtml+xml");
		}
		else
		if(type == "html" || type == "htm") {
			r = parse(response, "text/html");
		 } else {
			 r = response;
		 }

		return r;
	}

	/**
	 * Get a Blob from Storage by Url
	 * @param  {string} url
	 * @param  {string} [mimeType]
	 * @return {Blob}
	 */
	getBlob(url: string, mimeType?: string): Promise<Blob | undefined> {
		const encodedUrl = window.encodeURIComponent(url);

		return this.storage.getItem(encodedUrl).then(function(uint8array: any) {
			if(!uint8array) return;

			mimeType = mimeType || mime.lookup(url);

			return new Blob([uint8array], {type : mimeType});
		});

	}

	/**
	 * Get Text from Storage by Url
	 * @param  {string} url
	 * @param  {string} [mimeType]
	 * @return {string}
	 */
	getText(url: string, mimeType?: string): Promise<string | undefined> {
		const encodedUrl = window.encodeURIComponent(url);

		mimeType = mimeType || mime.lookup(url);

		return this.storage.getItem(encodedUrl).then(function(uint8array: any) {
			const deferred = new defer();
			const reader = new FileReader();

			if(!uint8array) return;

			const blob = new Blob([uint8array], {type : mimeType});

			reader.addEventListener("loadend", () => {
				deferred.resolve(reader.result);
			});

			reader.readAsText(blob, mimeType);

			return deferred.promise;
		});
	}

	/**
	 * Get a base64 encoded result from Storage by Url
	 * @param  {string} url
	 * @param  {string} [mimeType]
	 * @return {string} base64 encoded
	 */
	getBase64(url: string, mimeType?: string): Promise<string | undefined> {
		const encodedUrl = window.encodeURIComponent(url);

		mimeType = mimeType || mime.lookup(url);

		return this.storage.getItem(encodedUrl).then((uint8array: any) => {
			const deferred = new defer();
			const reader = new FileReader();

			if(!uint8array) return;

			const blob = new Blob([uint8array], {type : mimeType});

			reader.addEventListener("loadend", () => {
				deferred.resolve(reader.result);
			});
			reader.readAsDataURL(blob);

			return deferred.promise;
		});
	}

	/**
	 * Create a Url from a stored item
	 * @param  {string} url
	 * @param  {object} [options.base64] use base64 encoding or blob url
	 * @return {Promise} url promise with Url string
	 */
	createUrl(url: string, options?: { base64?: boolean }): Promise<string> {
		const deferred = new defer();
		const _URL = window.URL || (window as any).webkitURL || (window as any).mozURL;
		let tempUrl;
		let response;
		const useBase64 = options && options.base64;

		if(url in this.urlCache) {
			deferred.resolve(this.urlCache[url]);
			return deferred.promise;
		}

		if (useBase64) {
			response = this.getBase64(url);

			if (response) {
				response.then((tempUrl: string | undefined) => {

					if (!tempUrl) return;
					this.urlCache[url] = tempUrl;
					deferred.resolve(tempUrl);

				});

			}

		} else {

			response = this.getBlob(url);

			if (response) {
				response.then((blob: Blob | undefined) => {

					if (!blob) return;
					tempUrl = _URL.createObjectURL(blob);
					this.urlCache[url] = tempUrl;
					deferred.resolve(tempUrl);

				});

			}
		}


		if (!response) {
			deferred.reject({
				message : "File not found in storage: " + url,
				stack : new Error().stack
			});
		}

		return deferred.promise;
	}

	/**
	 * Revoke Temp Url for a archive item
	 * @param  {string} url url of the item in the store
	 */
	revokeUrl(url: string): void {
		const _URL = window.URL || (window as any).webkitURL || (window as any).mozURL;
		const fromCache = this.urlCache[url];
		if(fromCache) _URL.revokeObjectURL(fromCache);
	}

	destroy(): void {
		const _URL = window.URL || (window as any).webkitURL || (window as any).mozURL;
		for (const fromCache in this.urlCache) {
			_URL.revokeObjectURL(fromCache);
		}
		this.urlCache = {};
		this.removeListeners();
	}
}

EventEmitter(Store.prototype);

export default Store;
