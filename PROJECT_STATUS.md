# Project Status

## At a glance

- **1014+ tests passing** across 40 test files
- **1 runtime dependency** (`jszip`)
- **~6 intentional `any` types** remaining (3 in event emitter infrastructure, 2 in `EventMap` type definition, 1 in `HookCallback`)
- **0 `Function` types** in code — all 33 replaced with `HookCallback`, `ViewManagerConstructor`, `ViewConstructor`, `EventListener`, or typed function signatures
- **100% API-compatible** with epubjs v0.3.93

## Build outputs

| Format | File | Size | Use case |
|--------|------|------|----------|
| ESM | `dist/epub.js` | ~235 KB | Modern bundlers (Vite, webpack, Rollup) |
| CJS | `dist/epub.cjs` | ~151 KB | `require()` in legacy Node.js setups |
| UMD | `dist/epub.umd.js` | ~151 KB | `<script>` tags / CDN |
| Node ESM | `dist/epub.node.js` | ~232 KB | `@likecoin/epub-ts/node` |
| Node CJS | `dist/epub.node.cjs` | ~149 KB | `require("@likecoin/epub-ts/node")` |
| Types | `dist/*.d.ts` | — | Generated from source via `vite-plugin-dts` |

All formats are single-file bundles. `preserveModules` was considered for ESM but provides minimal benefit since `Book` imports nearly the entire dependency graph.

## Performance optimizations

All optimizations use transparent fallbacks — older browsers get the same behavior as before.

### Dirty-flag dimension caching (Layer 1)
`IframeView.expand()` caches `textWidth()`/`textHeight()` results and only re-measures when content actually changes (RESIZE/EXPAND events). This eliminates redundant synchronous reflows during page navigation, font size changes, and layout recalculations. The RESIZE event handler pre-populates the cache from `resizeCheck()` measurements, cutting the resize chain from 4 reflows to 2.

### Canvas-based text measurement (Layers 2–3)
`TextMeasurer` (`src/utils/text-measurer.ts`) measures text widths via `CanvasRenderingContext2D.measureText()` instead of DOM Range + `getBoundingClientRect()`. `Mapping.findTextStartRange()` and `findTextEndRange()` use binary search on pre-measured cumulative widths, reducing per-word reflow loops from O(N) to O(1) for text-heavy content. Falls back to DOM measurement for content with exotic CSS (`letter-spacing`, `word-spacing`, `text-indent`).

**Browser support for optimizations:**
- `OffscreenCanvas`: Chrome 69+, Firefox 105+, Safari 16.4+ (fallback: `HTMLCanvasElement`)
- `Intl.Segmenter`: Chrome 87+, Firefox 125+, Safari 15.4+ (fallback: space/CJK splitting)

## Known limitations

- **Node.js is parsing-only** — `@likecoin/epub-ts/node` provides metadata, spine, navigation, and section rendering via `linkedom`; no browser rendering
- **Annotation rendering incomplete** — `highlight()`, `underline()`, `mark()` in `annotations.ts` have TODO stubs needing View/Contents integration

## Roadmap

- **Annotation rendering** — `highlight()`, `underline()`, `mark()` in `annotations.ts` have TODO stubs needing View/Contents integration
- **3 remaining TODOs** — CFI range validation (`epubcfi.ts`), CFI validity check and page list fallback (`pagelist.ts`)
- **Logger abstraction** — 9 `eslint-disable no-console` suppressions could be replaced with a pluggable logger
- **Canvas page estimation (Layer 4)** — Optional: estimate page counts from text metrics for instant progress display before full `Locations.generate()` completes
