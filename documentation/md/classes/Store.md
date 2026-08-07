[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Store

# Class: Store

Defined in: src/store.ts:61

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<[`StoreEvents`](../interfaces/StoreEvents.md)\>

## Constructors

### Constructor

> **new Store**(`name`, `requester?`, `resolver?`): `Store`

Defined in: src/store.ts:74

#### Parameters

##### name

`string`

##### requester?

[`RequestFunction`](../type-aliases/RequestFunction.md)

##### resolver?

(`href`) => `string`

#### Returns

`Store`

## Properties

### \_status

> **\_status**: (`event`) => `void` \| `undefined`

Defined in: src/store.ts:72

***

### emit()

> **emit**: \<`K`\>(`type`, ...`args`) => `void`

Defined in: src/store.ts:64

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### args

...[`StoreEvents`](../interfaces/StoreEvents.md)\[`K`\]

#### Returns

`void`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`emit`](../interfaces/IEventEmitter.md#emit)

***

### name

> **name**: `string`

Defined in: src/store.ts:68

***

### off()

> **off**: \<`K`\>(`type`, `fn?`) => `void`

Defined in: src/store.ts:63

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

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`off`](../interfaces/IEventEmitter.md#off)

***

### on()

> **on**: \<`K`\>(`type`, `fn`) => `void`

Defined in: src/store.ts:62

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

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`on`](../interfaces/IEventEmitter.md#on)

***

### online

> **online**: `boolean`

Defined in: src/store.ts:71

***

### requester

> **requester**: [`RequestFunction`](../type-aliases/RequestFunction.md)

Defined in: src/store.ts:69

***

### resolver()

> **resolver**: (`href`) => `string`

Defined in: src/store.ts:70

#### Parameters

##### href

`string`

#### Returns

`string`

***

### storage

> **storage**: `SimpleStorage`

Defined in: src/store.ts:67

***

### urlCache

> **urlCache**: `Record`\<`string`, `string`\>

Defined in: src/store.ts:66

## Methods

### add()

> **add**(`resources`, `force?`): `Promise`\<(`Uint8Array`\<`ArrayBufferLike`\> \| `null`)[]\>

Defined in: src/store.ts:143

Add all of a book resources to the store

#### Parameters

##### resources

book resources

###### resources

`object`[]

##### force?

`boolean`

force resaving resources

#### Returns

`Promise`\<(`Uint8Array`\<`ArrayBufferLike`\> \| `null`)[]\>

store objects

***

### createUrl()

> **createUrl**(`url`, `options?`): `Promise`\<`string`\>

Defined in: src/store.ts:306

Create a Url from a stored item

#### Parameters

##### url

`string`

##### options?

###### base64?

`boolean`

use base64 encoding or blob url

#### Returns

`Promise`\<`string`\>

url promise with Url string

***

### destroy()

> **destroy**(): `void`

Defined in: src/store.ts:340

#### Returns

`void`

***

### getBase64()

> **getBase64**(`url`, `mimeType?`): `Promise`\<`string` \| `undefined`\>

Defined in: src/store.ts:285

Get a base64 encoded result from Storage by Url

#### Parameters

##### url

`string`

##### mimeType?

`string`

#### Returns

`Promise`\<`string` \| `undefined`\>

base64 encoded

***

### getBlob()

> **getBlob**(`url`, `mimeType?`): `Promise`\<`Blob` \| `undefined`\>

Defined in: src/store.ts:252

Get a Blob from Storage by Url

#### Parameters

##### url

`string`

##### mimeType?

`string`

#### Returns

`Promise`\<`Blob` \| `undefined`\>

***

### getText()

> **getText**(`url`, `_mimeType?`): `Promise`\<`string` \| `undefined`\>

Defined in: src/store.ts:270

Get Text from Storage by Url

#### Parameters

##### url

`string`

##### \_mimeType?

`string`

#### Returns

`Promise`\<`string` \| `undefined`\>

***

### put()

> **put**(`url`, `withCredentials?`, `headers?`, `signal?`): `Promise`\<`Uint8Array`\<`ArrayBufferLike`\> \| `null`\>

Defined in: src/store.ts:172

Put binary data from a url to storage

#### Parameters

##### url

`string`

a url to request from storage

##### withCredentials?

`boolean`

##### headers?

`Record`\<`string`, `string`\>

##### signal?

`AbortSignal`

#### Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\> \| `null`\>

***

### request()

> **request**(`url`, `type?`, `withCredentials?`, `headers?`, `signal?`): `Promise`\<`unknown`\>

Defined in: src/store.ts:194

Request a url

#### Parameters

##### url

`string`

a url to request from storage

##### type?

`string`

specify the type of the returned result

##### withCredentials?

`boolean`

##### headers?

`Record`\<`string`, `string`\>

##### signal?

`AbortSignal`

#### Returns

`Promise`\<`unknown`\>

***

### retrieve()

> **retrieve**(`url`, `type?`): `Promise`\<`unknown`\>

Defined in: src/store.ts:216

Request a url from storage

#### Parameters

##### url

`string`

a url to request from storage

##### type?

`string`

specify the type of the returned result

#### Returns

`Promise`\<`unknown`\>

***

### revokeUrl()

> **revokeUrl**(`url`): `void`

Defined in: src/store.ts:335

Revoke Temp Url for a archive item

#### Parameters

##### url

`string`

url of the item in the store

#### Returns

`void`
