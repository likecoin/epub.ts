import {qs, qsa, querySelectorByType, filterChildren} from "./utils/core";
import type { NavItem, LandmarkItem } from "./types";

/**
 * Navigation Parser
 * @param {document} xml navigation html / xhtml / ncx
 */
class Navigation {
	toc: NavItem[];
	tocByHref: Record<string, number>;
	tocById: Record<string, number>;
	landmarks: LandmarkItem[];
	landmarksByType: Record<string, number>;
	length: number;

	constructor(xml?: Document | NavItem[]) {
		this.toc = [];
		this.tocByHref = {};
		this.tocById = {};

		this.landmarks = [];
		this.landmarksByType = {};

		this.length = 0;
		if (xml) {
			this.parse(xml);
		}
	}

	/**
	 * Parse out the navigation items
	 * @param {document} xml navigation html / xhtml / ncx
	 */
	parse(xml: Document | NavItem[]): void {
		const isXml = (xml as Document).nodeType;
		let html;
		let ncx;

		if (isXml) {
			html = qs(xml as Document, "html");
			ncx = qs(xml as Document, "ncx");
		}

		if (!isXml) {
			this.toc = this.load(xml as NavItem[]);
		} else if(html) {
			this.toc = this.parseNav(xml as Document);
			this.landmarks = this.parseLandmarks(xml as Document);
		} else if(ncx){
			this.toc = this.parseNcx(xml as Document);
		}

		this.length = 0;

		this.unpack(this.toc);
	}

	/**
	 * Unpack navigation items
	 * @private
	 * @param  {array} toc
	 */
	unpack(toc: NavItem[]): void {
		let item;

		for (let i = 0; i < toc.length; i++) {
			item = toc[i]!;

			if (item.href) {
				this.tocByHref[item.href] = i;
			}

			if (item.id) {
				this.tocById[item.id] = i;
			}

			this.length++;

			if (item.subitems && item.subitems.length) {
				this.unpack(item.subitems);
			}
		}

	}

	/**
	 * Get an item from the navigation
	 * @param  {string} target
	 * @return {object} navItem
	 */
	get(target?: string): NavItem | NavItem[] | undefined {
		let index;

		if(!target) {
			return this.toc;
		}

		if(target.indexOf("#") === 0) {
			target = target.substring(1);
			index = this.tocById[target];
		} else if(target in this.tocByHref){
			index = this.tocByHref[target];
		}

		return this.getByIndex(target, index, this.toc);
	}

	/**
	 * Get an item from navigation subitems recursively by index
	 * @param  {string} target
	 * @param  {number} index
	 * @param  {array} navItems
	 * @return {object} navItem
	 */
	getByIndex(target: string, index: number | undefined, navItems: NavItem[]): NavItem | undefined {
		if (navItems.length === 0) {
			return;
		}

		const item = index !== undefined ? navItems[index] : undefined;
		if (item && (target === item.id || target === item.href)) {
			return item;
		} else {
			let result;
			for (let i = 0; i < navItems.length; ++i) {
				result = this.getByIndex(target, index, navItems[i]!.subitems ?? []);
				if (result) {
					break;
				}
			}
			return result;
		}
	}

	/**
	 * Get a landmark by type
	 * List of types: https://idpf.github.io/epub-vocabs/structure/
	 * @param  {string} type
	 * @return {object} landmarkItem
	 */
	landmark(type?: string): LandmarkItem | LandmarkItem[] | undefined {
		if(!type) {
			return this.landmarks;
		}

		const index = this.landmarksByType[type];

		return index !== undefined ? this.landmarks[index] : undefined;
	}

	/**
	 * Parse toc from a Epub > 3.0 Nav
	 * @private
	 * @param  {document} navHtml
	 * @return {array} navigation list
	 */
	parseNav(navHtml: Document): NavItem[] {
		const navElement = querySelectorByType(navHtml, "nav", "toc");
		let list: NavItem[] = [];

		if (!navElement) return list;

		const navList = filterChildren(navElement, "ol", true) as Element;
		if (!navList) return list;

		list = this.parseNavList(navList);
		return list;
	}

	/**
	 * Parses lists in the toc
	 * @param  {document} navListHtml
	 * @param  {string} parent id
	 * @return {array} navigation list
	 */
	parseNavList(navListHtml: Element, parent?: string): NavItem[] {
		const result: NavItem[] = [];

		if (!navListHtml) return result;
		if (!navListHtml.children) return result;
		
		for (let i = 0; i < navListHtml.children.length; i++) {
			const item = this.navItem(navListHtml.children[i]!, parent);

			if (item) {
				result.push(item);
			}
		}

		return result;
	}

	/**
	 * Create a navItem
	 * @private
	 * @param  {element} item
	 * @return {object} navItem
	 */
	navItem(item: Element, parent?: string): NavItem | undefined {
		let id = item.getAttribute("id") || undefined;
		const content = (filterChildren(item, "a", true)
			|| filterChildren(item, "span", true)) as Element;

		if (!content) {
			return;
		}

		const src = content.getAttribute("href") || "";
		
		if (!id) {
			id = src;
		}
		const text = content.textContent || "";

		let subitems: NavItem[] = [];
		const nested = filterChildren(item, "ol", true) as Element;
		if (nested) {
			subitems = 	this.parseNavList(nested, id);
		}

		return {
			"id": id,
			"href": src,
			"label": text,
			"subitems" : subitems,
			"parent" : parent
		};
	}

	/**
	 * Parse landmarks from a Epub > 3.0 Nav
	 * @private
	 * @param  {document} navHtml
	 * @return {array} landmarks list
	 */
	parseLandmarks(navHtml: Document): LandmarkItem[] {
		const navElement = querySelectorByType(navHtml, "nav", "landmarks");
		const navItems = navElement ? Array.from(qsa(navElement, "li")) : [];
		const length = navItems.length;
		let i;
		const list: LandmarkItem[] = [];
		let item;

		if(!navItems || length === 0) return list;

		for (i = 0; i < length; ++i) {
			item = this.landmarkItem(navItems[i]!);
			if (item) {
				list.push(item);
				this.landmarksByType[item.type!] = i;
			}
		}

		return list;
	}

	/**
	 * Create a landmarkItem
	 * @private
	 * @param  {element} item
	 * @return {object} landmarkItem
	 */
	landmarkItem(item: Element): LandmarkItem | undefined {
		const content = filterChildren(item, "a", true) as Element;

		if (!content) {
			return;
		}

		const type = content.getAttributeNS("http://www.idpf.org/2007/ops", "type") || undefined;
		const href = content.getAttribute("href") || "";
		const text = content.textContent || "";

		return {
			"href": href,
			"label": text,
			"type" : type
		};
	}

	/**
	 * Parse from a Epub > 3.0 NC
	 * @private
	 * @param  {document} navHtml
	 * @return {array} navigation list
	 */
	parseNcx(tocXml: Document): NavItem[] {
		const navPoints = qsa(tocXml, "navPoint");
		const length = navPoints.length;
		let i;
		const toc: Record<string, NavItem> = {};
		const list: NavItem[] = [];
		let item, parent;

		if(!navPoints || length === 0) return list;

		for (i = 0; i < length; ++i) {
			item = this.ncxItem(navPoints[i]!);
			toc[item.id] = item;
			if(!item.parent) {
				list.push(item);
			} else {
				parent = toc[item.parent];
				if (parent) {
					parent.subitems!.push(item);
				} else {
					list.push(item);
				}
			}
		}

		return list;
	}

	/**
	 * Create a ncxItem
	 * @private
	 * @param  {element} item
	 * @return {object} ncxItem
	 */
	ncxItem(item: Element): NavItem {
		const id = item.getAttribute("id") || "",
				content = qs(item, "content"),
				src = content ? content.getAttribute("src") ?? "" : "",
				navLabel = qs(item, "navLabel"),
				text = navLabel?.textContent ? navLabel.textContent : "",
				subitems: NavItem[] = [],
				parentNode = item.parentNode;
		let parent;

		if(parentNode && (parentNode.nodeName === "navPoint" || parentNode.nodeName.split(":").slice(-1)[0] === "navPoint")) {
			parent = (parentNode as Element).getAttribute("id") ?? undefined;
		}


		return {
			"id": id,
			"href": src,
			"label": text,
			"subitems" : subitems,
			"parent" : parent
		};
	}

	/**
	 * Load Spine Items
	 * @param  {object} json the items to be loaded
	 * @return {Array} navItems
	 */
	load(json: NavItem[]): NavItem[] {
		return json.map(item => {
			const rec = item as unknown as Record<string, unknown>;
			rec.label = rec.title;
			rec.subitems = rec.children ? this.load(rec.children as NavItem[]) : [];
			return item;
		});
	}

	/**
	 * forEach pass through
	 * @param  {Function} fn function to run on each item
	 * @return {method} forEach loop
	 */
	forEach(fn: (item: NavItem, index: number, array: NavItem[]) => void): void {
		return this.toc.forEach(fn);
	}
}

export default Navigation;
