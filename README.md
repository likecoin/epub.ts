# epub.ts (`@likecoin/epub-ts`)

[![CI](https://github.com/likecoin/epub.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/likecoin/epub.ts/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40likecoin%2Fepub-ts)](https://www.npmjs.com/package/@likecoin/epub-ts)
[![License](https://img.shields.io/npm/l/%40likecoin%2Fepub-ts)](./LICENSE)

**Drop-in replacement for [epubjs](https://github.com/futurepress/epub.js)** — same API, fully typed, 1 runtime dependency, actively maintained.

A complete TypeScript rewrite of epubjs v0.3.93 with strict mode, modern tooling, and ongoing bug fixes — without breaking your existing code.

## What you get

- **Same API, zero migration cost** — change one import line and everything works
- **Full TypeScript strict mode** — generated `.d.ts` from source, so autocomplete matches runtime
- **1 runtime dependency** (`jszip`) — smaller bundle, simpler supply chain
- **970+ tests** across 40 files — Vitest with robust coverage
- **Vite build** — ESM, CJS, and UMD outputs out of the box
- **Node.js support** — `@likecoin/epub-ts/node` parses EPUBs server-side with `linkedom`
- **Active maintenance** — [20+ bug fixes](./CHANGELOG.md) and counting

> **Note**: Built at [3ook.com](https://3ook.com) and provided as-is. Forked from [epubjs](https://github.com/futurepress/epub.js) v0.3.93 by [Fred Chasen](https://github.com/fchasen) / [FuturePress](https://github.com/futurepress).

## Get started

### Install

```bash
npm install @likecoin/epub-ts
```

### Migrate from epubjs

Change one line — everything else stays the same:

```diff
- import ePub from "epubjs";
+ import ePub from "@likecoin/epub-ts";
```

### Render an EPUB (browser)

```typescript
import ePub from "@likecoin/epub-ts";

const book = ePub("/path/to/book.epub");
const rendition = book.renderTo("viewer", { width: 600, height: 400 });
rendition.display();
```

### Load from file input

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

### Parse on Node.js (no browser needed)

Extract metadata, table of contents, and chapter HTML server-side. Requires [`linkedom`](https://github.com/WebReflection/linkedom):

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

## Named exports

```js
import {
	Book, EpubCFI, Rendition, Contents, Layout,
	Section, Spine, Locations, Navigation, PageList,
	Resources, Packaging, Archive, Store,
	Annotations, Themes, Mapping,
} from "@likecoin/epub-ts";
```

## API reference

Full documentation: [likecoin.github.io/epub.ts](https://likecoin.github.io/epub.ts/)

| Class | What it does |
|-------|-------------|
| `Book` | Load, parse, and manipulate an EPUB |
| `Rendition` | Render a book into a DOM element |
| `Contents` | Manage content inside an iframe |
| `EpubCFI` | Parse EPUB Canonical Fragment Identifiers |
| `Locations` | Generate and query reading positions |
| `Navigation` | Table of contents and landmarks |
| `Annotations` | Highlights, underlines, and marks |

## Supported environments

| Environment | Import | Notes |
|-------------|--------|-------|
| Modern browsers | `@likecoin/epub-ts` | Chrome, Firefox, Safari, Edge |
| Vite / webpack | `@likecoin/epub-ts` | ESM or CJS |
| Node.js 18+ | `@likecoin/epub-ts/node` | Parsing only (no rendering); requires `linkedom` peer dep |

## Development

```bash
git clone https://github.com/likecoin/epub.ts.git
cd epub.ts
npm install
```

| Script | Description |
|--------|-------------|
| `npm run build` | Vite library build → `dist/` |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run docs` | Generate API docs (HTML + Markdown) |

Requires Node.js 18+ and npm 9+.

## Contributing

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current status and what to work on.

For AI agents contributing to this project, see [AGENTS.md](./AGENTS.md).

## License

[BSD-2-Clause](./LICENSE) (same as epubjs)

## Acknowledgments

- [epubjs](https://github.com/futurepress/epub.js) by [Fred Chasen](https://github.com/fchasen) / [FuturePress](https://github.com/futurepress) — the original library this is forked from
- [jszip](https://github.com/Stuk/jszip) — ZIP file handling

## Built by [3ook.com](https://3ook.com)

3ook is a Web3 eBook platform where authors publish EPUB ebooks and readers collect them as digital assets.

## Related projects

- [epubjs](https://github.com/futurepress/epub.js) — Original EPUB reader library
- [epubcheck-ts](https://github.com/likecoin/epubcheck-ts) — TypeScript EPUB validator (also by 3ook.com)
