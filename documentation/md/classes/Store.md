[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Store

# Class: Store

Defined in: store.ts:16

Handles saving and requesting files from local storage

## Param

This should be the name of the application for modals

## Param

## Param

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)

## Constructors

### Constructor

> **new Store**(`name`, `requester?`, `resolver?`): `Store`

Defined in: store.ts:29

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

Defined in: store.ts:27

***

### emit()

> **emit**: (`type`, ...`args`) => `void`

Defined in: store.ts:19

#### Parameters

##### type

`string`

##### args

...`any`[]

#### Returns

`void`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`emit`](../interfaces/IEventEmitter.md#emit)

***

### name

> **name**: `string`

Defined in: store.ts:23

***

### off()

> **off**: (`type`, `fn?`) => `this`

Defined in: store.ts:18

#### Parameters

##### type

`string`

##### fn?

(...`args`) => `void`

#### Returns

`this`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`off`](../interfaces/IEventEmitter.md#off)

***

### on()

> **on**: (`type`, `fn`) => `this`

Defined in: store.ts:17

#### Parameters

##### type

`string`

##### fn

(...`args`) => `void`

#### Returns

`this`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`on`](../interfaces/IEventEmitter.md#on)

***

### online

> **online**: `boolean`

Defined in: store.ts:26

***

### requester

> **requester**: [`RequestFunction`](../type-aliases/RequestFunction.md)

Defined in: store.ts:24

***

### resolver()

> **resolver**: (`href`) => `string`

Defined in: store.ts:25

#### Parameters

##### href

`string`

#### Returns

`string`

***

### storage

> **storage**: `LocalForage`

Defined in: store.ts:22

***

### urlCache

> **urlCache**: `Record`\<`string`, `string`\>

Defined in: store.ts:21

## Methods

### add()

> **add**(`resources`, `force?`): `Promise`\<`any`[]\>

Defined in: store.ts:104

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

`Promise`\<`any`[]\>

store objects

***

### createUrl()

> **createUrl**(`url`, `options?`): `Promise`\<`string`\>

Defined in: store.ts:319

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

Defined in: store.ts:383

#### Returns

`void`

***

### getBase64()

> **getBase64**(`url`, `mimeType?`): `Promise`\<`string` \| `undefined`\>

Defined in: store.ts:291

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

Defined in: store.ts:243

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

> **getText**(`url`, `mimeType?`): `Promise`\<`string` \| `undefined`\>

Defined in: store.ts:262

Get Text from Storage by Url

#### Parameters

##### url

`string`

##### mimeType?

`string`

#### Returns

`Promise`\<`string` \| `undefined`\>

***

### put()

> **put**(`url`, `withCredentials?`, `headers?`): `Promise`\<`any`\>

Defined in: store.ts:132

Put binary data from a url to storage

#### Parameters

##### url

`string`

a url to request from storage

##### withCredentials?

`boolean`

##### headers?

`Record`\<`string`, `string`\>

#### Returns

`Promise`\<`any`\>

***

### request()

> **request**(`url`, `type?`, `withCredentials?`, `headers?`): `Promise`\<`any`\>

Defined in: store.ts:153

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

#### Returns

`Promise`\<`any`\>

***

### retrieve()

> **retrieve**(`url`, `type?`): `Promise`\<`any`\>

Defined in: store.ts:174

Request a url from storage

#### Parameters

##### url

`string`

a url to request from storage

##### type?

`string`

specify the type of the returned result

#### Returns

`Promise`\<`any`\>

***

### revokeUrl()

> **revokeUrl**(`url`): `void`

Defined in: store.ts:377

Revoke Temp Url for a archive item

#### Parameters

##### url

`string`

url of the item in the store

#### Returns

`void`
