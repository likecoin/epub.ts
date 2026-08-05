---
name: run-epub-ts
description: Build, run, screenshot and drive epub.ts — render a real EPUB in headless Chrome, page through it, inspect CFIs/TOC/rendered text, or parse without a browser. Use when asked to run, start, launch, screenshot, or manually verify a change in the actual reader rather than in tests.
---

# Running epub.ts

epub.ts is a **library**, so "the app" is an example page in `examples/` that loads
`dist/epub.umd.js` and renders an EPUB into iframes. Driving it means driving a
browser.

`.claude/skills/run-epub-ts/driver.mjs` is the harness: it serves the repo root,
opens an example against a committed fixture, waits for the rendition to paint,
and then exposes paging / screenshots / CFI reads / arbitrary page JS. It also has
a no-browser mode for the parse layer.

All paths below are relative to the repo root.

## Prerequisites

```bash
npm ci
npx puppeteer browsers install chrome   # no-op if already cached
```

Node 24 works. Nothing else to install — the driver uses `puppeteer`, already a
devDependency, and the static server is the repo's own `bench/harness/server.mjs`.

## Build (required before every browser run)

`dist/` is gitignored and the example pages load `dist/epub.umd.js` directly.
**Any change under `src/` is invisible to the browser until you rebuild.**

```bash
npm run build
```

To confirm your edit reached the browser, drop a `console.log` in the code you
changed, rebuild, and run the driver with `--verbose`.

## Run (agent path)

### Screenshot one render

```bash
node .claude/skills/run-epub-ts/driver.mjs render
```

Opens `examples/spreads.html` with `test/fixtures/alice.epub`, prints the current
CFI / href / page-of-total, and writes
`.claude/skills/run-epub-ts/shots/render.png`. **Open the PNG and look at it.**

### Scripted paging flow (the smoke test)

```bash
node .claude/skills/run-epub-ts/driver.mjs flow
```

Displays, `next`, `next`, `prev`; screenshots each step to `shots/flow-*.png`;
prints the TOC; then asserts the CFIs actually moved and that `prev` returned to
the step-1 CFI. Exits non-zero and prints `FLOW FAILED` if paging didn't move.
Verified output ends with `FLOW OK`.

### Interactive session that survives across turns

A FIFO keeps one REPL — same book, rendition and position — alive across separate
Bash calls, and needs nothing installed beyond a shell:

```bash
S=/tmp/epubts               # any writable dir
mkdir -p $S && rm -f $S/epubts.in && mkfifo $S/epubts.in
node .claude/skills/run-epub-ts/driver.mjs repl > $S/epubts.log 2>&1 < $S/epubts.in &
tail -f /dev/null > $S/epubts.in &     # holds the FIFO open
sleep 12; cat $S/epubts.log            # wait for "ready."
```

Then, from any later shell call:

```bash
echo 'goto chapter_001.xhtml' > $S/epubts.in
echo 'text 140'               > $S/epubts.in
echo 'ss my-shot'             > $S/epubts.in
sleep 4; tail -12 $S/epubts.log
```

Commands: `next` · `prev` · `goto <href|cfi>` · `loc` · `text [n]` (whole section,
see Gotchas) · `toc` · `ss [name]` · `eval <js>` · `quit`.
Every line — including blank and unknown ones — replies with `--done--`, so you
can poll the log for that sentinel. `quit` closes the browser, kills the server and
exits (logs `[driver] bye`); then `kill` the `tail -f` holder.

### No-browser path (parse / CFI / resources layers)

Most PRs here touch `src/book.ts`, `src/resources.ts`, `src/utils/*` — no
rendering needed:

```bash
node .claude/skills/run-epub-ts/driver.mjs parse                          # test/fixtures/alice.epub
node .claude/skills/run-epub-ts/driver.mjs parse bench/fixtures/war-and-peace.epub
```

Loads `dist/epub.node.js`, prints title, creator, spine length, first TOC entries,
and loads one section. Uses the `linkedom` peer dep (installed as a devDependency).

### Flags

| Flag | Meaning |
|---|---|
| `--epub <path>` | EPUB path **from the repo root**, e.g. `--epub /bench/fixtures/war-and-peace.epub` |
| `--name <n>` | screenshot basename |
| `--out <dir>` | screenshot directory (default `.claude/skills/run-epub-ts/shots/`) |
| `--width/--height` | viewport (default 1000×900) |
| `--timeout <ms>` | paint wait (default 60000) — lower it to fail fast while debugging |
| `--verbose` | forward page `console.log` (errors always shown) |
| `--headful` | non-headless Chrome |
| `--keep` | leave server + browser up after `render` |

Positional arg 1 is the example page, e.g.:

```bash
node .claude/skills/run-epub-ts/driver.mjs render continuous-scrolled.html --name continuous
node .claude/skills/run-epub-ts/driver.mjs flow continuous-scrolled.html
```

`spreads.html` exercises the **default** manager (paginated, 2-up);
`continuous-scrolled.html` exercises the **continuous** manager (scrolled). Both
verified against `test/fixtures/alice.epub`.

## Run (human path)

```bash
node bench/harness/server.mjs      # serves the repo root on port 5180
```

Then open `http://localhost:5180/examples/spreads.html?url=%2Ftest%2Ffixtures%2Falice.epub`.
Note the `?url=` — without it the examples fetch moby-dick from S3. Only these
examples read `?url=`: `spreads`, `scrolled`, `continuous-spreads`,
`continuous-scrolled`, `embedded`, `legacy`, `mathml`, `hypothesis`.

## Test / checks

```bash
npm test
npm run typecheck
npm run lint    # src/ only — the driver is not linted
```

## Gotchas

- **JSZip is `external` in every dist format.** `vite.config.ts` externalizes
  `jszip` with UMD global `JSZip`, so `dist/epub.umd.js` needs `window.JSZip` or
  `Archive.checkRequirements()` throws `EpubError: ... JSZip lib not loaded` on any
  `.epub`. Examples that default to a packed `.epub` ship a cdnjs `<script>`;
  `continuous-scrolled.html` and `scrolled.html` default to an unpacked `.opf` and
  **don't**. The driver sidesteps this by injecting
  `node_modules/jszip/dist/jszip.min.js` into the top frame via
  `evaluateOnNewDocument` — so every example works with `.epub` input.
- **The driver blocks all non-localhost requests** and prints
  `[offline] blocked external request: <url>`. That is deliberate: it turns the
  examples' S3/cdnjs defaults into a loud, fast failure instead of a silent
  network dependency. cdnjs JSZip requests are fulfilled from disk.
- **Don't wait for text to appear.** Spine item 0 of most real EPUBs is an
  image-only cover, so `view.document.body.textContent` is empty on a page that
  rendered perfectly. `text` returning empty on first display is normal — `next`
  once. The driver gates readiness on `view.displayed` plus a resolvable
  `rendition.currentLocation().start.cfi`.
- **`text` is section text, not page text.** The iframe holds the whole chapter
  and CSS columns decide what's visible, so pages 1 and 3 of one chapter return
  the *same* string. Never use `text` to check whether paging worked — compare
  the CFIs from `loc`, which is what `flow` asserts on.
- **`window.rendition` and `window.book` are your handles.** The examples use
  classic `<script>` with `var book` / `var rendition`, so both land on `window`.
  Prefer `rendition.next()` over clicking the `‹ ›` arrows.
- **dist is minified — constructor names are mangled.**
  `rendition.manager.constructor.name` returns `"mt"`. Use
  `rendition.settings.manager` (`"default"` / `"continuous"`) instead.
- **`bench/fixtures/*.epub` are gitignored downloads.** Only
  `test/fixtures/alice.epub` (and the unpacked `test/fixtures/alice/`) exist on a
  fresh checkout. Run `npm run bench:fixtures` (network) if you want the Gutenberg
  Alice or War and Peace.
- **The server sets COOP/COEP `require-corp`** (it's the bench harness server).
  Harmless for the examples, but any cross-origin subresource would be blocked by
  that too, not just by the driver's own request filter.
- Screenshots are gitignored via `.claude/skills/*/shots/`.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Waiting failed: 60000ms exceeded` with no other output | The page never painted. Re-run with `--verbose --timeout 8000` to get there fast and see the console. |
| `EpubError: ... JSZip lib not loaded` | You loaded the example outside the driver, or from `file://`. Serve it and use the driver. |
| `[offline] blocked external request: https://s3.amazonaws.com/...` | No `?url=` reached the page — check the `--epub` path starts with `/` and exists under the repo root. |
| `Error: listen EADDRINUSE ... :5181` | A previous driver died before cleanup. The driver now adopts a live server on that port; if it's a *stale* process, `lsof -ti tcp:5181 \| xargs kill`. |
| `dist/epub.umd.js missing — run npm run build first` | Exactly that. `dist/` is gitignored. |
| Your `console.log` in `src/` never appears | Two causes: you didn't `npm run build`, or you didn't pass `--verbose` (only `console.error` is forwarded by default). |
| `Cannot find package 'puppeteer'` | You ran the driver from outside the repo. Node resolves from the *script* location — run it by its in-repo path. |
| `FLOW FAILED` with repeated CFIs | Real regression: `next`/`prev` isn't moving the location. Screenshots in `shots/flow-*.png` show each step. |
