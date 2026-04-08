#!/usr/bin/env node
/**
 * Minimal static server for the bench harness.
 *
 * Serves the repo root so the harness page can reach:
 *   /bench/harness/...
 *   /dist/epub.js
 *   /node_modules/epubjs/dist/epub.js
 *   /bench/fixtures/alice-gutenberg.epub
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const PORT = Number(process.env.BENCH_PORT || 5180);

const MIME = {
	".html": "text/html; charset=utf-8",
	".js":   "application/javascript; charset=utf-8",
	".mjs":  "application/javascript; charset=utf-8",
	".css":  "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".epub": "application/epub+zip",
	".svg":  "image/svg+xml",
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".map":  "application/json",
};

function safeJoin(root, url) {
	const clean = decodeURIComponent(url.split("?")[0]);
	const p = join(root, clean);
	if (!p.startsWith(root)) return null;
	return p;
}

const server = createServer(async (req, res) => {
	let url = req.url || "/";
	if (url === "/") url = "/bench/harness/index.html";
	if (url === "/favicon.ico") { res.statusCode = 204; return res.end(); }
	const file = safeJoin(ROOT, url);
	if (!file) { res.statusCode = 400; return res.end("bad path"); }
	try {
		const s = await stat(file);
		if (s.isDirectory()) {
			res.statusCode = 301;
			res.setHeader("location", url.replace(/\/?$/, "/index.html"));
			return res.end();
		}
		const buf = await readFile(file);
		res.setHeader("content-type", MIME[extname(file)] || "application/octet-stream");
		res.setHeader("cache-control", "no-store");
		res.setHeader("cross-origin-opener-policy", "same-origin");
		res.setHeader("cross-origin-embedder-policy", "require-corp");
		res.setHeader("cross-origin-resource-policy", "cross-origin");
		res.end(buf);
	} catch {
		res.statusCode = 404;
		res.end("not found: " + url);
	}
});

server.listen(PORT, () => {
	const base = `http://localhost:${PORT}`;
	console.log(`\n[bench] harness server listening on ${base}`);
	console.log(`[bench] open ${base}/bench/harness/index.html?lib=epubts`);
	console.log(`[bench] open ${base}/bench/harness/index.html?lib=epubjs`);
	console.log(`[bench] (ctrl-c to stop)\n`);
});
