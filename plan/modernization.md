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

## Baseline gaps (pre-2016 legacy still present)

The baseline list above only counts APIs adopted *additively*. Several places in the code still carry **pre-2016 legacy code paths and fallback branches** that target browsers no longer in the support matrix (IE ≤10, pre-Chrome 41, pre-Safari 9). These are not "modernizations" in the Phase 1–3 sense — they are dead code removals and ES2015/ES2016 idioms that the original epub.js couldn't use because it polyfilled `requestAnimationFrame`. Phase 0.5 addresses them.

## Discovery summary

Opportunities ranked by (impact × safety). Full rationale in the original discovery session; this plan focuses on *what to do* rather than *why it's good*.

| # | API / Feature | Area | Impact | Risk | Phase |
|---|---|---|---|---|---|
| 0a | Delete unreachable `Math.random` uuid fallback | `utils/core.ts` | Dead code removal | None | 0.5 |
| 0b | Delete `document.createEvent("MouseEvents")` fallback | `marks-pane/index.ts` | Dead code removal | None | 0.5 |
| 0c | `String.includes` / `startsWith` / `endsWith` / `Array.includes` | scattered | Readability, intent clarity | None | 0.5 |
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

## Phase 0.5 — Pre-2016 legacy cleanup

**Status:** ✅ Landed. All three sub-items implemented; 993/993 tests passing; `typecheck` and `lint` clean.

**Goal:** delete dead fallback branches and convert pre-ES2016 idioms. Every item here is either a pure deletion or a literal 1:1 rename with no behavior change. Land before Phase 1 so the Phase 1 diffs touch less surrounding noise.

**Browser floor assumed:** Chrome 87+ / Safari 15.4+ / Firefox 78+ (the library's existing baseline, set by `Intl.Segmenter`). All APIs used below shipped well before that floor:

- `String.prototype.includes` / `startsWith` / `endsWith` — ES2015, Chrome 41 / Safari 9 (2015)
- `Array.prototype.includes` — ES2016, Chrome 47 / Safari 9 (2015)
- `new MouseEvent()` constructor — IE 11 / Chrome 15 / Safari 6
- `crypto.randomUUID()` — Chrome 92 / Safari 15.4 / Firefox 95

### 0.5.1 Delete unreachable `uuid()` fallback ✅
**Files:** `src/utils/core.ts:17-39`

Phase 1.2 is already landed — `_randomUUID` is cached at module load and `uuid()` prefers it. The `Math.random` + `new Date().getTime()` fallback branch beneath it is now unreachable on any browser this library claims to support (`crypto.randomUUID` is available everywhere above Chrome 92 / Safari 15.4, and `crypto` itself has been universal since Chrome 11 / Safari 5.1).

**Change:**
```ts
const _randomUUID: () => string =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID.bind(crypto)
        : (() => { throw new Error("crypto.randomUUID unavailable"); });

export function uuid(): string {
    return _randomUUID();
}
```

Or, even simpler — drop the capability check entirely and rely on the type system:
```ts
export const uuid = (): string => crypto.randomUUID();
```

**Careful points:**
- `crypto.randomUUID` requires a **secure context** (`https://`, `localhost`, or `file://`). The library does not document an insecure-context use case, and the test suite runs under `http://localhost` (secure). Verify by grepping tests for `uuid(` calls and running the suite after deletion.
- Node.js has `crypto.randomUUID()` on `globalThis.crypto` since Node 19 (and on `require("crypto")` since Node 14.17). The `src/node.ts` entry point already assumes a modern Node — no extra shim needed.

**Why it matters:** removes ~10 lines of legacy code and one `new Date().getTime()` call (the only one in the codebase if grep is right). The fallback was never going to execute.

**Test plan:** run the existing suite. Uniqueness of `uuid()` output is exercised indirectly via view/stage IDs.

**Rollback:** re-inline the old fallback. Single-function scope.

---

### 0.5.2 Delete `document.createEvent("MouseEvents")` fallback in marks-pane ✅
**Files:** `src/marks-pane/index.ts:53-66`

Current:
```ts
function cloneEvent(e: MouseEvent | TouchEvent): MouseEvent {
    const opts = Object.assign({}, e, { bubbles: false }) as MouseEventInit;
    try {
        return new MouseEvent(e.type, opts);
    } catch (_err) {
        const me = e as MouseEvent;
        const copy = document.createEvent("MouseEvents");
        copy.initMouseEvent(e.type, false, me.cancelable, me.view!,
            me.detail, me.screenX, me.screenY,
            me.clientX, me.clientY, me.ctrlKey,
            me.altKey, me.shiftKey, me.metaKey,
            me.button, me.relatedTarget);
        return copy;
    }
}
```

The `catch` branch exists only for IE ≤10, which lacks the `MouseEvent` constructor. Every browser in the library's baseline supports `new MouseEvent()`. The 14-argument `initMouseEvent` API has been deprecated in the spec for over a decade.

**Change:** delete the `try/catch`, keep only the constructor path. While here, the `Object.assign({}, e, { bubbles: false })` dance is also legacy — `MouseEventInit` accepts a small subset of properties, and `Object.assign` over a DOM event copies host-defined slots that the constructor will ignore. A tighter version:
```ts
function cloneEvent(e: MouseEvent): MouseEvent {
    return new MouseEvent(e.type, {
        bubbles: false,
        cancelable: e.cancelable,
        view: e.view,
        detail: e.detail,
        screenX: e.screenX,
        screenY: e.screenY,
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        button: e.button,
        relatedTarget: e.relatedTarget,
    });
}
```

**Careful points:**
- The plan's 1.5 "skip list" marks `src/marks-pane/index.ts` as inlined from upstream. **This is an explicit exception to that rule** — deleting dead IE fallback code is not a divergence worth preserving upstream parity for. Note it in the commit message.
- The signature currently accepts `MouseEvent | TouchEvent`. Check the call site: if it's only called with real `MouseEvent` instances (the `cloneEvent` name suggests so), tighten the type; if `TouchEvent` can be passed, keep the union and handle it.
- This function is called from the highlight/underline hit-testing path in `Pane`. A behavioral regression would show up as click-through or misrouted mark clicks. Manual smoke test on a book with highlights after landing.

**Test plan:** run existing `test/` suite (marks/annotations tests should cover this indirectly). If no direct coverage, add one test that constructs a `Pane`, dispatches a `click`, and asserts the cloned event has the expected `clientX/clientY`.

**Rollback:** restore the `try/catch`. Self-contained.

---

### 0.5.3 `String.includes` / `startsWith` / `endsWith` and `Array.includes` ✅
**Files:** batched across the codebase.

Convert `indexOf(...) > -1`, `indexOf(...) !== -1`, and `indexOf(...) === 0` idioms to the intent-specific methods **only where the index value is discarded**. Keep `indexOf` where the returned position is used (e.g. `spineItems.indexOf(section)` at `spine.ts:213`, `views.indexOf(view)` in `helpers/views.ts`).

**String `indexOf → startsWith`:**
| File:line | Current | Replace with |
|---|---|---|
| `src/epubcfi.ts:117` | `cfiStr.indexOf("epubcfi(") === 0 && cfiStr[cfiStr.length-1] === ")"` | `cfiStr.startsWith("epubcfi(") && cfiStr.endsWith(")")` |
| `src/epubcfi.ts:1024` | `str.indexOf("epubcfi(") === 0` | `str.startsWith("epubcfi(")` |
| `src/spine.ts:152` | `target.indexOf("#") === 0` | `target.startsWith("#")` |
| `src/navigation.ts:98` | `target.indexOf("#") === 0` | `target.startsWith("#")` |
| `src/contents.ts:1083` | `writingMode.indexOf("vertical") === 0` | `writingMode.startsWith("vertical")` |
| `src/managers/views/iframe.ts:232,234,237` | `writingMode.indexOf("vertical") === 0` ×3 | `writingMode.startsWith("vertical")` |
| `src/utils/replacements.ts:83` | `href.indexOf("mailto:") === 0` | `href.startsWith("mailto:")` |

**String `indexOf → includes`:**
| File:line | Current | Replace with |
|---|---|---|
| `src/book.ts:432` | `path.indexOf("://") > -1` | `path.includes("://")` |
| `src/utils/path.ts:18-19` | `const protocol = pathString.indexOf("://"); if (protocol > -1) {...}` | `if (pathString.includes("://")) {...}` (drop the intermediate) |
| `src/utils/path.ts:84` | `what.indexOf("://") > -1` | `what.includes("://")` |
| `src/utils/url.ts:24,95` | `indexOf("://") > -1` | `.includes("://")` |
| `src/utils/replacements.ts:7,93` | `indexOf("://") > -1` | `.includes("://")` |
| `src/utils/core.ts:87` | `n.indexOf(".") > -1` | `n.includes(".")` |
| `src/contents.ts:695` | `target.indexOf("#") > -1` | `target.includes("#")` |

**Array `indexOf → includes`:**
| File:line | Current | Replace with |
|---|---|---|
| `src/utils/core.ts:373` | `["xml","opf","ncx"].indexOf(ext) > -1` | `["xml","opf","ncx"].includes(ext)` |
| `src/themes.ts:171` | `links.indexOf(theme.url) === -1` | `!links.includes(theme.url)` |

**Special case — `src/pagelist.ts:138`:** the variable name (`isCfi`) lies about its type (it holds a numeric index, then checks `!== -1`), but the behavior is **correct**. Investigation confirmed this is not a latent bug. Convert for clarity:
```ts
// Before
isCfi = href.indexOf("epubcfi");
// ...
if (isCfi !== -1) { ... }

// After
hasCfi = href.includes("epubcfi");
// ...
if (hasCfi) { ... }
```
Rename the local to match its new type. Two-line change, pure readability win.

**Deliberately NOT changed:**
- `src/epubcfi.ts:755,758,782` — `Array.from(children).indexOf(anchor)` returns the child **index**, used downstream. Keep.
- `src/spine.ts:213` — `this.spineItems.indexOf(section)` returns the index. Keep.
- `src/managers/helpers/views.ts:29-30,75` — `_views.indexOf(view)` returns the index. Keep.
- `src/resources.ts:201,299` — `indexInUrls` is used as an index. Keep.
- `src/pagelist.ts:230` — `this.pages.indexOf(pg)` returns the index. Keep.
- `src/section.ts:121,175,240`, `src/mapping.ts:721,737`, `src/contents.ts:647` — all use the returned position. Keep.
- `src/marks-pane/index.ts:160,253,259` — upstream-inlined file; apply the plan's general skip rule (exception 0.5.2 is for dead code deletion only).
- `src/utils/core.ts:192,215,217` — `indexOfSorted` is the library's own exported API. Keep.

**Careful points:**
- Do a final grep after the rename: `rg 'indexOf\(.*\)\s*(===|!==|>)\s*-?[01]'` should return only the intentional keeps listed above.
- `tsconfig.json` `lib` needs `ES2016` for `Array.prototype.includes` types. Per Phase 1.5, the `lib` bump to `ES2022` (for `Object.hasOwn` / `Array.at`) already covers this — sequence the `lib` bump commit before 0.5.3 if Phase 1.5 hasn't landed yet.

**Why it matters:** intent clarity. A reader of `href.indexOf("mailto:") === 0` has to mentally parse "indexOf returns -1 on miss and 0 when found at the start, so `=== 0` means starts-with". `href.startsWith("mailto:")` is the same code without the cognitive step. In a CFI parser and URL resolver where off-by-one bugs are painful, removing ambiguity is worth one batch commit.

**Test plan:** the type checker catches rename mistakes; the existing test suite covers all touched files. No new tests required. Run `npm run lint && npm run typecheck && npm test` before committing.

**Rollback:** single-commit revert is safe — every change is a 1:1 semantic equivalent.

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

### 1.2 `crypto.randomUUID()` with fallback ✅ (superseded by 0.5.1)
**Files:** `src/utils/core.ts:16-35`

**Status:** the capability-cached version landed pre-Phase-0.5, and the fallback was then deleted entirely in Phase 0.5.1. `uuid()` is now a one-liner returning `crypto.randomUUID()`.


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

### 1.3 `queueMicrotask` in `microTick` ✅
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

### Phase 0.5 commits ✅ landed
Landed as a single combined commit (matching the `🚀 Phase 1 browser platform modernization` precedent) rather than three separate refactor commits — the sub-items are cohesive enough that splitting across files (e.g. `core.ts` touched by both 0.5.1 and 0.5.3) adds friction with no rollback benefit.

Note: `tsconfig.json` `lib` was already bumped to `ES2022` before Phase 0.5, so the sequencing concern around the 1.5 lib bump is moot.

### Phase 1 commits (independent, land in any order)
1. `fix: use pagehide instead of unload to restore bfcache` (1.1)
2. ~~`refactor: prefer crypto.randomUUID when available` (1.2)~~ — **already landed** in `utils/core.ts:17-20`; the fallback is removed in Phase 0.5.1.
3. ~~`refactor: use queueMicrotask in microTick` (1.3)~~ — **already landed** in `utils/core.ts:10`.
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

- **Phase 0.5:** all existing tests pass; grep for `indexOf\(` on string literals returns only the intentional keeps (array/string position lookups); no `catch (_err)` around `new MouseEvent`; no `Math.random()` in `utils/core.ts`; `new Date().getTime()` returns zero results in `src/`.
- **Phase 1:** all existing tests pass; no new test failures; `unload` grepping returns zero results outside `Section.unload()` naming.
- **Phase 2:** `AbortError` never surfaces as `loaderror`; `scrollend` and `requestIdleCallback` paths covered by unit tests; benchmark shows no regression on a small reference book.
- **Phase 3:** benchmark on a ≥100-section book shows measurable reduction in scroll-path CPU time (`performance.measure` on `update()` / visibility callbacks) before defaults flip.

## Out of scope (documented non-goals)

- Replacing JSZip with Compression Streams API — too large, needs a separate investigation.
- Replacing the custom `EventEmitter` with native `EventTarget` — breaks epubjs API compatibility.
- View Transitions API for page flips — Chrome-first and iframe semantics don't fit cleanly.
- `structuredClone` in `extend()`/`defaults()` — the shallow semantics are deliberate.
- `Element.checkVisibility()` — lacks the `offsetPrev`/`offsetNext` lookahead the managers need.
