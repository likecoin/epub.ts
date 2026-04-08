/**
 * Canvas-based text measurement utility.
 *
 * Applies pretext's prepare/layout pattern: expensive measurement is done once
 * via CanvasRenderingContext2D.measureText(), then layout queries (finding the
 * character offset at a pixel position) are pure binary-search arithmetic with
 * zero DOM reflow.
 *
 * Browser-only — not imported by the Node.js entry point.
 */

export interface TextSegment {
	/** The text node this segment belongs to */
	node: Text;
	/** Character offset within the text node where this segment starts */
	charOffset: number;
	/** The segment text content */
	text: string;
	/** Measured width of this segment in pixels */
	width: number;
	/** Cumulative width from the start of this text node's segment list */
	cumWidth: number;
}

export interface PreparedNode {
	node: Text;
	segments: TextSegment[];
	totalWidth: number;
	font: string;
	/** Cumulative width from document start through end of this node */
	cumDocWidth: number;
}

type SegmenterLike = { segment(text: string): Iterable<{ segment: string; index: number }> };

// CJK Unicode ranges for per-character segmentation fallback
const CJK_RE = /[\u2E80-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\u{20000}-\u{2FA1F}]/u;

/**
 * Determine if a CSS property value is "exotic" (non-default), meaning
 * canvas measureText() would not account for it.
 */
function hasExoticTextCSS(style: CSSStyleDeclaration): boolean {
	const letterSpacing = style.letterSpacing;
	if (letterSpacing && letterSpacing !== "normal" && letterSpacing !== "0px") return true;

	const wordSpacing = style.wordSpacing;
	if (wordSpacing && wordSpacing !== "normal" && wordSpacing !== "0px") return true;

	const textIndent = style.textIndent;
	if (textIndent && textIndent !== "0px") return true;

	return false;
}

/** Max number of font entries in the width cache before eviction */
const MAX_WIDTH_CACHE_FONTS = 32;

class TextMeasurer {
	private _canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
	private _ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
	/** font string → (text → width), bounded to MAX_WIDTH_CACHE_FONTS entries */
	private _widthCache: Map<string, Map<string, number>> = new Map();
	/** parent element → prepared nodes */
	private _preparedCache: WeakMap<Element, PreparedNode[]> = new WeakMap();
	/** text node → prepared node, for O(1) lookup in _canvasPrepare */
	private _nodeIndex: WeakMap<Text, PreparedNode> = new WeakMap();
	/** shared Intl.Segmenter instance (lazy) */
	private _segmenter: SegmenterLike | null = null;

	private getCanvas(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null {
		if (this._ctx) return this._ctx;

		if (typeof OffscreenCanvas !== "undefined") {
			this._canvas = new OffscreenCanvas(1, 1);
			this._ctx = this._canvas.getContext("2d");
			if (this._ctx) return this._ctx;
		}
		this._canvas = document.createElement("canvas");
		this._ctx = this._canvas.getContext("2d");
		return this._ctx;
	}

	private getSegmenter(): SegmenterLike | null {
		if (this._segmenter) return this._segmenter;
		if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
			this._segmenter = new (Intl as typeof Intl & { Segmenter: new (locale?: string, options?: { granularity: string }) => SegmenterLike }).Segmenter(undefined, { granularity: "word" });
			return this._segmenter;
		}
		return null;
	}

	/**
	 * Measure a text string with a given CSS font, returning its width in pixels.
	 * Results are cached per font+text pair.
	 */
	measureText(text: string, font: string): number {
		let fontMap = this._widthCache.get(font);
		if (fontMap) {
			const cached = fontMap.get(text);
			if (cached !== undefined) return cached;
		} else {
			// Evict oldest font entry if cache is full
			if (this._widthCache.size >= MAX_WIDTH_CACHE_FONTS) {
				const oldest = this._widthCache.keys().next().value;
				if (oldest !== undefined) this._widthCache.delete(oldest);
			}
			fontMap = new Map();
			this._widthCache.set(font, fontMap);
		}

		const ctx = this.getCanvas();
		if (!ctx) return 0;
		ctx.font = font;
		const width = ctx.measureText(text).width;
		fontMap.set(text, width);
		return width;
	}

	/**
	 * Segment text into word-level pieces suitable for measurement.
	 * Uses Intl.Segmenter when available, falls back to space-splitting
	 * (with per-character splitting for CJK).
	 */
	segmentText(text: string): { text: string; index: number }[] {
		const segmenter = this.getSegmenter();
		if (segmenter) {
			const result: { text: string; index: number }[] = [];
			for (const seg of segmenter.segment(text)) {
				result.push({ text: seg.segment, index: seg.index });
			}
			return result;
		}

		// Fallback: split on spaces, but split CJK characters individually.
		// Iterate by code point (for...of) to handle surrogate pairs correctly,
		// while tracking UTF-16 index for DOM Range offsets.
		const result: { text: string; index: number }[] = [];
		let current = "";
		let currentStart = 0;
		let i = 0;

		for (const ch of text) {
			if (ch === " ") {
				if (current) {
					result.push({ text: current, index: currentStart });
				}
				result.push({ text: " ", index: i });
				current = "";
				currentStart = i + ch.length;
			} else if (CJK_RE.test(ch)) {
				if (current) {
					result.push({ text: current, index: currentStart });
					current = "";
				}
				result.push({ text: ch, index: i });
				currentStart = i + ch.length;
			} else {
				if (!current) currentStart = i;
				current += ch;
			}
			i += ch.length;
		}
		if (current) {
			result.push({ text: current, index: currentStart });
		}
		return result;
	}

	/**
	 * Prepare phase: measure all text nodes under a root element.
	 * Returns PreparedNode[] with cumulative widths for binary search.
	 *
	 * Text nodes whose parent has exotic CSS (letter-spacing, word-spacing,
	 * text-indent) are skipped — the caller should fall back to DOM Range
	 * measurement for those.
	 *
	 * @param root The container element (usually document.body)
	 * @param win The window object for getComputedStyle
	 * @returns PreparedNode[] with entries for measurable text nodes (may be empty)
	 */
	prepare(root: Element, win: Window): PreparedNode[] {
		const cached = this._preparedCache.get(root);
		if (cached) return cached;

		const result: PreparedNode[] = [];
		const styleCache = new Map<Element, CSSStyleDeclaration>();
		const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
			acceptNode(node: Node): number {
				return (node as Text).data.trim().length > 0
					? NodeFilter.FILTER_ACCEPT
					: NodeFilter.FILTER_REJECT;
			}
		});

		let textNode: Text | null;
		while ((textNode = walker.nextNode() as Text | null)) {
			const parent = textNode.parentElement;
			if (!parent) continue;

			let style = styleCache.get(parent);
			if (!style) {
				style = win.getComputedStyle(parent);
				styleCache.set(parent, style);
			}
			if (hasExoticTextCSS(style)) continue;

			const font = style.font;
			if (!font) continue;

			const text = textNode.data;
			const segments = this.segmentText(text);
			const measured: TextSegment[] = [];
			let cumWidth = 0;

			for (const seg of segments) {
				const w = this.measureText(seg.text, font);
				measured.push({
					node: textNode,
					charOffset: seg.index,
					text: seg.text,
					width: w,
					cumWidth: cumWidth + w,
				});
				cumWidth += w;
			}

			const preparedNode: PreparedNode = {
				node: textNode,
				segments: measured,
				totalWidth: cumWidth,
				font,
				cumDocWidth: 0,
			};
			result.push(preparedNode);
			this._nodeIndex.set(textNode, preparedNode);
		}

		// Compute cumulative document-level widths for node-level binary search
		let docCumWidth = 0;
		for (let i = 0; i < result.length; i++) {
			docCumWidth += result[i]!.totalWidth;
			result[i]!.cumDocWidth = docCumWidth;
		}

		this._preparedCache.set(root, result);
		return result;
	}

	/**
	 * Clamped lower-bound binary search: returns the first index where
	 * getValue(arr[index]) >= target, or the last index when target exceeds
	 * all values (callers expect a valid in-range index even for overshoot).
	 * Returns 0 for empty arrays.
	 */
	private _lowerBound<T>(arr: T[], target: number, getValue: (item: T) => number): number {
		if (arr.length === 0) return 0;

		let lo = 0;
		let hi = arr.length - 1;

		while (lo < hi) {
			const mid = (lo + hi) >>> 1;
			if (getValue(arr[mid]!) < target) {
				lo = mid + 1;
			} else {
				hi = mid;
			}
		}

		return lo;
	}

	/**
	 * Find the segment index at a given pixel position using binary search
	 * on cumulative widths within a text node.
	 */
	findSegmentIndex(segments: TextSegment[], position: number): number {
		return this._lowerBound(segments, position, s => s.cumWidth);
	}

	/**
	 * Find the first PreparedNode index whose cumDocWidth is >= targetWidth.
	 */
	findNodeIndex(prepared: PreparedNode[], targetWidth: number): number {
		return this._lowerBound(prepared, targetWidth, n => n.cumDocWidth);
	}

	/**
	 * Look up a previously prepared text node in O(1).
	 * Returns null if the node was not prepared (exotic CSS, not yet prepared, etc.).
	 */
	getPreparedNode(node: Text): PreparedNode | null {
		return this._nodeIndex.get(node) || null;
	}

	/**
	 * Check if a text node's parent has exotic CSS that prevents canvas measurement.
	 */
	hasExoticCSS(node: Text, win: Window): boolean {
		const parent = node.parentElement;
		if (!parent) return true;
		return hasExoticTextCSS(win.getComputedStyle(parent));
	}

	/**
	 * Invalidate cached preparation for a root element,
	 * including all per-node index entries under it.
	 */
	invalidate(root: Element): void {
		const cached = this._preparedCache.get(root);
		if (cached) {
			for (const p of cached) {
				this._nodeIndex.delete(p.node);
			}
			this._preparedCache.delete(root);
		}
	}

	/**
	 * Destroy the measurer, releasing the canvas and all caches.
	 */
	destroy(): void {
		this._widthCache.clear();
		this._preparedCache = new WeakMap();
		this._nodeIndex = new WeakMap();
		this._ctx = null;
		this._canvas = null;
		this._segmenter = null;
	}
}

export default TextMeasurer;
