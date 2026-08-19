# Security

## Reporting a vulnerability

Report security issues privately via [GitHub Security Advisories](https://github.com/likecoin/epub.ts/security/advisories/new), or by email to the maintainer listed in `package.json`. Please don't open a public issue for an unfixed vulnerability.

## Threat model

**An EPUB is untrusted input.** It is a ZIP archive of attacker-controllable XHTML, CSS, SVG, fonts and images, and epub.ts renders that markup in the same browser session as your application. If your users can open books you did not author, treat every book as hostile.

The boundary that protects your origin is the **sandboxed iframe** each section is rendered into. The defaults are chosen to keep that boundary intact:

```js
book.renderTo("area", {
	allowScriptedContent: false,  // default
	allowPopups: false            // default
});
```

With those defaults the iframe carries `sandbox="allow-same-origin"`. Scripts in the book do not run, `javascript:` URLs do not execute, and the book cannot open windows.

## `allowScriptedContent: true` grants the book your origin

EPUB 3 permits scripted content, so this option exists — but it does not mean "run the book's scripts, safely contained". Enabling it produces:

```
sandbox="allow-same-origin allow-scripts"
```

Combining those two tokens is explicitly documented in the HTML specification as removing the protection sandboxing provides. Because the framed document is same-origin with your page, its scripts can reach `parent.document`, remove the `sandbox` attribute outright, and act with your origin's full authority — including your cookies, `localStorage`, IndexedDB and session.

`allow-same-origin` cannot simply be dropped. epub.ts needs same-origin DOM access to the rendered section to generate CFIs, paginate, and map ranges to screen positions; without it the library's core features stop working. The tradeoff is therefore inherent, not an oversight.

**Only enable `allowScriptedContent` for books you control or have independently vetted.** If you need to render scripted books from untrusted sources, isolate the whole reader — a separate origin, or a cross-origin iframe you control — so that a compromise cannot reach your application's origin.

The same reasoning applies to `allowPopups: true`, which adds `allow-popups`. Popups inherit the opener's sandbox flags, so this is much weaker than the above, but it does let a book open windows the user did not ask for.

## `InlineView` is not sandboxed

`InlineView` renders a section by assigning the book's `<body>` markup straight into a `<div>` in your own document:

```js
this.frame.innerHTML = body.innerHTML;
```

There is no iframe and no sandbox. Assigning to `innerHTML` will not run `<script>` elements, but it will run event-handler attributes such as `<img src=x onerror=...>` and `<svg onload=...>`, in your origin, with no restrictions.

It is exported only for compatibility with epubjs deep imports. **Do not use it with untrusted books.** The default `IframeView` is the safe choice, and is what `Rendition` uses unless you override it.

## No Content-Security-Policy is applied

epub.ts does not inject a CSP into rendered sections. Even with scripts fully disabled, a book can reach the network through ordinary markup — `<img src="https://...">`, `@font-face`, CSS `url()` — which is enough to phone home when a reader opens a page, revealing IP address, user agent, and reading activity to a third party.

If that matters for your deployment, apply a policy at the hosting layer (a response `Content-Security-Policy` header, or a CSP `<meta>` injected through the `Rendition` content hooks). Note that a `style-src` without `blob:` and `data:` will strip the book's own stylesheets, since resource replacement rewrites them to blob or data URLs.

## What the library does defend against

- Iframe sandboxing is on by default at every layer — `Rendition`, both view managers, and `IframeView` each default `allowScriptedContent` and `allowPopups` to `false` independently.
- Link hrefs pointing at `javascript:`, `vbscript:` and `data:text/html` are removed from rendered content, comparing against the scheme after stripping the characters the URL parser itself strips.
- Archive entries are read by exact name from the ZIP central directory and never written to disk, so a crafted entry path cannot escape a directory.
- The Node entry point parses only; it does not render or execute book content.
