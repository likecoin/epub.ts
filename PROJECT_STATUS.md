# Project Status

## Current Stage: C (Improvements)

### Stage A: Build + Tests
- [x] A1: Replace webpack+babel+karma with vite+vitest
- [x] A2: Convert tests to Vitest

### Stage B: TypeScript Conversion
- [x] B0a: Replace event-emitter with inline typed emitter
- [x] B0b: Inline marks-pane
- [x] B1: Level 0 leaf utilities
- [x] B2: Level 1 simple dependents
- [x] B3: Level 2 modules
- [x] B4: Level 3 modules
- [x] B5: Level 4-5 managers + rendition
- [x] B6: Level 6 top-level modules, remove types/

### Stage C: Improvements
- [x] Enable `noImplicitAny` (270 implicit-any params annotated)
- [x] Replace ~528 explicit `any` with proper types (~64 remain across 22 files)
- [x] Type all public APIs (no `any` in user-facing signatures)
- [x] Fix CSS injection vulnerability (use `textContent` instead of `innerHTML` for style elements)
- [x] Fix dangerous URL scheme handling (strip `javascript:` and `data:text/html` hrefs)
- [x] Enable `strictNullChecks` (476 errors fixed across 30 files)
- [x] Full `strict: true` (377 errors fixed: strictPropertyInitialization 120, noImplicitThis 251, others 6)
- [x] ESLint + TS plugin (0 errors, 0 warnings)
- [x] GitHub Actions CI
- [x] Replace `localforage` with native IndexedDB wrapper
- [x] Replace `@xmldom/xmldom` with browser-native DOMParser
- [x] Add `"sideEffects": false` to package.json (enables better tree-shaking for consumers)
- [x] Node.js import support (guard `window` at module scope)
- [x] Node.js parsing-only entry point (`@likecoin/epub-ts/node` with `linkedom` peer dep)
- [x] Improve test coverage (12 test files, 181 tests for 42 source files)
- [x] Reduce remaining `any` types (~82 → 21; 61 removed across 21 files, 21 intentionally kept: 14 event emitter pattern, 7 annotations.ts user data)
- [x] Replace `Function` types with proper signatures (~33 removed across 6 files; 0 remaining in code, 3 in JSDoc comments)
- [x] Reduce non-null assertions via definite assignment (~22 removed across `rendition.ts` and `book.ts`)

---

## Build Output

| Format | File | Size | Notes |
|--------|------|------|-------|
| ESM | `dist/epub.js` | ~343KB | Primary import for modern bundlers |
| CJS | `dist/epub.cjs` | ~211KB | `require()` support |
| UMD | `dist/epub.umd.js` | ~211KB | `<script>` tag / CDN usage |
| Node ESM | `dist/epub.node.js` | ~233KB | `@likecoin/epub-ts/node` for Node.js |
| Node CJS | `dist/epub.node.cjs` | ~150KB | `require("@likecoin/epub-ts/node")` |
| Types | `dist/*.d.ts` | — | Generated from source via `vite-plugin-dts` |

All formats are single-file bundles. `preserveModules` was considered for ESM but provides minimal benefit since `Book` imports nearly the entire dependency graph.

---

## Dependency Status

| Dep | Status | Notes |
|---|---|---|
| `core-js` | ✅ Removed (A1) | Babel polyfills, not needed with Vite |
| `lodash` | ✅ Removed (A1) | throttle/debounce replaced with native |
| `path-webpack` | ✅ Removed (A1) | Replaced with inline path utils |
| `event-emitter` | ✅ Removed (B0a) | Replaced with inline typed emitter |
| `marks-pane` | ✅ Removed (B0b) | Inlined as src/marks-pane/ |
| `jszip` | ✅ Keep | Core dependency (ZIP handling) |
| `localforage` | ✅ Removed (C) | Replaced with native IndexedDB wrapper (~30 lines) |
| `@xmldom/xmldom` | ✅ Removed (C) | Replaced with native DOMParser and XMLSerializer |

---

## Test Status

| Test | Status | Notes |
|---|---|---|
| core.test.ts | ✅ 19 passing | All, including file URL and directory-with-dot tests |
| epubcfi.test.ts | ✅ 27 passing | |
| locations.test.ts | ✅ 1 passing | |
| epub.test.ts | ✅ 2 passing | Unarchived + archived open |
| book.test.ts | ✅ 18 passing | Unarchived, archived, ArrayBuffer, no-cover, sub-object parity |
| section.test.ts | ✅ 4 passing | find() + search(), including cross-node spans |
| packaging.test.ts | ✅ 29 passing | Metadata, manifest, spine, paths, edge cases, EPUB2 fallbacks |
| navigation.test.ts | ✅ 20 passing | Alice TOC, get(), NCX, nested nav, landmarks |
| container.test.ts | ✅ 8 passing | Standard/nested/root paths, errors, destroy |
| layout.test.ts | ✅ 26 passing | Constructor, flow, spread, calculate, count |
| displayoptions.test.ts | ✅ 8 passing | Parse all fields, missing, empty, destroy |
| spine.test.ts | ✅ 19 passing | Unpack, get, first/last, each, append/remove |
| node.test.ts | ✅ 10 passing | Node.js entry point: open, metadata, spine, navigation, render |

**Total: 191 tests passing**

---

## Comparison with epubjs

| Aspect | epub.ts | epubjs |
|--------|---------|--------|
| Language | TypeScript (strict mode) | JavaScript |
| Build | Vite | webpack + Babel |
| Tests | Vitest | Karma + Mocha |
| Type definitions | Generated from source | Hand-written `.d.ts` |
| Dependencies | 1 (`jszip`) | 7+ (`core-js`, `lodash`, `event-emitter`, etc.) |
| API compatibility | 100% (drop-in replacement) | — |
| Bundle format | ESM + CJS + UMD | UMD |
| Maintenance | Active | Inactive since 2022 |

---

## Known Limitations

- **Node.js parsing-only support** — `@likecoin/epub-ts/node` entry point provides metadata, spine, navigation, and section rendering via `linkedom`; no browser rendering
- **Single-file ESM bundle** — `Book` imports nearly everything, so `preserveModules` wouldn't help much
- **21 `any` types remain** — intentionally kept: 14 in event emitter callback signatures (requires generic typed-emitter refactor), 7 in `annotations.ts` (public API `Record<string, any>` for user data)
- **0 `Function` types in code** — all 33 replaced with `HookCallback`, `ViewManagerConstructor`, `ViewConstructor`, `EventListener`, or typed function signatures

---

## Priority Next Steps

### High Priority
1. ~~Node.js parsing-only entry point (no rendering)~~ Done
2. Improve test coverage — untested: Rendition, Contents, Archive, PageList, all view managers

### Medium Priority
3. Explore splitting `Book` dependency graph for better tree-shaking
