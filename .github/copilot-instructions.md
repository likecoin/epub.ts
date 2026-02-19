# Copilot Agent Instructions for epub.ts

## Overview

**epub.ts** is a TypeScript fork of epubjs v0.3.93 — a library for parsing and rendering EPUB documents in the browser. Strict mode is enabled. The only runtime dependency is `jszip`.

## Conventions

All code conventions, commands, commit format, key files, and coding style rules are documented in [`CLAUDE.md`](../CLAUDE.md) at the repo root. **Read it first.**

For test counts, dependency status, and remaining work, see [`PROJECT_STATUS.md`](../PROJECT_STATUS.md).

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run build` | Vite library build to `dist/` |
| `npm test` | Run Vitest tests |
| `npm run typecheck` | `tsc --noEmit` type validation |
| `npm run lint` | ESLint (must pass with 0 errors, 0 warnings) |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run docs` | Generate API docs via typedoc |

### Full validation (run before committing)

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## CI Requirements

GitHub Actions CI (`.github/workflows/ci.yml`) runs on every push/PR and must pass before merging:

1. **Typecheck** — 0 errors
2. **Lint** — 0 errors, 0 warnings
3. **Build** — must succeed
4. **Test** — all tests passing

CI validates on Node.js 18 and 20.

### Docs Workflow

`.github/workflows/docs.yml` runs on pushes to `master` and publishes API docs to GitHub Pages.

## Copilot-Specific Notes

- Always run `npm install` first if `node_modules/` is missing.
- New source files go in `src/`; new tests go in `test/` with `.test.ts` extension.
- Public API exports should be added to `src/index.ts`.
- Do not remove or break existing functionality unless fixing a security vulnerability or explicitly asked.
