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
- [x] Replace ~528 explicit `any` with proper types (~100 remain where genuinely needed)
- [x] Type all public APIs (no `any` in user-facing signatures)
- [x] Enable `strictNullChecks` (476 errors fixed across 30 files)
- [x] Full `strict: true` (377 errors fixed: strictPropertyInitialization 120, noImplicitThis 251, others 6)
- [x] ESLint + TS plugin (0 errors, 0 warnings)
- [x] GitHub Actions CI
- [ ] Replace `localforage` with lighter IndexedDB wrapper
- [ ] Replace `@xmldom/xmldom` with browser-native DOMParser
- [x] Add `"sideEffects": false` to package.json (enables better tree-shaking for consumers)
- [ ] Node.js support (parsing-only entry point)
- [ ] Improve test coverage

---

## Build Output

| Format | File | Size | Notes |
|--------|------|------|-------|
| ESM | `dist/epub.js` | ~343KB | Primary import for modern bundlers |
| CJS | `dist/epub.cjs` | ~211KB | `require()` support |
| UMD | `dist/epub.umd.js` | ~211KB | `<script>` tag / CDN usage |
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
| `localforage` | 🟡 Replace planned | Storage — replace with lighter IndexedDB wrapper |
| `@xmldom/xmldom` | 🟡 Replace planned | XML parsing — replace with browser-native DOMParser |

---

## Test Status

| Test | Status | Notes |
|---|---|---|
| core.test.ts | ✅ 19 passing | All, including file URL and directory-with-dot tests |
| epubcfi.test.ts | ✅ 27 passing | |
| locations.test.ts | ✅ 2 passing | |
| epub.test.ts | ✅ 2 passing | Unarchived + archived open |
| book.test.ts | ✅ 8 passing | Unarchived, archived, ArrayBuffer, no-cover |
| section.test.ts | ✅ 4 passing | find() + search(), including cross-node spans |

**Total: 62 tests passing**

---

## Comparison with epubjs

| Aspect | epub.ts | epubjs |
|--------|---------|--------|
| Language | TypeScript (strict mode) | JavaScript |
| Build | Vite | webpack + Babel |
| Tests | Vitest | Karma + Mocha |
| Type definitions | Generated from source | Hand-written `.d.ts` |
| Dependencies | 3 (`jszip`, `localforage`, `@xmldom/xmldom`) | 7+ (`core-js`, `lodash`, `event-emitter`, etc.) |
| API compatibility | 100% (drop-in replacement) | — |
| Bundle format | ESM + CJS + UMD | UMD |
| Maintenance | Active | Inactive since 2022 |

---

## Known Limitations

- **No Node.js support** — requires a DOM environment; parsing-only entry point planned
- **No `sideEffects: false`** — consumers can't fully tree-shake unused exports yet
- **Single-file ESM bundle** — `Book` imports nearly everything, so `preserveModules` wouldn't help much
- **~100 `any` types remain** — in places where genuinely needed (e.g., DOM API interop, third-party lib types)

---

## Priority Next Steps

### High Priority
1. Replace `localforage` with lighter IndexedDB wrapper
2. Replace `@xmldom/xmldom` with browser-native DOMParser
3. Add `"sideEffects": false` to package.json

### Medium Priority
4. Node.js support (parsing-only entry point, no rendering)
5. Improve test coverage (rendition, navigation, annotations)

### Low Priority
6. Explore splitting `Book` dependency graph for better tree-shaking
7. Add CHANGELOG.md (Keep a Changelog format)
