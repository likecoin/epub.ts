import path from "./utils/path-utils";
import {qs} from "./utils/core";

/**
 * Handles Parsing and Accessing an Epub Container
 * @class
 * @param {document} [containerDocument] xml document
 */
class Container {
	packagePath: string;
	directory: string;
	encoding: string;

	constructor(containerDocument?: Document) {
		this.packagePath = '';
		this.directory = '';
		this.encoding = '';

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
		var rootfile;

		if(!containerDocument) {
			throw new Error("Container File Not Found");
		}

		rootfile = qs(containerDocument, "rootfile");

		if(!rootfile) {
			throw new Error("No RootFile Found");
		}

		this.packagePath = rootfile.getAttribute("full-path") ?? "";
		this.directory = path.dirname(this.packagePath);
		this.encoding = (containerDocument as any).xmlEncoding;
	}

	destroy(): void {
		(this as any).packagePath = undefined;
		(this as any).directory = undefined;
		(this as any).encoding = undefined;
	}
}

export default Container;
