# Changelog

## 0.7.2 (2026-08-20)

### Security

- Link hrefs are stripped of ASCII control characters and spaces before their scheme is sniffed, so `java\tscript:alert(1)` no longer reaches the browser as `javascript:`. The URL parser drops tab and newline from anywhere in the input and strips leading C0 controls, so the old `trimStart()` check compared a different string than the one the browser would navigate to. Five payloads bypassed it; four kept the `onclick` guard that cancels the default action, but `java\tscript://%0aalert(1)` contains `://`, so it took the absolute branch and got `target="_blank"` with no guard at all. `vbscript:` is now filtered alongside `javascript:` and `data:text/html`, and hrefs that legitimately contain spaces are unaffected, since the stripped value is only used for the comparison

### Documentation

- `SECURITY.md` documents the untrusted-EPUB threat model and two sharp edges that were previously unstated. `allowScriptedContent: true` adds `allow-scripts` next to the `allow-same-origin` the sandbox already carries — a pairing the HTML spec documents as removing sandbox protection, since the framed document can then reach `parent.document` and act with the host origin's authority. `allow-same-origin` can't be dropped, because CFI generation, pagination and mapping all need same-origin DOM access, so the tradeoff is inherent rather than fixable. `InlineView` assigns section markup to `innerHTML` in the host document with no iframe at all, so handler attributes run unsandboxed; it exists for epubjs deep-import parity and shouldn't meet an untrusted book. No CSP is applied either, so a book can beacon home through ordinary markup even with scripts off
- Vulnerability reports are directed to the maintainer address, since private vulnerability reporting is disabled on this repository and the GitHub Security Advisories link landed on an error page

## 0.7.1 (2026-08-07)

### Bug fixes

- Re-registering a theme that is already applied now updates the rendered sections instead of being ignored. `_injected` is a `string[]` but was read as a map, so the guard collapsed to `name === "default"`, and `select()` never recorded its own theme — so the common case, selecting a theme and then re-registering it, silently did nothing. The list also grew a duplicate entry per rendered section for the book's lifetime. epubjs v0.3.93 carries the same defect; the public API is unchanged
- `Contents.addStylesheetRules()` replaces the rules registered under a key instead of appending, matching its documented behavior and the string form. Calling it twice with the same key left two copies of every rule in one sheet. Keyless callers still merge, since they all share one node — `Rendition.adjustImages()` writes its column-fitting rules there
- Re-registering a url theme replaces its stylesheet instead of stacking a second `<link>`. `Contents.addStylesheet()` deduped only on an identical href and never removed the link it superseded, so the old stylesheet stayed in the document applying every rule the new one didn't override. It now takes an optional key, which `Themes` fills with the theme name
- A stylesheet whose rules can't be read is skipped rather than abandoning the rest. Touching `cssRules` on a cross-origin sheet throws, and the handler returned out of the whole loop — so one such stylesheet left the document with no media query listeners at all, and `@media`-driven reflows never triggered `expand()`
- `Store.getBase64()` routes through `blob2base64()` instead of hand-rolling the same `FileReader` promise. A failed read resolved `null`, and `createUrl()` then threw "File not found in storage" for a file that is in storage, hiding the real error
- `blob2base64()` rejects when the read fails. `onloadend` fires for failures too, where `result` is `null`, so a failure resolved `null` and surfaced much later as an undefined asset url rather than as an error the `Resources` replacement pass could catch
- `Contents` no longer measures a detached document from callbacks that outlive `destroy()` — a `ResizeObserver` callback already queued on `requestAnimationFrame` (which `disconnect()` cannot cancel), the `fonts.ready` continuation, the `transitionend` listener, and the 250 ms selection timer each emitted from a `Contents` the manager had already dropped
- Destroying a rendition before its view manager rendered no longer throws. `DefaultViewManager.destroy()` unconditionally touched the container, stage and listeners that only `render()` creates, so closing a reader while its book was still opening threw out of `Rendition.destroy()` — in React, an exception out of `componentWillUnmount` that unmounts the whole tree. `ContinuousViewManager` reached the same code through `super.destroy()`. The teardown is gated on the container and stage themselves rather than on `rendered`, so a `render()` that threw partway is still cleaned up

### Performance

- The mark-placement animation frame is skipped when a view has no marks. `reframe()` runs on every expand, so a reader without annotations scheduled a frame per page turn only to iterate an empty object
- The discarded computed-style reads are dropped from `Contents` sizing. `width()`/`height()` and `scaler()` wrote a style and read it back through `getComputedStyle` to build a return value their callers ignore, forcing a style flush on a path that runs on every `setLayout`, expand and resize

### Internal

- Add a `run-epub-ts` skill that drives the reader in headless Chrome — paging, CFI reads, screenshots and arbitrary page JS against the committed alice fixture, plus a no-browser mode for the parse layer. Non-localhost requests are blocked so the examples' network defaults fail loudly
- Trim `AGENTS.md` to what isn't derivable from `package.json`, `ls` and `tsconfig.json`, and replace the conventional-commit examples with the gitmoji subjects the repo actually uses

## 0.7.0 (2026-08-05)

### Breaking changes

- `Rendition.display()` is now typed `Promise<Section | undefined>` — it has always resolved `undefined` for a superseded or aborted display, and a cast was hiding it
- The `./dist/*` subpath export is narrowed to `./dist/*.js` and `./dist/*.cjs`, so per-module `.d.ts` paths with no JS beside them now fail at resolve time instead of at runtime

### Features

- Export `InlineView` for parity with epubjs deep imports (restores the import path, not a working renderer — the class has never rendered in any epubjs release)
- Add `method` to `RenditionOptions`, so TypeScript consumers can pass it to `renderTo()` without a cast

### Bug fixes

- `Rendition.display()` no longer hangs — and no longer stalls every later queued task — when rendering fails; `destroy()` settles the in-flight deferred too
- `DefaultViewManager.display()` settles on every failure path, not just the one mid-chain rejection it handled
- `Queue.clear()`/`stop()` settle the tasks they drop, so teardown no longer hangs a pending `display()` or `Locations.generate()`
- `Queue.run()` mints a fresh promise after the queue is cleared mid-flight instead of reporting a non-empty queue as drained
- View display promises settle before listeners run, so a throwing listener can't deadlock a view into permanent invisibility
- Overlapping `IframeView` displays share one in-flight promise instead of racing two loads
- The memoized `sectionRender` is cleared on failure and on destroy, so a failed view can retry instead of re-attaching to a rejected promise forever
- A view destroyed mid-load settles its pending load with `AbortError` instead of stranding the manager queue
- Views removed before they displayed are now destroyed — previously the one view worth aborting was always skipped, leaking its request and blob url
- The continuous fill loop ends when a view fails, and the failed view is dropped instead of walking the spine to its end attaching iframes
- A view that fails to display as it scrolls into range is dropped and reported, rather than silently re-requesting once per scroll tick
- Page-turn failures are reported on `displayerror` instead of being swallowed and scrolled to anyway
- Event listeners are isolated, so one throwing listener no longer skips the rest or propagates into library code
- The abort signal and per-call credentials/headers are forwarded through `Book.load`, so superseded section fetches are actually cancelled
- `request()` retries without the abort signal when `fetch` rejects it as cross-realm, unless the signal is already aborted
- Sections declared `application/xhtml+xml` but named `.htm`/`.html` are parsed strictly, with a lenient fallback when the strict parse fails — a self-closed `<title/>` no longer renders the section blank
- The nav document's parse type is inferred from its extension, so a not-well-formed `nav.xhtml` no longer yields an empty TOC with nothing thrown
- `method` is passed through to views in `ContinuousViewManager`, making `blobUrl` reachable in scrolled flow, and a re-displayed view no longer orphans its first blob url ([#35](https://github.com/likecoin/epub.ts/issues/35))
- The initial `about:blank` load is ignored when `method` is `"write"`, so the written document is measured and styled instead of an empty one
- Book resources load through `load()` so images, fonts and stylesheets carry the book's credentials, headers and abort signal
- The store carries the book's credentials and headers, so a stored book no longer caches a 401 body for later offline reads
- Replacement urls stay index-matched when an asset fails, so one 404 no longer rewrites every later asset onto the wrong blob
- The stylesheet blob that `replaceCss()` supersedes is reclaimed — previously one leaked blob per stylesheet, every book
- The replacement pass is skipped when the store would repeat it, orphaning the first set of blob urls
- `Resources` stays intact when destroyed mid-flight, and cancelled requests are no longer logged one line per asset

### Refactor

- Narrow the `displayed` event payload to a definite `Section`, dropping a null check listeners never needed

## 0.6.10 (2026-08-01)

### Features

- `Locations.locationFromHref()` resolves a TOC href to a location index, so readers can show page numbers beside navigation entries without re-parsing every section. Pre-paginated books return the spine index; unresolvable hrefs return `-1` ([#29](https://github.com/likecoin/epub.ts/issues/29))

### Bug fixes

- Per-itemref `rendition:layout-*` properties in the spine now override the package-level default, so fixed pages in a mostly-reflowable book are scaled to fit instead of column-paginated. Applies to layout formatting, view geometry, image clamping and `Locations.isPrePaginated()`
- `Contents.writingMode()` reads the styled element instead of `documentElement`. Books declaring `writing-mode: vertical-rl` on `<body>` (calibre's default output) were detected as horizontal, which height-locked the iframe and skipped the rest of every chapter ([#31](https://github.com/likecoin/epub.ts/issues/31))

## 0.6.9 (2026-07-18)

### Features

- Allow injecting a `DOMParser` to sidestep LinkeDOM hangs. Some real-world EPUBs drive LinkeDOM's synchronous parser into a busy loop that never returns, forcing Node consumers to isolate each book in a subprocess. A new `setDOMParser` (and a `BookOptions.domParser` shortcut) lets `jsdom` be swapped in without monkey-patching `globalThis.DOMParser`. The override is process-global, consistent with how the parse path already reads the global `DOMParser`, and covers both book-open and render parsing since both funnel through `core.parse`
- Parse spine resources by manifest `media-type` when the extension is unknown. `Section.load` inferred the parse type solely from the URL extension, so an extensionless or oddly-named spine resource (e.g. `chapter.html_split_001`) fell through to a raw string and `Section.load` read `documentElement` off it, throwing in the content hooks. The manifest `media-type` is now propagated to `Section` and used as a fallback when the extension yields no known parse token. A recognized extension still wins, so lenient `html` vs strict `xhtml` parsing is unchanged for normal books

### Bug fixes

- Match prefixed OPF elements under namespace-blind parsers. Legacy EPUB 2 packages that use prefixed element names (`<opf:metadata>`, `<opf:manifest>`, `<opf:item>`, `<opf:itemref>`, …) open in the browser but rejected with "No Metadata Found" on the Node/linkedom path: linkedom has no XML namespace support, so it keeps the literal `opf:` on tag names and the unprefixed selectors never match. `qs`/`qsa`/`qsp` now have a miss-path fallback — when the plain selector finds nothing, they retry with the prefix linkedom left on the document root (`<opf:package>` → `opf\:metadata`). Namespace-aware parsers match on the first try, so their behavior is unchanged. Mirrors the existing `dc:` fallback in `getElementText` and lets consumers drop the whole-EPUB `opf:` normalization workaround
- Read metadata via `textContent` so entities don't truncate values. On the Node/linkedom path, an entity reference becomes its own child node, so "Bookshops &amp; Bonedust" parses as `["Bookshops ", entity, " Bonedust"]`. `getElementText`/`getPropertyText` read only `childNodes[0]`, truncating the value at the first entity ("Bookshops"). Reading `textContent` concatenates and decodes the whole value. Browsers keep it a single text node, so their output is unchanged
- Resolve `uniqueIdentifier` under namespace-blind parsers. `findUniqueIdentifier` required localName `identifier` in the Dublin Core namespace, but linkedom keeps the `dc:` prefix on the local name and mis-assigns the namespace, so prefixed EPUB 2 books came back with an empty `uniqueIdentifier`. It now strips any prefix, also accepts a `dc:`-prefixed tag, and reads `textContent` so entity references don't truncate the value
- Fail clearly in `parse()` when no `DOMParser` is available. When both a configured `DOMParser` and `globalThis.DOMParser` are absent (e.g. Node without the `/node` entry and without `setDOMParser`), callers now get an actionable `EpubError` instead of a cryptic "ParserCtor is not a constructor" `TypeError`

## 0.6.8 (2026-07-05)

### Features

- Load `file://` books through an `XMLHttpRequest` fallback. `fetch()` cannot read the `file:` scheme, so a local `.epub` in a `react-native-webview` or `file://` deployment never loaded — and because nothing rendered, `relocated`/`locationChanged` never fired. `file://` URLs (and fetch-less runtimes) now route through `XMLHttpRequest`, treating status `0` (`file:` only) as success and bridging `AbortSignal` to `xhr.abort()`. It reuses `handleResponse`/`createBlob` from the core path and rejects with a clear `EpubError` when `XMLHttpRequest` is unavailable
- Expose the UMD bundle via a `./umd` export (plus a `./dist/*` glob) so the existing build is reachable for `<script>`-tag and `react-native-webview` drop-in use. The README documents the drop-in alongside `file://` loading notes; in a bundler, point at the standard ESM entrypoint rather than the UMD subpath

### Bug fixes

- Book open failures now surface the real cause and fail fast. The generic "Cannot load book" message masked the underlying error and never rejected `opening`/`loading`, so `book.opened` and `book.ready` hung forever instead of surfacing the cause (e.g. "JSZip lib not loaded" when the UMD bundle is loaded without JSZip). The underlying error is now emitted as the cause and the pending open/load promises are rejected so awaiting callers fail fast. Synchronous setup throws (e.g. `Archive` construction when JSZip is missing) route through the same handler so `open()` always rejects rather than throwing before its promise chain is built. The error message bounds its input — long strings are truncated and `ArrayBuffer`/`Blob` inputs are summarized by size/type rather than stringified
- Re-report location when a hidden container becomes visible. A rendition displayed into a `display:none` / zero-size element has no visible views, so `reportLocation()` can't emit and `relocated`/`locationChanged` never fire; the stage only listens to window `resize` (and only for non-fixed sizes), so later revealing the container never re-reported — a common `react-native-webview` / mount-before-measure case. The container is now observed directly and `reportLocation()` fires once it gains a real size, but only on a genuine unmeasurable→measurable transition and only until the first location is established, after which the observer self-disconnects
- Fail clearly when `XMLHttpRequest` is unavailable. The XHR fallback hit a bare `new XMLHttpRequest()` when the runtime also lacked `XMLHttpRequest` (e.g. Node without a polyfill), throwing a cryptic "is not a constructor". It now rejects with a clear `EpubError`

### Refactor

- Read container size from the `ResizeObserver` entry instead of forcing a reflow. The container recovery callback re-read layout via `getBoundingClientRect()` on every fire — a forced reflow inside a `ResizeObserver` callback, which can trigger further resize notifications. It now uses the `contentRect` the observer already delivers, and the disconnect/clear dance is centralized in a `_disconnectContainerObserver()` helper (matching `_disarmReanchor`) so the callback and `destroy()` share one idiom

## 0.6.7 (2026-06-20)

### Bug fixes

- `Rendition.currentLocation()` no longer throws after the rendition is destroyed. `reportLocation()` defers its work through the task queue and a `requestAnimationFrame`, but the scheduled frame can fire after `destroy()` has set `this.manager = undefined` — clearing the task queue cannot cancel an already-scheduled rAF. When a consumer tore down the reader (e.g. a route change) between scheduling and the frame firing, the callback woke up to an undefined manager and threw `Cannot read properties of undefined (reading 'currentLocation')`. The rAF callback now bails out when the manager is gone, and the same guard is added to the public `currentLocation()` method, which reaches the identical `manager.currentLocation()` call synchronously and could throw the same way if called post-destroy

## 0.6.6 (2026-05-27)

### Bug fixes

- `Locations.parse()` now yields at least one location per section. Sections with no real text — image-only plates or whitespace-only markup — produced zero locations because the opening range was created only after empty text nodes were skipped, so the trailing "close remaining" range never had a start container. Every such section silently contributed nothing to `Locations.total`, skewing the total and every reading-progress percentage after it. The opening range is now created before the empty-node skip, so even a whitespace-only section emits one location. Ports [futurepress/epub.js#1407](https://github.com/futurepress/epub.js/pull/1407), but drops that PR's `range === undefined` guard: the guard suppresses the per-node re-anchor that runs when a node ends exactly on a break boundary, making a section's trailing location span backward from the previous node as a cross-node range — keeping the `counter === 0` re-anchor preserves correct anchoring
- The CFI display position is re-anchored after late content reflow. A deep CFI restore could land on an early page before the saved position: the first `moveTo()` clamps the target to the last page of an under-measured layout, and the section only grows afterwards as images, web fonts, or host-injected theme CSS load. The rendition now listens for content-only reflow (`MANAGERS.RESIZE`, previously unhandled) and re-applies the original target for a short window after display, then re-reports so consumers persist the corrected location instead of the clamped one. The re-anchor is disarmed on `next`/`prev` and on genuine user scroll so an actively reading user is never yanked back, guarded against stale timers when a fresh display re-arms, serialized via an in-flight flag so overlapping displays on async (continuous) managers can't fight over views, and surfaces `manager.display` rejections as `displayError` instead of leaking an unhandled rejection

## 0.6.5 (2026-05-22)

### Bug fixes

- `Mapping.splitTextNodeIntoRanges` now splits spaceless scripts (CJK) per character instead of collapsing the whole text node into a single range. With only a space splitter, Chinese text produced one range, so `findTextStartRange` could not locate a column boundary inside a long paragraph and fell back to character offset `:0` — every page beginning mid-paragraph reported the paragraph's start, breaking reading-position and TTS anchoring. The `Intl.Segmenter`-based canvas fast path already handled CJK, but `text-indent` (universal in CJK books) tripped the exotic-CSS gate and disabled it, leaving the space-only DOM fallback in charge. Offsets are emitted in UTF-16 code units (astral characters advance by two), matching the EPUB CFI spec
- Split ranges are now aligned past leading whitespace. Split positions were computed against the `String.trim()`-ed text but applied to the raw text node, so a node with leading whitespace (common in pretty-printed XHTML) shifted every range left — the first range started inside the whitespace and word ranges mapped to the wrong characters, yielding incorrect CFIs and page boundaries
- The word-splitting loop no longer drops interior words. It nulled its working range after the first word, so the second word of every multi-word text node was never emitted (`"a b c d"` produced `["a", "c", "d"]`; a two-word node produced only its first word), leaving `findTextStartRange`/`findTextEndRange` with no range covering the dropped words and resolving a column boundary inside one to an adjacent word's offset. Rewritten as a single walk over every splitter; using `splitter.length` instead of a hardcoded `+1` also fixes multi-character custom splitters

## 0.6.4 (2026-05-19)

### Bug fixes

- `Mapping.page()` no longer emits a page whose `location.start.cfi` is after `location.end.cfi`. The canvas fast path estimates node positions from a uniform text-width-to-`scrollWidth` ratio; for a reflowable section rendered in a rendition shared with viewport-pinned fixed-layout siblings that mapping is non-linear, so `findStart`/`findEnd` could select the wrong nodes and invert document order — breaking consumers that rely on `start.cfi <= end.cfi`. `page()` now detects the inversion via `Range.compareBoundaryPoints` (no CFI string round-trip) and falls back to the monotonic DOM walk for that page via a new `noFast` flag on `findStart`/`findEnd`

### Tests

- Fix the `AbortSignal` `request()` test under jsdom. jsdom's `AbortSignal` is a different realm than Node's undici `fetch`, which rejected the foreign signal with a `TypeError` before it could abort, so `request.ts`'s `AbortError`-passthrough branch was never exercised and the error fell through to the `EpubError` wrapper. The test now stubs `fetch` to reject with the `AbortError` undici/browsers actually throw, verifying `request()`'s real contract deterministically without depending on cross-realm `AbortSignal` compatibility

## 0.6.3 (2026-04-14)

### Modernization

- Phase 2 browser platform modernization — five feature-detected enhancements, each with an ES2020 fallback so the library still runs on the declared Chrome 80 / Safari 13.4 / Firefox 74 floor:
  - `defer` delegates to `Promise.withResolvers()` when available, skipping the extra closure allocation
  - `request()` / `Section.load/render` / `IframeView` accept an optional `AbortSignal`; views create a controller at `render()` and abort it in `destroy()`, so rapid page navigation no longer downloads sections the user flicked past. `AbortError` is surfaced verbatim instead of being wrapped as `EpubError`, and is suppressed on the `loaderror` path
  - Default + continuous managers attach a native `scrollend` listener when `"onscrollend" in window`, suppressing the 20ms/150ms `setTimeout` fallback emission path. Native timing is authoritative for momentum scroll on iOS
  - `Locations.generate()` schedules the pause between sections via `requestIdleCallback` (`timeout: pause + 50`) when present, interleaving background location walking with user scrolling
  - `.epub-view` containers get `contain: layout paint` to isolate sibling reflow and paint. `size` containment is deliberately excluded because `expand()` still needs to read the iframe document's natural `scrollWidth`/`scrollHeight`
- Drop browser floor to ES2020 — re-allows `http://` intranet and `file://` deployments by reintroducing a `Math.random`-based `uuid()` fallback for insecure contexts and Firefox 74–94. `tsconfig` `lib` narrowed from ES2022 back to ES2020; `Object.hasOwn` and `Array.prototype.at` uses were rewritten to ES2020-compatible equivalents so accidental reintroduction surfaces as a compile error instead of a Firefox 74–91 runtime crash

### Tests

- Add `AbortSignal` propagation tests covering both the `request()` layer (pre-aborted signal surfaces `AbortError` verbatim, not wrapped as `EpubError`) and the `IframeView` layer (`destroy()` mid-render rejects the render promise with `AbortError` and emits neither `loaderror` nor `rendered`)

## 0.6.2 (2026-04-10)

### Modernization

- Phase 1 browser platform modernization — drop-in adoption of 2016–2022 browser APIs:
  - Replace `window` `"unload"` listeners with `"pagehide"` in both view managers and guard on `event.persisted` so bfcache entry leaves the manager alive (destroying would break `pageshow` restore)
  - Prefer `crypto.randomUUID()` in `uuid()`, cached at module load to avoid a per-call `typeof` check
  - Use `queueMicrotask` in `microTick`, skipping the `Promise.resolve()` allocation on every locations queue tick
  - Mark scroll listeners `{ passive: true }` in default + continuous managers and `snap.ts` — none call `preventDefault`, so compositor-thread scrolling is free
  - Migrate remaining `hasOwnProperty` call sites to `Object.hasOwn`
  - Replace `arr[arr.length - 1]` with `arr.at(-1)` where it clarifies intent
  - Add `ErrorOptions` (`cause`) to `EpubError` and forward the caught error from `request.ts` so fetch failures preserve their original stack
  - Bump `tsconfig` `lib` to ES2022 (target stays at ES2020)
- Phase 0.5 pre-2016 legacy cleanup — delete dead IE/pre-ES2016 fallback branches and convert `indexOf` comparisons to intent-specific string/array methods (`includes`, `startsWith`, `endsWith`). Drops the `Math.random`/`Date.getTime` fallback in `uuid()` and the `document.createEvent("MouseEvents")` fallback in marks-pane. 18 idiom sites across 13 files. All behavior-preserving.

### Bug fixes

- Prevent scroll flicker by hiding off-screen views instead of destroying them
- Stop `DefaultViewManager`'s internal task queue (`this.q`) on `destroy()` — any `check()`/`update()` task enqueued just before destroy previously continued firing via `requestAnimationFrame` and crashed on torn-down views (production hit destroyed iframes; tests had a ~40% flake rate from leaked rAF callbacks crossing files)

### Tests

- Add 8 `ContinuousViewManager.erase()` unit tests covering scroll-compensation arithmetic on every code path (vertical, horizontal LTR, horizontal RTL non-fullsize and fullsize, fractional `bounds.width`, no-above branch, views-collection removal)
- Lock in the `pagehide` bfcache guard (`if (e.persisted) return`) with direct-invocation tests for both managers so a future refactor can't silently strip it

### Internal

- Add local benchmark suite (`bench/`) comparing bundle size and runtime perf against `epubjs@0.3.93`. Puppeteer harness runs cold-parse, first-display, next-page, `locations.generate`, `currentLocation`, and heap scenarios against Alice in Wonderland and War and Peace fixtures. Gitignored output. Headline: `locations.generate(1000)` drops from ~43s to ~159ms on the War and Peace fixture.
- Add Performance section to README with numbers for both fixtures.
- Correct `plan/modernization.md` browser floor to Chrome 93+ / Safari 15.4+ / Firefox 95+ (bounded by `crypto.randomUUID`, `Array.prototype.at`, `Object.hasOwn`, and `Error` `cause`).

## 0.6.1 (2026-04-08)

### Performance

- Add node-level canvas binary search to `Mapping.findStart`/`findEnd` — extends the canvas optimization from 0.6.0 to the node-finding walk. Cumulative document-level text widths power a ratio-based binary search that replaces the O(N) `nodeBounds()` reflow walk, eliminating up to ~19 forced reflows per `findRanges` pass. Hoists and measurer-gates `scrollWidth`/`scrollHeight` reads so the DOM-walk fallback pays no extra reflow cost. Correctly handles RTL, subpixel rounding, and wide candidate windows; falls back to the DOM walk when monotonicity can't rule out an earlier match.

## 0.6.0 (2026-04-02)

### Features

- Allow custom underline styles
- Add canvas-based text measurement and dirty-flag dimension caching

### Docs

- Rewrite docs with value-focused messaging for developers

### CI

- Add npm Trusted Publishing workflow with OIDC provenance

## 0.5.1 (2026-03-30)

### Refactor

- Export `Container` class, fix `ContinuousViewManager` type mismatch, regenerate API docs

### Tests

- Add 69 InlineView tests with extracted shared view mocks

### Cleanup

- Remove 13 stale TODO comments inherited from epubjs

## 0.5.0 (2026-03-28)

### Modernization

- Replace `XMLHttpRequest` with `fetch` across Archive, Store, and request utilities — drops the last browser-era XHR dependency
- Extract `handleResponse` helper and add `EpubError` class for structured error handling
- Replace trivial `defer()` usage with native `async`/`await`
- Simplify `requestAnimationFrame` export (direct re-export instead of wrapper)
- Normalize `setTimeout(fn, 1)` → `setTimeout(fn, 0)` for consistency
- Enforce strict equality (`===`/`!==`) throughout

### Removed

- Remove `prefixed()` CSS vendor-prefix helper (all target browsers support unprefixed properties)
- Remove `webkitURL`/`mozURL` fallbacks (standard `URL` is universally available)
- Remove `ResizeObserver` polyfill fallback path (supported in all modern browsers)
- Remove iOS 10.3 orientation change workaround
- Remove other dead code and obsolete polyfills

### Bug fixes

- Include response body text in fetch error messages for easier debugging
- Fix review findings from modernization commits

## 0.4.9 (2026-03-03)

### Performance

- Reduce Locations default pause from 100ms to 0 — eliminates ~10s of artificial delay for 100-chapter books; consumers can still pass a custom pause value
- Replace FileReader + Blob roundtrip with synchronous TextDecoder in `Store.getText()` (~5x faster per call)
- Single-pass regex for CSS URL substitution — replaces O(N×M) loop with one combined regex and Map lookup; fixes a substring collision edge case
- Batch CSS writes in `Contents.columns()`/`size()`/`fit()` — reduces ~15 forced layouts per call to 1
- Add microtask scheduling mode to Queue, use it in Locations — saves ~1.5s of rAF overhead for background computation
- Defer blob URL creation to not block `book.opened` — replacements now run concurrently; new `book.replacementsReady` promise for consumers who need to wait; section rendering still waits for replacements via serialize hook

### Bug fixes

- Fix `book.opened` resolving before navigation is loaded — now waits for `loaded.navigation` (previously masked by slow replacements)

## 0.4.8 (2026-03-03)

### Bug fixes

- Plug memory leaks in view, resource, and store cleanup:
  - Call `section.unload()` in `IframeView.destroy()` to release off-screen chapter DOMs
  - Revoke blob URLs in `Resources.destroy()` before clearing `replacementUrls`
  - Fix `Store.destroy()` to revoke `urlCache` values instead of keys

## 0.4.7 (2026-02-26)

### Bug fixes

- Fix Android Chrome/Brave skipping the last page of each EPUB chapter — re-expand view before jumping to next/prev section to force layout reflow; on Android Chrome/Brave, the initial `expand()` measures before CSS column layout fully settles, making `scrollWidth` one page too narrow
- Apply the same re-expand-then-recheck pattern to `prev()` and vertical pagination branches for completeness
- Re-enable `fontLoadListeners()` (commented out since 2016) so font load events trigger `resizeCheck()`, proactively correcting iframe sizing after web fonts settle

### Tests

- Expand test coverage from 481 to 876 tests across 38 test files (10 new test files added covering Stage, marks-pane, Contents, Mapping, IframeView, Rendition, DefaultViewManager, ContinuousViewManager, Snap, and Store; expanded Locations, Section, and Resources tests)

## 0.4.6 (2026-02-20)

### Features

- Add Node.js parsing-only entry point (`@likecoin/epub-ts/node`) — parse EPUB metadata, spine, navigation, and section content without a browser; requires `linkedom` as an optional peer dependency
- Add `./node` subpath export with ESM (`epub.node.js`) and CJS (`epub.node.cjs`) bundles
- Add typed event emitter generics: `IEventEmitter<E extends EventMap>` with per-class event map interfaces (`BookEvents`, `RenditionEvents`, `ContentsEvents`, `AnnotationEvents`, `LocationsEvents`, `LayoutEvents`, `StoreEvents`, `DefaultManagerEvents`, `IframeViewEvents`, `InlineViewEvents`) — all exported from the public API for consumer use

### Bug fixes

- Restore `Spine.prepend()` unshift that was accidentally commented out during the 2016 epubjs eslint cleanup
- Restore definite assignment assertions in `Resources` fields (regression from strict migration); fix `window.encodeURIComponent` → `encodeURIComponent` in `Store` for Node.js compatibility
- Fix `book.opened` promise hanging forever when `open()` throws synchronously; use `console.error` instead of throwing in `hook.ts` trigger catch block

### Type safety

- Reduce ~22 non-null assertions via definite assignment in `rendition.ts` and `book.ts`
- Type `orientationchange` event payload as `number` (matches `window.orientation` API); type `markClicked` data arg as `object | undefined`; type `loaderror` payload as `unknown`

### Tests

- Expand test coverage from 71 to 481 tests across 28 test files (17 new test files added covering Archive, PageList, Resources, Annotations, Packaging, Navigation, Container, Layout, DisplayOptions, Spine, utility layer, Replacements, Views, Request, and Themes)

## 0.4.5 (2026-02-17)

### Bug fixes

- Guard `window` reference in `store.ts` at module scope for Node.js/SSR compatibility
- Guard `window` references in `archive.ts`, `url.ts`, and `replacements.ts` for Node.js compatibility
- Replace `window.decodeURIComponent` with global `decodeURIComponent` in `archive.ts`
- Fix `querySelectorByType` crash on environments without CSS namespace selector support (e.g. linkedom)
- Add `getElementsByTagName` fallback in `Packaging.getElementText` for parsers without XML namespace support

### Type safety

- Replace ~61 `any` types with proper types across 21 files (~82 remain, intentionally kept)
- Replace ~33 `Function` types with proper signatures across 6 files (0 remaining in code)
- Reduce ~95 non-null assertions via definite assignment across 4 files

## 0.4.4 (2026-02-16)

### Bug fixes

- Fix 6 unintended behavioral changes from TypeScript migration:
  - Restore `locations.parse()` order: check empty text before starting range
  - Restore `rendition` `metadata.minSpreadWidth` fallback
  - Revert `contents.css()` to bracket access for camelCase compat
  - Remove incorrect BINARY fallback in `book.determineType()`
  - Restore `window` guard on `_URL` for Node.js/SSR safety
  - Restore `qs()` returning `null` instead of `undefined`
- Fix 3 more unintended behavioral changes:
  - Restore `EpubCFI.compare()` offset ordering when one offset is null
  - Remove `parseComponent()` `.filter()` that changed step array indices
  - Fix `store.createUrl()` promise hanging forever when value is undefined
- Fix `store()` replacement string value coerced to boolean

### Type safety

- Remove ~100 `any` types across 22 source files (~64 remain)
- Add `defer<T>` generic type and cascade across 16 files
- Add Window augmentation for vendor URL prefixes
- Fix type errors from stricter queue `enqueue` signature

## 0.4.3 (2026-02-15)

### Security

- Fix CSS injection: use `textContent` instead of `innerHTML` for style elements
- Strip `javascript:` and `data:text/html` hrefs from EPUB links to prevent XSS

### Bug fixes

- Clean up event listeners and timers in `destroy()` methods across 6 files
  (Book, Contents, Rendition, IframeView, DefaultViewManager, ContinuousViewManager)
- Clean up image `onload` handlers and `__listeners` in `Contents.destroy()`
- Clean up `Store` reference in `Book.destroy()`

### Type safety

- Remove ~143 `any` types across 24 source files
- Widen `destroy()` properties with `| undefined` to remove `(this as any)` casts
- Type callback parameters in rendition, themes, and annotations hooks
- Replace `CSSStyleDeclaration` index access with `getPropertyValue()`
- Replace `el.attributes.name.value` with `el.getAttribute("name")` in DisplayOptions
- Type `Hook` class context/register/trigger signatures
- Remove IE compatibility code (`onreadystatechange`, `MSApp`)

### Documentation

- Update PROJECT_STATUS.md with security fixes, accurate `any` count, and expanded next steps
- Remove stale `types/` directory reference from AGENTS.md
- Fix README comparison table: bundle format now correctly lists ESM + CJS + UMD

## 0.4.2 (2026-02-15)

### Bug fixes (ported from epub.js upstream PRs and forks)

- Fix `orientationchange` event listener case mismatch in `Stage.destroy()`
- Fix memory leak: store `unload` listeners as named properties for proper removal
- Fix `Navigation.get()` failing when target has `#` prefix
- Ensure at least one location per section for image-only/empty content
- Parse manifest `fallback` attribute per EPUB spec
- Fix bottom-of-page detection using floating-point-safe comparison
- Fix vertical `moveTo` using `layout.height` instead of `layout.delta`
- Fix `substitute()` for percent-encoded URLs with CJK filenames
- Disable scroll anchoring (`overflow-anchor: none`) on epub container
- Add `dblclick` to `DOM_EVENTS` for iframe event forwarding
- Fix themes registered via `registerCss()` not injected into new views
- Guard `pane.addMark()` with try/catch to prevent invalid highlights from
  breaking section navigation
- Remove deprecated `-webkit-line-box-contain` CSS that causes line-height
  rendering issues on iOS Safari

## 0.4.1 (2026-02-11)

### Bug fixes

- Fix `requestAnimationFrame` illegal invocation caused by lost `window` context
  after ES6 modernization removed `.call(window, ...)` from Queue

## 0.4.0 (2026-02-11)

### Breaking changes

- Drop IE8–IE11 support: removed all Trident detection, TreeWalker fallbacks,
  `overrideMimeType` polyfill, `safeFilter` hack, and `querySelector` polyfills.
  Library now targets modern browsers only.

### Dependencies removed

- `localforage` — replaced with a thin native IndexedDB wrapper (~30 lines);
  graceful fallback via try/catch when IndexedDB is unavailable (e.g. Safari
  private browsing). Public `Store` API unchanged.
- `@xmldom/xmldom` — replaced with native `DOMParser` and `XMLSerializer`.
  Only runtime dependency is now `jszip`.
- `@types/localforage` (devDependency)

### Dependencies upgraded

- `jszip` 3.7.1 → 3.10.1

### Bug fixes

- Fix `Store` request interceptor not falling through to network on cache miss
- Fix memory leaks in `Contents`: remove resize/MutationObserver listeners on
  destroy
- Fix incomplete `Rendition.destroy()`: now cleans up manager, themes, and
  annotation hooks

### Refactor

- Modernize legacy JS patterns to ES6+ across 18 files: replace `arguments`
  with rest params, `Array.prototype.slice.call` with `Array.from`,
  `.apply()`/`.call()` with spread syntax, `.bind(this)` with arrow functions
- Remove resolved TODOs and dead code

## 0.3.97 (2026-02-08)

### Documentation

- Overhauled README: added CI/npm/license badges, features section, API summary
  table, epubjs comparison table, supported environments, expanded development
  section with prerequisites and scripts table, acknowledgments, related projects
- Improved AGENTS.md: added coding conventions, code style, commit messages,
  testing guidelines, key files table, current stage summary
- Expanded PROJECT_STATUS.md: added build output table, epubjs comparison,
  known limitations, priority next steps
- Migrated API docs from documentation.js to typedoc (HTML + Markdown output)
- Cleaned up invalid JSDoc across 7 source files (stale `@param` names,
  unsupported `@memberof`/`@fires` tags)
- Rebranded all 26 example HTML titles from "EPUB.js" to "epub.ts"
- Added fork attribution to examples index page

### Build & tooling

- Added `"sideEffects": false` to package.json for better tree-shaking
- Added `typedoc` as devDependency with `npm run docs` script
- Added GitHub Actions workflow for auto-deploying API docs to GitHub Pages

### Type safety

- Enabled full `strict: true` in TypeScript config (strictPropertyInitialization,
  noImplicitThis — 377 errors fixed)
- Enabled stricter ESLint rules

## 0.3.96 (2026-02-07)

### Type safety

- Replace `any` with proper types across all public APIs: `ePub()`, `Book.ready`,
  `Book.loaded`, `Rendition.next/prev`, `Locations.generateFromWords`,
  `Store.getText/getBase64`, `EpubCFI.base/path/parse/fromRange/fromNode`, and more
- Fix `SpineItem.next()/prev()` return type from `SpineItem` to `Section`
  (matches runtime behavior; eliminates all `as unknown as Section` casts)
- Export all public classes (`Spine`, `Locations`, `Navigation`, `PageList`,
  `Resources`, `Packaging`, `Archive`, `Store`, `DisplayOptions`, `Annotations`,
  `Themes`, `Mapping`) from package entry point

### Bug fixes

- Fix `EpubCFI.compare()` null-safety bug: offset comparison now guards against
  null offsets instead of silently returning "equal"
- Fix `Annotations.each()` which used broken `forEach.apply` on a Record
- Fix `Locations.processWords` early return to resolve with `[]` instead of
  `undefined`
- Guard rendition mark-click callback against destroyed view contents

## 0.3.95 (2026-02-07)

### Exports

- Export `Section` class from package entry point
- Re-export all shared types (`NavItem`, `Location`, etc.) from package entry,
  matching the original epubjs public API surface

## 0.3.94 (2026-02-07)

### Bug fixes

- Enable `display: inline-block` on column containers to fix iOS WebKit
  scrollWidth inflation loop that caused infinite width calculation.
  Note: this may cause layout issues with RTL content.

## 0.3.93 (2026-02-07)

Initial release of `@likecoin/epub-ts`, a TypeScript fork of [epubjs](https://github.com/futurepress/epub.js) v0.3.93.

### Build & tooling

- Replaced webpack + Babel + Karma with Vite + Vitest
- Added ESLint with TypeScript plugin (0 errors, 0 warnings)
- Added GitHub Actions CI

### TypeScript conversion

- Converted all source files from JavaScript to TypeScript
- Enabled `noImplicitAny` (270 implicit-any params annotated)
- Replaced ~528 explicit `any` with proper types
- Enabled `strictNullChecks` (476 errors fixed across 30 files)

### Dependencies removed

- `core-js` (Babel polyfills, not needed with Vite)
- `lodash` (throttle/debounce replaced with native)
- `path-webpack` (replaced with inline path utils)
- `event-emitter` (replaced with inline typed emitter)
- `marks-pane` (inlined as src/marks-pane/)

### Bug fixes

- Fixed Path class directory extension parsing
- Fixed Url file:// origin handling
- Fixed all skipped/todo tests with HTTP fixture server
