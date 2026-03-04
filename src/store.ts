import {handleResponse as _handleResponse, EpubError} from "./utils/core";
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

const _URL = typeof window !== "undefined" ? window.URL : undefined;

/**
 * Handles saving and requesting files from local storage
 * @class
 * @param {string} name This should be the name of the application for modals
 * @param {function} [requester]
 * @param {function} [resolver]
 */
export interface StoreEvents extends Record<string, any[]> {
	"online": [Store];
	"offline": [Store];
}

class Store implements IEventEmitter<StoreEvents> {
	declare on: IEventEmitter<StoreEvents>["on"];
	declare off: IEventEmitter<StoreEvents>["off"];
	declare emit: IEventEmitter<StoreEvents>["emit"];

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
			const encodedUrl = encodeURIComponent(url);

			return this.storage.getItem(encodedUrl).then((item) => {
				if (!item || force) {
					return this.requester(url, "binary")
						.then((data) => {
							return this.storage.setItem(encodedUrl, data as Uint8Array);
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
		const encodedUrl = encodeURIComponent(url);

		return this.storage.getItem(encodedUrl).then((result) => {
			if (!result) {
				return this.requester(url, "binary", withCredentials, headers).then((data) => {
					return this.storage.setItem(encodedUrl, data as Uint8Array);
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
	async retrieve(url: string, type?: string): Promise<unknown> {
		const path = new Path(url);

		// If type isn't set, determine it from the file extension
		if(!type) {
			type = path.extension;
		}

		const r = type === "blob"
			? await this.getBlob(url)
			: await this.getText(url);

		if (r) {
			return this.handleResponse(r, type);
		}

		throw new EpubError("File not found in storage: " + url);
	}

	/**
	 * Handle the response from request
	 * @private
	 * @param  {string | Blob} response
	 * @param  {string} [type]
	 * @return {string | Document | Blob | object} the parsed result
	 */
	handleResponse(response: string | Blob, type?: string): string | Document | Blob | object {
		return _handleResponse(response, type);
	}

	/**
	 * Get a Blob from Storage by Url
	 * @param  {string} url
	 * @param  {string} [mimeType]
	 * @return {Blob}
	 */
	getBlob(url: string, mimeType?: string): Promise<Blob | undefined> {
		const encodedUrl = encodeURIComponent(url);

		return this.storage.getItem(encodedUrl).then(function(uint8array) {
			if(!uint8array) return;

			mimeType = mimeType || mime.lookup(url);

			return new Blob([uint8array as BlobPart], {type : mimeType});
		});

	}

	/**
	 * Get Text from Storage by Url
	 * @param  {string} url
	 * @return {string}
	 */
	getText(url: string, _mimeType?: string): Promise<string | undefined> {
		const encodedUrl = encodeURIComponent(url);

		return this.storage.getItem(encodedUrl).then(function(uint8array) {
			if(!uint8array) return;
			return new TextDecoder().decode(uint8array as Uint8Array);
		});
	}

	/**
	 * Get a base64 encoded result from Storage by Url
	 * @param  {string} url
	 * @param  {string} [mimeType]
	 * @return {string} base64 encoded
	 */
	async getBase64(url: string, mimeType?: string): Promise<string | undefined> {
		const encodedUrl = encodeURIComponent(url);

		mimeType = mimeType || mime.lookup(url);

		const uint8array = await this.storage.getItem(encodedUrl);
		if(!uint8array) return;

		const blob = new Blob([uint8array as BlobPart], {type : mimeType});

		return new Promise<string>((resolve) => {
			const reader = new FileReader();
			reader.addEventListener("loadend", () => {
				resolve(reader.result as string);
			});
			reader.readAsDataURL(blob);
		});
	}

	/**
	 * Create a Url from a stored item
	 * @param  {string} url
	 * @param  {object} [options.base64] use base64 encoding or blob url
	 * @return {Promise} url promise with Url string
	 */
	async createUrl(url: string, options?: { base64?: boolean }): Promise<string> {
		if(url in this.urlCache) {
			return this.urlCache[url]!;
		}

		const useBase64 = options && options.base64;

		if (useBase64) {
			const tempUrl = await this.getBase64(url);
			if (tempUrl) {
				this.urlCache[url] = tempUrl;
				return tempUrl;
			}
		} else {
			const blob = await this.getBlob(url);
			if (blob) {
				const tempUrl = _URL!.createObjectURL(blob);
				this.urlCache[url] = tempUrl;
				return tempUrl;
			}
		}

		throw new EpubError("File not found in storage: " + url);
	}

	/**
	 * Revoke Temp Url for a archive item
	 * @param  {string} url url of the item in the store
	 */
	revokeUrl(url: string): void {
		const fromCache = this.urlCache[url];
		if(fromCache) _URL!.revokeObjectURL(fromCache);
	}

	destroy(): void {
		for (const key in this.urlCache) {
			const cachedUrl = this.urlCache[key];
			if(cachedUrl) _URL!.revokeObjectURL(cachedUrl);
		}
		this.urlCache = {};
		this.removeListeners();
	}
}

EventEmitter(Store.prototype);

export default Store;
