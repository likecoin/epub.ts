import EventEmitter from "./utils/event-emitter";
import EpubCFI from "./epubcfi";
import { EVENTS } from "./utils/constants";
import type { IEventEmitter } from "./types";
import type Rendition from "./rendition";
import type IframeView from "./managers/views/iframe";

interface AnnotationView {
	index: number;
	highlight: (cfiRange: string, data?: Record<string, string>, cb?: EventListener, className?: string, styles?: Record<string, string>) => object | undefined;
	underline: (cfiRange: string, data?: Record<string, string>, cb?: EventListener, className?: string, styles?: Record<string, string>) => object | undefined;
	mark: (cfiRange: string, data?: Record<string, string>, cb?: EventListener) => object | null | undefined;
	unhighlight: (cfiRange: string) => void;
	ununderline: (cfiRange: string) => void;
	unmark: (cfiRange: string) => void;
}

/**
	* Handles managing adding & removing Annotations
	* @param {Rendition} rendition
	* @class
	*/
class Annotations {
	rendition: Rendition;
	highlights: Annotation[];
	underlines: Annotation[];
	marks: Annotation[];
	_annotations: Record<string, Annotation>;
	_annotationsBySectionIndex: Record<number, string[]>;

	constructor (rendition: Rendition) {
		this.rendition = rendition;
		this.highlights = [];
		this.underlines = [];
		this.marks = [];
		this._annotations = {};
		this._annotationsBySectionIndex = {};

		this.rendition.hooks.render.register((view: IframeView) => this.inject(view));
		this.rendition.hooks.unloaded.register((view: IframeView) => this.clear(view));
	}

	/**
	 * Add an annotation to store
	 * @param {string} type Type of annotation to add: "highlight", "underline", "mark"
	 * @param {EpubCFI} cfiRange EpubCFI range to attach annotation to
	 * @param {object} data Data to assign to annotation
	 * @param {function} [cb] Callback after annotation is added
	 * @param {string} className CSS class to assign to annotation
	 * @param {object} styles CSS styles to assign to annotation
	 * @returns {Annotation} annotation
	 */
	add (type: string, cfiRange: string, data?: Record<string, any>, cb?: EventListener, className?: string, styles?: Record<string, string>): Annotation {
		const hash = encodeURI(cfiRange + type);
		const cfi = new EpubCFI(cfiRange);
		const sectionIndex = cfi.spinePos;
		const annotation = new Annotation({
			type,
			cfiRange,
			data,
			sectionIndex,
			cb,
			className,
			styles
		});

		this._annotations[hash] = annotation;

		if (sectionIndex in this._annotationsBySectionIndex) {
			this._annotationsBySectionIndex[sectionIndex]!.push(hash);
		} else {
			this._annotationsBySectionIndex[sectionIndex] = [hash];
		}

		const views = this.rendition.views();

		views.forEach( (view: AnnotationView) => {
			if (annotation.sectionIndex === view.index) {
				annotation.attach(view);
			}
		});

		return annotation;
	}

	/**
	 * Remove an annotation from store
	 * @param {EpubCFI} cfiRange EpubCFI range the annotation is attached to
	 * @param {string} type Type of annotation to add: "highlight", "underline", "mark"
	 */
	remove (cfiRange: string, type?: string): void {
		const hash = encodeURI(cfiRange + type);

		if (hash in this._annotations) {
			const annotation = this._annotations[hash]!;

			if (type && annotation.type !== type) {
				return;
			}

			const views = this.rendition.views();
			views.forEach( (view: AnnotationView) => {
				this._removeFromAnnotationBySectionIndex(annotation.sectionIndex, hash);
				if (annotation.sectionIndex === view.index) {
					annotation.detach(view);
				}
			});

			delete this._annotations[hash];
		}
	}

	/**
	 * Remove an annotations by Section Index
	 * @private
	 */
	_removeFromAnnotationBySectionIndex (sectionIndex: number, hash: string): void {
		this._annotationsBySectionIndex[sectionIndex] = this._annotationsAt(sectionIndex).filter(h => h !== hash);
	}

	/**
	 * Get annotations by Section Index
	 * @private
	 */
	_annotationsAt (index: number): string[] {
		return this._annotationsBySectionIndex[index] ?? [];
	}


	/**
	 * Add a highlight to the store
	 * @param {EpubCFI} cfiRange EpubCFI range to attach annotation to
	 * @param {object} data Data to assign to annotation
	 * @param {function} cb Callback after annotation is clicked
	 * @param {string} className CSS class to assign to annotation
	 * @param {object} styles CSS styles to assign to annotation
	 */
	highlight (cfiRange: string, data?: Record<string, any>, cb?: EventListener, className?: string, styles?: Record<string, string>): Annotation {
		return this.add("highlight", cfiRange, data, cb, className, styles);
	}

	/**
	 * Add a underline to the store
	 * @param {EpubCFI} cfiRange EpubCFI range to attach annotation to
	 * @param {object} data Data to assign to annotation
	 * @param {function} cb Callback after annotation is clicked
	 * @param {string} className CSS class to assign to annotation
	 * @param {object} styles CSS styles to assign to annotation
	 */
	underline (cfiRange: string, data?: Record<string, any>, cb?: EventListener, className?: string, styles?: Record<string, string>): Annotation {
		return this.add("underline", cfiRange, data, cb, className, styles);
	}

	/**
	 * Add a mark to the store
	 * @param {EpubCFI} cfiRange EpubCFI range to attach annotation to
	 * @param {object} data Data to assign to annotation
	 * @param {function} cb Callback after annotation is clicked
	 */
	mark (cfiRange: string, data?: Record<string, any>, cb?: EventListener): Annotation {
		return this.add("mark", cfiRange, data, cb);
	}

	/**
	 * iterate over annotations in the store
	 */
	each (fn: (annotation: Annotation, key: string) => void): void {
		Object.keys(this._annotations).forEach((key) => {
			fn(this._annotations[key]!, key);
		});
	}

	/**
	 * Hook for injecting annotation into a view
	 * @param {View} view
	 * @private
	 */
	inject (view: AnnotationView): void {
		const sectionIndex = view.index;
		if (sectionIndex in this._annotationsBySectionIndex) {
			const annotations = this._annotationsBySectionIndex[sectionIndex]!;
			annotations.forEach((hash) => {
				const annotation = this._annotations[hash];
				if (!annotation) return;
				annotation.attach(view);
			});
		}
	}

	/**
	 * Hook for removing annotation from a view
	 * @param {View} view
	 * @private
	 */
	clear (view: AnnotationView): void {
		const sectionIndex = view.index;
		if (sectionIndex in this._annotationsBySectionIndex) {
			const annotations = this._annotationsBySectionIndex[sectionIndex]!;
			annotations.forEach((hash) => {
				const annotation = this._annotations[hash];
				if (!annotation) return;
				annotation.detach(view);
			});
		}
	}

	/**
	 * [Not Implemented] Show annotations
	 * @TODO: needs implementation in View
	 */
	show (): void {

	}

	/**
	 * [Not Implemented] Hide annotations
	 * @TODO: needs implementation in View
	 */
	hide (): void {

	}

}

/**
 * Annotation object
 * @class
 * @param {object} options
 * @param {string} options.type Type of annotation to add: "highlight", "underline", "mark"
 * @param {EpubCFI} options.cfiRange EpubCFI range to attach annotation to
 * @param {object} options.data Data to assign to annotation
 * @param {int} options.sectionIndex Index in the Spine of the Section annotation belongs to
 * @param {function} [options.cb] Callback after annotation is clicked
 * @param {string} className CSS class to assign to annotation
 * @param {object} styles CSS styles to assign to annotation
 * @returns {Annotation} annotation
 */
class Annotation implements IEventEmitter {
	type: string;
	cfiRange: string;
	data: Record<string, any>;
	sectionIndex: number;
	mark: object | null | undefined;
	cb: EventListener;
	className: string;
	styles: Record<string, string>;

	declare on: IEventEmitter["on"];
	declare off: IEventEmitter["off"];
	declare emit: IEventEmitter["emit"];

	constructor ({
		type,
		cfiRange,
		data,
		sectionIndex,
		cb,
		className,
		styles
	}: { type: string; cfiRange: string; data?: Record<string, any>; sectionIndex?: number; cb?: EventListener; className?: string; styles?: Record<string, string> }) {
		this.type = type;
		this.cfiRange = cfiRange;
		this.data = data ?? {};
		this.sectionIndex = sectionIndex ?? 0;
		this.mark = undefined;
		this.cb = cb!;
		this.className = className ?? "";
		this.styles = styles ?? {};
	}

	/**
	 * Update stored data
	 * @param {object} data
	 */
	update (data: Record<string, any>): void {
		this.data = data;
	}

	/**
	 * Add to a view
	 * @param {View} view
	 */
	attach (view: AnnotationView): object | null | undefined {
		const {cfiRange, data, type, mark: _mark, cb, className, styles} = this;
		let result;

		if (type === "highlight") {
			result = view.highlight(cfiRange, data, cb, className, styles);
		} else if (type === "underline") {
			result = view.underline(cfiRange, data, cb, className, styles);
		} else if (type === "mark") {
			result = view.mark(cfiRange, data, cb);
		}

		this.mark = result;
		this.emit(EVENTS.ANNOTATION.ATTACH, result);
		return result;
	}

	/**
	 * Remove from a view
	 * @param {View} view
	 */
	detach (view: AnnotationView): void {
		const {cfiRange, type} = this;

		if (view) {
			if (type === "highlight") {
				view.unhighlight(cfiRange);
			} else if (type === "underline") {
				view.ununderline(cfiRange);
			} else if (type === "mark") {
				view.unmark(cfiRange);
			}
		}

		this.mark = undefined;
		this.emit(EVENTS.ANNOTATION.DETACH, undefined);
	}

	/**
	 * [Not Implemented] Get text of an annotation
	 * @TODO: needs implementation in contents
	 */
	text (): void {

	}

}

EventEmitter(Annotation.prototype);


export default Annotations
