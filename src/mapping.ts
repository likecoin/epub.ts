import EpubCFI from "./epubcfi";
import { nodeBounds } from "./utils/core";
import type { EpubCFIPair, RangePair, LayoutProps } from "./types";
import type IframeView from "./managers/views/iframe";
import type Contents from "./contents";
import type TextMeasurer from "./utils/text-measurer";
import type { PreparedNode } from "./utils/text-measurer";

/**
 * Map text locations to CFI ranges
 * @class
 * @param {Layout} layout Layout to apply
 * @param {string} [direction="ltr"] Text direction
 * @param {string} [axis="horizontal"] vertical or horizontal axis
 * @param {boolean} [dev] toggle developer highlighting
 */
class Mapping {
	layout: LayoutProps;
	horizontal: boolean;
	direction: string;
	_dev: boolean;
	_measurer: TextMeasurer | null;

	constructor(layout: LayoutProps, direction?: string, axis?: string, dev: boolean = false, measurer?: TextMeasurer) {
		this.layout = layout;
		this.horizontal = (axis === "horizontal") ? true : false;
		this.direction = direction || "ltr";
		this._dev = dev;
		this._measurer = measurer || null;
	}

	/**
	 * Find CFI pairs for entire section at once
	 */
	section(view: IframeView): EpubCFIPair[] {
		const ranges = this.findRanges(view);
		const map = this.rangeListToCfiList(view.section.cfiBase!, ranges);

		return map;
	}

	/**
	 * Find CFI pairs for a page
	 * @param {Contents} contents Contents from view
	 * @param {string} cfiBase string of the base for a cfi
	 * @param {number} start position to start at
	 * @param {number} end position to end at
	 */
	page(contents: Contents, cfiBase: string, start: number, end: number): EpubCFIPair | undefined {
		const root = contents && contents.document ? contents.document.body : false;

		if (!root) {
			return;
		}

		// Read scrollWidth/Height once to avoid redundant forced reflows across
		// the two fast-path calls (getting scroll dimensions forces layout).
		const docEl = contents.document.documentElement;
		const scrollDimension = this.horizontal ? docEl.scrollWidth : docEl.scrollHeight;

		const result = this.rangePairToCfiPair(cfiBase, {
			start: this.findStart(root, start, end, scrollDimension),
			end: this.findEnd(root, start, end, scrollDimension)
		});

		if (this._dev === true) {
			const doc = contents.document;
			const startRange = new EpubCFI(result.start).toRange(doc)!;
			const endRange = new EpubCFI(result.end).toRange(doc)!;

			const selection = doc.defaultView!.getSelection();
			const r = doc.createRange();
			selection!.removeAllRanges();
			r.setStart(startRange.startContainer, startRange.startOffset);
			r.setEnd(endRange.endContainer, endRange.endOffset);
			selection!.addRange(r);
		}

		return result;
	}

	/**
	 * Walk a node, preforming a function on each node it finds
	 * @private
	 * @param {Node} root Node to walkToNode
	 * @param {function} func walk function
	 * @return {*} returns the result of the walk function
	 */
	walk(root: Node, func: (node: Node) => Node | undefined): Node | undefined {
		const filter: NodeFilter = {
			acceptNode(node: Node): number {
				if ((node as Text).data.trim().length > 0) {
					return NodeFilter.FILTER_ACCEPT;
				} else {
					return NodeFilter.FILTER_REJECT;
				}
			}
		};

		const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter);
		let node;
		let result;
		while ((node = treeWalker.nextNode())) {
			result = func(node);
			if(result) break;
		}

		return result;
	}

	findRanges(view: IframeView): RangePair[] {
		const columns = [];
		const scrollWidth = view.contents!.scrollWidth();
		const spreads = Math.ceil( scrollWidth / this.layout.spreadWidth);
		const count = spreads * this.layout.divisor;
		const columnWidth = this.layout.columnWidth;
		const gap = this.layout.gap;
		// Reuse scrollWidth for horizontal (already fetched above); read
		// scrollHeight for vertical. Hoisted out of the loop so the fast path
		// doesn't force a reflow per column.
		const scrollDimension = this.horizontal
			? scrollWidth
			: view.document.documentElement.scrollHeight;
		let start, end;

		for (let i = 0; i < count; i++) {
			start = (columnWidth + gap) * i;
			end = (columnWidth * (i+1)) + (gap * i);
			columns.push({
				start: this.findStart(view.document.body, start, end, scrollDimension),
				end: this.findEnd(view.document.body, start, end, scrollDimension)
			});
		}

		return columns;
	}

	/**
	 * Find Start Range
	 * @private
	 * @param {Node} root root node
	 * @param {number} start position to start at
	 * @param {number} end position to end at
	 * @param {number} [scrollDimension] total scrollable dimension in CSS pixels
	 *   (scrollWidth for horizontal, scrollHeight for vertical). Hoisted reads
	 *   avoid forced reflows in the canvas fast path; omit to read lazily.
	 * @return {Range}
	 */
	findStart(root: Node, start: number, end: number, scrollDimension?: number): Range {
		// Canvas fast path: binary search on cumulative document widths
		if (root.nodeType === Node.ELEMENT_NODE) {
			const fast = this._canvasFindNode(root as Element, start, end, "start", scrollDimension);
			if (fast) return this.findTextStartRange(fast.node, start, end, fast.nodePos);
		}

		const stack = [root];
		let $el;
		let found;
		let $prev = root;
		let lastElPos: DOMRect | undefined;

		while (stack.length) {

			$el = stack.shift();

			found = this.walk($el!, (node) => {
				let left, right, top, bottom;


				const elPos = nodeBounds(node);
				lastElPos = elPos;

				if (this.horizontal && this.direction === "ltr") {

					left = elPos.left;
					right = elPos.right;

					if( left >= start && left <= end ) {
						return node;
					} else if (right > start) {
						return node;
					} else {
						$prev = node;
						stack.push(node);
					}

				} else if (this.horizontal && this.direction === "rtl") {

					left = elPos.left;
					right = elPos.right;

					if( right <= end && right >= start ) {
						return node;
					} else if (left < end) {
						return node;
					} else {
						$prev = node;
						stack.push(node);
					}

				} else {

					top = elPos.top;
					bottom = elPos.bottom;

					if( top >= start && top <= end ) {
						return node;
					} else if (bottom > start) {
						return node;
					} else {
						$prev = node;
						stack.push(node);
					}

				}
				return undefined;


			});

			if(found) {
				return this.findTextStartRange(found, start, end, lastElPos);
			}

		}

		// Return last element
		return this.findTextStartRange($prev, start, end, lastElPos);
	}

	/**
	 * Find End Range
	 * @private
	 * @param {Node} root root node
	 * @param {number} start position to start at
	 * @param {number} end position to end at
	 * @param {number} [scrollDimension] total scrollable dimension in CSS pixels
	 *   (scrollWidth for horizontal, scrollHeight for vertical). Hoisted reads
	 *   avoid forced reflows in the canvas fast path; omit to read lazily.
	 * @return {Range}
	 */
	findEnd(root: Node, start: number, end: number, scrollDimension?: number): Range {
		// Canvas fast path: binary search on cumulative document widths
		if (root.nodeType === Node.ELEMENT_NODE) {
			const fast = this._canvasFindNode(root as Element, start, end, "end", scrollDimension);
			if (fast) return this.findTextEndRange(fast.node, start, end, fast.nodePos);
		}

		const stack = [root];
		let $el;
		let $prev = root;
		let found;
		let lastElPos: DOMRect | undefined;
		let prevElPos: DOMRect | undefined;

		while (stack.length) {

			$el = stack.shift();

			found = this.walk($el!, (node) => {

				let left, right, top, bottom;

				const elPos = nodeBounds(node);
				lastElPos = elPos;

				if (this.horizontal && this.direction === "ltr") {

					left = Math.round(elPos.left);
					right = Math.round(elPos.right);

					if(left > end && $prev) {
						return $prev;
					} else if(right > end) {
						return node;
					} else {
						$prev = node;
						prevElPos = elPos;
						stack.push(node);
					}

				} else if (this.horizontal && this.direction === "rtl") {

					left = Math.round(elPos.left);
					right = Math.round(elPos.right);

					if(right < start && $prev) {
						return $prev;
					} else if(left < start) {
						return node;
					} else {
						$prev = node;
						prevElPos = elPos;
						stack.push(node);
					}

				} else {

					top = Math.round(elPos.top);
					bottom = Math.round(elPos.bottom);

					if(top > end && $prev) {
						return $prev;
					} else if(bottom > end) {
						return node;
					} else {
						$prev = node;
						prevElPos = elPos;
						stack.push(node);
					}

				}
				return undefined;

			});


			if(found){
				const pos = (found === $prev) ? prevElPos : lastElPos;
				return this.findTextEndRange(found, start, end, pos);
			}

		}

		// end of chapter
		return this.findTextEndRange($prev, start, end, prevElPos);
	}

	/**
	 * Try to prepare a text node's root for canvas-based measurement.
	 * Returns the PreparedNode for this text node, or null if not available.
	 * @private
	 */
	private _canvasPrepare(node: Node): PreparedNode | null {
		if (!this._measurer || node.nodeType !== Node.TEXT_NODE) return null;

		const textNode = node as Text;
		const parent = textNode.parentElement;
		if (!parent) return null;

		const win = parent.ownerDocument?.defaultView;
		if (!win) return null;

		const indexed = this._measurer.getPreparedNode(textNode);
		if (indexed) {
			const currentFont = win.getComputedStyle(parent).font;
			if (!currentFont || currentFont === indexed.font) return indexed;
			// Font changed — invalidate so the shared tail re-prepares
			const body = parent.ownerDocument.body;
			if (body) this._measurer.invalidate(body);
		}

		if (this._measurer.hasExoticCSS(textNode, win)) return null;

		const body = parent.ownerDocument.body;
		if (!body) return null;

		this._measurer.prepare(body, win);
		return this._measurer.getPreparedNode(textNode);
	}

	/**
	 * Canvas fast path: use binary search on pre-measured cumulative widths
	 * to find a Range at the target position, then verify with one getBoundingClientRect.
	 * Returns the Range if verification passes, or null to fall through to DOM loop.
	 * @private
	 */
	private _canvasFindRange(
		node: Node, nodePos: DOMRect, target: number, verifyFn: (pos: DOMRect) => boolean
	): Range | null {
		const prepared = this._canvasPrepare(node);
		if (!prepared || prepared.segments.length === 0) return null;

		const textNode = node as Text;
		const nodeStart = this.horizontal
			? (this.direction === "rtl" ? nodePos.right : nodePos.left)
			: nodePos.top;
		const relativeTarget = (this.horizontal && this.direction === "rtl")
			? nodeStart - target
			: target - nodeStart;

		if (relativeTarget < 0) return null;

		const segIdx = this._measurer!.findSegmentIndex(prepared.segments, relativeTarget);
		const segments = prepared.segments;
		const doc = textNode.ownerDocument!;
		const len = textNode.data.length;

		// Try the found segment, then the next one (target may fall mid-segment
		// due to CSS column breaks or justification shifting the boundary)
		for (let i = segIdx; i < segments.length && i <= segIdx + 1; i++) {
			const seg = segments[i]!;
			const nextSeg = segments[i + 1];

			const range = doc.createRange();
			range.setStart(textNode, Math.min(seg.charOffset, len));
			range.setEnd(textNode, Math.min(nextSeg ? nextSeg.charOffset : len, len));

			if (verifyFn(range.getBoundingClientRect())) return range;
		}

		return null;
	}

	/**
	 * Canvas fast path for node-level search: binary search on cumulative
	 * document-level text widths to estimate which text node falls at a target
	 * pixel position, then verify with 1-2 getBoundingClientRect calls.
	 * Returns the node and its verified bounds, or null to fall through to the DOM walk.
	 * @private
	 */
	private _canvasFindNode(
		root: Element, start: number, end: number, mode: "start" | "end", scrollDimension?: number
	): { node: Node; nodePos: DOMRect } | null {
		if (!this._measurer) return null;

		const win = root.ownerDocument?.defaultView;
		if (!win) return null;

		const prepared = this._measurer.prepare(root, win);
		if (prepared.length === 0) return null;

		const totalDocWidth = prepared[prepared.length - 1]!.cumDocWidth;
		if (totalDocWidth === 0) return null;

		// Reading scrollWidth/Height forces layout. Callers in hot paths
		// (findRanges, page) hoist this read; fall back to a one-shot read here.
		if (scrollDimension === undefined) {
			const docEl = root.ownerDocument.documentElement;
			scrollDimension = this.horizontal ? docEl.scrollWidth : docEl.scrollHeight;
		}
		if (scrollDimension === 0) return null;

		// Map column boundary to a cumulative-text-width target. cumDocWidth
		// grows in document order, which for RTL means right-to-left visually,
		// so the RTL distance is measured from the right edge.
		let target: number;
		if (this.horizontal && this.direction === "rtl") {
			// reading-order start = right column edge (end);
			// reading-order end = left column edge (start)
			target = scrollDimension - (mode === "start" ? end : start);
		} else {
			target = mode === "start" ? start : end;
		}
		const targetCumWidth = (target / scrollDimension) * totalDocWidth;

		const idx = this._measurer.findNodeIndex(prepared, targetCumWidth);

		// Scan a bounded window around the estimate in document order. The
		// ratio-based estimate can miss by a handful of nodes when images,
		// block gaps, wrapping, or column breaks distort the text-width-to-
		// visual-position mapping. Iterating in document order mirrors the
		// walk in findStart/findEnd, so first-match semantics are preserved.
		//
		// Edge guard: if the match lands at the window boundary on the side
		// we haven't explored past (left edge for "start", right edge for
		// "end"), we can't prove there isn't an earlier/later correct node
		// outside the window. Return null to trigger the DOM walk fallback.
		const WINDOW_RADIUS = 3;
		const lo = Math.max(0, idx - WINDOW_RADIUS);
		const hi = Math.min(prepared.length - 1, idx + WINDOW_RADIUS);

		let prevNode: Text | null = null;
		let prevElPos: DOMRect | null = null;

		for (let ci = lo; ci <= hi; ci++) {
			const candidate = prepared[ci]!;
			const elPos = nodeBounds(candidate.node);

			// Edge guard: match at the left edge of the window with lo > 0
			// means we cannot invoke monotonicity to rule out an earlier
			// match outside the window — fall back to the DOM walk.
			const atLeftEdge = ci === lo && lo > 0;

			if (this.horizontal && this.direction === "ltr") {
				if (mode === "start") {
					if ((elPos.left >= start && elPos.left <= end) || elPos.right > start) {
						if (atLeftEdge) return null;
						return { node: candidate.node, nodePos: elPos };
					}
				} else {
					if (elPos.left > end) {
						if (prevNode && prevElPos) {
							return { node: prevNode, nodePos: prevElPos };
						}
						return null;
					} else if (elPos.right > end) {
						if (atLeftEdge) return null;
						return { node: candidate.node, nodePos: elPos };
					} else {
						prevNode = candidate.node;
						prevElPos = elPos;
					}
				}
			} else if (this.horizontal && this.direction === "rtl") {
				if (mode === "start") {
					if ((elPos.right <= end && elPos.right >= start) || elPos.left < end) {
						if (atLeftEdge) return null;
						return { node: candidate.node, nodePos: elPos };
					}
				} else {
					if (elPos.right < start) {
						if (prevNode && prevElPos) {
							return { node: prevNode, nodePos: prevElPos };
						}
						return null;
					} else if (elPos.left < start) {
						if (atLeftEdge) return null;
						return { node: candidate.node, nodePos: elPos };
					} else {
						prevNode = candidate.node;
						prevElPos = elPos;
					}
				}
			} else {
				if (mode === "start") {
					if ((elPos.top >= start && elPos.top <= end) || elPos.bottom > start) {
						if (atLeftEdge) return null;
						return { node: candidate.node, nodePos: elPos };
					}
				} else {
					if (elPos.top > end) {
						if (prevNode && prevElPos) {
							return { node: prevNode, nodePos: prevElPos };
						}
						return null;
					} else if (elPos.bottom > end) {
						if (atLeftEdge) return null;
						return { node: candidate.node, nodePos: elPos };
					} else {
						prevNode = candidate.node;
						prevElPos = elPos;
					}
				}
			}
		}

		// Loop ended without a match. For end mode, if every node in the
		// window was fully before end AND the window reaches the last
		// prepared node, the last prev is the correct answer (the column
		// contains the rest of the document). Otherwise fall back.
		if (mode === "end" && prevNode && prevElPos && hi === prepared.length - 1) {
			return { node: prevNode, nodePos: prevElPos };
		}

		return null;
	}

	/**
	 * Find Text Start Range
	 * @private
	 * @param {Node} node text node
	 * @param {number} start position to start at
	 * @param {number} end position to end at
	 * @param {DOMRect} [nodePos] pre-computed node bounds from findStart (avoids redundant reflow)
	 * @return {Range}
	 */
	findTextStartRange(node: Node, start: number, end: number, nodePos?: DOMRect): Range {
		// Canvas fast path: reuse nodePos from findStart to avoid a second reflow
		if (nodePos) {
			// RTL: reading-order start is at the right column edge (end)
			const target = (this.horizontal && this.direction === "rtl") ? end : start;
			const canvasRange = this._canvasFindRange(node, nodePos, target, (pos) => {
				const check = this.horizontal
					? (this.direction === "rtl" ? pos.right : pos.left)
					: pos.top;
				if (this.horizontal && this.direction === "ltr") return check >= start;
				if (this.horizontal && this.direction === "rtl") return check <= end;
				return check >= start;
			});
			if (canvasRange) return canvasRange;
		}

		const ranges = this.splitTextNodeIntoRanges(node);
		let range;
		let pos;
		let left, top, right;

		for (let i = 0; i < ranges.length; i++) {
			range = ranges[i]!;

			pos = range.getBoundingClientRect();

			if (this.horizontal && this.direction === "ltr") {

				left = pos.left;
				if( left >= start ) {
					return range;
				}

			} else if (this.horizontal && this.direction === "rtl") {

				right = pos.right;
				if( right <= end ) {
					return range;
				}

			} else {

				top = pos.top;
				if( top >= start ) {
					return range;
				}

			}

		}

		return ranges[0]!;
	}

	/**
	 * Find Text End Range
	 * @private
	 * @param {Node} node text node
	 * @param {number} start position to start at
	 * @param {number} end position to end at
	 * @param {DOMRect} [nodePos] pre-computed node bounds from findEnd (avoids redundant reflow)
	 * @return {Range}
	 */
	findTextEndRange(node: Node, start: number, end: number, nodePos?: DOMRect): Range {
		// Canvas fast path: reuse nodePos from findEnd to avoid a second reflow
		if (nodePos) {
			// RTL: reading-order end is at the left column edge (start)
			const target = (this.horizontal && this.direction === "rtl") ? start : end;
			const canvasRange = this._canvasFindRange(node, nodePos, target, (pos) => {
				if (this.horizontal && this.direction === "ltr") return pos.left <= end && pos.right >= end;
				if (this.horizontal && this.direction === "rtl") return pos.right >= start && pos.left <= start;
				return pos.top <= end && pos.bottom >= end;
			});
			if (canvasRange) return canvasRange;
		}

		const ranges = this.splitTextNodeIntoRanges(node);
		let prev;
		let range;
		let pos;
		let left, right, top, bottom;

		for (let i = 0; i < ranges.length; i++) {
			range = ranges[i]!;

			pos = range.getBoundingClientRect();

			if (this.horizontal && this.direction === "ltr") {

				left = pos.left;
				right = pos.right;

				if(left > end && prev) {
					return prev;
				} else if(right > end) {
					return range;
				}

			} else if (this.horizontal && this.direction === "rtl") {

				left = pos.left
				right = pos.right;

				if(right < start && prev) {
					return prev;
				} else if(left < start) {
					return range;
				}

			} else {

				top = pos.top;
				bottom = pos.bottom;

				if(top > end && prev) {
					return prev;
				} else if(bottom > end) {
					return range;
				}

			}


			prev = range;

		}

		// Ends before limit
		return ranges[ranges.length-1]!;

	}

	/**
	 * Split up a text node into ranges for each word
	 * @private
	 * @param {Node} root root node
	 * @param {string} [_splitter] what to split on
	 * @return {Range[]}
	 */
	splitTextNodeIntoRanges(node: Node, _splitter?: string): Range[] {
		const ranges: Range[] = [];
		const textContent = node.textContent || "";
		const text = textContent.trim();
		let range: Range | null;
		const doc = node.ownerDocument!;
		const splitter = _splitter || " ";

		let pos = text.indexOf(splitter);

		if(pos === -1 || node.nodeType !== Node.TEXT_NODE) {
			range = doc.createRange();
			range.selectNodeContents(node);
			return [range];
		}

		range = doc.createRange();
		range.setStart(node, 0);
		range.setEnd(node, pos);
		ranges.push(range);
		range = null;

		while ( pos !== -1 ) {

			pos = text.indexOf(splitter, pos + 1);
			if(pos > 0) {

				if(range) {
					range.setEnd(node, pos);
					ranges.push(range);
				}

				range = doc.createRange();
				range.setStart(node, pos+1);
			}
		}

		if(range) {
			range.setEnd(node, text.length);
			ranges.push(range);
		}

		return ranges;
	}


	/**
	 * Turn a pair of ranges into a pair of CFIs
	 * @private
	 * @param {string} cfiBase base string for an EpubCFI
	 * @param {object} rangePair { start: Range, end: Range }
	 * @return {object} { start: "epubcfi(...)", end: "epubcfi(...)" }
	 */
	rangePairToCfiPair(cfiBase: string, rangePair: RangePair): EpubCFIPair {

		const startRange = rangePair.start;
		const endRange = rangePair.end;

		startRange.collapse(true);
		endRange.collapse(false);

		const startCfi = new EpubCFI(startRange, cfiBase).toString();
		const endCfi = new EpubCFI(endRange, cfiBase).toString();

		return {
			start: startCfi,
			end: endCfi
		};

	}

	rangeListToCfiList(cfiBase: string, columns: RangePair[]): EpubCFIPair[] {
		const map = [];
		let cifPair;

		for (let i = 0; i < columns.length; i++) {
			cifPair = this.rangePairToCfiPair(cfiBase, columns[i]!);

			map.push(cifPair);

		}

		return map;
	}

	/**
	 * Set the axis for mapping
	 * @param {string} axis horizontal | vertical
	 * @return {boolean} is it horizontal?
	 */
	axis(axis?: string): boolean {
		if (axis) {
			this.horizontal = (axis === "horizontal") ? true : false;
		}
		return this.horizontal;
	}
}

export default Mapping;
