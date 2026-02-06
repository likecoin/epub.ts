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
- [ ] Replace `localforage` with lighter IndexedDB wrapper
- [ ] Replace `@xmldom/xmldom` with browser-native DOMParser
- [x] Enable `strictNullChecks` (476 errors fixed across 30 files)
- [x] Full `strict: true` (377 errors fixed: strictPropertyInitialization 120, noImplicitThis 251, others 6)
- [ ] Node.js support (parsing-only entry point)
- [ ] Improve test coverage
- [x] ESLint + TS plugin (0 errors, 0 warnings)
- [x] GitHub Actions CI

### Dependency Status
| Dep | Status | Notes |
|---|---|---|
| `core-js` | ✅ Removed (A1) | Babel polyfills, not needed with Vite |
| `lodash` | ✅ Removed (A1) | throttle/debounce replaced with native |
| `path-webpack` | ✅ Removed (A1) | Replaced with inline path utils |
| `event-emitter` | ✅ Removed (B0a) | Replaced with inline typed emitter |
| `marks-pane` | ✅ Removed (B0b) | Inlined as src/marks-pane/ |
| `jszip` | ✅ Keep | Core dependency |
| `localforage` | ✅ Keep | Storage (replace in Stage C) |
| `@xmldom/xmldom` | ✅ Keep | XML parsing (replace in Stage C) |

### Test Status
| Test | Status | Notes |
|---|---|---|
| core.test.ts | ✅ 19 passing | All, including file URL and directory-with-dot tests |
| epubcfi.test.ts | ✅ 27 passing | |
| locations.test.ts | ✅ 2 passing | |
| epub.test.ts | ✅ 2 passing | Unarchived + archived open |
| book.test.ts | ✅ 8 passing | Unarchived, archived, ArrayBuffer, no-cover |
| section.test.ts | ✅ 4 passing | find() + search(), including cross-node spans |
