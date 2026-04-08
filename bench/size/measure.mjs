#!/usr/bin/env node
/**
 * Track C — static bundle size measurement.
 *
 * Compares raw / gzip / brotli sizes of the ESM builds of
 * epubjs vs @likecoin/epub-ts. Purely static; no runtime involved.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { gzipSync, brotliCompressSync, constants as zlibConstants } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const RESULTS_DIR = resolve(ROOT, "bench", "results");

const targets = [
	{
		name: "epubjs",
		label: "epubjs 0.3.93",
		path: resolve(ROOT, "node_modules/epubjs/dist/epub.js"),
	},
	{
		name: "epub-ts",
		label: "@likecoin/epub-ts",
		path: resolve(ROOT, "dist/epub.js"),
	},
];

function measure(file) {
	if (!existsSync(file)) {
		throw new Error(`missing: ${file} (did you run \`npm run build\`?)`);
	}
	const buf = readFileSync(file);
	const gz = gzipSync(buf, { level: 9 });
	const br = brotliCompressSync(buf, {
		params: {
			[zlibConstants.BROTLI_PARAM_QUALITY]: 11,
		},
	});
	return { raw: buf.length, gzip: gz.length, brotli: br.length };
}

function kb(n) {
	return (n / 1024).toFixed(1);
}

function pctDelta(a, b) {
	if (a === 0) return "n/a";
	const d = ((b - a) / a) * 100;
	const sign = d > 0 ? "+" : "";
	return `${sign}${d.toFixed(1)}%`;
}

const results = targets.map(t => ({ ...t, ...measure(t.path) }));

const [epubjs, epubts] = results;

const header = `| Library              | Raw (KB) | gzip (KB) | brotli (KB) |`;
const sep    = `| -------------------- | -------: | --------: | ----------: |`;
const rows = results.map(
	r => `| ${r.label.padEnd(20)} | ${kb(r.raw).padStart(8)} | ${kb(r.gzip).padStart(9)} | ${kb(r.brotli).padStart(11)} |`
);
const deltaRow = `| **Δ (epub-ts vs epubjs)** | ${pctDelta(epubjs.raw, epubts.raw).padStart(8)} | ${pctDelta(epubjs.gzip, epubts.gzip).padStart(9)} | ${pctDelta(epubjs.brotli, epubts.brotli).padStart(11)} |`;

console.log("\nTrack C — Static bundle size (ESM build)\n");
console.log(header);
console.log(sep);
for (const r of rows) console.log(r);
console.log(deltaRow);
console.log();

if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
const payload = {
	track: "C-static-size",
	generatedAt: new Date().toISOString(),
	targets: results.map(r => ({
		name: r.name,
		label: r.label,
		path: r.path.replace(ROOT + "/", ""),
		bytes: { raw: r.raw, gzip: r.gzip, brotli: r.brotli },
	})),
};
writeFileSync(resolve(RESULTS_DIR, "size.json"), JSON.stringify(payload, null, 2));
console.log(`→ wrote bench/results/size.json`);
