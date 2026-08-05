# Agent Instructions

All project rules and conventions are below. See also `README.md` for project overview and `PROJECT_STATUS.md` for volatile status.

## Conventions

### TypeScript
- API-compatible with epubjs v0.3.93 — do not break the public API
- When adding or tightening types, do not introduce unintended behavioral changes — adding null guards is fine, but do not change return values, filter arrays, or alter control flow just to satisfy the type checker
- ES6 classes with inline typed emitter
- Tabs for indentation, double quotes for strings

### Code Style
- Do not add unnecessary comments — only comment where logic isn't self-evident
- Prefer editing existing files over creating new ones
- Keep changes minimal — don't refactor surrounding code when fixing a bug

### Commit Messages
Gitmoji prefix, then a capitalized imperative summary:
- `🐛 Infer the nav document's parse type from its extension`
- `✨ Resolve TOC hrefs to location indexes for page numbers`
- `🏷️ Add typed event emitter generics across all emitter classes`
- `♻️ Export InlineView for parity with epubjs deep imports`
- `✅ Test AbortSignal propagation through request and IframeView`
- `📝 Regenerate docs`

## Testing

- Run `npm test` to verify all tests pass before committing

## Status

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current stage, test counts, dependency status, and remaining work.
