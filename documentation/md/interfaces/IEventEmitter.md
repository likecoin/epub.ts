[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / IEventEmitter

# Interface: IEventEmitter\<E\>

Defined in: src/types.ts:18

## Type Parameters

### E

`E` *extends* [`EventMap`](../type-aliases/EventMap.md) = `Record`\<`string`, `any`[]\>

## Properties

### \_\_listeners?

> `optional` **\_\_listeners**: `Record`\<`string`, (...`args`) => `void`[]\>

Defined in: src/types.ts:22

## Methods

### emit()

> **emit**\<`K`\>(`type`, ...`args`): `void`

Defined in: src/types.ts:21

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### args

...`E`\[`K`\]

#### Returns

`void`

***

### off()

> **off**\<`K`\>(`type`, `fn?`): `void`

Defined in: src/types.ts:20

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### fn?

(...`args`) => `void`

#### Returns

`void`

***

### on()

> **on**\<`K`\>(`type`, `fn`): `void`

Defined in: src/types.ts:19

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### fn

(...`args`) => `void`

#### Returns

`void`
