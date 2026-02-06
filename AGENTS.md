# AGENTS.md

## Commands
- `npm run build` — Vite library build
- `npm test` — Vitest
- `npm run typecheck` — tsc --noEmit

## Codebase
- `src/` — Library source (JS, converting to TypeScript)
- `test/` — Vitest tests
- `dist/` — Build output (gitignored)
- `types/` — Legacy TS declarations (will be removed after full TS conversion)

## Conventions
- ES6 classes with event-emitter mixin (migrating to mitt)
- Moderate TS strictness (noImplicitAny: true)
- API-compatible with epubjs v0.3.93
- Tabs for indentation, double quotes for strings
- BSD-2-Clause license

## Status
See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for conversion progress.
