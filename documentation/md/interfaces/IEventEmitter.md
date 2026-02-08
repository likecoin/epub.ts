[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / IEventEmitter

# Interface: IEventEmitter

Defined in: types.ts:16

## Properties

### \_\_listeners?

> `optional` **\_\_listeners**: `Record`\<`string`, (...`args`) => `void`[]\>

Defined in: types.ts:20

## Methods

### emit()

> **emit**(`type`, ...`args`): `void`

Defined in: types.ts:19

#### Parameters

##### type

`string`

##### args

...`any`[]

#### Returns

`void`

***

### off()

> **off**(`type`, `fn?`): `any`

Defined in: types.ts:18

#### Parameters

##### type

`string`

##### fn?

(...`args`) => `void`

#### Returns

`any`

***

### on()

> **on**(`type`, `fn`): `any`

Defined in: types.ts:17

#### Parameters

##### type

`string`

##### fn

(...`args`) => `void`

#### Returns

`any`
