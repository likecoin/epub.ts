import {qs, qsa } from "./utils/core";

/**
 * Open DisplayOptions Format Parser
 * @class
 * @param {document} displayOptionsDocument XML
 */
class DisplayOptions {
	interactive: string;
	fixedLayout: string;
	openToSpread: string;
	orientationLock: string;

	constructor(displayOptionsDocument?: Document) {
		this.interactive = "";
		this.fixedLayout = "";
		this.openToSpread = "";
		this.orientationLock = "";

		if (displayOptionsDocument) {
			this.parse(displayOptionsDocument);
		}
	}

	/**
	 * Parse XML
	 * @param  {document} displayOptionsDocument XML
	 * @return {DisplayOptions} self
	 */
	parse(displayOptionsDocument: Document): this {
		if(!displayOptionsDocument) {
			return this;
		}

		const displayOptionsNode = qs(displayOptionsDocument, "display_options");
		if(!displayOptionsNode) {
			return this;
		} 

		const options = qsa(displayOptionsNode, "option") as NodeListOf<Element>;
		options.forEach((el) => {
			let value = "";

			if (el.childNodes.length) {
				value = el.childNodes[0].nodeValue ?? "";
			}

			switch ((el.attributes as any).name.value) {
			    case "interactive":
			        this.interactive = value;
			        break;
			    case "fixed-layout":
			        this.fixedLayout = value;
			        break;
			    case "open-to-spread":
			        this.openToSpread = value;
			        break;
			    case "orientation-lock":
			        this.orientationLock = value;
			        break;
			}
		});

		return this;
	}

	destroy(): void {
		(this as any).interactive = undefined;
		(this as any).fixedLayout = undefined;
		(this as any).openToSpread = undefined;
		(this as any).orientationLock = undefined;
	}
}

export default DisplayOptions;
