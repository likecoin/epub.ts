# AGENTS.md

All project rules and conventions are below. See also `README.md` for project overview and `PROJECT_STATUS.md` for volatile status.

## Commands

- `npm run build` — Vite library build
- `npm test` — Vitest
- `npm run typecheck` — tsc --noEmit
- `npm run lint` — ESLint
- `npm run docs` — Generate API docs (HTML + Markdown via typedoc)

## Codebase

- `src/` — Library source (TypeScript)
- `test/` — Vitest tests
- `dist/` — Build output (gitignored)
- `documentation/md/API.md` — Generated API docs

## Conventions

### TypeScript
- Full `strict: true` (noImplicitAny, strictNullChecks, strictPropertyInitialization, etc.)
- API-compatible with epubjs v0.3.93 — do not break the public API
- When adding or tightening types, do not introduce unintended behavioral changes — adding null guards is fine, but do not change return values, filter arrays, or alter control flow just to satisfy the type checker
- ES6 classes with inline typed emitter
- Tabs for indentation, double quotes for strings

### Code Style
- Do not add unnecessary comments — only comment where logic isn't self-evident
- Prefer editing existing files over creating new ones
- Keep changes minimal — don't refactor surrounding code when fixing a bug

### Commit Messages
- `feat: add CFI range support`
- `fix: handle missing spine item`
- `refactor: simplify event emitter`
- `test: add section search tests`
- `chore: update dependencies`

## Testing

- Tests live in `test/` directory
- Use Vitest with globals
- Run `npm test` to verify all tests pass before committing

## Key Files

| File | Purpose |
|------|---------|
| `src/epub.ts` | Default export factory function |
| `src/book.ts` | Main Book class |
| `src/rendition.ts` | Rendering engine |
| `src/epubcfi.ts` | EPUB CFI parser |
| `src/index.ts` | Public API exports |
| `src/node.ts` | Node.js entry point (linkedom shims + parsing exports) |

## Status

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for conversion progress.

### Current Stage: C (Improvements)
- TypeScript strict mode: complete
- ESLint: 0 errors, 0 warnings
- `localforage` replaced with native IndexedDB
- `@xmldom/xmldom` replaced with native DOMParser
- Only 1 runtime dependency: `jszip`
- Security: CSS injection and dangerous URL schemes fixed
- Node.js parsing-only entry point: complete (`@likecoin/epub-ts/node` with `linkedom`)
- Remaining: improve test coverage, reduce ~21 remaining `any` types
