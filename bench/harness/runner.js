const qs = new URLSearchParams(location.search);
const lib = qs.get("lib") || "epubts";
const scenarios = (qs.get("scenarios") || "cold-parse,first-display,next-page,locations,current-location,heap").split(",");
const fixture = qs.get("fixture") || "/bench/fixtures/alice-gutenberg.epub";
const iters = Number(qs.get("iters") || "10");

const $status = document.getElementById("status");
const $results = document.getElementById("results");
const $label = document.getElementById("lib-label");
const $viewer = document.getElementById("viewer");
$label.textContent = lib;
$label.className = lib === "epubjs" ? "lib-epubjs" : "lib-epubts";

function log(msg) {
	$status.textContent = `[${lib}] ${msg}`;
}

function clearViewer() {
	$viewer.replaceChildren();
}

function loadScript(src) {
	return new Promise((res, rej) => {
		const s = document.createElement("script");
		s.src = src;
		s.onload = () => res();
		s.onerror = () => rej(new Error(`failed to load ${src}`));
		document.head.appendChild(s);
	});
}

async function loadLib() {
	// Both libraries declare jszip as external; load it first in both cases
	// so the comparison is apples-to-apples on the bundle side too.
	await loadScript("/node_modules/jszip/dist/jszip.min.js");
	if (lib === "epubjs") {
		await loadScript("/node_modules/epubjs/dist/epub.js");
	} else {
		await loadScript("/dist/epub.umd.js");
	}
	return window.ePub;
}

async function fetchAb(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
	return await res.arrayBuffer();
}

function cloneAb(ab) {
	return ab.slice(0);
}

function stats(samples) {
	const sorted = [...samples].sort((a, b) => a - b);
	const n = sorted.length;
	const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[(n - 1) / 2];
	const mean = samples.reduce((s, v) => s + v, 0) / n;
	const variance = samples.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
	const stddev = Math.sqrt(variance);
	const p95 = sorted[Math.min(n - 1, Math.floor(n * 0.95))];
	return { n, median, mean, p95, stddev, min: sorted[0], max: sorted[n - 1] };
}

async function scenarioColdParse(ePub, ab) {
	const samples = [];
	for (let i = 0; i < iters; i++) {
		log(`cold-parse ${i + 1}/${iters}`);
		const t0 = performance.now();
		const book = ePub(cloneAb(ab));
		await book.opened;
		samples.push(performance.now() - t0);
		book.destroy();
	}
	return stats(samples);
}

async function scenarioFirstDisplay(ePub, ab) {
	const samples = [];
	for (let i = 0; i < iters; i++) {
		log(`first-display ${i + 1}/${iters}`);
		clearViewer();
		const book = ePub(cloneAb(ab));
		await book.opened;
		const rendition = book.renderTo("viewer", { width: 600, height: 400 });
		const t0 = performance.now();
		await rendition.display();
		samples.push(performance.now() - t0);
		rendition.destroy();
		book.destroy();
	}
	return stats(samples);
}

async function scenarioNextPage(ePub, ab) {
	const samples = [];
	clearViewer();
	const book = ePub(cloneAb(ab));
	await book.opened;
	const rendition = book.renderTo("viewer", { width: 600, height: 400 });
	await rendition.display();
	for (let i = 0; i < 3; i++) await rendition.next();
	const n = Math.max(iters * 5, 50);
	for (let i = 0; i < n; i++) {
		log(`next-page ${i + 1}/${n}`);
		const t0 = performance.now();
		await rendition.next();
		samples.push(performance.now() - t0);
	}
	rendition.destroy();
	book.destroy();
	return stats(samples);
}

// Exercises Mapping.page() / findRanges path — optimized in 0.6.0 (canvas
// text measurement) and 0.6.1 (Mapping.findStart/findEnd canvas binary
// search). Not frame-paced: currentLocation() is a synchronous/microtask
// computation, so the library's CPU cost is visible without RAF gating.
async function scenarioCurrentLocation(ePub, ab) {
	clearViewer();
	const book = ePub(cloneAb(ab));
	await book.opened;
	const rendition = book.renderTo("viewer", { width: 600, height: 400 });
	await rendition.display();
	// Warm a few page turns so layout/visible spread is settled
	for (let i = 0; i < 3; i++) await rendition.next();

	// headless Chrome clamps performance.now() to 100μs — batch per-sample
	// so the per-call mean is resolvable.
	const CALLS_PER_SAMPLE = 50;
	const samples = [];
	const n = Math.max(iters, 15);
	for (let i = 0; i < n; i++) {
		log(`current-location ${i + 1}/${n}`);
		const t0 = performance.now();
		for (let k = 0; k < CALLS_PER_SAMPLE; k++) rendition.currentLocation();
		samples.push((performance.now() - t0) / CALLS_PER_SAMPLE);
	}
	rendition.destroy();
	book.destroy();
	return { ...stats(samples), callsPerSample: CALLS_PER_SAMPLE };
}

async function scenarioLocations(ePub, ab) {
	const samples = [];
	let producedCount = 0;
	const runs = Math.max(3, Math.floor(iters / 2));
	for (let i = 0; i < runs; i++) {
		log(`locations ${i + 1}/${runs}`);
		const book = ePub(cloneAb(ab));
		await book.opened;
		const t0 = performance.now();
		const result = await book.locations.generate(1000);
		samples.push(performance.now() - t0);
		// Sanity: count produced locations so we can verify work was actually done
		const count = typeof book.locations.length === "function"
			? book.locations.length()
			: (Array.isArray(result) ? result.length : 0);
		producedCount = count;
		book.destroy();
	}
	return { ...stats(samples), producedCount };
}

async function scenarioHeap(ePub, ab) {
	// Requires Chrome with --enable-precise-memory-info + --expose-gc.
	// Puppeteer is launched with both in driver.mjs.
	if (!performance.memory) return { note: "performance.memory unavailable" };
	const gc = () => { if (window.gc) { window.gc(); window.gc(); } };

	// Warm the harness itself (first open allocates library-level caches)
	clearViewer();
	{
		const book = ePub(cloneAb(ab));
		await book.opened;
		const rendition = book.renderTo("viewer", { width: 600, height: 400 });
		await rendition.display();
		rendition.destroy();
		book.destroy();
	}
	clearViewer();
	gc();
	await new Promise(r => setTimeout(r, 100));
	gc();

	const before = performance.memory.usedJSHeapSize;
	const book = ePub(cloneAb(ab));
	await book.opened;
	const rendition = book.renderTo("viewer", { width: 600, height: 400 });
	await rendition.display();
	// Keep book+rendition alive while sampling
	const after = performance.memory.usedJSHeapSize;
	rendition.destroy();
	book.destroy();
	return { beforeBytes: before, afterBytes: after, deltaBytes: after - before };
}

const RUNNERS = {
	"cold-parse":       scenarioColdParse,
	"first-display":    scenarioFirstDisplay,
	"next-page":        scenarioNextPage,
	"locations":        scenarioLocations,
	"current-location": scenarioCurrentLocation,
	"heap":             scenarioHeap,
};

async function main() {
	try {
		log("loading library…");
		const ePub = await loadLib();
		log("fetching fixture…");
		const ab = await fetchAb(fixture);
		const results = { lib, fixture, iters, userAgent: navigator.userAgent, scenarios: {} };
		for (const name of scenarios) {
			const fn = RUNNERS[name];
			if (!fn) { results.scenarios[name] = { error: "unknown scenario" }; continue; }
			try {
				results.scenarios[name] = await fn(ePub, ab);
			} catch (err) {
				results.scenarios[name] = { error: String(err?.message || err) };
			}
		}
		results.finishedAt = new Date().toISOString();
		$results.textContent = JSON.stringify(results, null, 2);
		window.__benchResults = results;
		window.__benchDone = true;
		log("done.");
		document.title = `bench:${lib}:done`;
	} catch (err) {
		$results.textContent = String(err?.stack || err);
		window.__benchError = String(err);
		log(`error: ${err?.message || err}`);
	}
}

main();
