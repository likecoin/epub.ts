# Benchmarks

Head-to-head performance comparison between `epubjs@0.3.93` and
`@likecoin/epub-ts`. The suite is **local-only** — no CI, no published
baseline — and is intended for sanity-checking perf claims made in
the top-level README and for catching regressions during development.

## Tracks

| Track | What | How |
| ----- | ---- | --- |
| **A — Browser** | `cold-parse`, `first-display`, `next-page`, `locations.generate(1000)`, `current-location`, heap delta | Puppeteer drives headless Chrome against a local harness page that loads each library via `<script>` tags |
| **C — Static size** | Raw / gzip / brotli of the ESM bundles | Pure filesystem read + `zlib` |

## Scenario → optimization coverage

The scenarios exist to exercise the specific code paths that recent
releases optimized. If you add a new perf fix, add a scenario that
reflects it.

| Scenario | Library path under test | Optimization this reflects |
| --- | --- | --- |
| `cold-parse` | `Book.open()` → `book.opened` | **0.4.9** — defer blob URL creation so `book.opened` doesn't block on `Resources.replacements()`; **0.4.6** — fix `book.opened` not waiting for navigation load |
| `first-display` | `rendition.display()` → `"displayed"` event | Layout + iframe setup + first `mapping.page()` pass; covers **0.6.0** canvas text measurement indirectly |
| `next-page` | `rendition.next()` loop (50 samples) | Frame-paced; present for regression detection only |
| `locations.generate(1000)` | `Book.locations.generate()` walking all spine items | **0.4.9** — reduce default pause 100 ms → 0 (saves ~10 s on 100-chapter books), `Store.getText()` 5× via `TextDecoder`, microtask-scheduled `Queue` to skip rAF overhead |
| `current-location` | `rendition.currentLocation()` × 50 per sample | **0.6.0** — canvas text measurement + dirty-flag dimension caching; **0.6.1** — `Mapping.findStart`/`findEnd` canvas binary search replacing O(N) `nodeBounds()` reflow walk |
| `heap` | `performance.memory.usedJSHeapSize` delta after a GC'd baseline + full `display()` | **0.4.8** — memory leak fixes in `IframeView`/`Resources`/`Store` cleanup; **0.4.0** — removal of `localforage` and `@xmldom/xmldom` |

The numbers are only meaningful per fixture — a 200 KB book and a
1.7 MB book exercise the locations walker very differently, so the
harness ships two fixtures and you can switch with `--fixture`.

> Track B (Node-only parse bench) was intentionally dropped — epubjs
> has no official Node support path, and running it under jsdom mostly
> measures jsdom overhead rather than library behavior. The browser
> track already covers parse / render / locations head-to-head in a
> real engine, so there is no need for a duplicate.

## Fixtures

Both are real Project Gutenberg EPUB3-with-images files, downloaded on
first run. Gitignored. Re-download with `npm run bench:fixtures`.

| File | Source | Size | Spine | Locations |
| --- | --- | ---: | ---: | ---: |
| `alice-gutenberg.epub` | [#11 Alice in Wonderland](https://www.gutenberg.org/ebooks/11.epub3.images) | 185 KB | 13 | 169 |
| `war-and-peace.epub` | [#2600 War and Peace](https://www.gutenberg.org/ebooks/2600.epub3.images) | 1.7 MB | 368 | 429 |

The small/large split is deliberate — the slow paths in epubjs
(particularly `locations.generate`) scale super-linearly, so the
Alice numbers understate the practical win you see on a real novel.
Use War and Peace (or larger) to catch scaling bugs.

## Running

```bash
# one-time fixture download
npm run bench:fixtures

# full run (size + browser)
npm run bench

# individual tracks
npm run bench:size
npm run bench:browser -- --iters 30

# swap the fixture
npm run bench:browser -- --iters 10 --fixture /bench/fixtures/war-and-peace.epub

# open the harness manually in a browser (useful for debugging)
npm run bench:serve
# then open http://localhost:5180/bench/harness/index.html?lib=epubts
```

`BENCH_VERBOSE=1` surfaces benign teardown console errors that are
otherwise suppressed.

### Browser driver options

```bash
node bench/harness/driver.mjs \
  --iters 30 \
  --scenarios cold-parse,first-display,next-page,locations,heap \
  --fixture /bench/fixtures/alice-gutenberg.epub \
  --timeout 300000
```

## Methodology

Each browser scenario:

1. Loads the target library (`epubjs` or `@likecoin/epub-ts`) as a
   global `<script>` tag. JSZip is loaded first in both cases, so the
   comparison is apples-to-apples at the bundle level.
2. Fetches the fixture once per page load into an `ArrayBuffer`.
3. For each iteration, hands the scenario a *fresh copy* of that
   buffer (`ArrayBuffer.slice(0)`) — JSZip retains references to the
   input buffer, so reusing it across iterations would bias results.
4. Records timings with `performance.now()`. Numbers reported as
   **median** of N iterations. The JSON output also contains mean,
   p95, stddev, min, and max.

Chrome is launched with `--enable-precise-memory-info` and
`--js-flags=--expose-gc` so the `heap` scenario can reliably
double-GC before sampling.

## Results are gitignored

`bench/results/*.json` is in `.gitignore`. If you want to track perf
deltas over time, copy the JSON somewhere else — we deliberately do
not commit them to keep the repo free of machine-specific noise.

## Caveats (must-read before quoting numbers)

1. **`next-page` is frame-paced, not CPU-bound.** Both libraries
   converge on ~33 ms per page turn because the render path is gated
   on `requestAnimationFrame`. This metric is present for regression
   detection, not for bragging rights.
2. **`cold-parse` excludes network fetch.** The fixture is already in
   memory when the timer starts. Add real-network latency on top for
   user-perceived load time.
3. **`heap` is noisy.** Chrome's `performance.memory` buckets
   allocations coarsely even with `--enable-precise-memory-info`.
   Treat ±10 % as noise; only large deltas are meaningful.
4. **`locations.generate()` numbers are very different.** Both
   libraries produce the same count of locations (169 on the Alice
   fixture), but epub-ts finishes ~100× faster in our runs. If you
   are evaluating this claim independently, please verify against
   your own fixture — we welcome reports.
5. **Host affects absolute numbers.** Relative deltas are more stable
   than absolute ms. Re-run locally before quoting.
6. **Bench tooling is a `devDependency` only.** Puppeteer and epubjs
   are installed under `devDependencies` and do not ship in the
   published package.

## File layout

```
bench/
├── README.md             # this file
├── fixtures/
│   ├── download.mjs      # fetch Project Gutenberg Alice
│   └── alice-gutenberg.epub   (gitignored)
├── size/
│   └── measure.mjs       # Track C — static bundle size
├── harness/
│   ├── index.html        # harness page loaded by puppeteer
│   ├── runner.js         # scenario implementations (shared)
│   ├── server.mjs        # minimal static server for the harness
│   └── driver.mjs        # puppeteer driver that orchestrates runs
└── results/              # generated JSON (gitignored)
    ├── size.json
    └── browser.json
```
