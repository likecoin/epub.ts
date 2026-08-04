[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / DOMParserConstructor

# Type Alias: DOMParserConstructor()

> **DOMParserConstructor** = () => `object`

Defined in: src/types.ts:121

A DOMParser-like constructor. Used to inject an alternative parser (e.g.
jsdom) in place of the default one via `setDOMParser` or `BookOptions.domParser`.

## Returns

`object`

### parseFromString()

> **parseFromString**(`markup`, `mimeType`): `Document`

#### Parameters

##### markup

`string`

##### mimeType

`string`

#### Returns

`Document`
