# Project Status

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
- **~14 `any` types remain** — intentionally kept: 7 in `annotations.ts` (public API `Record<string, any>` for user data), 7 in event emitter infrastructure (`EventMap`, mixin implementation)
- **0 `Function` types in code** — all 33 replaced with `HookCallback`, `ViewManagerConstructor`, `ViewConstructor`, `EventListener`, or typed function signatures

---

## Next Steps

