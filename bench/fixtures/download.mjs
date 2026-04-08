#!/usr/bin/env node
/**
 * Download benchmark fixtures from Project Gutenberg (EPUB3 with images).
 *
 * Two sizes:
 *   - alice-gutenberg.epub   — #11, Alice in Wonderland (small, ~185 KB)
 *   - war-and-peace.epub     — #2600, War and Peace (large, ~1.7 MB)
 *
 * Both are gitignored. Run `npm run bench:fixtures` once before
 * running the benchmark.
 */
import { createWriteStream, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FIXTURES = [
	{
		name: "alice-gutenberg.epub",
		url: "https://www.gutenberg.org/ebooks/11.epub3.images",
		label: "Alice in Wonderland (#11)",
	},
	{
		name: "war-and-peace.epub",
		url: "https://www.gutenberg.org/ebooks/2600.epub3.images",
		label: "War and Peace (#2600)",
	},
];

for (const f of FIXTURES) {
	const out = resolve(__dirname, f.name);
	if (existsSync(out)) {
		console.log(`[bench] ${f.label}: already present`);
		continue;
	}
	console.log(`[bench] downloading ${f.label} → ${out}`);
	const res = await fetch(f.url, { redirect: "follow" });
	if (!res.ok || !res.body) {
		console.error(`[bench] ${f.label}: HTTP ${res.status}`);
		process.exit(1);
	}
	await pipeline(res.body, createWriteStream(out));
}
console.log(`[bench] done.`);
