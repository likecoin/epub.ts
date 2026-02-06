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
	declare emit: (type: string, ...args: any[]) => void;

	spine: Spine;
	request: RequestFunction;
	pause: number;
	q: Queue;
	epubcfi: EpubCFI;
	_locations: string[];
	_locationsWords: { cfi: string; wordCount: number }[];
	total: number;
	break: number;
	_current: number;
	_wordCounter: number;
	_currentCfi: string;
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

		this._currentCfi ='';
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

		this.q.pause();

		this.spine.each(function(section: Section) {
			if (section.linear) {
				this.q.enqueue(this.process.bind(this), section);
			}
		}.bind(this));

		return this.q.run().then(function() {
			this.total = this._locations.length - 1;

			if (this._currentCfi) {
				this.currentLocation = this._currentCfi;
			}

			return this._locations;
			// console.log(this.percentage(this.book.rendition.location.start), this.percentage(this.book.rendition.location.end));
		}.bind(this));

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
			.then(function(contents: Element) {
				var completed = new defer();
				var locations = this.parse(contents, section.cfiBase);
				this._locations = this._locations.concat(locations);

				section.unload();

				this.processingTimeout = setTimeout(() => completed.resolve(locations), this.pause);
				return completed.promise;
			}.bind(this));

	}

	parse(contents: Element, cfiBase: string, chars?: number): string[] {
		var locations: string[] = [];
		var range: any;
		var doc = contents.ownerDocument;
		var body = qs(doc, "body");
		var counter = 0;
		var prev: any;
		var _break = chars || this.break;
		var parser = function(node: Node) {
			var len = (node as Text).length;
			var dist;
			var pos = 0;

			if ((node.textContent ?? "").trim().length === 0) {
				return false; // continue
			}

			// Start range
			if (counter == 0) {
				range = this.createRange();
				range.startContainer = node;
				range.startOffset = 0;
			}

			dist = _break - counter;

			// Node is smaller than a break,
			// skip over it
			if(dist > len){
				counter += len;
				pos = len;
			}


			while (pos < len) {
				dist = _break - counter;

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
					let cfi = new EpubCFI(range, cfiBase).toString();
					locations.push(cfi);
					counter = 0;
				}
			}
			prev = node;
		};

		sprint(body!, parser.bind(this));

		// Close remaining
		if (range && range.startContainer && prev) {
			range.endContainer = prev;
			range.endOffset = prev.length;
			let cfi = new EpubCFI(range, cfiBase).toString();
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
	generateFromWords(startCfi?: string, wordCount?: number, count?: number): Promise<any[]> {
		var start = startCfi ? new EpubCFI(startCfi) : undefined;
		this.q.pause();
		this._locationsWords = [];
		this._wordCounter = 0;

		this.spine.each(function(section: Section) {
			if (section.linear) {
				if (start) {
					if (section.index >= start.spinePos) {
						this.q.enqueue(this.processWords.bind(this), section, wordCount, start, count);
					}
				} else {
					this.q.enqueue(this.processWords.bind(this), section, wordCount, start, count);
				}
			}
		}.bind(this));

		return this.q.run().then(function() {
			if (this._currentCfi) {
				this.currentLocation = this._currentCfi;
			}

			return this._locationsWords;
		}.bind(this));

	}

	processWords(section: Section, wordCount: number, startCfi?: EpubCFI, count?: number): Promise<any> {
		if (count && this._locationsWords.length >= count) {
			return Promise.resolve();
		}

		return section.load(this.request)
			.then(function(contents: Element) {
				var completed = new defer();
				var locations = this.parseWords(contents, section, wordCount, startCfi);
				var remainingCount = count! - this._locationsWords.length;
				this._locationsWords = this._locationsWords.concat(locations.length >= count! ? locations.slice(0, remainingCount) : locations);

				section.unload();

				this.processingTimeout = setTimeout(() => completed.resolve(locations), this.pause);
				return completed.promise;
			}.bind(this));
	}

	//http://stackoverflow.com/questions/18679576/counting-words-in-string
	countWords(s: string): number {
		s = s.replace(/(^\s*)|(\s*$)/gi, "");//exclude  start and end white-space
		s = s.replace(/[ ]{2,}/gi, " ");//2 or more space to 1
		s = s.replace(/\n /, "\n"); // exclude newline with a start spacing
		return s.split(" ").length;
	}

	parseWords(contents: Element, section: Section, wordCount: number, startCfi?: EpubCFI): { cfi: string; wordCount: number }[] {
		var cfiBase = section.cfiBase;
		var locations: { cfi: string; wordCount: number }[] = [];
		var doc = contents.ownerDocument;
		var body = qs(doc, "body");
		var prev;
		var _break = wordCount;
		var foundStartNode = startCfi ? startCfi.spinePos !== section.index : true;
		var startNode: Node | undefined;
		if (startCfi && section.index === startCfi.spinePos) {
			startNode = startCfi.findNode(startCfi.range ? startCfi.path.steps.concat(startCfi.start!.steps) : startCfi.path.steps, contents.ownerDocument!);
		}
		var parser = function(node: Node) {
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
			var len  = this.countWords(node.textContent ?? "");
			var dist;
			var pos = 0;

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

					let cfi = new EpubCFI(node, cfiBase);
					locations.push({ cfi: cfi.toString(), wordCount: this._wordCounter });
					this._wordCounter = 0;
				}
			}
			prev = node;
		};

		sprint(body!, parser.bind(this));

		return locations;
	}

	/**
	 * Get a location from an EpubCFI
	 * @param {EpubCFI} cfi
	 * @return {number}
	 */
	locationFromCfi(cfi: string | EpubCFI): number {
		let loc;
		if (EpubCFI.prototype.isCfiString(cfi)) {
			cfi = new EpubCFI(cfi);
		}
		// Check if the location has not been set yet
		if(this._locations.length === 0) {
			return -1;
		}

		loc = locationOf(cfi, this._locations, this.epubcfi.compare);

		if (loc > this.total) {
			return this.total;
		}

		return loc;
	}

	/**
	 * Get a percentage position in locations from an EpubCFI
	 * @param {EpubCFI} cfi
	 * @return {number}
	 */
	percentageFromCfi(cfi: string | EpubCFI): number | null {
		if(this._locations.length === 0) {
			return null;
		}
		// Find closest cfi
		var loc = this.locationFromCfi(cfi);
		// Get percentage in total
		return this.percentageFromLocation(loc);
	}

	/**
	 * Get a percentage position from a location index
	 * @param {number} location
	 * @return {number}
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
		var cfi: string | number = -1;
		// check that pg is an int
		if(typeof loc != "number"){
			loc = parseInt(loc);
		}

		if(loc >= 0 && loc < this._locations.length) {
			cfi = this._locations[loc];
		}

		return cfi;
	}

	/**
	 * Get an EpubCFI from location percentage
	 * @param {number} percentage
	 * @return {EpubCFI} cfi
	 */
	cfiFromPercentage(percentage: number): string | number {
		let loc;
		if (percentage > 1) {
			console.warn("Normalize cfiFromPercentage value to between 0 - 1");
		}

		// Make sure 1 goes to very end
		if (percentage >= 1) {
			let cfi = new EpubCFI(this._locations[this.total]);
			cfi.collapse();
			return cfi.toString();
		}

		loc = Math.ceil(this.total * percentage);
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
		this.total = this._locations.length - 1;
		return this._locations;
	}

	/**
	 * Save locations to JSON
	 * @return {json}
	 */
	save(): string {
		return JSON.stringify(this._locations);
	}

	getCurrent(): number {
		return this._current;
	}

	setCurrent(curr: string | number): void {
		var loc;

		if(typeof curr == "string"){
			this._currentCfi = curr;
		} else if (typeof curr == "number") {
			this._current = curr;
		} else {
			return;
		}

		if(this._locations.length === 0) {
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
	get currentLocation(): number {
		return this._current;
	}

	/**
	 * Set the current location
	 */
	set currentLocation(curr: string | number) {
		this.setCurrent(curr);
	}

	/**
	 * Locations length
	 */
	length (): number {
		return this._locations.length;
	}

	destroy (): void {
		(this as any).spine = undefined;
		(this as any).request = undefined;
		(this as any).pause = undefined;

		this.q.stop();
		(this as any).q = undefined;
		(this as any).epubcfi = undefined;

		(this as any)._locations = undefined;
		(this as any).total = undefined;

		(this as any).break = undefined;
		(this as any)._current = undefined;

		(this as any).currentLocation = undefined;
		(this as any)._currentCfi = undefined;
		clearTimeout(this.processingTimeout);
	}
}

EventEmitter(Locations.prototype);

export default Locations;
