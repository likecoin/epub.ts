/**
 * Node.js parsing-only entry point for epub.ts.
 *
 * Requires `linkedom` as a peer dependency to provide DOMParser
 * and document globals that the parsing chain needs.
 *
 * Usage:
 *   import { Book } from "@likecoin/epub-ts/node";
 *   const book = new Book(buffer);
 *   await book.opened;
 */

import { DOMParser as LinkedomDOMParser, parseHTML } from "linkedom";

if (typeof globalThis.DOMParser === "undefined") {
	globalThis.DOMParser = LinkedomDOMParser as unknown as typeof globalThis.DOMParser;
}

if (typeof globalThis.XMLSerializer === "undefined") {
	globalThis.XMLSerializer = class XMLSerializer {
		serializeToString(node: Node): string {
			return (node as unknown as { toString(): string }).toString();
		}
	} as unknown as typeof globalThis.XMLSerializer;
}

if (typeof globalThis.document === "undefined") {
	const { document } = parseHTML("<!DOCTYPE html><html><head></head><body></body></html>");
	(globalThis as typeof globalThis & { document: Document }).document = document as Document;
}

export { default as Book } from "./book";
export { default as EpubCFI } from "./epubcfi";
export { default as Container } from "./container";
export { default as Packaging } from "./packaging";
export { default as Navigation } from "./navigation";
export { default as Spine } from "./spine";
export { default as Locations } from "./locations";
export { default as Section } from "./section";
export { default as Archive } from "./archive";
export { default as PageList } from "./pagelist";
export { default as Resources } from "./resources";
export { default as DisplayOptions } from "./displayoptions";
export { default as Layout } from "./layout";
export * from "./types";
