#!/usr/bin/env node
/**
 * Puppeteer driver for Track A — browser head-to-head.
 *
 * Starts the harness server, launches headless Chrome, runs the scenarios
 * for each library, pulls window.__benchResults, and prints a comparison
 * table. Writes raw JSON to bench/results/browser.json (gitignored).
 *
 * Run:  node bench/harness/driver.mjs
 *       node bench/harness/driver.mjs --iters 20 --scenarios cold-parse,first-display
 */
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const RESULTS_DIR = resolve(ROOT, "bench", "results");
const PORT = Number(process.env.BENCH_PORT || 5180);
const BASE = `http://localhost:${PORT}`;

const args = process.argv.slice(2);
function arg(name, fallback) {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? args[i + 1] : fallback;
}
const iters = arg("iters", "10");
const scenarios = arg("scenarios", "cold-parse,first-display,next-page,locations,current-location,heap");
const fixture = arg("fixture", "/bench/fixtures/alice-gutenberg.epub");
const timeoutMs = Number(arg("timeout", "900000"));

function startServer() {
	return new Promise((res, rej) => {
		const proc = spawn(process.execPath, [resolve(__dirname, "server.mjs")], {
			stdio: ["ignore", "pipe", "pipe"],
			env: { ...process.env, BENCH_PORT: String(PORT) },
		});
		const onOut = (buf) => {
			const s = buf.toString();
			process.stdout.write(s);
			if (s.includes("listening on")) res(proc);
		};
		proc.stdout.on("data", onOut);
		proc.stderr.on("data", (b) => process.stderr.write(b));
		proc.on("error", rej);
		setTimeout(() => rej(new Error("server start timeout")), 10_000);
	});
}

async function runLib(browser, lib) {
	const page = await browser.newPage();
	// Chrome fires benign teardown console errors during destroy() of short-lived
	// books/renditions. Those don't affect scenario timings — suppress unless verbose.
	const verbose = process.env.BENCH_VERBOSE === "1";
	page.on("pageerror", (err) => { if (verbose) console.error(`[${lib}] page error:`, err.message); });
	page.on("console", (msg) => {
		if (verbose && msg.type() === "error") console.error(`[${lib}] console:`, msg.text());
	});
	page.on("response", (res) => {
		if (res.status() === 404 && verbose) console.error(`[${lib}] 404: ${res.url()}`);
	});
	const url = `${BASE}/bench/harness/index.html?lib=${lib}&iters=${iters}&scenarios=${scenarios}&fixture=${encodeURIComponent(fixture)}`;
	console.log(`[driver] ${lib}: ${url}`);
	await page.goto(url, { waitUntil: "domcontentloaded" });
	await page.waitForFunction(() => window.__benchDone === true || window.__benchError, { timeout: timeoutMs });
	const err = await page.evaluate(() => window.__benchError);
	if (err) { await page.close(); throw new Error(`${lib}: ${err}`); }
	const results = await page.evaluate(() => window.__benchResults);
	await page.close();
	return results;
}

function fmt(n, digits = 1) {
	if (n == null || Number.isNaN(n)) return "—";
	return Number(n).toFixed(digits);
}

function renderTable(epubjs, epubts) {
	const scenarioOrder = ["cold-parse", "first-display", "next-page", "locations", "current-location"];
	console.log(`\nTrack A — Browser head-to-head (median ms, ${iters} iters, lower is better)\n`);
	console.log(`| Scenario            | epubjs 0.3.93 | @likecoin/epub-ts |   Δ     |`);
	console.log(`| ------------------- | ------------: | ----------------: | ------: |`);
	for (const name of scenarioOrder) {
		const a = epubjs.scenarios[name];
		const b = epubts.scenarios[name];
		if (!a || !b || a.error || b.error) continue;
		const d = ((b.median - a.median) / a.median) * 100;
		const sign = d > 0 ? "+" : "";
		// Scenarios under 1ms need more precision
		const digits = Math.max(a.median, b.median) < 1 ? 3 : 1;
		console.log(`| ${name.padEnd(19)} | ${fmt(a.median, digits).padStart(13)} | ${fmt(b.median, digits).padStart(17)} | ${(sign + fmt(d) + "%").padStart(7)} |`);
	}
	const hA = epubjs.scenarios.heap;
	const hB = epubts.scenarios.heap;
	if (hA && hB && hA.deltaBytes != null && hB.deltaBytes != null) {
		const aMb = hA.deltaBytes / 1024 / 1024;
		const bMb = hB.deltaBytes / 1024 / 1024;
		const d = ((bMb - aMb) / aMb) * 100;
		const sign = d > 0 ? "+" : "";
		console.log(`| heap delta (MB)     | ${fmt(aMb, 2).padStart(13)} | ${fmt(bMb, 2).padStart(17)} | ${(sign + fmt(d) + "%").padStart(7)} |`);
	}
	console.log();
}

async function main() {
	const serverProc = await startServer();
	let browser;
	try {
		browser = await puppeteer.launch({
			headless: true,
			protocolTimeout: timeoutMs,
			args: [
				"--enable-precise-memory-info",
				"--js-flags=--expose-gc",
				"--no-sandbox",
				"--disable-dev-shm-usage",
			],
		});
		console.log(`[driver] chromium launched`);
		const epubjs = await runLib(browser, "epubjs");
		const epubts = await runLib(browser, "epubts");
		renderTable(epubjs, epubts);

		if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
		const payload = {
			track: "A-browser",
			generatedAt: new Date().toISOString(),
			iters: Number(iters),
			fixture,
			epubjs,
			epubts,
		};
		writeFileSync(resolve(RESULTS_DIR, "browser.json"), JSON.stringify(payload, null, 2));
		console.log(`→ wrote bench/results/browser.json`);
	} finally {
		if (browser) await browser.close();
		serverProc.kill("SIGTERM");
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
