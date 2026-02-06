import { defer } from "./utils/core";
import EpubCFI from "./epubcfi";
import Hook from "./utils/hook";
import { sprint } from "./utils/core";
import { replaceBase } from "./utils/replacements";
import Request from "./utils/request";
import { DOMParser as XMLDOMSerializer } from "@xmldom/xmldom";
import type { SpineItem, GlobalLayout, SearchResult, RequestFunction } from "./types";

/**
 * Represents a Section of the Book
 *
 * In most books this is equivalent to a Chapter
 * @param {object} item  The spine item representing the section
 * @param {object} hooks hooks for serialize and content
 */
class Section {
	idref: string;
	linear: boolean;
	properties: string[];
	index: number;
	href: string;
	url: string;
	canonical: string;
	next: () => SpineItem | undefined;
	prev: () => SpineItem | undefined;
	cfiBase: string;
	hooks: { serialize: Hook; content: Hook };
	document: Document | undefined;
	contents: Element | undefined;
	output: string | undefined;
	request: RequestFunction;

	constructor(item: SpineItem, hooks?: { serialize: Hook; content: Hook }){
		this.idref = item.idref;
		this.linear = item.linear === "yes";
		this.properties = item.properties;
		this.index = item.index;
		this.href = item.href;
		this.url = item.url;
		this.canonical = item.canonical;
		this.next = item.next;
		this.prev = item.prev;

		this.cfiBase = item.cfiBase;

		if (hooks) {
			this.hooks = hooks;
		} else {
			this.hooks = {} as any;
			this.hooks.serialize = new Hook(this);
			this.hooks.content = new Hook(this);
		}

		this.document = undefined;
		this.contents = undefined;
		this.output = undefined;
	}

	/**
	 * Load the section from its url
	 * @param  {method} [_request] a request method to use for loading
	 * @return {document} a promise with the xml document
	 */
	load(_request?: RequestFunction): Promise<Element> {
		var request = _request || this.request || Request;
		var loading = new defer();
		var loaded = loading.promise;

		if(this.contents) {
			loading.resolve(this.contents);
		} else {
			request(this.url)
				.then(function(xml: Document){
					// var directory = new Url(this.url).directory;

					this.document = xml;
					this.contents = xml.documentElement;

					return this.hooks.content.trigger(this.document, this);
				}.bind(this))
				.then(function(){
					loading.resolve(this.contents);
				}.bind(this))
				.catch(function(error: Error){
					loading.reject(error);
				});
		}

		return loaded;
	}

	/**
	 * Adds a base tag for resolving urls in the section
	 * @private
	 */
	base(): void {
		return replaceBase(this.document!, this);
	}

	/**
	 * Render the contents of a section
	 * @param  {method} [_request] a request method to use for loading
	 * @return {string} output a serialized XML Document
	 */
	render(_request?: RequestFunction): Promise<string> {
		var rendering = new defer();
		var rendered = rendering.promise;
		this.output; // TODO: better way to return this from hooks?

		this.load(_request).
			then(function(contents: Element){
				var userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
				var isIE = userAgent.indexOf('Trident') >= 0;
				var Serializer;
				if (typeof XMLSerializer === "undefined" || isIE) {
					Serializer = XMLDOMSerializer;
				} else {
					Serializer = XMLSerializer;
				}
				var serializer = new Serializer() as unknown as XMLSerializer;
				this.output = serializer.serializeToString(contents);
				return this.output;
			}.bind(this)).
			then(function(){
				return this.hooks.serialize.trigger(this.output, this);
			}.bind(this)).
			then(function(){
				rendering.resolve(this.output);
			}.bind(this))
			.catch(function(error: Error){
				rendering.reject(error);
			});

		return rendered;
	}

	/**
	 * Find a string in a section
	 * @param  {string} _query The query string to find
	 * @return {object[]} A list of matches, with form {cfi, excerpt}
	 */
	find(_query: string): SearchResult[] {
		var section = this;
		var matches: SearchResult[] = [];
		var query = _query.toLowerCase();
		var find = function(node: Node){
			var text = node.textContent!.toLowerCase();
			var range: Range;
			var cfi;
			var pos;
			var last = -1;
			var excerpt;
			var limit = 150;

			while (pos != -1) {
				// Search for the query
				pos = text.indexOf(query, last + 1);

				if (pos != -1) {
					// We found it! Generate a CFI
					range = section.document!.createRange();
					range.setStart(node, pos);
					range.setEnd(node, pos + query.length);

					cfi = section.cfiFromRange(range);

					// Generate the excerpt
					if (node.textContent!.length < limit) {
						excerpt = node.textContent!;
					}
					else {
						excerpt = node.textContent!.substring(pos - limit/2, pos + limit/2);
						excerpt = "..." + excerpt + "...";
					}

					// Add the CFI to the matches list
					matches.push({
						cfi: cfi,
						excerpt: excerpt
					});
				}

				last = pos;
			}
		};

		sprint(section.document!, function(node) {
			find(node);
		});

		return matches;
	};


	/**
	 * Search a string in multiple sequential Element of the section. If the document.createTreeWalker api is missed(eg: IE8), use `find` as a fallback.
	 * @param  {string} _query The query string to search
	 * @param  {int} maxSeqEle The maximum number of Element that are combined for search, default value is 5.
	 * @return {object[]} A list of matches, with form {cfi, excerpt}
	 */
	search(_query: string, maxSeqEle: number = 5): SearchResult[] {
		if (typeof(document.createTreeWalker) == "undefined") {
			return this.find(_query);
		}
		let matches: SearchResult[] = [];
		const excerptLimit = 150;
		const section = this;
		const query = _query.toLowerCase();
		const search = function(nodeList: Node[]){
			const textWithCase =  nodeList.reduce((acc: string ,current: Node)=>{
				return acc + (current.textContent ?? "");
			},"");
			const text = textWithCase.toLowerCase();
			const pos = text.indexOf(query);
			if (pos != -1){
				const startNodeIndex = 0 , endPos = pos + query.length;
				let endNodeIndex = 0 , l = 0;
				if (pos < (nodeList[startNodeIndex] as Text).length){
					let cfi;
					while( endNodeIndex < nodeList.length - 1 ){
						l += (nodeList[endNodeIndex] as Text).length;
						if ( endPos <= l){
							break;
						}
						endNodeIndex += 1;
					}

					let startNode = nodeList[startNodeIndex] , endNode = nodeList[endNodeIndex];
					let range = section.document!.createRange();
					range.setStart(startNode,pos);
					let beforeEndLengthCount =  nodeList.slice(0, endNodeIndex).reduce((acc: number,current: Node)=>{return acc+(current.textContent ?? "").length;},0) ;
					range.setEnd(endNode, beforeEndLengthCount > endPos ? endPos : endPos - beforeEndLengthCount );
					cfi = section.cfiFromRange(range);

					let excerpt = nodeList.slice(0, endNodeIndex+1).reduce((acc: string,current: Node)=>{return acc+(current.textContent ?? "") ;},"");
					if (excerpt.length > excerptLimit){
						excerpt = excerpt.substring(pos - excerptLimit/2, pos + excerptLimit/2);
						excerpt = "..." + excerpt + "...";
					}
					matches.push({
						cfi: cfi,
						excerpt: excerpt
					});
				}
			}
		}

		const treeWalker = document.createTreeWalker(section.document!, NodeFilter.SHOW_TEXT, null);
		let node: Node | null , nodeList: Node[] = [];
		while (node = treeWalker.nextNode()) {
			nodeList.push(node);
			if (nodeList.length == maxSeqEle){
				search(nodeList.slice(0 , maxSeqEle));
				nodeList = nodeList.slice(1, maxSeqEle);
			}
		}
		if (nodeList.length > 0){
			search(nodeList);
		}
		return matches;
	}

	/**
	* Reconciles the current chapters layout properties with
	* the global layout properties.
	* @param {object} globalLayout  The global layout settings object, chapter properties string
	* @return {object} layoutProperties Object with layout properties
	*/
	reconcileLayoutSettings(globalLayout: GlobalLayout): Record<string, string> {
		//-- Get the global defaults
		var settings: Record<string, string> = {
			layout : globalLayout.layout,
			spread : globalLayout.spread,
			orientation : globalLayout.orientation
		};

		//-- Get the chapter's display type
		this.properties.forEach(function(prop){
			var rendition = prop.replace("rendition:", "");
			var split = rendition.indexOf("-");
			var property, value;

			if(split != -1){
				property = rendition.slice(0, split);
				value = rendition.slice(split+1);

				settings[property] = value;
			}
		});
		return settings;
	}

	/**
	 * Get a CFI from a Range in the Section
	 * @param  {range} _range
	 * @return {string} cfi an EpubCFI string
	 */
	cfiFromRange(_range: Range): string {
		return new EpubCFI(_range, this.cfiBase).toString();
	}

	/**
	 * Get a CFI from an Element in the Section
	 * @param  {element} el
	 * @return {string} cfi an EpubCFI string
	 */
	cfiFromElement(el: Element): string {
		return new EpubCFI(el, this.cfiBase).toString();
	}

	/**
	 * Unload the section document
	 */
	unload(): void {
		this.document = undefined;
		this.contents = undefined;
		this.output = undefined;
	}

	destroy(): void {
		this.unload();
		this.hooks.serialize.clear();
		this.hooks.content.clear();

		(this as any).hooks = undefined;
		(this as any).idref = undefined;
		(this as any).linear = undefined;
		(this as any).properties = undefined;
		(this as any).index = undefined;
		(this as any).href = undefined;
		(this as any).url = undefined;
		(this as any).next = undefined;
		(this as any).prev = undefined;

		(this as any).cfiBase = undefined;
	}
}

export default Section;
