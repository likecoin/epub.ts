# epub.ts (`@likecoin/epub-ts`)

A TypeScript fork of [epubjs](https://github.com/futurepress/epub.js) v0.3.93 by [Fred Chasen](https://github.com/fchasen) / [FuturePress](https://github.com/futurepress) — parse and render EPUB documents in the browser.

[![CI](https://github.com/likecoin/epub.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/likecoin/epub.ts/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40likecoin%2Fepub-ts)](https://www.npmjs.com/package/@likecoin/epub-ts)
[![License](https://img.shields.io/npm/l/%40likecoin%2Fepub-ts)](./LICENSE)

> **Note**: This library is primarily developed for internal use at [3ook.com](https://3ook.com) and is provided as-is. It was mainly built with AI-assisted development. For the original library, see [epubjs](https://github.com/futurepress/epub.js).

## Features

- **Drop-in replacement** for epubjs v0.3.93 — same API, just change the import
- **TypeScript first** — full strict mode, typed emitter, generated `.d.ts` declarations
- **Modern build** — Vite library build, ESM + CJS output
- **Fewer dependencies** — only 1 runtime dependency (`jszip`); removed `core-js`, `lodash`, `path-webpack`, `event-emitter`, `localforage`, `@xmldom/xmldom`
- **Named exports** — import individual classes like `Book`, `EpubCFI`, `Rendition`, etc.

## Installation

```bash
npm install @likecoin/epub-ts
```

## Quick Start

### ES Modules (recommended)

```typescript
import ePub from "@likecoin/epub-ts";

const book = ePub("/path/to/book.epub");
const rendition = book.renderTo("viewer", { width: 600, height: 400 });
rendition.display();
```

### Browser (from ArrayBuffer)

```typescript
import ePub from "@likecoin/epub-ts";

const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener("change", async (event) => {
	const file = event.target.files[0];
	const data = await file.arrayBuffer();
	const book = ePub(data);
	const rendition = book.renderTo("viewer", { width: 600, height: 400 });
	rendition.display();
});
```

### Node.js (parsing only)

Parse EPUB metadata, spine, navigation, and section content without a browser. Requires [`linkedom`](https://github.com/WebReflection/linkedom) as a peer dependency.

```bash
npm install linkedom
```

```typescript
import { Book } from "@likecoin/epub-ts/node";
import { readFileSync } from "node:fs";

const data = readFileSync("book.epub");
const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
const book = new Book(arrayBuffer);
await book.opened;

console.log(book.packaging.metadata.title);
console.log(book.navigation.toc.map(item => item.label));

const section = book.spine.first();
const html = await section.render(book.archive.request.bind(book.archive));
```

## Migration from epubjs

Drop-in replacement. Change your import:

```diff
- import ePub from "epubjs";
+ import ePub from "@likecoin/epub-ts";
```

All APIs remain the same.

## Named Exports

```js
import {
	Book, EpubCFI, Rendition, Contents, Layout,
	Section, Spine, Locations, Navigation, PageList,
	Resources, Packaging, Archive, Store,
	Annotations, Themes, Mapping,
} from "@likecoin/epub-ts";
```

## API

See the full [API documentation](https://likecoin.github.io/epub.ts/) for details on all classes, interfaces, and methods.

Key classes:

| Class | Description |
|-------|-------------|
| `Book` | Main EPUB representation — loading, parsing, manipulation |
| `Rendition` | Renders a book to a DOM element |
| `Contents` | Manages content within an iframe |
| `EpubCFI` | EPUB Canonical Fragment Identifier parser |
| `Locations` | Generates and manages reading locations |
| `Navigation` | Table of contents and landmarks |
| `Annotations` | Highlights, underlines, and marks |

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

## Supported Environments

| Environment | Import | Notes |
|-------------|--------|-------|
| Modern browsers | `@likecoin/epub-ts` | Chrome, Firefox, Safari, Edge |
| Vite / webpack | `@likecoin/epub-ts` | ESM or CJS |
| Node.js 18+ | `@likecoin/epub-ts/node` | Parsing only (no rendering); requires `linkedom` peer dep |

## What's Changed from epubjs

- Build: webpack + Babel → Vite
- Tests: Karma + Mocha → Vitest
- Source: JavaScript → TypeScript (full strict mode)
- Removed dependencies: `core-js`, `lodash`, `path-webpack`, `localforage`, `@xmldom/xmldom`
- Replaced `event-emitter` with inline typed emitter
- Replaced `localforage` with native IndexedDB wrapper
- Replaced `@xmldom/xmldom` with native DOMParser/XMLSerializer
- Added Node.js parsing-only entry point (`@likecoin/epub-ts/node`) with `linkedom`
- Dropped IE8–IE11 support

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone https://github.com/likecoin/epub.ts.git
cd epub.ts
npm install
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Vite library build → `dist/` |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run docs` | Generate API docs (HTML + Markdown) |

## Contributing

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current conversion progress and what to work on.

For AI agents contributing to this project, see [AGENTS.md](./AGENTS.md).

## License

[BSD-2-Clause](./LICENSE) (same as epubjs)

## Acknowledgments

- [epubjs](https://github.com/futurepress/epub.js) by [Fred Chasen](https://github.com/fchasen) / [FuturePress](https://github.com/futurepress) — the original library this is forked from
- [jszip](https://github.com/Stuk/jszip) — ZIP file handling

## Built by 3ook.com

This project is built and maintained by the [3ook.com](https://3ook.com) team. 3ook is a Web3 eBook platform where authors can publish EPUB ebooks and readers can collect them as digital assets.

## Related Projects

- [epubjs](https://github.com/futurepress/epub.js) — Original EPUB reader library
- [epubcheck-ts](https://github.com/likecoin/epubcheck-ts) — TypeScript EPUB validator (also by 3ook.com)
