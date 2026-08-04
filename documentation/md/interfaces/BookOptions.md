[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / BookOptions

# Interface: BookOptions

Defined in: src/types.ts:123

## Properties

### canonical()?

> `optional` **canonical**: (`path`) => `string`

Defined in: src/types.ts:129

#### Parameters

##### path

`string`

#### Returns

`string`

***

### domParser?

> `optional` **domParser**: [`DOMParserConstructor`](../type-aliases/DOMParserConstructor.md)

Defined in: src/types.ts:133

Alternative DOMParser to inject; delegates to `setDOMParser` (process-global — see its docs).

***

### encoding?

> `optional` **encoding**: `string`

Defined in: src/types.ts:127

***

### openAs?

> `optional` **openAs**: `string`

Defined in: src/types.ts:130

***

### replacements?

> `optional` **replacements**: `string`

Defined in: src/types.ts:128

***

### requestCredentials?

> `optional` **requestCredentials**: `boolean`

Defined in: src/types.ts:125

***

### requestHeaders?

> `optional` **requestHeaders**: `Record`\<`string`, `string`\>

Defined in: src/types.ts:126

***

### requestMethod?

> `optional` **requestMethod**: [`RequestFunction`](../type-aliases/RequestFunction.md)

Defined in: src/types.ts:124

***

### store?

> `optional` **store**: `string` \| `boolean`

Defined in: src/types.ts:131
