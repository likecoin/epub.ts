import path from "./utils/path-utils";
import {qs} from "./utils/core";

/**
 * Handles Parsing and Accessing an Epub Container
 * @class
 * @param {document} [containerDocument] xml document
 */
class Container {
	packagePath: string | undefined;
	directory: string | undefined;
	encoding: string | undefined;

	constructor(containerDocument?: Document) {
		this.packagePath = "";
		this.directory = "";
		this.encoding = "";

		if (containerDocument) {
			this.parse(containerDocument);
		}
	}

	/**
	 * Parse the Container XML
	 * @param  {document} containerDocument
	 */
	parse(containerDocument: Document): void {
		//-- <rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/>
		if(!containerDocument) {
			throw new Error("Container File Not Found");
		}

		const rootfile = qs(containerDocument, "rootfile");

		if(!rootfile) {
			throw new Error("No RootFile Found");
		}

		this.packagePath = rootfile.getAttribute("full-path") ?? "";
		this.directory = path.dirname(this.packagePath);
		this.encoding = containerDocument.xmlEncoding;
	}

	destroy(): void {
		this.packagePath = undefined;
		this.directory = undefined;
		this.encoding = undefined;
	}
}

export default Container;
