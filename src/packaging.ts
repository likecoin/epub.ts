import {qs, qsa, qsp, indexOfElementNode} from "./utils/core";
import type { PackagingMetadataObject, PackagingSpineItem, PackagingManifestItem, PackagingManifestObject, PackagingObject, NavItem } from "./types";

export interface WebPubManifest {
	metadata: PackagingMetadataObject;
	readingOrder?: PackagingSpineItem[];
	spine?: PackagingSpineItem[];
	resources: (PackagingManifestItem & { rel?: string[] })[];
	toc: (NavItem & { title?: string })[];
}

/**
 * Open Packaging Format Parser
 */
class Packaging {
	manifest!: PackagingManifestObject;
	navPath!: string;
	ncxPath!: string;
	coverPath!: string;
	spineNodeIndex!: number;
	spine!: PackagingSpineItem[];
	metadata!: PackagingMetadataObject;
	uniqueIdentifier!: string;
	toc!: NavItem[];

	constructor(packageDocument?: Document) {
		this.manifest = {};
		this.navPath = "";
		this.ncxPath = "";
		this.coverPath = "";
		this.spineNodeIndex = 0;
		this.spine = [];
		this.metadata = {} as PackagingMetadataObject;

		if (packageDocument) {
			this.parse(packageDocument);
		}
	}

	/**
	 * Parse OPF XML
	 * @param  {document} packageDocument OPF XML
	 * @return {object} parsed package parts
	 */
	parse(packageDocument: Document): PackagingObject {
		if(!packageDocument) {
			throw new Error("Package File Not Found");
		}

		const metadataNode = qs(packageDocument, "metadata");
		if(!metadataNode) {
			throw new Error("No Metadata Found");
		}

		const manifestNode = qs(packageDocument, "manifest");
		if(!manifestNode) {
			throw new Error("No Manifest Found");
		}

		const spineNode = qs(packageDocument, "spine");
		if(!spineNode) {
			throw new Error("No Spine Found");
		}

		this.manifest = this.parseManifest(manifestNode);
		this.navPath = this.findNavPath(manifestNode);
		this.ncxPath = this.findNcxPath(manifestNode, spineNode);
		this.coverPath = this.findCoverPath(packageDocument);

		this.spineNodeIndex = indexOfElementNode(spineNode);

		this.spine = this.parseSpine(spineNode, this.manifest);

		this.uniqueIdentifier = this.findUniqueIdentifier(packageDocument);
		this.metadata = this.parseMetadata(metadataNode);

		this.metadata.direction = spineNode.getAttribute("page-progression-direction") ?? "";

		return {
			"metadata" : this.metadata,
			"spine"    : this.spine,
			"manifest" : this.manifest,
			"navPath"  : this.navPath,
			"ncxPath"  : this.ncxPath,
			"coverPath": this.coverPath,
			"spineNodeIndex" : this.spineNodeIndex
		};
	}

	/**
	 * Parse Metadata
	 * @private
	 * @param  {node} xml
	 * @return {object} metadata
	 */
	parseMetadata(xml: Element): PackagingMetadataObject {
		const metadata = {} as PackagingMetadataObject;

		metadata.title = this.getElementText(xml, "title");
		metadata.creator = this.getElementText(xml, "creator");
		metadata.description = this.getElementText(xml, "description");

		metadata.pubdate = this.getElementText(xml, "date");

		metadata.publisher = this.getElementText(xml, "publisher");

		metadata.identifier = this.getElementText(xml, "identifier");
		metadata.language = this.getElementText(xml, "language");
		metadata.rights = this.getElementText(xml, "rights");

		metadata.modified_date = this.getPropertyText(xml, "dcterms:modified");

		metadata.layout = this.getPropertyText(xml, "rendition:layout");
		metadata.orientation = this.getPropertyText(xml, "rendition:orientation");
		metadata.flow = this.getPropertyText(xml, "rendition:flow");
		metadata.viewport = this.getPropertyText(xml, "rendition:viewport");
		metadata.media_active_class = this.getPropertyText(xml, "media:active-class");
		metadata.spread = this.getPropertyText(xml, "rendition:spread");
		// metadata.page_prog_dir = packageXml.querySelector("spine").getAttribute("page-progression-direction");

		return metadata;
	}

	/**
	 * Parse Manifest
	 * @private
	 * @param  {node} manifestXml
	 * @return {object} manifest
	 */
	parseManifest(manifestXml: Element): PackagingManifestObject {
		const manifest: PackagingManifestObject = {};

		//-- Turn items into an array
		// var selected = manifestXml.querySelectorAll("item");
		const selected = qsa(manifestXml, "item");
		const items = Array.from(selected);

		//-- Create an object with the id as key
		items.forEach(function(item: Element){
			const id = item.getAttribute("id") ?? "",
					href = item.getAttribute("href") || "",
					type = item.getAttribute("media-type") || "",
					overlay = item.getAttribute("media-overlay") || "",
					properties = item.getAttribute("properties") || "",
					fallback = item.getAttribute("fallback") || "";

			manifest[id] = {
				"href" : href,
				// "url" : href,
				"type" : type,
				"overlay" : overlay,
				"properties" : properties.length ? properties.split(" ") : [],
				"fallback" : fallback,
			};

		});

		return manifest;

	}

	/**
	 * Parse Spine
	 * @private
	 * @param  {node} spineXml
	 * @param  {Packaging.manifest} manifest
	 * @return {object} spine
	 */
	parseSpine(spineXml: Element, _manifest: PackagingManifestObject): PackagingSpineItem[] {
		const spine: PackagingSpineItem[] = [];

		const selected = qsa(spineXml, "itemref");
		const items = Array.from(selected);

		// var epubcfi = new EpubCFI();

		//-- Add to array to maintain ordering and cross reference with manifest
		items.forEach(function(item: Element, index: number){
			const idref = item.getAttribute("idref");
			// var cfiBase = epubcfi.generateChapterComponent(spineNodeIndex, index, Id);
			const props = item.getAttribute("properties") || "";
			const propArray = props.length ? props.split(" ") : [];
			// var manifestProps = manifest[Id].properties;
			// var manifestPropArray = manifestProps.length ? manifestProps.split(" ") : [];

			const itemref = {
				"id" : item.getAttribute("id") ?? undefined,
				"idref" : idref!,
				"linear" : item.getAttribute("linear") || "yes",
				"properties" : propArray,
				// "href" : manifest[Id].href,
				// "url" :  manifest[Id].url,
				"index" : index
				// "cfiBase" : cfiBase
			};
			spine.push(itemref);
		});

		return spine;
	}

	/**
	 * Find Unique Identifier
	 * @private
	 * @param  {node} packageXml
	 * @return {string} Unique Identifier text
	 */
	findUniqueIdentifier(packageXml: Document): string {
		const uniqueIdentifierId = packageXml.documentElement.getAttribute("unique-identifier");
		if (! uniqueIdentifierId) {
			return "";
		}
		const identifier = packageXml.getElementById(uniqueIdentifierId);
		if (! identifier) {
			return "";
		}

		if (identifier.localName === "identifier" && identifier.namespaceURI === "http://purl.org/dc/elements/1.1/") {
			return identifier.childNodes.length > 0 ? (identifier.childNodes[0]!.nodeValue ?? "").trim() : "";
		}

		return "";
	}

	/**
	 * Find TOC NAV
	 * @private
	 * @param {element} manifestNode
	 * @return {string}
	 */
	findNavPath(manifestNode: Element): string {
		// Find item with property "nav"
		// Should catch nav regardless of order
		// var node = manifestNode.querySelector("item[properties$='nav'], item[properties^='nav '], item[properties*=' nav ']");
		const node = qsp(manifestNode, "item", {"properties":"nav"});
		return node ? node.getAttribute("href") || "" : "";
	}

	/**
	 * Find TOC NCX
	 * media-type="application/x-dtbncx+xml" href="toc.ncx"
	 * @private
	 * @param {element} manifestNode
	 * @param {element} spineNode
	 * @return {string}
	 */
	findNcxPath(manifestNode: Element, spineNode: Element): string {
		// var node = manifestNode.querySelector("item[media-type='application/x-dtbncx+xml']");
		let node = qsp(manifestNode, "item", {"media-type":"application/x-dtbncx+xml"});
		let tocId;

		// If we can't find the toc by media-type then try to look for id of the item in the spine attributes as
		// according to http://www.idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2,
		// "The item that describes the NCX must be referenced by the spine toc attribute."
		if (!node) {
			tocId = spineNode.getAttribute("toc");
			if(tocId) {
				// node = manifestNode.querySelector("item[id='" + tocId + "']");
				node = manifestNode.querySelector(`#${tocId}`) ?? undefined;
			}
		}

		return node ? node.getAttribute("href") || "" : "";
	}

	/**
	 * Find the Cover Path
	 * <item properties="cover-image" id="ci" href="cover.svg" media-type="image/svg+xml" />
	 * Fallback for Epub 2.0
	 * @private
	 * @param  {node} packageXml
	 * @return {string} href
	 */
	findCoverPath(packageXml: Document): string {
		const pkg = qs(packageXml, "package");
		const _epubVersion = pkg?.getAttribute("version");

		// Try parsing cover with epub 3.
		// var node = packageXml.querySelector("item[properties='cover-image']");
		const node = qsp(packageXml, "item", {"properties":"cover-image"});
		if (node) return node.getAttribute("href") ?? "";

		// Fallback to epub 2.
		const metaCover = qsp(packageXml, "meta", {"name":"cover"});

		if (metaCover) {
			const coverId = metaCover.getAttribute("content");
			// var cover = packageXml.querySelector("item[id='" + coverId + "']");
			const cover = packageXml.getElementById(coverId!);
			return cover ? cover.getAttribute("href") ?? "" : "";
		}
		else {
			return "";
		}
	}

	/**
	 * Get text of a namespaced element
	 * @private
	 * @param  {node} xml
	 * @param  {string} tag
	 * @return {string} text
	 */
	getElementText(xml: Element, tag: string): string {
		let found = xml.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", tag);

		// Fallback for parsers without XML namespace support (e.g. linkedom)
		if (!found || found.length === 0) {
			found = xml.getElementsByTagName(`dc:${tag}`);
		}

		if(!found || found.length === 0) return "";

		const el = found[0]!;

		if(el.childNodes.length){
			return el.childNodes[0]!.nodeValue ?? "";
		}

		return "";

	}

	/**
	 * Get text by property
	 * @private
	 * @param  {node} xml
	 * @param  {string} property
	 * @return {string} text
	 */
	getPropertyText(xml: Element, property: string): string {
		const el = qsp(xml, "meta", {"property":property});

		if(el && el.childNodes.length){
			return el.childNodes[0]!.nodeValue ?? "";
		}

		return "";
	}

	/**
	 * Load JSON Manifest
	 * @param json - JSON manifest data
	 * @return parsed package parts
	 */
	load(json: WebPubManifest): PackagingObject & { toc: NavItem[] } {
		this.metadata = json.metadata;

		const spine = json.readingOrder || json.spine;
		this.spine = spine!.map((item: PackagingSpineItem, index: number) =>{
			item.index = index;
			item.linear = item.linear || "yes";
			return item;
		});

		json.resources.forEach((item: PackagingManifestItem & { rel?: string[] }, index: number) => {
			this.manifest[index] = item;

			if (item.rel && item.rel[0] === "cover") {
				this.coverPath = item.href;
			}
		});

		this.spineNodeIndex = 0;

		this.toc = json.toc.map((item: NavItem & { title?: string }) =>{
			item.label = item.title || item.label;
			return item;
		});

		return {
			"metadata" : this.metadata,
			"spine"    : this.spine,
			"manifest" : this.manifest,
			"navPath"  : this.navPath,
			"ncxPath"  : this.ncxPath,
			"coverPath": this.coverPath,
			"spineNodeIndex" : this.spineNodeIndex,
			"toc" : this.toc
		};
	}

	destroy(): void {
		this.manifest = undefined!;
		this.navPath = undefined!;
		this.ncxPath = undefined!;
		this.coverPath = undefined!;
		this.spineNodeIndex = undefined!;
		this.spine = undefined!;
		this.metadata = undefined!;
	}
}

export default Packaging;
