import { qs } from "./core";
import Url from "./url";

export function replaceBase(doc: Document, section: { url: string }): void {
	let base;
	let url = section.url;
	const absolute = (url.indexOf("://") > -1);

	if(!doc){
		return;
	}

	const head = qs(doc, "head");
	base = qs(head!, "base");

	if(!base) {
		base = doc.createElement("base");
		head!.insertBefore(base, head!.firstChild);
	}

	// Fix for Safari crashing if the url doesn't have an origin
	if (!absolute && typeof window !== "undefined" && window.location) {
		url = window.location.origin + url;
	}

	base.setAttribute("href", url);
}

export function replaceCanonical(doc: Document, section: { canonical: string }): void {
	let link;
	const url = section.canonical;

	if(!doc){
		return;
	}

	const head = qs(doc, "head");
	link = qs(head!, "link[rel='canonical']");

	if (link) {
		link.setAttribute("href", url);
	} else {
		link = doc.createElement("link");
		link.setAttribute("rel", "canonical");
		link.setAttribute("href", url);
		head!.appendChild(link);
	}
}

export function replaceMeta(doc: Document, section: { idref: string }): void {
	let meta;
	const id = section.idref;
	if(!doc){
		return;
	}

	const head = qs(doc, "head");
	meta = qs(head!, "link[property='dc.identifier']");

	if (meta) {
		meta.setAttribute("content", id);
	} else {
		meta = doc.createElement("meta");
		meta.setAttribute("name", "dc.identifier");
		meta.setAttribute("content", id);
		head!.appendChild(meta);
	}
}

// TODO: move me to Contents
export function replaceLinks(contents: Element, fn: (path: string) => void): void {

	const links = contents.querySelectorAll("a[href]");

	if (!links.length) {
		return;
	}

	const base = qs(contents.ownerDocument, "base");
	const location = base ? base.getAttribute("href") ?? undefined : undefined;
	const replaceLink = function(link: Element): void {
		const href = link.getAttribute("href") ?? "";

		if(href.indexOf("mailto:") === 0){
			return;
		}

		const hrefTrimmed = href.trimStart().toLowerCase();
		if(hrefTrimmed.startsWith("javascript:") || hrefTrimmed.startsWith("data:text/html")){
			link.removeAttribute("href");
			return;
		}

		const absolute = (href.indexOf("://") > -1);

		if(absolute){

			link.setAttribute("target", "_blank");

		}else{
			let linkUrl: Url | undefined;
			try {
				linkUrl = new Url(href, location);
			} catch(_error) {
				// NOOP
			}

			(link as HTMLElement).onclick = function(): boolean {

				if(linkUrl && linkUrl.hash) {
					fn(linkUrl.Path.path + linkUrl.hash);
				} else if(linkUrl){
					fn(linkUrl.Path.path);
				} else {
					fn(href);
				}

				return false;
			};
		}
	};

	for (let i = 0; i < links.length; i++) {
		replaceLink(links[i]!);
	}


}

export function substitute(content: string, urls: string[], replacements: string[]): string {
	urls.forEach(function(url, i){
		if (url && replacements[i]) {
			// Also try decoded form for URLs with percent-encoded characters (e.g. CJK filenames)
			try {
				const decoded = decodeURIComponent(url);
				if (decoded !== url) {
					const escapedDecoded = decoded.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
					content = content.replace(new RegExp(escapedDecoded, "g"), replacements[i]);
				}
			} catch (_e) {
				// Invalid URI encoding, skip decoded replacement
			}
			// Account for special characters in the file name.
			// See https://stackoverflow.com/a/6318729.
			url = url.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
			content = content.replace(new RegExp(url, "g"), replacements[i]);
		}
	});
	return content;
}
