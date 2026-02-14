# Changelog

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
