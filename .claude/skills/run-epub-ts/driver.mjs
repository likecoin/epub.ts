#!/usr/bin/env node
/**
 * Agent driver for epub.ts — launches the real reader in headless Chrome and
 * drives it programmatically.
 *
 * epub.ts is a library, so "the app" is an example page in examples/ that
 * loads dist/epub.umd.js and renders an EPUB into an iframe. This driver
 * serves the repo root, opens an example against a local fixture, waits for
 * the rendition to paint, and then lets you page/screenshot/eval against it.
 *
 * Commands:
 *   render [example]   open an example, wait for paint, screenshot
 *   flow   [example]   scripted flow: display -> next -> next -> prev, shots each
 *   parse  [epub]      no-browser path: parse via dist/epub.node.js and dump
 *   repl   [example]   stdin REPL (next/prev/goto/loc/text/toc/ss/eval/quit).
 *                      Pipe commands in, or back it with a FIFO to keep one
 *                      session alive across separate shell calls — see SKILL.md.
 *
 * Flags: --epub <path-from-repo-root> --name <shot> --out <dir> --width N
 *        --height N --timeout <ms> --verbose --headful --keep
 *
 * Screenshots land in .claude/skills/run-epub-ts/shots/ by default.
 */
import { spawn } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import puppeteer from "puppeteer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..", "..");
const PORT = Number(process.env.EPUBTS_PORT || 5181);
const BASE = `http://localhost:${PORT}`;
const MAX_ERRORS = 50;

const argv = process.argv.slice(2);
const cmd = argv[0] || "render";

// Boolean flags take no value; everything else consumes the next token unless
// that token is itself a flag, so neither `--epub` at the end of the line nor
// `--epub --keep` can swallow something that isn't a value.
const BOOLEAN = new Set(["headful", "keep", "verbose"]);
const flags = new Map();
const positional = [];
for (let i = 1; i < argv.length; i++) {
	const t = argv[i];
	if (!t.startsWith("--")) { positional.push(t); continue; }
	const name = t.slice(2);
	const next = argv[i + 1];
	if (BOOLEAN.has(name)) flags.set(name, true);
	else if (next != null && !next.startsWith("--")) flags.set(name, argv[++i]);
	else flags.set(name, undefined);
}
const flag = (name, fallback) => (flags.get(name) != null ? flags.get(name) : fallback);
const has = (name) => flags.has(name);

const EXAMPLE = positional[0] || "spreads.html";
// test/fixtures/alice.epub is committed; bench/fixtures/*.epub are gitignored
// downloads (npm run bench:fixtures), so they can't be the default.
const EPUB = flag("epub", "/test/fixtures/alice.epub");
const OUT = resolve(flag("out", join(__dirname, "shots")));
const WIDTH = Number(flag("width", "1000"));
const HEIGHT = Number(flag("height", "900"));
const TIMEOUT = Number(flag("timeout", "60000")) || 60_000;

function log(...a) { console.log("[driver]", ...a); }

/** Tracked so a mid-run failure or a signal still tears the server/browser down. */
let active = null;

// puppeteer kills Chrome on SIGINT itself, but nothing else would reap the
// static server we spawned — and it exits the process in the same tick, so this
// handler has to do its work synchronously.
for (const sig of ["SIGINT", "SIGTERM"]) {
	process.once(sig, () => { active?.server?.kill(); process.exit(130); });
}

/**
 * Reuses bench/harness/server.mjs (serves the repo root, so /examples,
 * /dist and /bench/fixtures are all reachable from one origin). That couples us
 * to two things over there: the BENCH_PORT env var, and the "listening on"
 * line it prints when ready — change either and this hangs until the timeout.
 *
 * If something is already listening on PORT — e.g. a driver run that died
 * before cleanup — adopt it instead of failing with EADDRINUSE.
 */
async function startServer() {
	// Bare fetch has no overall deadline: something bound to the port that
	// accepts but never replies would stall here for undici's 300s default.
	const alive = await fetch(`${BASE}/examples/index.html`, { signal: AbortSignal.timeout(1500) })
		.then((r) => r.ok).catch(() => false);
	if (alive) { log("reusing server already on", BASE); return { kill() {} }; }
	return new Promise((res, rej) => {
		const proc = spawn(process.execPath, [resolve(ROOT, "bench/harness/server.mjs")], {
			stdio: ["ignore", "pipe", "pipe"],
			env: { ...process.env, BENCH_PORT: String(PORT) },
		});
		// A live timer keeps the event loop open, so leaving this pending would
		// add ~9s of dead wait to every successful run.
		const timer = setTimeout(() => rej(new Error("server start timeout")), 10_000);
		timer.unref();
		proc.stdout.on("data", (b) => {
			if (b.toString().includes("listening on")) { clearTimeout(timer); res(proc); }
		});
		proc.stderr.on("data", (b) => process.stderr.write(b));
		proc.on("error", (e) => { clearTimeout(timer); rej(e); });
	});
}

function exampleUrl(example, epub) {
	return `${BASE}/examples/${example}?url=${encodeURIComponent(epub)}`;
}

/**
 * Two things the examples get wrong for offline agent use:
 *
 * 1. jszip is `external` in every dist format (see vite.config.ts), so the UMD
 *    build needs a `window.JSZip` global or Archive throws "JSZip lib not
 *    loaded" on any .epub. Some examples ship a cdnjs <script> for it; the ones
 *    that default to an unpacked .opf (continuous-scrolled, scrolled) do not.
 *    Inject the local copy into the top frame so every example works.
 * 2. Anything still reaching outside localhost is a hidden network dependency
 *    (examples default to moby-dick on S3). Block it loudly instead of hanging.
 */
async function makeHermetic(page) {
	const jszip = await readFile(resolve(ROOT, "node_modules/jszip/dist/jszip.min.js"), "utf8");
	await page.evaluateOnNewDocument(`if (window.top === window && !window.JSZip) { ${jszip} }`);
	await page.setRequestInterception(true);
	page.on("request", (req) => {
		const u = req.url();
		// These reject if the request was already handled by a racing handler;
		// an unhandled rejection would take the whole driver down.
		const swallow = () => {};
		if (u.startsWith(BASE) || /^(data|blob|about|file):/.test(u)) return void req.continue().catch(swallow);
		if (/jszip[.\-\w]*\.js/i.test(u)) {
			return void req.respond({ contentType: "application/javascript", body: jszip }).catch(swallow);
		}
		console.error("[offline] blocked external request:", u);
		return void req.abort().catch(swallow);
	});
}

async function open(example = EXAMPLE, epub = EPUB) {
	if (!existsSync(resolve(ROOT, "dist/epub.umd.js"))) {
		throw new Error("dist/epub.umd.js missing — run `npm run build` first");
	}
	// Registered before the browser exists so a failed launch still reaps the server.
	const server = await startServer();
	active = { server, browser: null, page: null, errors: [] };

	const browser = await puppeteer.launch({
		headless: !has("headful"),
		args: ["--no-sandbox", "--allow-file-access-from-files"],
		defaultViewport: { width: WIDTH, height: HEIGHT },
	});
	active.browser = browser;
	const page = await browser.newPage();
	active.page = page;
	await makeHermetic(page);

	const { errors } = active;
	page.on("pageerror", (e) => {
		if (errors.length < MAX_ERRORS) errors.push(e.message);
		console.error("[page error]", e.message);
	});
	page.on("console", (m) => {
		if (m.type() === "error") console.error("[console]", m.text());
		// Without --verbose, debug logging you added to src/ while iterating
		// would silently vanish.
		else if (has("verbose")) console.log(`[console:${m.type()}]`, m.text());
	});
	page.on("requestfailed", (r) => console.error("[net fail]", r.url(), r.failure()?.errorText));

	const url = exampleUrl(example, epub);
	log("open", url);
	await page.goto(url, { waitUntil: "domcontentloaded" });
	await waitForPaint(page, TIMEOUT);
	return active;
}

/** Let layout land before measuring or screenshotting. */
const settle = (page) =>
	page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/**
 * The example's `var rendition` becomes window.rendition (classic script), so
 * readiness is observable from the API rather than by guessing at timings.
 *
 * Gate on view.displayed + a resolvable currentLocation() CFI — NOT on the
 * iframe having text. The first spine item of most real EPUBs is an
 * image-only cover, so a text check waits forever on a page that rendered
 * fine.
 */
async function waitForPaint(page, timeout) {
	await page.waitForFunction(() => {
		const r = window.rendition;
		if (!r || !r.manager || !r.manager.views) return false;
		const views = r.manager.views.displayed && r.manager.views.displayed();
		if (!views || !views.length || !views[0].displayed) return false;
		const l = r.currentLocation();
		return !!(l && l.start && l.start.cfi);
	}, { timeout, polling: "raf" });
	await settle(page);
	// Covers Rendition's REANCHOR_DEBOUNCE (50ms) and the reflow it triggers.
	await new Promise((r) => setTimeout(r, 150));
}

async function shot(page, name) {
	mkdirSync(OUT, { recursive: true });
	const file = join(OUT, name.endsWith(".png") ? name : `${name}.png`);
	await page.screenshot({ path: file });
	log("shot", file);
	return file;
}

async function loc(page) {
	return page.evaluate(() => {
		const l = window.rendition && window.rendition.currentLocation();
		if (!l || !l.start) return null;
		return { cfi: l.start.cfi, href: l.start.href, index: l.start.index, displayed: l.start.displayed };
	});
}

/**
 * next()/prev() resolve only after manager.next() has run, and
 * Rendition.currentLocation() recomputes from the manager rather than reading
 * the cached this.location — so the new CFI is readable as soon as the
 * evaluate settles. No sleep needed, and waiting on the "relocated" event
 * would be worse: it fires a frame later and not at all at the end of the book.
 */
async function nav(page, dir) {
	if (dir !== "next" && dir !== "prev") throw new Error(`nav: expected next|prev, got ${dir}`);
	await page.evaluate((d) => window.rendition[d](), dir);
	await settle(page);
	return loc(page);
}

async function goto(page, target) {
	await page.evaluate((t) => window.rendition.display(t), target);
	await settle(page);
	return loc(page);
}

async function toc(page) {
	return page.evaluate(() =>
		window.book.loaded.navigation.then((n) => n.toc.map((i) => ({ label: i.label.trim(), href: i.href })))
	);
}

/**
 * Text of the whole displayed *section*, not of the visible page — the iframe
 * holds the entire chapter and CSS columns decide what's on screen. Two
 * different pages of one chapter return the same string, so don't use this to
 * decide whether paging worked; compare CFIs from loc() for that.
 */
async function sectionText(page, n = 200) {
	return page.evaluate((n) => {
		const v = window.rendition.manager.views.displayed()[0];
		const doc = v.document || v.iframe.contentDocument;
		return doc.body.textContent.replace(/\s+/g, " ").trim().slice(0, n);
	}, n);
}

async function close(ctx) {
	if (!ctx) return;
	try {
		if (ctx.browser) await ctx.browser.close().catch(() => {});
	} finally {
		ctx.server?.kill();
	}
}

function reportErrors(ctx) {
	if (!ctx.errors.length) return false;
	console.error("[driver] page errors:", ctx.errors);
	return true;
}

// ---------------------------------------------------------------- commands

async function cmdRender() {
	const ctx = await open();
	log("location", await loc(ctx.page));
	log("text", await sectionText(ctx.page, 120));
	await shot(ctx.page, flag("name", "render"));
	// Reported before the --keep bail-out: --keep is for inspecting a page, which
	// is exactly when it is throwing.
	const failed = reportErrors(ctx);
	if (has("keep")) { log("--keep: leaving browser up, ctrl-c to stop"); return; }
	await close(ctx);
	if (failed) process.exit(1);
}

async function cmdFlow() {
	const ctx = await open();
	const display = await loc(ctx.page);
	await shot(ctx.page, "flow-0-display");
	const next1 = await nav(ctx.page, "next");
	await shot(ctx.page, "flow-1-next");
	const next2 = await nav(ctx.page, "next");
	await shot(ctx.page, "flow-2-next");
	const back = await nav(ctx.page, "prev");
	await shot(ctx.page, "flow-3-prev");

	log("toc:", (await toc(ctx.page)).slice(0, 5));
	const steps = { display, next1, next2, back };
	for (const [name, l] of Object.entries(steps)) log(`${name}:`, l && l.cfi);
	await close(ctx);

	const cfi = (l) => l && l.cfi;
	const moved = cfi(display) && cfi(next1) && cfi(next2) && cfi(display) !== cfi(next1) && cfi(next1) !== cfi(next2);
	const returned = cfi(back) === cfi(next1);
	if (!moved || !returned) {
		console.error("[driver] FLOW FAILED — paging did not move as expected:", steps);
		process.exit(1);
	}
	if (reportErrors(ctx)) process.exit(1);
	log("FLOW OK");
}

async function cmdRepl() {
	const ctx = await open();
	log("ready. commands: next | prev | goto <href|cfi> | loc | text | toc | ss <name> | eval <js> | quit");
	const rl = createInterface({ input: process.stdin });
	for await (const line of rl) {
		const [c, ...rest] = line.trim().split(/\s+/);
		const arg = rest.join(" ");
		let quit = false;
		try {
			if (c === "next" || c === "prev") console.log(JSON.stringify(await nav(ctx.page, c)));
			else if (c === "goto") console.log(JSON.stringify(await goto(ctx.page, arg)));
			else if (c === "loc") console.log(JSON.stringify(await loc(ctx.page)));
			else if (c === "text") console.log(await sectionText(ctx.page, Number(arg) || 300));
			else if (c === "toc") console.log(JSON.stringify(await toc(ctx.page), null, 1));
			else if (c === "ss") console.log(await shot(ctx.page, arg || "repl"));
			// eval is the point of this command: run agent-typed JS in the page
			// context. Local-only agent tooling, never shipped in dist/.
			else if (c === "eval") console.log(JSON.stringify(await ctx.page.evaluate((s) => eval(s), arg)));
			else if (c === "quit") quit = true;
			else if (c) console.log("? unknown:", c);
		} catch (e) { console.error("ERR", e.message); }
		// Emitted for every line including blanks — SKILL.md tells agents to poll
		// for this sentinel, so skipping it strands them until their own timeout.
		console.log("--done--");
		if (quit) break;
	}
	// A FIFO never sends EOF, so without this the browser would go away but node
	// would sit on an open stdin forever.
	rl.close();
	await close(ctx);
	log("bye");
	process.exit(0);
}

/** No browser: exercise the parse/util layer through the node build. */
async function cmdParse() {
	const build = resolve(ROOT, "dist/epub.node.js");
	if (!existsSync(build)) throw new Error("dist/epub.node.js missing — run `npm run build` first");
	const file = resolve(ROOT, positional[0] || EPUB.replace(/^\//, ""));
	const { Book } = await import(build);
	const buf = await readFile(file);
	const ab = new ArrayBuffer(buf.byteLength);
	new Uint8Array(ab).set(buf);
	const book = new Book(ab);
	await book.opened;
	const nav = await book.loaded.navigation;
	log("file", file);
	log("title", book.packaging.metadata.title);
	log("creator", book.packaging.metadata.creator);
	log("spine items", book.spine.length);
	log("toc", nav.toc.slice(0, 5).map((i) => i.label.trim()));
	const section = book.spine.get(Math.min(1, book.spine.length - 1));
	if (section) {
		const doc = await section.load(book.load.bind(book));
		log("section", section.href, "chars", doc.textContent.replace(/\s+/g, " ").trim().length);
		log("cfi", section.cfiBase);
	}
	book.destroy();
}

const commands = { render: cmdRender, flow: cmdFlow, repl: cmdRepl, parse: cmdParse };
const run = commands[cmd];
if (!run) { console.error("unknown command:", cmd, "— try:", Object.keys(commands).join(" | ")); process.exit(2); }
run().catch(async (e) => {
	console.error("[driver] FAILED:", e.message);
	// Unconditional: process.exit tears down Chrome anyway (puppeteer's own exit
	// hook), so skipping cleanup here would only ever strand the server.
	await close(active).catch(() => {});
	process.exit(1);
});
