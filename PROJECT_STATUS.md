# Project Status

## Build Output

| Format | File | Size | Notes |
|--------|------|------|-------|
| ESM | `dist/epub.js` | ~235KB | Primary import for modern bundlers |
| CJS | `dist/epub.cjs` | ~151KB | `require()` support |
| UMD | `dist/epub.umd.js` | ~151KB | `<script>` tag / CDN usage |
| Node ESM | `dist/epub.node.js` | ~232KB | `@likecoin/epub-ts/node` for Node.js |
| Node CJS | `dist/epub.node.cjs` | ~149KB | `require("@likecoin/epub-ts/node")` |
| Types | `dist/*.d.ts` | — | Generated from source via `vite-plugin-dts` |

All formats are single-file bundles. `preserveModules` was considered for ESM but provides minimal benefit since `Book` imports nearly the entire dependency graph.

---

## Test Status

**Total: 884 tests passing (38 test files)**

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
- **~6 `any` types remain** — intentionally kept: 3 in event emitter infrastructure, 2 in `EventMap` type definition, 1 in `HookCallback`
- **0 `Function` types in code** — all 33 replaced with `HookCallback`, `ViewManagerConstructor`, `ViewConstructor`, `EventListener`, or typed function signatures

---

## Next Steps

- **Test coverage for `InlineView`** — `src/managers/views/inline.ts` (480 lines) has no test file; largest untested module
- **Annotation rendering** — `highlight()`, `underline()`, `mark()` in `annotations.ts` have TODO stubs needing View/Contents integration
- **14 inherited TODOs** — across 8 files, mostly from original epubjs (see `grep -r TODO src/`)
- **Logger abstraction** — 9 `eslint-disable no-console` suppressions could be replaced with a pluggable logger

