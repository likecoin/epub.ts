import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT_FILE = join(tmpdir(), "epub-ts-test-port");

let cachedPort: string | undefined;

export function getFixtureUrl(filepath: string): string {
	if (!cachedPort) {
		cachedPort = readFileSync(PORT_FILE, "utf-8").trim();
	}
	return `http://127.0.0.1:${cachedPort}${filepath}`;
}

export function parseXML(xml: string, mime: DOMParserSupportedType = "application/xml"): Document {
	return new DOMParser().parseFromString(xml, mime);
}
