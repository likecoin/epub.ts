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

## Performance

Head-to-head numbers on two Project Gutenberg fixtures: a small book
([Alice in Wonderland #11](https://www.gutenberg.org/ebooks/11.epub3.images),
185 KB) and a large book
([War and Peace #2600](https://www.gutenberg.org/ebooks/2600.epub3.images),
1.7 MB). Apple M4 Pro, macOS 26.4, headless Chrome 146, Node 20,
median of 10–15 iterations. Run the bench yourself with
`npm run bench`; see [bench/README.md](./bench/README.md) for full
methodology and caveats.

| Metric                           | epubjs 0.3.93 | @likecoin/epub-ts |       Δ |
| -------------------------------- | ------------: | ----------------: | ------: |
| Bundle size (gzip, KB)           |         132.8 |              57.5 |  −56.7% |
| **Alice (185 KB)**               |               |                   |         |
| Cold parse (ms)                  |           2.2 |               2.2 |     ≈ 0 |
| First display (ms)               |          96.8 |              83.4 |  −13.8% |
| `locations.generate(1000)` (ms)  |        1760.3 |              10.4 |  −99.4% |
| `currentLocation()` (ms / call)  |         0.106 |             0.060 |  −43.8% |
| **War and Peace (1.7 MB)**       |               |                   |         |
| Cold parse (ms)                  |          11.7 |               7.9 |  −33.1% |
| First display (ms)               |          90.1 |              91.9 |     ≈ 0 |
| `locations.generate(1000)` (ms)  |       42903.3 |             158.9 |  −99.6% |
| `currentLocation()` (ms / call)  |         0.196 |             0.153 |  −22.1% |

**43 seconds → 159 ms** on `locations.generate()` for a 1.7 MB book:
this is the single biggest user-visible win, and it's what the
[0.4.9 locations optimization](./CHANGELOG.md#049-2026-03-03) was
aimed at. Both libraries produce the same output count
(169 locations for Alice, 429 for War and Peace) — the delta is real
work, not a short-circuit.

`currentLocation()` — the pagination / CFI-range query called on every
page turn — exercises the
[0.6.0 canvas text measurement](./CHANGELOG.md#060-2026-04-02) and
[0.6.1 `Mapping.findStart`/`findEnd` binary search](./CHANGELOG.md#061-2026-04-08)
and is roughly 2× faster as a result. `next-page` timings are omitted
from the table because both libraries converge on a frame-paced
~33 ms, which doesn't differentiate them.

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

### Use with a `<script>` tag (UMD / WebView)

For environments without a bundler — a plain HTML page, or a `react-native-webview`
loading local files — use the UMD build. It exposes a global `ePub` and expects
`JSZip` to be loaded first, mirroring the classic epubjs drop-in:

```html
<script src="jszip.min.js"></script>
<script src="epub.umd.js"></script>
<script>
	const book = ePub("book.epub");
	const rendition = book.renderTo("viewer", { width: 600, height: 400 });
	rendition.display();
</script>
```

The bundle lives at `dist/epub.umd.js` — copy it locally, or load it from a CDN
via `https://unpkg.com/@likecoin/epub-ts/dist/epub.umd.js`. In a bundler, prefer
the standard entrypoint instead, which resolves to the ES module build:
`import ePub from "@likecoin/epub-ts"`.

Loading a book from a `file://` URL (e.g. a local `.epub` bundled into a WebView)
is supported: `fetch` can't read the `file:` scheme, so such requests fall back to
`XMLHttpRequest`. The host must grant file access (on Android WebView, enable
`allowFileAccess` / `allowFileAccessFromFileURLs`). Alternatively, read the file
yourself and hand epub.ts an `ArrayBuffer` — `ePub(arrayBuffer)` skips the network
entirely and works everywhere.

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
| Modern browsers | `@likecoin/epub-ts` | Chrome 80+, Edge 80+, Firefox 74+, Safari 13.4+ (ES2020, Q1 2020) |
| Insecure contexts | `@likecoin/epub-ts` | `http://` intranet and `file://` deployments supported — runtime APIs gated behind secure contexts (`crypto.randomUUID`) are feature-detected with fallbacks |
| Vite / webpack | `@likecoin/epub-ts` | ESM or CJS |
| `<script>` tag / WebView | `dist/epub.umd.js` | UMD global `ePub`; load `JSZip` first. Reads `file://` books via XHR fallback |
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
