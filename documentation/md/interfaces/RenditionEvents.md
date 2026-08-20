[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / RenditionEvents

# Interface: RenditionEvents

Defined in: src/rendition.ts:57

Displays an Epub as a series of Views for each Section.
Requires Manager and View class to handle specifics of rendering
the section content.

## Param

## Param

## Param

## Param

## Param

class for the cfi parser to ignore

## Param

## Param

## Param

how content is delivered to the iframe: srcdoc, blobUrl, write

## Param

layout to force

## Param

force spread value

## Param

overridden by spread: none (never) / both (always)

## Param

url of stylesheet to be injected

## Param

false to disable orientation events

## Param

url of script to be injected

## Param

use snap scrolling

## Param

default text direction

## Param

enable running scripts in content.
Pairs `allow-scripts` with the `allow-same-origin` the sandbox needs, which the HTML spec
notes removes sandbox protection — the book gains your origin's full authority.
See https://github.com/likecoin/epub.ts/blob/master/SECURITY.md

## Param

enable opening popup in content

## Extends

- `Record`\<`string`, `any`[]\>

## Indexable

\[`key`: `string`\]: `any`[]

## Properties

### attached

> **attached**: \[\]

Defined in: src/rendition.ts:59

***

### displayed

> **displayed**: \[[`Section`](../classes/Section.md)\]

Defined in: src/rendition.ts:60

***

### displayerror

> **displayerror**: \[`Error`\]

Defined in: src/rendition.ts:61

***

### layout

> **layout**: \[[`LayoutProps`](LayoutProps.md), `Partial`\<[`LayoutProps`](LayoutProps.md)\>\]

Defined in: src/rendition.ts:70

***

### locationChanged

> **locationChanged**: \[\{ `end`: `string`; `href`: `string`; `index`: `number`; `percentage`: `number` \| `undefined`; `start`: `string`; \}\]

Defined in: src/rendition.ts:66

***

### markClicked

> **markClicked**: \[`string`, `object` \| `undefined`, [`Contents`](../classes/Contents.md)\]

Defined in: src/rendition.ts:68

***

### orientationchange

> **orientationchange**: \[`number`\]

Defined in: src/rendition.ts:65

***

### relocated

> **relocated**: \[[`Location`](Location.md)\]

Defined in: src/rendition.ts:67

***

### removed

> **removed**: \[[`Section`](../classes/Section.md), `IframeView`\]

Defined in: src/rendition.ts:63

***

### rendered

> **rendered**: \[[`Section`](../classes/Section.md), `IframeView`\]

Defined in: src/rendition.ts:62

***

### resized

> **resized**: \[\{ `height`: `number`; `width`: `number`; \}, `string`?\]

Defined in: src/rendition.ts:64

***

### selected

> **selected**: \[`string`, [`Contents`](../classes/Contents.md)\]

Defined in: src/rendition.ts:69

***

### started

> **started**: \[\]

Defined in: src/rendition.ts:58
