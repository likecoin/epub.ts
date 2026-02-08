[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Deferred

# Interface: Deferred\<T\>

Defined in: types.ts:8

## Type Parameters

### T

`T` = `any`

## Properties

### id

> **id**: `string`

Defined in: types.ts:9

***

### promise

> **promise**: `Promise`\<`T`\>

Defined in: types.ts:12

***

### reject()

> **reject**: (`reason?`) => `void`

Defined in: types.ts:11

#### Parameters

##### reason?

`any`

#### Returns

`void`

***

### resolve()

> **resolve**: (`value?`) => `void`

Defined in: types.ts:10

#### Parameters

##### value?

`T` | `PromiseLike`\<`T`\>

#### Returns

`void`
