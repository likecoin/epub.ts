[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Deferred

# Interface: Deferred\<T\>

Defined in: src/types.ts:9

## Type Parameters

### T

`T` = `unknown`

## Properties

### promise

> **promise**: `Promise`\<`T`\>

Defined in: src/types.ts:12

***

### reject()

> **reject**: (`reason?`) => `void`

Defined in: src/types.ts:11

#### Parameters

##### reason?

`unknown`

#### Returns

`void`

***

### resolve()

> **resolve**: (`value`) => `void`

Defined in: src/types.ts:10

#### Parameters

##### value

`T` | `PromiseLike`\<`T`\>

#### Returns

`void`
