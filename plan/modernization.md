# Browser Platform Modernization Plan

Discovery + phased implementation plan for adopting modern browser APIs (2016–2026) in `epub.ts`.

## Principles

- **API compatibility first.** The public surface must stay drop-in with `epubjs v0.3.93`. Every change below is either internal or a capability-detected enhancement with fallback to today's code path.
- **Feature-detect, never assume.** Browsers targeted by this library range from Chrome 87+ / Safari 15.4+ (current `Intl.Segmenter` floor) upward. Each new API gets a `typeof`/`in` check with the existing behavior as fallback.
- **No behavioral regressions.** Changes must pass the existing 993+ test suite unmodified. Tests added for new paths should run against both the modern and fallback branches where feasible.
- **Small, reversible commits.** Each item in Phase 1 and 2 is a self-contained commit that can be reverted in isolation.
- **Measure, don't guess.** For Phase 3 items (windowing rewrite), land behind an opt-in flag first and benchmark against a large reference book before making it the default.

## Baseline (already modernized)

For context — these are already in use and should not be disturbed:

- `ResizeObserver`, `MutationObserver` (contents.ts)
- `OffscreenCanvas`, `Intl.Segmenter` (text-measurer.ts)
- `WeakMap`/`WeakRef`-style caches (text-measurer.ts)
- `IndexedDB` via raw API (store.ts)
- `fetch` (request.ts)
- `TextDecoder`, `document.fonts.ready`

## Discovery summary

Opportunities ranked by (impact × safety). Full rationale in the original discovery session; this plan focuses on *what to do* rather than *why it's good*.

| # | API / Feature | Area | Impact | Risk | Phase |
|---|---|---|---|---|---|
| 1 | `pagehide` instead of `unload` (+ `e.persisted` guard) | default + continuous manager | Restores bfcache for all embedders | Requires `e.persisted` check — see 1.1 | 1 |
| 2 | `crypto.randomUUID()` | `utils/core.ts` `uuid()` | Tiny perf, cleaner | None | 1 |
| 3 | `queueMicrotask` | `utils/core.ts` `microTick` | Tiny perf | None | 1 |
| 4 | `{ passive: true }` scroll listeners | default + continuous manager | Removes scroll jank on touch | None | 1 |
| 5 | `Object.hasOwn`, `Array.at(-1)` | scattered | Readability | None | 1 |
| 6 | `Error` `cause` option | `EpubError` | Better diagnostics | Low | 1 |
| 7 | `AbortController` on `fetch` | `request.ts`, `section.ts`, view destroy | Saves bandwidth/CPU on rapid nav | Medium (plumbing) | 2 |
| 8 | `scrollend` event | default + continuous manager | Replaces timeout-based "stopped scrolling" detection | Low (with fallback) | 2 |
| 9 | `requestIdleCallback` | `locations.ts` generate loop | Non-blocking background work | Low (with fallback) | 2 |
| 10 | CSS `contain: layout paint` on `.epub-view` | `iframe.ts` container | Isolates reflow between views | Low | 2 |
| 11 | `Promise.withResolvers()` | replace `defer` class | Code deletion | Low | 2 |
| 12 | `IntersectionObserver` windowing | `ContinuousViewManager.update/check` | Eliminates manual visibility math | High | 3 |
| 13 | CSS `content-visibility: auto` | view container | Skips paint/layout of off-screen sections | High (measurement interaction) | 3 |
| 14 | Native CSS scroll-snap | replace `Snap` helper | Deletes ~374 lines, better feel | High (touch parity) | 3 (optional) |

---

## Phase 1 — Zero-risk drop-ins

**Goal:** land eight independent commits, each under ~20 lines, none changing observable behavior.

### 1.1 Replace `unload` with `pagehide`
**Files:** `src/managers/default/index.ts:176,200`, `src/managers/continuous/index.ts:426,473`

- Change the event name from `"unload"` to `"pagehide"` for both `addEventListener` and `removeEventListener`.
- **The handler MUST guard on `event.persisted` and skip `destroy()` when the page is entering bfcache.** Managers are not automatically rebuilt on `pageshow` — the embedding application would have to re-invoke `rendition.display()`, which no code does. Destroying unconditionally on `pagehide` would silently break every bfcache restore, defeating the whole point of moving off `unload`.
  ```ts
  this._onPageHide = (e: PageTransitionEvent): void => {
      if (e.persisted) return; // entering bfcache — leave manager alive
      this.destroy();
  };
  ```
- Rename `_onUnload` → `_onPageHide` and tighten its type to `PageTransitionEvent` while you're in the file. `_onUnload` is internal only (no public API surface).

**Why it matters:** any page listening to `unload` is excluded from bfcache in Chrome, Safari, and Firefox. Embedders of this library currently cannot get instant back/forward navigation. This is the single highest user-visible impact change in the whole plan.

**Test plan:**
- Existing tests shouldn't reference the event name; verify with `rg "unload" test/`.
- Add a unit test that `destroy()` runs when a `pagehide` event is dispatched on `window` after `render()`.

**Rollback:** Trivial one-line revert.

---

### 1.2 `crypto.randomUUID()` with fallback
**Files:** `src/utils/core.ts:16-35`

Cache the capability check at module load — following the existing `_URL` pattern on the same file — so `uuid()` (called for every view and stage construction) doesn't re-evaluate `typeof` on every call:

```ts
const _randomUUID: (() => string) | undefined =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID.bind(crypto)
        : undefined;

export function uuid(): string {
    if (_randomUUID) return _randomUUID();
    // existing Math.random fallback
}
```

`.bind(crypto)` preserves the receiver, since `crypto.randomUUID` is a method.

**Why it matters:** existing implementation uses `Math.random()`, which is fine for IDs but `crypto.randomUUID()` is faster and collision-safe. Non-secure contexts (http://) fall through to the existing code.

**Test plan:** existing `uuid()` callers (view IDs, stage IDs) already test for uniqueness indirectly. Add a format-regex test for the output.

---

### 1.3 `queueMicrotask` in `microTick`
**Files:** `src/utils/core.ts:10`

```ts
export const microTick: (cb: FrameRequestCallback) => number =
    (cb) => { queueMicrotask(() => cb(performance.now())); return 0; };
```

**Why it matters:** avoids an unnecessary Promise allocation on every tick. `queueMicrotask` is universal since 2018 (Chrome 71, Safari 12.1, Firefox 69). No fallback needed.

**Test plan:** `locations.ts` uses `microTick` as the queue ticker — the locations test suite exercises this heavily.

---

### 1.4 Passive scroll listeners
**Files:** `src/managers/default/index.ts:188`, `src/managers/continuous/index.ts:454`, `src/managers/helpers/snap.ts:144`

Change:
```ts
scroller.addEventListener("scroll", this._onScroll);
```
to:
```ts
scroller.addEventListener("scroll", this._onScroll, { passive: true });
```

Per DOM spec, `removeEventListener` only needs matching `capture`; `passive` is a hint the browser ignores on removal. Leave removal calls as-is.

**Why it matters:** none of the scroll handlers call `preventDefault()`, so they're *logically* passive. Marking them explicitly lets Chrome/Safari run scrolling on the compositor thread without a JS round-trip, reducing scroll jank on touch devices.

**Careful point:** don't miss `snap.ts:144` — it's a third scroll listener that already has passive touch listeners on the same scroller but scroll itself was non-passive.

**Test plan:** no behavior change expected. Spot-check with a large continuous book in the `examples/` folder manually if possible.

---

### 1.5 `Object.hasOwn` and `Array.at(-1)` cleanups
**Files:**
- `src/managers/views/iframe.ts:441` — `this.marks.hasOwnProperty(m)` → `Object.hasOwn(this.marks, m)`
- `src/managers/helpers/stage.ts:318` — `set.hasOwnProperty(prop)` → `Object.hasOwn(set, prop)`
- `src/themes.ts:83,169,243` — three call sites in `registerThemes`, `inject`, `overrides`
- `src/epubcfi.ts:918` — `toTextRange` child step matching
- `src/utils/mime.ts:145,148` — MIME table initialization loops
- `src/managers/default/index.ts:750` — `visible[visible.length-1]!` → `visible.at(-1)!`
- `src/managers/continuous/index.ts:363-364` — `displayed[displayed.length-1]!` → `displayed.at(-1)!`

**Prerequisite (one-time):** `tsconfig.json` `lib` must include `ES2022` for `Object.hasOwn` and `Array.prototype.at` type definitions. `target` stays at `ES2020` — the lib bump only enables type info, not emit syntax.

**Skip list:** `src/marks-pane/index.ts` uses `hasOwnProperty` twice but the file header marks it as inlined from an upstream library; don't diverge.

**Why it matters:** purely cosmetic; batch into a single `refactor:` commit (plus the separate `chore: bump tsconfig lib to ES2022` prerequisite commit if you want a clean history). `Object.hasOwn` and `Array.at()` are both universal since 2022 (Chrome 92/Safari 15.4 for `.at`, Chrome 93/Safari 15.4 for `Object.hasOwn`) — within the library's existing baseline.

**Test plan:** type-checker is sufficient.

---

### 1.6 `Error` `cause` for `EpubError`
**Files:** `src/utils/core.ts:397-404`, `src/utils/request.ts:33,38`

Extend `EpubError`:
```ts
export class EpubError extends Error {
    status?: number;
    constructor(message: string, status?: number, options?: { cause?: unknown }) {
        super(message, options);
        this.name = "EpubError";
        this.status = status;
    }
}
```

Then:
```ts
throw new EpubError((e as Error).message || "Network Error", 0, { cause: e });
```

**Why it matters:** preserves the original stack when wrapping fetch failures. No behavior change for catch blocks that only read `.message` / `.status`.

**Test plan:** add one assertion: `expect(thrown.cause).toBeInstanceOf(TypeError)` when fetch rejects.

---

## Phase 2 — Isolated enhancements with capability detection

**Goal:** five feature-flagged improvements, each behind a runtime capability check with the Phase-0 code as fallback.

### 2.1 `Promise.withResolvers()` with fallback
**Files:** `src/utils/core.ts:598-609` + every import site.

Keep the `defer<T>` class as-is but make its constructor delegate to `Promise.withResolvers()` when available:

```ts
export class defer<T = unknown> {
    resolve!: (value: T | PromiseLike<T>) => void;
    reject!: (reason?: unknown) => void;
    promise: Promise<T>;

    constructor() {
        if (typeof (Promise as unknown as { withResolvers?: () => unknown }).withResolvers === "function") {
            const { promise, resolve, reject } =
                (Promise as unknown as { withResolvers: <U>() => { promise: Promise<U>; resolve: (v: U | PromiseLike<U>) => void; reject: (r?: unknown) => void } }).withResolvers<T>();
            this.promise = promise;
            this.resolve = resolve;
            this.reject = reject;
            return;
        }
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
```

This keeps the class name and every call site untouched. Simplest possible delta.

**Why it matters:** small perf win (skips the extra closure allocation); signals API intent. Universal in Chrome 119 / Safari 17.4 / Firefox 121 (late 2024), so fallback is essential through ~2026.

**Test plan:** existing defer users (Queue, managers, iframe load, locations) indirectly cover this. No new tests required.

**Rollback:** revert the constructor body; class name unchanged.

---

### 2.2 `AbortController` for cancellable requests
**Files:** `src/utils/request.ts`, `src/section.ts`, `src/managers/views/iframe.ts` (in `destroy()`), `src/types.ts` (`RequestFunction` signature)

**Scope:**
- Add optional `signal?: AbortSignal` parameter as the *last* argument of `request()`. Existing callers compile unchanged.
- Thread a new optional `signal` through `Section.render()` / `Section.load()`.
- Store an `AbortController` on `IframeView` at the start of `render()`, and call `controller.abort()` in `destroy()`.
- Update the `RequestFunction` type to include the optional signal at the end.

**Careful points:**
- `Archive.request()` and `Store.request()` are drop-in replacements for `request()` — they also need to accept and ignore the signal (archives are sync, stores don't use fetch).
- Aborted requests throw `DOMException: AbortError`. The view's render chain currently catches errors via `loaderror` — verify the abort does not emit `loaderror` for intentional cancellation. Use `if (signal?.aborted || (e as Error).name === "AbortError") return;` in the catch.
- Do not add a signal parameter where one isn't needed — keep the rest of the call sites unchanged.

**Why it matters:** on rapid page navigation (especially mobile flicking), the current code downloads every section the user swipes past, even sections already scrolled off. Aborting in-flight fetches reclaims bandwidth and CPU.

**Test plan:**
- Unit test: mock `fetch` to resolve after a delay; call `request(url, undefined, undefined, undefined, signal)`, abort immediately, assert it rejects with `AbortError`.
- Integration test: create an `IframeView`, call `destroy()` before `render()` resolves, assert no `loaderror` is emitted and no `contents` is assigned.
- Regression: all existing request tests must still pass with no signal supplied.

**Rollback:** revert the chain; the signal parameter is optional everywhere so intermediate states are safe.

---

### 2.3 `scrollend` event with fallback
**Files:** `src/managers/default/index.ts:1000-1035`, `src/managers/continuous/index.ts:477-544`

**Scope:**
- At listener setup time, feature-detect: `"onscrollend" in window` (or `typeof document.onscrollend !== "undefined"`).
- When available: attach a `scrollend` listener that emits `SCROLLED` directly. Remove the `setTimeout(..., 20)` / `setTimeout(..., 150)` fallback path in that branch.
- When unavailable: keep the existing timeout code verbatim as fallback.

**Careful points:**
- The continuous manager's `onScroll` does double duty: it updates `scrollDeltaVert/Horz` AND sets a separate 150ms timer to reset them. The 150ms timer is unrelated to "stopped scrolling" — it's delta accumulation reset. Only the `afterScrolled` emission path should be moved to `scrollend`.
- The `snapper.supportsTouch() && snapper.needsSnap()` gate before emitting `SCROLLED` must still apply on the `scrollend` path.
- Test with touch momentum scrolling — `scrollend` fires after momentum, which is *better* than the timer but produces different timing. Update tests that assert timing only if any exist.

**Why it matters:** the 20ms/150ms constants are arbitrary and wrong for momentum scroll on iOS. The native event is authoritative.

**Test plan:**
- Unit test both branches by mocking `"onscrollend" in window`.
- Verify `SCROLLED` is emitted exactly once per scroll gesture on each branch.

**Rollback:** remove the feature-detect branch; fallback is already the current code.

---

### 2.4 `requestIdleCallback` for `Locations.generate()`
**Files:** `src/locations.ts:110-113`

Current:
```ts
return new Promise<string[]>((resolve) => {
    this.processingTimeout = setTimeout(() => resolve(locations), this.pause);
});
```

Proposed:
```ts
return new Promise<string[]>((resolve) => {
    const schedule = typeof requestIdleCallback === "function"
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: (this.pause ?? 0) + 50 })
        : (cb: () => void) => setTimeout(cb, this.pause);
    schedule(() => resolve(locations));
});
```

**Why it matters:** lets the browser interleave location generation with user scrolling. `requestIdleCallback` is in Chrome/Firefox since 2016 and Safari 17.4 (Mar 2024). The `timeout` ensures it doesn't starve if the main thread is busy.

**Careful points:**
- Keep `this.processingTimeout` around for `destroy()` cleanup, but store the idle-callback handle in it instead. Teardown needs `cancelIdleCallback` vs `clearTimeout` branching.
- Don't conflate this with `scheduler.postTask` — that's Chrome-only and not worth the complexity.

**Test plan:** existing locations test suite exercises `generate()` extensively. Should pass unchanged; optionally add a mock that verifies `requestIdleCallback` is called when available.

---

### 2.5 CSS `contain: layout paint` on `.epub-view`
**Files:** `src/managers/views/iframe.ts:118-137` (`container()` method)

Add one line in the container setup:
```ts
element.style.contain = "layout paint";
```

**Why it matters:** in continuous mode, each view is a sibling flex item. Without containment, a reflow inside one view can cascade into sibling measurement. `contain: layout paint` creates a containment boundary, reducing the cost of internal reflows during rendering and iframe load. Universal since 2020.

**Careful points:**
- **Do not use `contain: size`** — that fixes the element to its intrinsic size, breaking the `expand()` logic that reads `scrollWidth`/`scrollHeight` from the iframe document.
- Verify manually that annotations, CFI mapping, and scroll positions remain correct on a reference book.
- If any test snapshots layout numbers that depend on siblings influencing each other (unlikely), update them.

**Test plan:** full existing suite must pass. Visual check on a long book is wise.

**Rollback:** delete one line.

---

## Phase 3 — Architectural changes (opt-in first)

**Goal:** larger refactors that delete code but require benchmarking and visual verification. Land behind an opt-in setting (`settings.useIntersectionObserver`, `settings.useContentVisibility`) so users can validate before switchover.

### 3.1 `IntersectionObserver`-based windowing for continuous manager
**Files:** `src/managers/continuous/index.ts`

**Approach:**
- Gate the entire new path behind `options.settings?.useIntersectionObserver === true` initially. Default `false`.
- When enabled: create an `IntersectionObserver` in `addEventListeners`, with `root: this.settings.fullsize ? null : this.container`, and `rootMargin` = `${this.settings.offset}px` on all sides.
- Observe every view element as it is created in `add`/`append`/`prepend`.
- Replace the body of `check()` with logic driven by observer callbacks: on `isIntersecting` transitions, append/prepend new neighbors; on exit, trim.
- Keep the scroll handler for `scrollTop`/`scrollLeft` tracking and the `SCROLL` event; only visibility logic moves.
- Unobserve in `erase()`.
- Disconnect in `destroy()`.

**Careful points:**
- `rootMargin` must be kept in sync if `settings.offset` changes dynamically.
- `visible()` and `currentLocation()` still need `getBoundingClientRect`-based measurement — `IntersectionObserver` only replaces the *trigger*, not the position data.
- The existing `check()`/`update()`/`fill()` interface is called from `display()`, `next()`, `prev()`. Those must still complete deterministically — observer callbacks are async, so `fill()` may need a promise that resolves when the observer fires an `isIntersecting: false` for the edges (i.e., windowing complete).
- On initial display, views aren't yet in the DOM when added — the observer won't fire until after layout. Use an initial `requestAnimationFrame` → `check()` bootstrap to seed the window.

**Why it matters:** eliminates `isVisible()` forced reflows (which call `view.position()` → `getBoundingClientRect()` per view per scroll event) and removes the debounce timer. For a 30-section book, that's ~30 layout calls every 30ms dropped to zero.

**Test plan:**
- Add a new test file `test/continuous-intersection.test.ts` mirroring the existing continuous manager tests but with the setting enabled.
- Run both test suites in CI. Both must pass before switching the default.
- Benchmark: load a reference book with N=200 sections, measure cumulative scroll time. Document results in `PROJECT_STATUS.md` under "Performance optimizations".
- Only after benchmarks show no regression (and ideally >20% scroll CPU reduction) should the default flip to `true`.

**Rollback:** flag-gated; set default back to `false`. The legacy path is untouched.

---

### 3.2 CSS `content-visibility: auto` on view containers
**Files:** `src/managers/views/iframe.ts` (`container()`)

**Approach:**
- Gate behind `options.settings?.useContentVisibility`.
- When enabled, set:
  ```ts
  element.style.contentVisibility = "auto";
  element.style.containIntrinsicSize = `${this.settings.height}px ${this.settings.width}px`;
  ```
  on the `.epub-view` element.
- Update `contain-intrinsic-size` whenever `reframe` changes dimensions.

**Careful points:**
- `content-visibility: auto` forces the element into `contain: size layout paint style`. Reading `scrollWidth`/`scrollHeight` through it returns the intrinsic size, not the real content size. Since `expand()` reads from the iframe's document, not the view element, this should be fine — but verify.
- `getBoundingClientRect` on hidden (skipped) elements returns stale-but-correct bounds in modern browsers, but scroll offsets may be affected. Mapping and CFI navigation need verification.
- Pairs naturally with 3.1 — both target the windowing use case.
- Safari only supports this from version 18 (Sep 2024). Feature-detect with `CSS.supports("content-visibility", "auto")`.

**Test plan:** full suite + visual check on long book. The CFI round-trip tests are the most sensitive to layout changes and should all still pass.

**Rollback:** flag-gated.

---

### 3.3 Native CSS scroll-snap (optional, deferred)
**Files:** `src/managers/helpers/snap.ts` and users of `Snap` in `continuous/index.ts`

**Approach:** long-term investigation, not scheduled. Would replace the manual touch-tracking + rAF easing loop with `scroll-snap-type: x mandatory` + `scroll-snap-align: start` on page-sized child elements. Large behavioral test matrix (RTL, vertical, touch cancel, momentum) required.

**Not in scope for this plan.** Track as a research ticket; revisit after Phase 1–2 are merged.

---

## Execution order and commit strategy

Each numbered section below is one commit. Run `npm test && npm run typecheck && npm run lint` before each commit.

### Phase 1 commits (independent, land in any order)
1. `fix: use pagehide instead of unload to restore bfcache` (1.1)
2. `refactor: prefer crypto.randomUUID when available` (1.2)
3. `refactor: use queueMicrotask in microTick` (1.3)
4. `refactor: mark scroll listeners passive` (1.4)
5. `refactor: use Object.hasOwn and Array.at` (1.5)
6. `feat: preserve error cause in EpubError` (1.6)

### Phase 2 commits (in this order due to shared files)
7. `refactor: delegate defer to Promise.withResolvers when available` (2.1)
8. `feat: support AbortSignal in request and view lifecycle` (2.2) — largest commit; split into `feat: thread AbortSignal through request` + `feat: cancel view requests on destroy` if it gets unwieldy
9. `feat: use scrollend event when available` (2.3)
10. `perf: schedule locations generation on idle callback when available` (2.4)
11. `perf: contain layout and paint on view elements` (2.5)

### Phase 3 commits (opt-in, behind settings flag)
12. `feat: optional IntersectionObserver-based windowing in continuous manager` (3.1)
13. `feat: optional content-visibility for view elements` (3.2)

Do not flip the Phase 3 defaults in the same PR that introduces them. Ship, benchmark, then flip in a separate commit with benchmark numbers in `PROJECT_STATUS.md`.

## Success criteria

- **Phase 1:** all existing tests pass; no new test failures; `unload` grepping returns zero results outside `Section.unload()` naming.
- **Phase 2:** `AbortError` never surfaces as `loaderror`; `scrollend` and `requestIdleCallback` paths covered by unit tests; benchmark shows no regression on a small reference book.
- **Phase 3:** benchmark on a ≥100-section book shows measurable reduction in scroll-path CPU time (`performance.measure` on `update()` / visibility callbacks) before defaults flip.

## Out of scope (documented non-goals)

- Replacing JSZip with Compression Streams API — too large, needs a separate investigation.
- Replacing the custom `EventEmitter` with native `EventTarget` — breaks epubjs API compatibility.
- View Transitions API for page flips — Chrome-first and iframe semantics don't fit cleanly.
- `structuredClone` in `extend()`/`defaults()` — the shallow semantics are deliberate.
- `Element.checkVisibility()` — lacks the `offsetPrev`/`offsetNext` lookahead the managers need.
