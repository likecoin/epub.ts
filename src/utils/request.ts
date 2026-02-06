import {defer, isXml, parse} from "./core";
import Path from "./path";

function request(url: string, type?: string, withCredentials?: boolean, headers?: Record<string, string>): Promise<any> {
	const supportsURL = (typeof window != "undefined") ? window.URL : false; // TODO: fallback for url if window isn't defined
	const BLOB_RESPONSE: XMLHttpRequestResponseType = supportsURL ? "blob" : "arraybuffer";

	const deferred = new defer();

	const xhr = new XMLHttpRequest();

	//-- Check from PDF.js:
	//   https://github.com/mozilla/pdf.js/blob/master/web/compatibility.js
	const xhrPrototype = XMLHttpRequest.prototype;

	let header;

	if (!("overrideMimeType" in xhrPrototype)) {
		// IE10 might have response, but not overrideMimeType
		Object.defineProperty(xhrPrototype, "overrideMimeType", {
			value: function xmlHttpRequestOverrideMimeType() {}
		});
	}

	if(withCredentials) {
		xhr.withCredentials = true;
	}

	xhr.onreadystatechange = handler;
	xhr.onerror = err;

	xhr.open("GET", url, true);

	for(header in headers) {
		xhr.setRequestHeader(header, headers![header]);
	}

	if(type == "json") {
		xhr.setRequestHeader("Accept", "application/json");
	}

	// If type isn"t set, determine it from the file extension
	if(!type) {
		type = new Path(url).extension;
	}

	if(type == "blob"){
		xhr.responseType = BLOB_RESPONSE;
	}


	if(isXml(type)) {
		// xhr.responseType = "document";
		xhr.overrideMimeType("text/xml"); // for OPF parsing
	}

	if(type == "xhtml") {
		// xhr.responseType = "document";
	}

	if(type == "html" || type == "htm") {
		// xhr.responseType = "document";
	}

	if(type == "binary") {
		xhr.responseType = "arraybuffer";
	}

	xhr.send();

	function err(e: ProgressEvent) {
		deferred.reject(e);
	}

	function handler() {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			let responseXML: Document | null | false = false;

			if(xhr.responseType === "" || xhr.responseType === "document") {
				responseXML = xhr.responseXML;
			}

			if (xhr.status === 200 || xhr.status === 0 || responseXML) { //-- Firefox is reporting 0 for blob urls
				let r;

				if (!xhr.response && !responseXML) {
					deferred.reject({
						status: xhr.status,
						message : "Empty Response",
						stack : new Error().stack
					});
					return deferred.promise;
				}

				if (xhr.status === 403) {
					deferred.reject({
						status: xhr.status,
						response: xhr.response,
						message : "Forbidden",
						stack : new Error().stack
					});
					return deferred.promise;
				}
				if(responseXML){
					r = xhr.responseXML;
				} else
				if(isXml(type!)){
					// xhr.overrideMimeType("text/xml"); // for OPF parsing
					// If xhr.responseXML wasn't set, try to parse using a DOMParser from text
					r = parse(xhr.response, "text/xml");
				}else
				if(type == "xhtml"){
					r = parse(xhr.response, "application/xhtml+xml");
				}else
				if(type == "html" || type == "htm"){
					r = parse(xhr.response, "text/html");
				}else
				if(type == "json"){
					r = JSON.parse(xhr.response);
				}else
				if(type == "blob"){

					if(supportsURL) {
						r = xhr.response;
					} else {
						//-- Safari doesn't support responseType blob, so create a blob from arraybuffer
						r = new Blob([xhr.response]);
					}

				}else{
					r = xhr.response;
				}

				deferred.resolve(r);
			} else {

				deferred.reject({
					status: xhr.status,
					message : xhr.response,
					stack : new Error().stack
				});

			}
		}
	}

	return deferred.promise;
}

export default request;
