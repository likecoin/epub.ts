[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Archive

# Class: Archive

Defined in: src/archive.ts:13

Handles Unzipping a requesting files from an Epub Archive

## Constructors

### Constructor

> **new Archive**(): `Archive`

Defined in: src/archive.ts:17

#### Returns

`Archive`

## Properties

### urlCache

> **urlCache**: `Record`\<`string`, `string`\>

Defined in: src/archive.ts:15

***

### zip

> **zip**: `JSZip` \| `undefined`

Defined in: src/archive.ts:14

## Methods

### createUrl()

> **createUrl**(`url`, `options?`): `Promise`\<`string`\>

Defined in: src/archive.ts:160

Create a Url from an unarchived item

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

Defined in: src/archive.ts:196

#### Returns

`void`

***

### getBase64()

> **getBase64**(`url`, `mimeType?`): `Promise`\<`string`\> \| `undefined`

Defined in: src/archive.ts:141

Get a base64 encoded result from Archive by Url

#### Parameters

##### url

`string`

##### mimeType?

`string`

#### Returns

`Promise`\<`string`\> \| `undefined`

base64 encoded

***

### getBlob()

> **getBlob**(`url`, `mimeType?`): `Promise`\<`Blob`\> \| `undefined`

Defined in: src/archive.ts:104

Get a Blob from Archive by Url

#### Parameters

##### url

`string`

##### mimeType?

`string`

#### Returns

`Promise`\<`Blob`\> \| `undefined`

***

### getText()

> **getText**(`url`, `_encoding?`): `Promise`\<`string`\> \| `undefined`

Defined in: src/archive.ts:123

Get Text from Archive by Url

#### Parameters

##### url

`string`

##### \_encoding?

`string`

#### Returns

`Promise`\<`string`\> \| `undefined`

text content

***

### open()

> **open**(`input`, `isBase64?`): `Promise`\<`JSZip`\>

Defined in: src/archive.ts:44

Open an archive

#### Parameters

##### input

`string` | `Blob` | `ArrayBuffer`

##### isBase64?

`boolean`

tells JSZip if the input data is base64 encoded

#### Returns

`Promise`\<`JSZip`\>

zipfile

***

### openUrl()

> **openUrl**(`zipUrl`, `isBase64?`): `Promise`\<`JSZip`\>

Defined in: src/archive.ts:54

Load and Open an archive

#### Parameters

##### zipUrl

`string`

##### isBase64?

`boolean`

tells JSZip if the input data is base64 encoded

#### Returns

`Promise`\<`JSZip`\>

zipfile

***

### request()

> **request**(`url`, `type?`): `Promise`\<`unknown`\>

Defined in: src/archive.ts:67

Request a url from the archive

#### Parameters

##### url

`string`

a url to request from the archive

##### type?

`string`

specify the type of the returned result

#### Returns

`Promise`\<`unknown`\>

***

### revokeUrl()

> **revokeUrl**(`url`): `void`

Defined in: src/archive.ts:191

Revoke Temp Url for a archive item

#### Parameters

##### url

`string`

url of the item in the archive

#### Returns

`void`
