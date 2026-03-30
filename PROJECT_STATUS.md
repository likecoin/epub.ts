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

**Total: 953 tests passing (39 test files)**

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

## Performance Optimizations

### Dirty-flag dimension caching (Layer 1)
`IframeView.expand()` now caches `textWidth()`/`textHeight()` results and only re-measures when content actually changes (RESIZE/EXPAND events). This eliminates redundant synchronous reflows during page navigation, font size changes, and layout recalculations. The RESIZE event handler pre-populates the cache from `resizeCheck()` measurements, cutting the resize chain from 4 reflows to 2.

### Canvas-based text measurement (Layers 2–3)
`TextMeasurer` (`src/utils/text-measurer.ts`) measures text widths via `CanvasRenderingContext2D.measureText()` instead of DOM Range + `getBoundingClientRect()`. `Mapping.findTextStartRange()` and `findTextEndRange()` use binary search on pre-measured cumulative widths, reducing per-word reflow loops from O(N) to O(1) for text-heavy content. Falls back to DOM measurement for content with exotic CSS (`letter-spacing`, `word-spacing`, `text-indent`).

### Browser requirements for optimizations
- `OffscreenCanvas`: Chrome 69+, Firefox 105+, Safari 16.4+ (fallback: `HTMLCanvasElement`)
- `Intl.Segmenter`: Chrome 87+, Firefox 125+, Safari 15.4+ (fallback: space/CJK splitting)
- Older browsers get the same behavior as before — all optimizations are transparent fallbacks

---

## Next Steps

- **Annotation rendering** — `highlight()`, `underline()`, `mark()` in `annotations.ts` have TODO stubs needing View/Contents integration
- **3 remaining TODOs** — CFI range validation (`epubcfi.ts`), CFI validity check and page list fallback (`pagelist.ts`)
- **Logger abstraction** — 9 `eslint-disable no-console` suppressions could be replaced with a pluggable logger
- **Canvas page estimation (Layer 4)** — Optional: estimate page counts from text metrics for instant progress display before full `Locations.generate()` completes

