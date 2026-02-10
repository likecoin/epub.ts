import EpubCFI from "./epubcfi";
import Hook from "./utils/hook";
import Section from "./section";
import {replaceBase, replaceCanonical, replaceMeta} from "./utils/replacements";
import type { PackagingManifestObject, PackagingObject, SpineItem } from "./types";

/**
 * A collection of Spine Items
 */
class Spine {
	spineItems: Section[];
	spineByHref: Record<string, number>;
	spineById: Record<string, number>;
	hooks: { serialize: Hook; content: Hook };
	epubcfi: EpubCFI;
	loaded: boolean;
	items: SpineItem[];
	manifest: PackagingManifestObject;
	spineNodeIndex: number;
	baseUrl: string;
	length: number;

	constructor() {
		this.spineItems = [];
		this.spineByHref = {};
		this.spineById = {};

		this.hooks = {} as any;
		this.hooks.serialize = new Hook();
		this.hooks.content = new Hook();

		// Register replacements
		this.hooks.content.register(replaceBase);
		this.hooks.content.register(replaceCanonical);
		this.hooks.content.register(replaceMeta);

		this.epubcfi = new EpubCFI();

		this.loaded = false;

		this.items = [];
		this.manifest = {};
		this.spineNodeIndex = 0;
		this.baseUrl = "";
		this.length = 0;
	}

	/**
	 * Unpack items from a opf into spine items
	 * @param  {Packaging} _package
	 * @param  {method} resolver URL resolver
	 * @param  {method} canonical Resolve canonical url
	 */
	unpack(_package: PackagingObject & { baseUrl?: string; basePath?: string }, resolver: (href: string, absolute?: boolean) => string, canonical: (href: string) => string): void {

		this.items = _package.spine as unknown as SpineItem[];
		this.manifest = _package.manifest;
		this.spineNodeIndex = _package.spineNodeIndex;
		this.baseUrl = _package.baseUrl || _package.basePath || "";
		this.length = this.items.length;

		this.items.forEach( (item, index) => {
			const manifestItem = this.manifest[item.idref!];

			item.index = index;
			item.cfiBase = this.epubcfi.generateChapterComponent(this.spineNodeIndex, item.index, item.id);

			if (item.href) {
				item.url = resolver(item.href, true);
				item.canonical = canonical(item.href);
			}

			if(manifestItem) {
				item.href = manifestItem.href;
				item.url = resolver(item.href, true);
				item.canonical = canonical(item.href);

				if(manifestItem.properties.length){
					item.properties.push(...manifestItem.properties);
				}
			}

			if (item.linear === "yes") {
				item.prev = (): Section | undefined => {
					let prevIndex = item.index;
					while (prevIndex > 0) {
						const prev = this.get(prevIndex-1);
						if (prev && prev.linear) {
							return prev;
						}
						prevIndex -= 1;
					}
					return;
				};
				item.next = (): Section | undefined => {
					let nextIndex = item.index;
					while (nextIndex < this.spineItems.length-1) {
						const next = this.get(nextIndex+1);
						if (next && next.linear) {
							return next;
						}
						nextIndex += 1;
					}
					return;
				};
			} else {
				item.prev = function(): Section | undefined {
					return undefined;
				}
				item.next = function(): Section | undefined {
					return undefined;
				}
			}


			const spineItem = new Section(item, this.hooks);

			this.append(spineItem);


		});

		this.loaded = true;
	}

	/**
	 * Get an item from the spine
	 * @param  {string|number} [target]
	 * @return {Section} section
	 * @example spine.get();
	 * @example spine.get(1);
	 * @example spine.get("chap1.html");
	 * @example spine.get("#id1234");
	 */
	get(target?: string | number): Section | null {
		let index = 0;

		if (typeof target === "undefined") {
			while (index < this.spineItems.length) {
				const next = this.spineItems[index];
				if (next && next.linear) {
					break;
				}
				index += 1;
			}
		} else if(this.epubcfi.isCfiString(target)) {
			const cfi = new EpubCFI(target as string);
			index = cfi.spinePos;
		} else if(typeof target === "number" || isNaN(Number(target)) === false){
			index = Number(target);
		} else if(typeof target === "string" && target.indexOf("#") === 0) {
			index = this.spineById[target.substring(1)] ?? -1;
		} else if(typeof target === "string") {
			// Remove fragments
			target = target.split("#")[0]!;
			index = this.spineByHref[target] ?? this.spineByHref[encodeURI(target)] ?? -1;
		}

		return this.spineItems[index] ?? null;
	}

	/**
	 * Append a Section to the Spine
	 * @private
	 * @param  {Section} section
	 */
	append(section: Section): number {
		const index = this.spineItems.length;
		section.index = index;

		this.spineItems.push(section);

		// Encode and Decode href lookups
		// see pr for details: https://github.com/futurepress/epub.js/pull/358
		this.spineByHref[decodeURI(section.href)] = index;
		this.spineByHref[encodeURI(section.href)] = index;
		this.spineByHref[section.href] = index;

		this.spineById[section.idref] = index;

		return index;
	}

	/**
	 * Prepend a Section to the Spine
	 * @private
	 * @param  {Section} section
	 */
	prepend(section: Section): number {
		// var index = this.spineItems.unshift(section);
		this.spineByHref[section.href] = 0;
		this.spineById[section.idref] = 0;

		// Re-index
		this.spineItems.forEach(function(item, index){
			item.index = index;
		});

		return 0;
	}

	// insert(section, index) {
	//
	// };

	/**
	 * Remove a Section from the Spine
	 * @private
	 * @param  {Section} section
	 */
	remove(section: Section): Section[] | undefined {
		const index = this.spineItems.indexOf(section);

		if(index > -1) {
			delete this.spineByHref[section.href];
			delete this.spineById[section.idref];

			return this.spineItems.splice(index, 1);
		}
		return undefined;
	}

	/**
	 * Loop over the Sections in the Spine
	 * @return {method} forEach
	 */
	each(fn: (section: Section, index: number, array: Section[]) => void): void {
		return this.spineItems.forEach(fn);
	}

	/**
	 * Find the first Section in the Spine
	 * @return {Section} first section
	 */
	first(): Section | undefined {
		let index = 0;

		do {
			const next = this.get(index);

			if (next && next.linear) {
				return next;
			}
			index += 1;
		} while (index < this.spineItems.length) ;
		return undefined;
	}

	/**
	 * Find the last Section in the Spine
	 * @return {Section} last section
	 */
	last(): Section | undefined {
		let index = this.spineItems.length-1;

		do {
			const prev = this.get(index);
			if (prev && prev.linear) {
				return prev;
			}
			index -= 1;
		} while (index >= 0);
		return undefined;
	}

	destroy(): void {
		this.each((section: Section) => section.destroy());

		(this as any).spineItems = undefined;
		(this as any).spineByHref = undefined;
		(this as any).spineById = undefined;

		this.hooks.serialize.clear();
		this.hooks.content.clear();
		(this as any).hooks = undefined;

		(this as any).epubcfi = undefined;

		this.loaded = false;

		(this as any).items = undefined;
		(this as any).manifest = undefined;
		(this as any).spineNodeIndex = undefined;
		(this as any).baseUrl = undefined;
		(this as any).length = undefined;
	}
}

export default Spine;
