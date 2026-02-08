[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Resources

# Class: Resources

Defined in: resources.ts:19

Handle Package Resources

## Param

## Param

## Param

## Param

## Param

## Constructors

### Constructor

> **new Resources**(`manifest`, `options?`): `Resources`

Defined in: resources.ts:35

#### Parameters

##### manifest

[`PackagingManifestObject`](../interfaces/PackagingManifestObject.md)

##### options?

###### archive?

[`Archive`](Archive.md)

###### replacements?

`string`

###### request?

[`RequestFunction`](../type-aliases/RequestFunction.md)

###### resolver?

(`href`, `absolute?`) => `string`

#### Returns

`Resources`

## Properties

### assets

> **assets**: [`PackagingManifestItem`](../interfaces/PackagingManifestItem.md)[]

Defined in: resources.ts:30

***

### css

> **css**: [`PackagingManifestItem`](../interfaces/PackagingManifestItem.md)[]

Defined in: resources.ts:31

***

### cssUrls

> **cssUrls**: `string`[]

Defined in: resources.ts:33

***

### html

> **html**: [`PackagingManifestItem`](../interfaces/PackagingManifestItem.md)[]

Defined in: resources.ts:29

***

### manifest

> **manifest**: [`PackagingManifestObject`](../interfaces/PackagingManifestObject.md)

Defined in: resources.ts:26

***

### replacementUrls

> **replacementUrls**: `string`[]

Defined in: resources.ts:28

***

### resources

> **resources**: [`PackagingManifestItem`](../interfaces/PackagingManifestItem.md)[]

Defined in: resources.ts:27

***

### settings

> **settings**: `object`

Defined in: resources.ts:20

#### archive

> **archive**: [`Archive`](Archive.md)

#### replacements

> **replacements**: `string`

#### request

> **request**: [`RequestFunction`](../type-aliases/RequestFunction.md)

#### resolver()

> **resolver**: (`href`, `absolute?`) => `string`

##### Parameters

###### href

`string`

###### absolute?

`boolean`

##### Returns

`string`

***

### urls

> **urls**: `string`[]

Defined in: resources.ts:32

## Methods

### createUrl()

> **createUrl**(`url`): `Promise`\<`string`\>

Defined in: resources.ts:130

Create a url to a resource

#### Parameters

##### url

`string`

#### Returns

`Promise`\<`string`\>

Promise resolves with url string

***

### destroy()

> **destroy**(): `void`

Defined in: resources.ts:325

#### Returns

`void`

***

### get()

> **get**(`path`): `Promise`\<`string`\> \| `undefined`

Defined in: resources.ts:294

Get a URL for a resource

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`string`\> \| `undefined`

url

***

### process()

> **process**(`manifest`): `void`

Defined in: resources.ts:50

Process resources

#### Parameters

##### manifest

[`PackagingManifestObject`](../interfaces/PackagingManifestObject.md)

#### Returns

`void`

***

### relativeTo()

> **relativeTo**(`absolute`, `resolver?`): `string`[]

Defined in: resources.ts:277

Resolve all resources URLs relative to an absolute URL

#### Parameters

##### absolute

`string`

to be resolved to

##### resolver?

(`href`, `absolute?`) => `string`

#### Returns

`string`[]

array with relative Urls

***

### replacements()

> **replacements**(): `Promise`\<`string`[]\>

Defined in: resources.ts:157

Create blob urls for all the assets

#### Returns

`Promise`\<`string`[]\>

returns replacement urls

***

### substitute()

> **substitute**(`content`, `url?`): `string`

Defined in: resources.ts:315

Substitute urls in content, with replacements,
relative to a url if provided

#### Parameters

##### content

`string`

##### url?

`string`

url to resolve to

#### Returns

`string`

content with urls substituted
