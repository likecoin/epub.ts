import {qs, sprint, locationOf, defer} from "./utils/core";
import Queue from "./utils/queue";
import EpubCFI from "./epubcfi";
import { EVENTS } from "./utils/constants";
import EventEmitter from "./utils/event-emitter";
import type { IEventEmitter, RequestFunction } from "./types";
import type Spine from "./spine";
import type Section from "./section";

/**
 * Find Locations for a Book
 * @param {Spine} spine
 * @param {request} request
 * @param {number} [pause=100]
 */
class Locations implements IEventEmitter {
	declare on: (type: string, fn: (...args: any[]) => void) => this;
	declare off: (type: string, fn?: (...args: any[]) => void) => this;
	declare emit: (type: string, ...args: unknown[]) => void;

	spine: Spine | undefined;
	request: RequestFunction | undefined;
	pause: number | undefined;
	q: Queue | undefined;
	epubcfi: EpubCFI | undefined;
	_locations: string[] | undefined;
	_locationsWords: { cfi: string; wordCount: number }[];
	total: number | undefined;
	break: number | undefined;
	_current: number | undefined;
	_wordCounter: number;
	_currentCfi: string | undefined;
	processingTimeout: ReturnType<typeof setTimeout> | undefined;

	constructor(spine: Spine, request: RequestFunction, pause?: number) {
		this.spine = spine;
		this.request = request;
		this.pause = pause || 100;

		this.q = new Queue(this);
		this.epubcfi = new EpubCFI();

		this._locations = [];
		this._locationsWords = [];
		this.total = 0;

		this.break = 150;

		this._current = 0;

		this._wordCounter = 0;

		this._currentCfi ="";
		this.processingTimeout = undefined;
	}

	/**
	 * Load all of sections in the book to generate locations
	 * @param  {int} chars how many chars to split on
	 * @return {Promise<Array<string>>} locations
	 */
	generate(chars?: number): Promise<string[]> {

		if (chars) {
			this.break = chars;
		}

		this.q!.pause();

		this.spine!.each((section: Section) => {
			if (section.linear) {
				this.q!.enqueue((s: Section) => this.process(s), section);
			}
		});

		return this.q!.run().then(() => {
			this.total = this._locations!.length - 1;

			if (this._currentCfi) {
				this.currentLocation = this._currentCfi;
			}

			return this._locations!;
			// console.log(this.percentage(this.book.rendition.location.start), this.percentage(this.book.rendition.location.end));
		});

	}

	createRange (): { startContainer: Node | undefined; startOffset: number | undefined; endContainer: Node | undefined; endOffset: number | undefined } {
		return {
			startContainer: undefined,
			startOffset: undefined,
			endContainer: undefined,
			endOffset: undefined
		};
	}

	process(section: Section): Promise<string[]> {

		return section.load(this.request)
			.then((contents: Element) => {
				const completed = new defer<string[]>();
				const locations = this.parse(contents, section.cfiBase!);
				this._locations = this._locations!.concat(locations);

				section.unload();

				this.processingTimeout = setTimeout(() => completed.resolve(locations), this.pause);
				return completed.promise;
			});

	}

	parse(contents: Element, cfiBase: string, chars?: number): string[] {
		const locations: string[] = [];
		let range: any;
		const doc = contents.ownerDocument;
		const body = qs(doc, "body");
		let counter = 0;
		let prev: any;
		const _break = chars || this.break;
		const parser = (node: Node): boolean => {
			const len = (node as Text).length;
			let dist;
			let pos = 0;

			if ((node.textContent ?? "").trim().length === 0) {
				prev = node;
				return false; // continue
			}

			// Start range
			if (counter === 0) {
				range = this.createRange();
				range.startContainer = node;
				range.startOffset = 0;
			}

			dist = _break! - counter;

			// Node is smaller than a break,
			// skip over it
			if(dist > len){
				counter += len;
				pos = len;
			}


			while (pos < len) {
				dist = _break! - counter;

				if (counter === 0) {
					// Start new range
					pos += 1;
					range = this.createRange();
					range.startContainer = node;
					range.startOffset = pos;
				}

				// pos += dist;

				// Gone over
				if(pos + dist >= len){
					// Continue counter for next node
					counter += len - pos;
					// break
					pos = len;
				// At End
				} else {
					// Advance pos
					pos += dist;

					// End the previous range
					range.endContainer = node;
					range.endOffset = pos;
					// cfi = section.cfiFromRange(range);
					const cfi = new EpubCFI(range, cfiBase).toString();
					locations.push(cfi);
					counter = 0;
				}
			}
			prev = node;
			return false;
		};

		sprint(body!, parser);

		// Close remaining
		if (range && range.startContainer && prev) {
			range.endContainer = prev;
			range.endOffset = prev.length;
			const cfi = new EpubCFI(range, cfiBase).toString();
			locations.push(cfi);
			counter = 0;
		}

		return locations;
	}


	/**
	 * Load all of sections in the book to generate locations
	 * @param  {string} startCfi start position
	 * @param  {int} wordCount how many words to split on
	 * @param  {int} count result count
	 * @return {object} locations
	 */
	generateFromWords(startCfi?: string, wordCount?: number, count?: number): Promise<{ cfi: string; wordCount: number }[]> {
		const start = startCfi ? new EpubCFI(startCfi) : undefined;
		this.q!.pause();
		this._locationsWords = [];
		this._wordCounter = 0;

		this.spine!.each((section: Section) => {
			if (section.linear) {
				if (start) {
					if (section.index! >= start.spinePos) {
						this.q!.enqueue((s: Section, wc: number, st: any, c: number) => this.processWords(s, wc, st, c), section, wordCount!, start, count!);
					}
				} else {
					this.q!.enqueue((s: Section, wc: number, st: any, c: number) => this.processWords(s, wc, st, c), section, wordCount!, start, count!);
				}
			}
		});

		return this.q!.run().then(() => {
			if (this._currentCfi) {
				this.currentLocation = this._currentCfi;
			}

			return this._locationsWords;
		});

	}

	processWords(section: Section, wordCount: number, startCfi?: EpubCFI, count?: number): Promise<{ cfi: string; wordCount: number }[]> {
		if (count && this._locationsWords.length >= count) {
			return Promise.resolve([]);
		}

		return section.load(this.request)
			.then((contents: Element) => {
				const completed = new defer<{ cfi: string; wordCount: number }[]>();
				const locations = this.parseWords(contents, section, wordCount, startCfi);
				const remainingCount = count! - this._locationsWords.length;
				this._locationsWords = this._locationsWords.concat(locations.length >= count! ? locations.slice(0, remainingCount) : locations);

				section.unload();

				this.processingTimeout = setTimeout(() => completed.resolve(locations), this.pause);
				return completed.promise;
			});
	}

	//http://stackoverflow.com/questions/18679576/counting-words-in-string
	countWords(s: string): number {
		s = s.replace(/(^\s*)|(\s*$)/gi, "");//exclude  start and end white-space
		s = s.replace(/[ ]{2,}/gi, " ");//2 or more space to 1
		s = s.replace(/\n /, "\n"); // exclude newline with a start spacing
		return s.split(" ").length;
	}

	parseWords(contents: Element, section: Section, wordCount: number, startCfi?: EpubCFI): { cfi: string; wordCount: number }[] {
		const cfiBase = section.cfiBase;
		const locations: { cfi: string; wordCount: number }[] = [];
		const doc = contents.ownerDocument;
		const body = qs(doc, "body");
		let _prev;
		const _break = wordCount;
		let foundStartNode = startCfi ? startCfi.spinePos !== section.index : true;
		let startNode: Node | undefined;
		if (startCfi && section.index === startCfi.spinePos) {
			startNode = startCfi.findNode(startCfi.range ? startCfi.path.steps.concat(startCfi.start!.steps) : startCfi.path.steps, contents.ownerDocument!);
		}
		const parser = (node: Node): boolean => {
			if (!foundStartNode) {
				if (node === startNode) {
					foundStartNode = true;
				} else {
					return false;
				}
			}
			if ((node.textContent ?? "").length < 10) {
				if ((node.textContent ?? "").trim().length === 0) {
					return false;
				}
			}
			const len  = this.countWords(node.textContent ?? "");
			let dist;
			let pos = 0;

			if (len === 0) {
				return false; // continue
			}

			dist = _break - this._wordCounter;

			// Node is smaller than a break,
			// skip over it
			if (dist > len) {
				this._wordCounter += len;
				pos = len;
			}


			while (pos < len) {
				dist = _break - this._wordCounter;

				// Gone over
				if (pos + dist >= len) {
					// Continue counter for next node
					this._wordCounter += len - pos;
					// break
					pos = len;
					// At End
				} else {
					// Advance pos
					pos += dist;

					const cfi = new EpubCFI(node, cfiBase);
					locations.push({ cfi: cfi.toString(), wordCount: this._wordCounter });
					this._wordCounter = 0;
				}
			}
			_prev = node;
			return false;
		};

		sprint(body!, parser);

		return locations;
	}

	/**
	 * Get a location from an EpubCFI
	 * @param {EpubCFI} cfi
	 * @return {number}
	 */
	locationFromCfi(cfi: string | EpubCFI): number {
		if (EpubCFI.prototype.isCfiString(cfi)) {
			cfi = new EpubCFI(cfi);
		}
		// Check if the location has not been set yet
		if(this._locations!.length === 0) {
			return -1;
		}

		const loc = locationOf(cfi, this._locations!, this.epubcfi!.compare);

		if (loc > this.total!) {
			return this.total!;
		}

		return loc;
	}

	/**
	 * Get a percentage position in locations from an EpubCFI
	 * @param {EpubCFI} cfi
	 * @return {number}
	 */
	percentageFromCfi(cfi: string | EpubCFI): number | null {
		if(this._locations!.length === 0) {
			return null;
		}
		// Find closest cfi
		const loc = this.locationFromCfi(cfi);
		// Get percentage in total
		return this.percentageFromLocation(loc);
	}

	/**
	 * Get a percentage position from a location index
	 * @param loc - location index
	 * @return percentage
	 */
	percentageFromLocation(loc: number): number {
		if (!loc || !this.total) {
			return 0;
		}

		return (loc / this.total);
	}

	/**
	 * Get an EpubCFI from location index
	 * @param {number} loc
	 * @return {EpubCFI} cfi
	 */
	cfiFromLocation(loc: string | number): string | number {
		let cfi: string | number = -1;
		// check that pg is an int
		if(typeof loc != "number"){
			loc = parseInt(loc);
		}

		if(loc >= 0 && loc < this._locations!.length) {
			cfi = this._locations![loc]!;
		}

		return cfi;
	}

	/**
	 * Get an EpubCFI from location percentage
	 * @param {number} percentage
	 * @return {EpubCFI} cfi
	 */
	cfiFromPercentage(percentage: number): string | number {
		if (percentage > 1) {
		// eslint-disable-next-line no-console
		console.warn("Normalize cfiFromPercentage value to between 0 - 1");
		}

		// Make sure 1 goes to very end
		if (percentage >= 1) {
			const cfi = new EpubCFI(this._locations![this.total!]);
			cfi.collapse();
			return cfi.toString();
		}

		const loc = Math.ceil(this.total! * percentage);
		return this.cfiFromLocation(loc);
	}

	/**
	 * Load locations from JSON
	 * @param {json} locations
	 */
	load(locations: string | string[]): string[] {
		if (typeof locations === "string") {
			this._locations = JSON.parse(locations);
		} else {
			this._locations = locations;
		}
		this.total = this._locations!.length - 1;
		return this._locations!;
	}

	/**
	 * Save locations to JSON
	 * @return {json}
	 */
	save(): string {
		return JSON.stringify(this._locations);
	}

	getCurrent(): number {
		return this._current!;
	}

	setCurrent(curr: string | number | undefined): void {
		let loc;

		if(typeof curr == "string"){
			this._currentCfi = curr;
		} else if (typeof curr == "number") {
			this._current = curr;
		} else {
			return;
		}

		if(this._locations!.length === 0) {
			return;
		}

		if(typeof curr == "string"){
			loc = this.locationFromCfi(curr);
			this._current = loc;
		} else {
			loc = curr;
		}

		this.emit(EVENTS.LOCATIONS.CHANGED, {
			percentage: this.percentageFromLocation(loc)
		});
	}

	/**
	 * Get the current location
	 */
	get currentLocation(): number | undefined {
		return this._current;
	}

	/**
	 * Set the current location
	 */
	set currentLocation(curr: string | number | undefined) {
		this.setCurrent(curr);
	}

	/**
	 * Locations length
	 */
	length (): number {
		return this._locations!.length;
	}

	destroy (): void {
		this.spine = undefined;
		this.request = undefined;
		this.pause = undefined;

		this.q?.stop();
		this.q = undefined;
		this.epubcfi = undefined;

		this._locations = undefined;
		this.total = undefined;

		this.break = undefined;
		this._current = undefined;

		this.currentLocation = undefined;
		this._currentCfi = undefined;
		clearTimeout(this.processingTimeout);
	}
}

EventEmitter(Locations.prototype);

export default Locations;
