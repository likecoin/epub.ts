[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / default

# Function: default()

> **default**(`url?`, `options?`): [`Book`](../classes/Book.md)

Defined in: epub.ts:17

Creates a new Book

## Parameters

### url?

URL, Path or ArrayBuffer

`string` | `ArrayBuffer` | `Blob` | [`BookOptions`](../interfaces/BookOptions.md)

### options?

[`BookOptions`](../interfaces/BookOptions.md)

to pass to the book

## Returns

[`Book`](../classes/Book.md)

a new Book object

## Example

```ts
ePub("/path/to/book.epub", {})
```
