[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Archive

# Class: Archive

Defined in: archive.ts:11

Handles Unzipping a requesting files from an Epub Archive

## Constructors

### Constructor

> **new Archive**(): `Archive`

Defined in: archive.ts:15

#### Returns

`Archive`

## Properties

### urlCache

> **urlCache**: `Record`\<`string`, `string`\>

Defined in: archive.ts:13

***

### zip

> **zip**: `JSZip`

Defined in: archive.ts:12

## Methods

### createUrl()

> **createUrl**(`url`, `options?`): `Promise`\<`string`\>

Defined in: archive.ts:188

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

Defined in: archive.ts:250

#### Returns

`void`

***

### getBase64()

> **getBase64**(`url`, `mimeType?`): `Promise`\<`string`\> \| `undefined`

Defined in: archive.ts:169

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

Defined in: archive.ts:132

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

Defined in: archive.ts:151

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

Defined in: archive.ts:42

Open an archive

#### Parameters

##### input

`string` | `ArrayBuffer` | `Blob`

##### isBase64?

`boolean`

tells JSZip if the input data is base64 encoded

#### Returns

`Promise`\<`JSZip`\>

zipfile

***

### openUrl()

> **openUrl**(`zipUrl`, `isBase64?`): `Promise`\<`JSZip`\>

Defined in: archive.ts:52

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

> **request**(`url`, `type?`): `Promise`\<`any`\>

Defined in: archive.ts:65

Request a url from the archive

#### Parameters

##### url

`string`

a url to request from the archive

##### type?

`string`

specify the type of the returned result

#### Returns

`Promise`\<`any`\>

***

### revokeUrl()

> **revokeUrl**(`url`): `void`

Defined in: archive.ts:244

Revoke Temp Url for a archive item

#### Parameters

##### url

`string`

url of the item in the archive

#### Returns

`void`
