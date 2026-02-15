import {defer, isXml, parse} from "./utils/core";
import httpRequest from "./utils/request";
import mime from "./utils/mime";
import Path from "./utils/path";
import EventEmitter from "./utils/event-emitter";
import type { IEventEmitter, RequestFunction } from "./types";

interface SimpleStorage {
	getItem(key: string): Promise<Uint8Array | null>;
	setItem(key: string, value: Uint8Array): Promise<Uint8Array>;
}

function openIDB(name: string): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(name, 1);
		req.onupgradeneeded = (): void => {
			req.result.createObjectStore("data");
		};
		req.onsuccess = (): void => resolve(req.result);
		req.onerror = (): void => reject(req.error);
	});
}

function createStorage(name: string): SimpleStorage {
	const dbPromise = openIDB(name);

	return {
		getItem(key: string): Promise<Uint8Array | null> {
			return dbPromise.then((db) => new Promise((resolve, reject) => {
				const tx = db.transaction("data", "readonly");
				const req = tx.objectStore("data").get(key);
				req.onsuccess = (): void => resolve(req.result ?? null);
				req.onerror = (): void => reject(req.error);
			}));
		},
		setItem(key: string, value: Uint8Array): Promise<Uint8Array> {
			return dbPromise.then((db) => new Promise((resolve, reject) => {
				const tx = db.transaction("data", "readwrite");
				const req = tx.objectStore("data").put(value, key);
				req.onsuccess = (): void => resolve(value);
				req.onerror = (): void => reject(req.error);
			}));
		}
	};
}

const _URL = window.URL || window.webkitURL || window.mozURL;

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
	storage!: SimpleStorage;
	name: string;
	requester: RequestFunction;
	resolver: (href: string) => string;
	online: boolean;
	_status: ((event: Event) => void) | undefined;

	constructor(name: string, requester?: RequestFunction, resolver?: (href: string) => string) {
		this.urlCache = {};

		this.name = name;
		this.requester = requester || httpRequest;
		this.resolver = resolver!;

		this.online = true;

		this.checkRequirements();

		this.addListeners();
	}

	/**
	 * Checks that IndexedDB is available and creates the storage instance
	 * @private
	 */
	checkRequirements(): void {
		try {
			if (typeof indexedDB === "undefined") {
				throw new Error("IndexedDB not available");
			}
			this.storage = createStorage(this.name);
		} catch (_e) {
			throw new Error("IndexedDB not available");
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
	add(resources: { resources: Array<{ href: string }> }, force?: boolean): Promise<(Uint8Array | null)[]> {
		const mapped = resources.resources.map((item: { href: string }) => {
			const { href } = item;
			const url = this.resolver(href);
			const encodedUrl = window.encodeURIComponent(url);

			return this.storage.getItem(encodedUrl).then((item) => {
				if (!item || force) {
					return this.requester(url, "binary")
						.then((data: Uint8Array) => {
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
	put(url: string, withCredentials?: boolean, headers?: Record<string, string>): Promise<Uint8Array | null> {
		const encodedUrl = window.encodeURIComponent(url);

		return this.storage.getItem(encodedUrl).then((result) => {
			if (!result) {
				return this.requester(url, "binary", withCredentials, headers).then((data: Uint8Array) => {
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
	request(url: string, type?: string, withCredentials?: boolean, headers?: Record<string, string>): Promise<unknown> {
		if (this.online) {
			// From network
			return this.requester(url, type, withCredentials, headers).then((data: unknown) => {
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
	retrieve(url: string, type?: string): Promise<unknown> {
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
	 * @param  {string | Blob} response
	 * @param  {string} [type]
	 * @return {string | Document | Blob | object} the parsed result
	 */
	handleResponse(response: string | Blob, type?: string): string | Document | Blob | object {
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
	 * Get a Blob from Storage by Url
	 * @param  {string} url
	 * @param  {string} [mimeType]
	 * @return {Blob}
	 */
	getBlob(url: string, mimeType?: string): Promise<Blob | undefined> {
		const encodedUrl = window.encodeURIComponent(url);

		return this.storage.getItem(encodedUrl).then(function(uint8array) {
			if(!uint8array) return;

			mimeType = mimeType || mime.lookup(url);

			return new Blob([uint8array as BlobPart], {type : mimeType});
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

		return this.storage.getItem(encodedUrl).then(function(uint8array) {
			const deferred = new defer();
			const reader = new FileReader();

			if(!uint8array) return;

			const blob = new Blob([uint8array as BlobPart], {type : mimeType});

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

		return this.storage.getItem(encodedUrl).then((uint8array) => {
			const deferred = new defer();
			const reader = new FileReader();

			if(!uint8array) return;

			const blob = new Blob([uint8array as BlobPart], {type : mimeType});

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
		const fromCache = this.urlCache[url];
		if(fromCache) _URL.revokeObjectURL(fromCache);
	}

	destroy(): void {
		for (const fromCache in this.urlCache) {
			_URL.revokeObjectURL(fromCache);
		}
		this.urlCache = {};
		this.removeListeners();
	}
}

EventEmitter(Store.prototype);

export default Store;
