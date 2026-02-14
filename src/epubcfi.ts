import {extend, type, findChildren, RangeObject, isNumber} from "./utils/core";
import type { EpubCFIStep, EpubCFIComponent } from "./types";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const _COMMENT_NODE = 8;
const DOCUMENT_NODE = 9;

/**
	* Parsing and creation of EpubCFIs: http://www.idpf.org/epub/linking/cfi/epub-cfi.html

	* Implements:
	* - Character Offset: epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3)
	* - Simple Ranges : epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1:1,/3:4)

	* Does Not Implement:
	* - Temporal Offset (~)
	* - Spatial Offset (@)
	* - Temporal-Spatial Offset (~ + @)
	* - Text Location Assertion ([)
	* @class
	@param {string | Range | Node } [cfiFrom]
	@param {string | object} [base]
	@param {string} [ignoreClass] class to ignore when parsing DOM
*/
class EpubCFI {
	str: string;
	base: EpubCFIComponent;
	spinePos: number;
	range: boolean;
	path: EpubCFIComponent;
	start: EpubCFIComponent | null;
	end: EpubCFIComponent | null;
	id!: string | null;

	constructor(cfiFrom?: string | Range | Node | EpubCFI, base?: string | EpubCFIComponent, ignoreClass?: string) {
		this.str = "";

		this.base = {} as EpubCFIComponent;
		this.spinePos = 0; // For compatibility

		this.range = false; // true || false;

		this.path = {} as EpubCFIComponent;
		this.start = null;
		this.end = null;

		// Allow instantiation without the "new" keyword
		if (!(this instanceof EpubCFI)) {
			return new EpubCFI(cfiFrom, base, ignoreClass);
		}

		if(typeof base === "string") {
			this.base = this.parseComponent(base);
		} else if(typeof base === "object" && base.steps) {
			this.base = base;
		}

		const type = this.checkType(cfiFrom);


		if(type === "string") {
			this.str = cfiFrom as string;
			return extend(this, this.parse(cfiFrom as string));
		} else if (type === "range") {
			return extend(this, this.fromRange(cfiFrom as Range, this.base, ignoreClass));
		} else if (type === "node") {
			return extend(this, this.fromNode(cfiFrom as Node, this.base, ignoreClass));
		} else if (type === "EpubCFI" && (cfiFrom as EpubCFI).path) {
			return cfiFrom as EpubCFI;
		} else if (!cfiFrom) {
			return this;
		} else {
			throw new TypeError("not a valid argument for EpubCFI");
		}

	}

	/**
	 * Check the type of constructor input
	 * @private
	 */
	checkType(cfi: string | Range | Node | EpubCFI | undefined): string | false {

		if (this.isCfiString(cfi)) {
			return "string";
		// Is a range object
		} else if (cfi && typeof cfi === "object" && (type(cfi) === "Range" || typeof((cfi as Range).startContainer) != "undefined")){
			return "range";
		} else if (cfi && typeof cfi === "object" && typeof((cfi as Node).nodeType) != "undefined" ){ // || typeof cfi === "function"
			return "node";
		} else if (cfi && typeof cfi === "object" && cfi instanceof EpubCFI){
			return "EpubCFI";
		} else {
			return false;
		}
	}

	/**
	 * Parse a cfi string to a CFI object representation
	 * @param {string} cfiStr
	 * @returns {object} cfi
	 */
	parse(cfiStr: string): Partial<Pick<EpubCFI, "spinePos" | "range" | "base" | "path" | "start" | "end">> {
		const cfi = {
			spinePos: -1,
			range: false,
			base: {} as EpubCFIComponent,
			path: {} as EpubCFIComponent,
			start: null as EpubCFIComponent | null,
			end: null as EpubCFIComponent | null
		};
		if(typeof cfiStr !== "string") {
			return {spinePos: -1};
		}

		if(cfiStr.indexOf("epubcfi(") === 0 && cfiStr[cfiStr.length-1] === ")") {
			// Remove initial epubcfi( and ending )
			cfiStr = cfiStr.slice(8, cfiStr.length-1);
		}

		const baseComponent = this.getChapterComponent(cfiStr);

		// Make sure this is a valid cfi or return
		if(!baseComponent) {
			return {spinePos: -1};
		}

		cfi.base = this.parseComponent(baseComponent);

		const pathComponent = this.getPathComponent(cfiStr);
		cfi.path = this.parseComponent(pathComponent!);

		const range = this.getRange(cfiStr);

		if(range) {
			cfi.range = true;
			cfi.start = this.parseComponent(range[0]);
			cfi.end = this.parseComponent(range[1]);
		}

		// Chapter segment is always the second step
		if (cfi.base.steps.length < 2) {
			return {spinePos: -1};
		}
		cfi.spinePos = cfi.base.steps[1]!.index;

		return cfi;
	}

	parseComponent(componentStr: string): EpubCFIComponent {
		const component: EpubCFIComponent = {
			steps: [],
			terminal: {
				offset: null,
				assertion: null
			}
		};
		const parts = componentStr.split(":");
		const steps = parts[0]!.split("/");
		let terminal;

		if(parts.length > 1) {
			terminal = parts[1]!;
			component.terminal = this.parseTerminal(terminal);
		}

		if (steps[0] === "") {
			steps.shift(); // Ignore the first slash
		}

		component.steps = steps.map((step: string) => {
			return this.parseStep(step);
		}).filter((step): step is EpubCFIStep => step !== undefined);

		return component;
	}

	parseStep(stepStr: string): EpubCFIStep | undefined {
		let type, index, id;

		const has_brackets = stepStr.match(/\[(.*)\]/);
		if(has_brackets && has_brackets[1]){
			id = has_brackets[1];
		}

		//-- Check if step is a text node or element
		const num = parseInt(stepStr);

		if(isNaN(num)) {
			return;
		}

		if(num % 2 === 0) { // Even = is an element
			type = "element";
			index = num / 2 - 1;
		} else {
			type = "text";
			index = (num - 1 ) / 2;
		}

		return {
			"type" : type,
			"index" : index,
			"id" : id || null,
			"tagName" : ""
		};
	}

	parseTerminal(termialStr: string): { offset: number | null; assertion: string | null } {
		let characterOffset: number | null;
		let textLocationAssertion: string | null = null;
		const assertion = termialStr.match(/\[(.*)\]/);

		if(assertion && assertion[1]){
			characterOffset = parseInt(termialStr.split("[")[0]!);
			textLocationAssertion = assertion[1];
		} else {
			characterOffset = parseInt(termialStr);
		}

		if (!isNumber(characterOffset)) {
			characterOffset = null;
		}

		return {
			"offset": characterOffset,
			"assertion": textLocationAssertion
		};

	}

	getChapterComponent(cfiStr: string): string {

		const indirection = cfiStr.split("!");

		return indirection[0]!;
	}

	getPathComponent(cfiStr: string): string | undefined {

		const indirection = cfiStr.split("!");

		if(indirection[1]) {
			const ranges = indirection[1].split(",");
			return ranges[0];
		}
		return undefined;
	}

	getRange(cfiStr: string): [string, string] | false {

		const ranges = cfiStr.split(",");

		if(ranges.length === 3){
			return [
				ranges[1]!,
				ranges[2]!
			];
		}

		return false;
	}

	getCharecterOffsetComponent(cfiStr: string): string {
		const splitStr = cfiStr.split(":");
		return splitStr[1] || "";
	}

	joinSteps(steps: EpubCFIStep[]): string {
		if(!steps) {
			return "";
		}

		return steps.map(function(part){
			let segment = "";

			if(part.type === "element") {
				segment += (part.index + 1) * 2;
			}

			if(part.type === "text") {
				segment += 1 + (2 * part.index);
			}

			if(part.id) {
				segment += "[" + part.id + "]";
			}

			return segment;

		}).join("/");

	}

	segmentString(segment: EpubCFIComponent): string {
		let segmentString = "/";

		segmentString += this.joinSteps(segment.steps);

		if(segment.terminal && segment.terminal.offset != null){
			segmentString += ":" + segment.terminal.offset;
		}

		if(segment.terminal && segment.terminal.assertion != null){
			segmentString += "[" + segment.terminal.assertion + "]";
		}

		return segmentString;
	}

	/**
	 * Convert CFI to a epubcfi(...) string
	 * @returns {string} epubcfi
	 */
	toString(): string {
		let cfiString = "epubcfi(";

		cfiString += this.segmentString(this.base);

		cfiString += "!";
		cfiString += this.segmentString(this.path);

		// Add Range, if present
		if(this.range && this.start) {
			cfiString += ",";
			cfiString += this.segmentString(this.start);
		}

		if(this.range && this.end) {
			cfiString += ",";
			cfiString += this.segmentString(this.end);
		}

		cfiString += ")";

		return cfiString;
	}


	/**
	 * Compare which of two CFIs is earlier in the text
	 * @returns {number} First is earlier = -1, Second is earlier = 1, They are equal = 0
	 */
	compare(cfiOne: string | EpubCFI, cfiTwo: string | EpubCFI): number {
		let stepsA, stepsB;
		let terminalA, terminalB;

		let _rangeAStartSteps, _rangeAEndSteps;
		let _rangeBStartSteps, _rangeBEndSteps;
		let _rangeAStartTerminal, _rangeAEndTerminal;
		let _rangeBStartTerminal, _rangeBEndTerminal;

		if(typeof cfiOne === "string") {
			cfiOne = new EpubCFI(cfiOne);
		}
		if(typeof cfiTwo === "string") {
			cfiTwo = new EpubCFI(cfiTwo);
		}
		// Compare Spine Positions
		if(cfiOne.spinePos > cfiTwo.spinePos) {
			return 1;
		}
		if(cfiOne.spinePos < cfiTwo.spinePos) {
			return -1;
		}

		if (cfiOne.range) {
			stepsA = cfiOne.path.steps.concat(cfiOne.start!.steps);
			terminalA = cfiOne.start!.terminal;
		} else {
			stepsA = cfiOne.path.steps;
			terminalA = cfiOne.path.terminal;
		}

		if (cfiTwo.range) {
			stepsB = cfiTwo.path.steps.concat(cfiTwo.start!.steps);
			terminalB = cfiTwo.start!.terminal;
		} else {
			stepsB = cfiTwo.path.steps;
			terminalB = cfiTwo.path.terminal;
		}

		// Compare Each Step in the First item
		for (let i = 0; i < stepsA.length; i++) {
			if(!stepsA[i]) {
				return -1;
			}
			if(!stepsB[i]) {
				return 1;
			}
			if(stepsA[i]!.index > stepsB[i]!.index) {
				return 1;
			}
			if(stepsA[i]!.index < stepsB[i]!.index) {
				return -1;
			}
			// Otherwise continue checking
		}

		// All steps in First equal to Second and First is Less Specific
		if(stepsA.length < stepsB.length) {
			return -1;
		}

		// Compare the character offset of the text node
		if(terminalA.offset != null && terminalB.offset != null) {
			if(terminalA.offset > terminalB.offset) {
				return 1;
			}
			if(terminalA.offset < terminalB.offset) {
				return -1;
			}
		}

		// CFI's are equal
		return 0;
	}

	step(node: Node): EpubCFIStep {
		const nodeType = (node.nodeType === TEXT_NODE) ? "text" : "element";

		return {
			"id" : (node as Element).id,
			"tagName" : (node as Element).tagName,
			"type" : nodeType,
			"index" : this.position(node)
		};
	}

	filteredStep(node: Node, ignoreClass: string): EpubCFIStep | undefined {
		const filteredNode = this.filter(node, ignoreClass);

		// Node filtered, so ignore
		if (!filteredNode) {
			return;
		}

		// Otherwise add the filter node in
		const nodeType = (filteredNode.nodeType === TEXT_NODE) ? "text" : "element";

		return {
			"id" : (filteredNode as Element).id,
			"tagName" : (filteredNode as Element).tagName,
			"type" : nodeType,
			"index" : this.filteredPosition(filteredNode, ignoreClass)
		};
	}

	pathTo(node: Node, offset: number | null, ignoreClass?: string): EpubCFIComponent {
		const segment: EpubCFIComponent = {
			steps: [],
			terminal: {
				offset: null,
				assertion: null
			}
		};
		let currentNode = node;
		let step;

		while(currentNode && currentNode.parentNode &&
					currentNode.parentNode.nodeType != DOCUMENT_NODE) {

			if (ignoreClass) {
				step = this.filteredStep(currentNode, ignoreClass);
			} else {
				step = this.step(currentNode);
			}

			if (step) {
				segment.steps.unshift(step);
			}

			currentNode = currentNode.parentNode;

		}

		if (offset != null && offset >= 0) {

			segment.terminal.offset = offset;

			// Make sure we are getting to a textNode if there is an offset
			if(segment.steps.length > 0 && segment.steps[segment.steps.length-1]!.type != "text") {
				segment.steps.push({
					"type" : "text",
					"index" : 0,
					"id" : null,
					"tagName" : ""
				});
			}

		}


		return segment;
	}

	equalStep(stepA: EpubCFIStep, stepB: EpubCFIStep): boolean {
		if (!stepA || !stepB) {
			return false;
		}

		if(stepA.index === stepB.index &&
			 stepA.id === stepB.id &&
			 stepA.type === stepB.type) {
			return true;
		}

		return false;
	}

	/**
	 * Create a CFI object from a Range
	 * @param {Range} range
	 * @param {string | object} base
	 * @param {string} [ignoreClass]
	 * @returns {object} cfi
	 */
	fromRange(range: Range, base: string | EpubCFIComponent, ignoreClass?: string): Partial<Pick<EpubCFI, "spinePos" | "range" | "base" | "path" | "start" | "end">> {
		const cfi = {
			range: false,
			base: {} as EpubCFIComponent,
			path: {} as EpubCFIComponent,
			start: null as EpubCFIComponent | null,
			end: null as EpubCFIComponent | null,
			spinePos: 0
		};

		const start = range.startContainer;
		const end = range.endContainer;

		let startOffset = range.startOffset;
		let endOffset = range.endOffset;

		let needsIgnoring = false;

		if (ignoreClass) {
			// Tell pathTo if / what to ignore
			needsIgnoring = (start.ownerDocument!.querySelector("." + ignoreClass) != null);
		}


		if (typeof base === "string") {
			cfi.base = this.parseComponent(base);
			cfi.spinePos = cfi.base.steps[1]!.index;
		} else if (typeof base === "object") {
			cfi.base = base;
		}

		if (range.collapsed) {
			if (needsIgnoring) {
				startOffset = this.patchOffset(start, startOffset, ignoreClass!);
			}
			cfi.path = this.pathTo(start, startOffset, ignoreClass);
		} else {
			cfi.range = true;

			if (needsIgnoring) {
				startOffset = this.patchOffset(start, startOffset, ignoreClass!);
			}

			cfi.start = this.pathTo(start, startOffset, ignoreClass);
			if (needsIgnoring) {
				endOffset = this.patchOffset(end, endOffset, ignoreClass!);
			}

			cfi.end = this.pathTo(end, endOffset, ignoreClass);

			// Create a new empty path
			cfi.path = {
				steps: [],
				terminal: { offset: null, assertion: null }
			};

			// Push steps that are shared between start and end to the common path
			const len = cfi.start.steps.length;
			let i;

			for (i = 0; i < len; i++) {
				if (this.equalStep(cfi.start.steps[i]!, cfi.end.steps[i]!)) {
					if(i === len-1) {
						// Last step is equal, check terminals
						if(cfi.start.terminal === cfi.end.terminal) {
							// CFI's are equal
							cfi.path.steps.push(cfi.start.steps[i]!);
							// Not a range
							cfi.range = false;
						}
					} else {
						cfi.path.steps.push(cfi.start.steps[i]!);
					}

				} else {
					break;
				}
			}

			cfi.start.steps = cfi.start.steps.slice(cfi.path.steps.length);
			cfi.end.steps = cfi.end.steps.slice(cfi.path.steps.length);

			// TODO: Add Sanity check to make sure that the end if greater than the start
		}

		return cfi;
	}

	/**
	 * Create a CFI object from a Node
	 * @param {Node} anchor
	 * @param {string | object} base
	 * @param {string} [ignoreClass]
	 * @returns {object} cfi
	 */
	fromNode(anchor: Node, base: string | EpubCFIComponent, ignoreClass?: string): Partial<Pick<EpubCFI, "spinePos" | "range" | "base" | "path" | "start" | "end">> {
		const cfi = {
			range: false,
			base: {} as EpubCFIComponent,
			path: {} as EpubCFIComponent,
			start: null as EpubCFIComponent | null,
			end: null as EpubCFIComponent | null,
			spinePos: 0
		};

		if (typeof base === "string") {
			cfi.base = this.parseComponent(base);
			cfi.spinePos = cfi.base.steps[1]!.index;
		} else if (typeof base === "object") {
			cfi.base = base;
		}

		cfi.path = this.pathTo(anchor, null, ignoreClass);

		return cfi;
	}

	filter(anchor: Node, ignoreClass: string): Node | false {
		let needsIgnoring;
		let sibling; // to join with
		let parent, previousSibling, nextSibling;
		let isText = false;

		if (anchor.nodeType === TEXT_NODE) {
			isText = true;
			parent = anchor.parentNode;
			needsIgnoring = (anchor.parentNode as Element).classList.contains(ignoreClass);
		} else {
			isText = false;
			needsIgnoring = (anchor as Element).classList.contains(ignoreClass);
		}

		if (needsIgnoring && isText) {
			previousSibling = parent!.previousSibling;
			nextSibling = parent!.nextSibling;

			// If the sibling is a text node, join the nodes
			if (previousSibling && previousSibling.nodeType === TEXT_NODE) {
				sibling = previousSibling;
			} else if (nextSibling && nextSibling.nodeType === TEXT_NODE) {
				sibling = nextSibling;
			}

			if (sibling) {
				return sibling;
			} else {
				// Parent will be ignored on next step
				return anchor;
			}

		} else if (needsIgnoring && !isText) {
			// Otherwise just skip the element node
			return false;
		} else {
			// No need to filter
			return anchor;
		}

	}

	patchOffset(anchor: Node, offset: number, ignoreClass: string): number {
		if (anchor.nodeType != TEXT_NODE) {
			throw new Error("Anchor must be a text node");
		}

		let curr = anchor;
		let totalOffset = offset;

		// If the parent is a ignored node, get offset from it's start
		if ((anchor.parentNode as Element).classList.contains(ignoreClass)) {
			curr = anchor.parentNode!;
		}

		while (curr.previousSibling) {
			if(curr.previousSibling.nodeType === ELEMENT_NODE) {
				// Originally a text node, so join
				if((curr.previousSibling as Element).classList.contains(ignoreClass)){
					totalOffset += (curr.previousSibling.textContent ?? "").length;
				} else {
					break; // Normal node, dont join
				}
			} else {
				// If the previous sibling is a text node, join the nodes
				totalOffset += (curr.previousSibling.textContent ?? "").length;
			}

			curr = curr.previousSibling;
		}

		return totalOffset;

	}

	normalizedMap(children: NodeListOf<ChildNode>, nodeType: number, ignoreClass: string): Record<number, number> {
		const output: Record<number, number> = {};
		let prevIndex = -1;
		let i;
		const len = children.length;
		let currNodeType;
		let prevNodeType;

		for (i = 0; i < len; i++) {

			currNodeType = children[i]!.nodeType;

			// Check if needs ignoring
			if (currNodeType === ELEMENT_NODE &&
					(children[i]! as Element).classList.contains(ignoreClass)) {
				currNodeType = TEXT_NODE;
			}

			if (i > 0 &&
					currNodeType === TEXT_NODE &&
					prevNodeType === TEXT_NODE) {
				// join text nodes
				output[i] = prevIndex;
			} else if (nodeType === currNodeType){
				prevIndex = prevIndex + 1;
				output[i] = prevIndex;
			}

			prevNodeType = currNodeType;

		}

		return output;
	}

	position(anchor: Node): number {
		let children, index;
		if (anchor.nodeType === ELEMENT_NODE) {
			children = (anchor.parentNode as Element).children;
			if (!children) {
				children = findChildren(anchor.parentNode as Element);
			}
			index = Array.from(children as ArrayLike<Node>).indexOf(anchor);
		} else {
			children = this.textNodes(anchor.parentNode!);
			index = children.indexOf(anchor);
		}

		return index;
	}

	filteredPosition(anchor: Node, ignoreClass: string): number {
		let children, map;

		if (anchor.nodeType === ELEMENT_NODE) {
			children = (anchor.parentNode as Element).children;
			map = this.normalizedMap(children as any, ELEMENT_NODE, ignoreClass);
		} else {
			children = anchor.parentNode!.childNodes;
			// Inside an ignored node
			if((anchor.parentNode as Element).classList.contains(ignoreClass)) {
				anchor = anchor.parentNode!;
				children = anchor.parentNode!.childNodes;
			}
			map = this.normalizedMap(children, TEXT_NODE, ignoreClass);
		}


		// anchor is always a child of its parentNode, so indexOf is guaranteed to find it
		const index = Array.from(children as ArrayLike<Node>).indexOf(anchor);

		return map[index]!;
	}

	stepsToXpath(steps: EpubCFIStep[]): string {
		const xpath = [".", "*"];

		steps.forEach(function(step){
			const position = step.index + 1;

			if(step.id){
				xpath.push("*[position()=" + position + " and @id='" + step.id + "']");
			} else if(step.type === "text") {
				xpath.push("text()[" + position + "]");
			} else {
				xpath.push("*[" + position + "]");
			}
		});

		return xpath.join("/");
	}


	/*

	To get the last step if needed:

	// Get the terminal step
	lastStep = steps[steps.length-1];
	// Get the query string
	query = this.stepsToQuery(steps);
	// Find the containing element
	startContainerParent = doc.querySelector(query);
	// Find the text node within that element
	if(startContainerParent && lastStep.type == "text") {
		container = startContainerParent.childNodes[lastStep.index];
	}
	*/
	stepsToQuerySelector(steps: EpubCFIStep[]): string {
		const query = ["html"];

		steps.forEach(function(step){
			const position = step.index + 1;

			if(step.id){
				query.push("#" + step.id);
			} else if(step.type === "text") {
				// unsupported in querySelector
				// query.push("text()[" + position + "]");
			} else {
				query.push("*:nth-child(" + position + ")");
			}
		});

		return query.join(">");

	}

	textNodes(container: Node, ignoreClass?: string): Node[] {
		return Array.from(container.childNodes).
			filter(function (node: Node) {
				if (node.nodeType === TEXT_NODE) {
					return true;
				} else if (ignoreClass && (node as Element).classList.contains(ignoreClass)) {
					return true;
				}
				return false;
			});
	}

	walkToNode(steps: EpubCFIStep[], _doc?: Document, ignoreClass?: string): Node | undefined {
		const doc = _doc || document;
		let container: Node = doc.documentElement;
		let children;
		let step;
		const len = steps.length;
		let i;

		for (i = 0; i < len; i++) {
			step = steps[i]!;

			if(step.type === "element") {
				//better to get a container using id as some times step.index may not be correct
				//For ex.https://github.com/futurepress/epub.js/issues/561
				if(step.id) {
					container = doc.getElementById(step.id)!;
				}
				else {
					children = (container as Element).children || findChildren(container as Element);
					container = children[step.index] as Element;
				}
			} else if(step.type === "text") {
				container = this.textNodes(container, ignoreClass)[step.index] as Node;
			}
			if(!container) {
				//Break the for loop as due to incorrect index we can get error if
				//container is undefined so that other functionailties works fine
				//like navigation
				break;
			}

		}

		return container;
	}

	findNode(steps: EpubCFIStep[], _doc?: Document, ignoreClass?: string): Node | undefined {
		const doc = _doc || document;
		let container;
		let xpath;

		if(!ignoreClass && typeof doc.evaluate != "undefined") {
			xpath = this.stepsToXpath(steps);
			container = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue ?? undefined;
		} else if(ignoreClass) {
			container = this.walkToNode(steps, doc, ignoreClass);
		} else {
			container = this.walkToNode(steps, doc);
		}

		return container;
	}

	fixMiss(steps: EpubCFIStep[], offset: number, _doc?: Document, ignoreClass?: string): { container: Node; offset: number } {
		let container = this.findNode(steps.slice(0,-1), _doc, ignoreClass);
		if (!container) {
			return { container: (_doc ?? document).documentElement, offset: 0 };
		}
		const children = container.childNodes;
		const map = this.normalizedMap(children, TEXT_NODE, ignoreClass!);
		let child;
		let len;
		const lastStepIndex = steps[steps.length-1]!.index;

		for (const childIndex in map) {
			if (!map.hasOwnProperty(childIndex)) continue;

			if(map[childIndex] === lastStepIndex) {
				child = children[childIndex]!;
				len = (child.textContent ?? "").length;
				if(offset > len) {
					offset = offset - len;
				} else {
					if (child.nodeType === ELEMENT_NODE) {
						container = child.childNodes[0] ?? child;
					} else {
						container = child;
					}
					break;
				}
			}
		}

		return {
			container: container!,
			offset: offset
		};

	}

	/**
	 * Creates a DOM range representing a CFI
	 * @param {document} _doc document referenced in the base
	 * @param {string} [ignoreClass]
	 * @return {Range}
	 */
	toRange(_doc?: Document, ignoreClass?: string): Range | null {
		const doc = _doc || document;
		let range;
		let start, end, startContainer, endContainer;
		const cfi = this;
		let startSteps, endSteps;
		const needsIgnoring = ignoreClass ? (doc.querySelector("." + ignoreClass) != null) : false;
		let missed;

		if (typeof(doc.createRange) !== "undefined") {
			range = doc.createRange();
		} else {
			range = new RangeObject();
		}

		if (cfi.range) {
			start = cfi.start!;
			startSteps = cfi.path.steps.concat(start.steps);
			startContainer = this.findNode(startSteps, doc, needsIgnoring ? ignoreClass : undefined);
			end = cfi.end!;
			endSteps = cfi.path.steps.concat(end.steps);
			endContainer = this.findNode(endSteps, doc, needsIgnoring ? ignoreClass : undefined);
		} else {
			start = cfi.path;
			startSteps = cfi.path.steps;
			startContainer = this.findNode(cfi.path.steps, doc, needsIgnoring ? ignoreClass : undefined);
		}

		if(startContainer) {
			try {

				if(start.terminal.offset != null) {
					range.setStart(startContainer, start.terminal.offset);
				} else {
					range.setStart(startContainer, 0);
				}

			} catch (_e) {
				missed = this.fixMiss(startSteps, start.terminal.offset!, doc, needsIgnoring ? ignoreClass : undefined);
				range.setStart(missed.container, missed.offset);
			}
		} else {
			// eslint-disable-next-line no-console
			console.log("No startContainer found for", this.toString());
			// No start found
			return null;
		}

		if (endContainer) {
			try {

				if(end!.terminal.offset != null) {
					range.setEnd(endContainer, end!.terminal.offset);
				} else {
					range.setEnd(endContainer, 0);
				}

			} catch (_e) {
				missed = this.fixMiss(endSteps!, cfi.end!.terminal.offset!, doc, needsIgnoring ? ignoreClass : undefined);
				range.setEnd(missed.container, missed.offset);
			}
		}


		// doc.defaultView.getSelection().addRange(range);
		return range as Range;
	}

	/**
	 * Check if a string is wrapped with "epubcfi()"
	 * @param {string} str
	 * @returns {boolean}
	 */
	isCfiString(str: unknown): boolean {
		if(typeof str === "string" &&
			str.indexOf("epubcfi(") === 0 &&
			str[str.length-1] === ")") {
			return true;
		}

		return false;
	}

	generateChapterComponent(_spineNodeIndex: number, _pos: number | string, id?: string): string {
		const pos = parseInt(_pos as string),
				spineNodeIndex = (_spineNodeIndex + 1) * 2;
		let cfi = "/"+spineNodeIndex+"/";

		cfi += (pos + 1) * 2;

		if(id) {
			cfi += "[" + id + "]";
		}

		return cfi;
	}

	/**
	 * Collapse a CFI Range to a single CFI Position
	 * @param {boolean} [toStart=false]
	 */
	collapse(toStart?: boolean): void {
		if (!this.range) {
			return;
		}

		this.range = false;

		if (toStart) {
			this.path.steps = this.path.steps.concat(this.start!.steps);
			this.path.terminal = this.start!.terminal;
		} else {
			this.path.steps = this.path.steps.concat(this.end!.steps);
			this.path.terminal = this.end!.terminal;
		}

	}
}

export default EpubCFI;
