# Copilot Agent Instructions for epub.ts

## Repository Overview

**epub.ts** is a TypeScript fork of epubjs v0.3.93 — a library for parsing and rendering EPUB documents in the browser. This is a ~60-file TypeScript library with strict type checking, maintained by 3ook.com for internal use. It provides a drop-in replacement for epubjs with improved type safety and modern tooling.

**Key Facts:**
- **Language:** TypeScript (strict mode enabled)
- **Package manager:** npm
- **Build tool:** Vite
- **Test framework:** Vitest
- **Linter:** ESLint with TypeScript plugin
- **Size:** ~343KB ESM bundle, 62 passing tests
- **Dependencies:** jszip, localforage, @xmldom/xmldom (3 runtime deps)

## Build & Validation Commands

All commands must be run from the repository root. **Always run `npm install` first if dependencies are missing.**

### Setup (run once)
```bash
npm install
```
Time: ~10-30 seconds depending on network

### Build
```bash
npm run build
```
- Uses Vite to build library to `dist/`
- Generates ESM, CJS, and UMD bundles
- Generates TypeScript declarations
- Time: ~5-10 seconds
- Output: `dist/epub.js`, `dist/epub.cjs`, `dist/epub.umd.js`, `dist/*.d.ts`

### Type Check
```bash
npm run typecheck
```
- Runs `tsc --noEmit` (no output files, just type validation)
- Must pass with 0 errors
- Time: ~5-10 seconds
- **Important:** TypeScript is in strict mode (noImplicitAny, strictNullChecks, strictPropertyInitialization, etc.)

### Linting
```bash
npm run lint
```
- Runs ESLint with TypeScript plugin
- Must pass with **0 errors, 0 warnings**
- Time: ~3-5 seconds
- Use `npm run lint:fix` for auto-fixable issues

### Tests
```bash
npm test
```
- Runs all tests with Vitest
- Should show **481 tests passing**
- Time: ~5-10 seconds
- Tests are in `test/` directory (core.test.ts, epubcfi.test.ts, etc.)
- Use `npm run test:watch` for watch mode during development

### Documentation Generation
```bash
npm run docs
```
- Generates API docs with typedoc
- Output: HTML in `documentation/html/` and Markdown in `documentation/md/`
- Time: ~5-10 seconds

### Full Validation Sequence (recommended before committing)
```bash
npm run typecheck && npm run lint && npm test && npm run build
```
Time: ~20-30 seconds total

## Project Structure

### Key Files
```
src/
├── epub.ts              - Default export factory function (main entry point)
├── book.ts              - Main Book class (loads/parses EPUB)
├── rendition.ts         - Rendering engine (displays book in DOM)
├── epubcfi.ts          - EPUB CFI (Canonical Fragment Identifier) parser
├── index.ts            - Public API exports (re-exports all classes)
├── section.ts          - Individual EPUB section/chapter
├── spine.ts            - Book spine (reading order)
├── locations.ts        - Location/pagination system
├── navigation.ts       - Table of contents
├── annotations.ts      - Highlights and marks
├── contents.ts         - Iframe content management
├── packaging.ts        - OPF package document parser
├── resources.ts        - Resource management
└── utils/              - Utility functions
    ├── core.ts         - Core utilities
    └── path.ts         - Path utilities (replaces path-webpack)

test/                   - Vitest tests
documentation/          - Generated API docs
dist/                   - Build output (gitignored)
types/                  - Legacy TS declarations (being removed)
```

### Configuration Files
- `package.json` - npm configuration, scripts, dependencies
- `tsconfig.json` - TypeScript configuration (strict mode)
- `vite.config.ts` - Vite build configuration
- `vitest.config.ts` - Vitest test configuration
- `eslint.config.js` - ESLint configuration
- `.gitignore` - Excludes `dist/`, `node_modules/`, `documentation/html/`

### Architecture
This is a **single-library** project with no sub-packages. The `Book` class is the main entry point and imports nearly the entire dependency graph, so tree-shaking benefits are limited even with ESM. The library is designed for browser environments and requires a DOM.

**Dependency Graph (simplified):**
```
epub.ts (factory) → Book → Rendition, Locations, Navigation, etc.
                        ↓
                     Spine, Section, Resources, etc.
                        ↓
                     utilities (epubcfi, core, path, etc.)
```

## CI/CD Requirements

GitHub Actions workflows in `.github/workflows/`:

### CI Workflow (`ci.yml`)
Runs on every push/PR. **Must pass before merging.**

Checks:
1. **Typecheck** - TypeScript compilation (must have 0 errors)
2. **Lint** - ESLint (must have 0 errors, 0 warnings)
3. **Build** - Vite build (must succeed)
4. **Test** - Vitest tests (must have 62/62 passing)

The CI workflow validates on Node.js 18 and 20. All checks must pass.

### Docs Workflow (`docs.yml`)
Runs on pushes to `master`. Generates and publishes API documentation to GitHub Pages.

## Code Conventions

### TypeScript Style
- **Strict mode enabled:** All strict flags are on (noImplicitAny, strictNullChecks, strictPropertyInitialization, etc.)
- **No `any` in public APIs:** User-facing signatures must be fully typed
- **Tabs for indentation**
- **Double quotes for strings**
- ES6 classes with inline typed emitter
- Prefer existing types over `any` (only ~100 `any` remain where genuinely needed)

### Code Quality
- **Minimal comments:** Only comment where logic isn't self-evident
- **Prefer editing over creating:** Edit existing files rather than creating new ones
- **Minimal changes:** Don't refactor surrounding code when fixing a bug
- **API compatibility:** Must maintain 100% API compatibility with epubjs v0.3.93

### Commit Message Format
Follow conventional commits:
- `feat: add CFI range support`
- `fix: handle missing spine item`
- `refactor: simplify event emitter`
- `test: add section search tests`
- `chore: update dependencies`

## Current Project Status

**Stage: C (Improvements)** — Core conversion to TypeScript is complete.

✅ **Completed:**
- Full TypeScript conversion with strict mode
- ESLint with 0 errors, 0 warnings
- GitHub Actions CI
- 481 tests passing (28 test files)
- Inline typed emitter (replaced event-emitter)
- Reduced dependencies to 1 (`jszip`); removed core-js, lodash, path-webpack, localforage, @xmldom/xmldom
- Node.js parsing-only entry point (`@likecoin/epub-ts/node` with `linkedom`)

🔄 **Remaining work:**
- Improve test coverage for rendering modules (Rendition, Contents, Mapping, view managers)

**Do not remove or break existing functionality** unless fixing a security vulnerability or unless explicitly asked to do so.

## Common Tasks & Gotchas

### Making Code Changes
1. Always run `npm run typecheck` after changes to catch type errors early
2. Run `npm run lint` to catch style issues
3. Run `npm test` to verify tests pass
4. Run full validation before committing: `npm run typecheck && npm run lint && npm test && npm run build`

### Adding New Files
- New source files go in `src/`
- New tests go in `test/` with `.test.ts` extension
- Exports should be added to `src/index.ts` if they're public API

### Type Errors
- This project uses **full strict mode** — all TypeScript strict flags are enabled
- Cannot use `any` in public APIs
- Must initialize class properties or mark them as optional
- Must handle `null`/`undefined` explicitly

### ESLint Errors
- Must have **0 errors, 0 warnings** to pass CI
- Use `npm run lint:fix` for auto-fixable issues
- Common issues: unused variables, missing types, incorrect formatting

### Test Failures
- Tests are in `test/` directory using Vitest with globals
- 481 tests should pass
- Tests cover: core utilities, EPUB CFI parsing, locations, book loading, sections, archive, packaging, navigation, resources, annotations, and more

### Dependencies
- Only add new dependencies if absolutely necessary
- Check for security vulnerabilities before adding
- This project aims to minimize dependencies

## Key Documentation Files

1. **README.md** - User-facing documentation, installation, API overview
2. **AGENTS.md** - Detailed conventions for AI agents (you've seen this already)
3. **PROJECT_STATUS.md** - Current conversion progress, dependency status, test status
4. **CHANGELOG.md** - Version history and changes

## Trust These Instructions

These instructions have been carefully validated. **Trust them first** and only search or explore if:
- Information here is incomplete
- Information here contradicts actual behavior
- You encounter unexpected errors

When in doubt, check AGENTS.md and PROJECT_STATUS.md for additional details.
