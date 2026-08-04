[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / setDOMParser

# Function: setDOMParser()

> **setDOMParser**(`parser`): `void`

Defined in: src/utils/core.ts:528

Override the DOMParser used by parse. Lets a Node consumer inject
jsdom in place of the default (LinkeDOM), which can synchronously hang on
some real-world EPUBs. This is process-global state, not per-Book — the last
value set wins. Pass `undefined` to restore the global `DOMParser`.

## Parameters

### parser

[`DOMParserConstructor`](../type-aliases/DOMParserConstructor.md) | `undefined`

## Returns

`void`

## Memberof

Core
