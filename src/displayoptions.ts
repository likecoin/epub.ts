import {qs, qsa } from "./utils/core";

/**
 * Open DisplayOptions Format Parser
 * @class
 * @param {document} displayOptionsDocument XML
 */
class DisplayOptions {
	interactive: string | undefined;
	fixedLayout: string | undefined;
	openToSpread: string | undefined;
	orientationLock: string | undefined;

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
				value = el.childNodes[0]!.nodeValue ?? "";
			}

			switch (el.getAttribute("name") ?? "") {
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
		this.interactive = undefined;
		this.fixedLayout = undefined;
		this.openToSpread = undefined;
		this.orientationLock = undefined;
	}
}

export default DisplayOptions;
