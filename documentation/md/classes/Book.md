[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Book

# Class: Book

Defined in: src/book.ts:81

An Epub representation with methods for the loading, parsing and manipulation
of its contents.

## Param

## Param

## Param

a request function to use instead of the default

## Param

send the xhr request withCredentials

## Param

send the xhr request headers

## Param

optional to pass 'binary' or base64' for archived Epubs

## Param

use base64, blobUrl, or none for replacing assets in archived Epubs

## Param

optional function to determine canonical urls for a path

## Param

optional string to determine the input type

## Param

cache the contents in local storage, value should be the name of the reader

## Param

optional DOMParser constructor to use instead of the global one (e.g. jsdom in Node); process-global, see setDOMParser

## Examples

```ts
new Book("/path/to/book.epub", {})
```

```ts
new Book({ replacements: "blobUrl" })
```

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<[`BookEvents`](../interfaces/BookEvents.md)\>

## Constructors

### Constructor

> **new Book**(`url?`, `options?`): `Book`

Defined in: src/book.ts:118

#### Parameters

##### url?

`string` | `Blob` | `ArrayBuffer` | [`BookOptions`](../interfaces/BookOptions.md)

##### options?

[`BookOptions`](../interfaces/BookOptions.md)

#### Returns

`Book`

## Properties

### archive

> **archive**: [`Archive`](Archive.md) \| `undefined`

Defined in: src/book.ts:104

***

### archived

> **archived**: `boolean`

Defined in: src/book.ts:103

***

### container

> **container**: [`Container`](Container.md) \| `undefined`

Defined in: src/book.ts:108

***

### cover

> **cover**: `string`

Defined in: src/book.ts:112

***

### displayOptions

> **displayOptions**: [`DisplayOptions`](DisplayOptions.md) \| `undefined`

Defined in: src/book.ts:110

***

### emit()

> **emit**: \<`K`\>(`type`, ...`args`) => `void`

Defined in: src/book.ts:116

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### args

...[`BookEvents`](../interfaces/BookEvents.md)\[`K`\]

#### Returns

`void`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`emit`](../interfaces/IEventEmitter.md#emit)

***

### isOpen

> **isOpen**: `boolean`

Defined in: src/book.ts:85

***

### isRendered

> **isRendered**: `boolean`

Defined in: src/book.ts:95

***

### loaded

> **loaded**: `BookLoadedState`

Defined in: src/book.ts:87

***

### loading

> **loading**: `BookLoadingState`

Defined in: src/book.ts:86

***

### locations

> **locations**: [`Locations`](Locations.md)

Defined in: src/book.ts:98

***

### navigation

> **navigation**: [`Navigation`](Navigation.md)

Defined in: src/book.ts:99

***

### off()

> **off**: \<`K`\>(`type`, `fn?`) => `void`

Defined in: src/book.ts:115

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

Defined in: src/book.ts:114

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

### opened

> **opened**: `Promise`\<`Book`\>

Defined in: src/book.ts:84

***

### opening

> **opening**: `defer`\<`Book`\>

Defined in: src/book.ts:83

***

### package

> **package**: [`Packaging`](Packaging.md) \| `undefined`

Defined in: src/book.ts:111

***

### packaging

> **packaging**: [`Packaging`](Packaging.md)

Defined in: src/book.ts:109

***

### pageList

> **pageList**: [`PageList`](PageList.md)

Defined in: src/book.ts:100

***

### path

> **path**: `Path` \| `undefined`

Defined in: src/book.ts:102

***

### ready

> **ready**: `Promise`\<\[[`PackagingManifestObject`](../interfaces/PackagingManifestObject.md), [`Spine`](Spine.md), [`PackagingMetadataObject`](../interfaces/PackagingMetadataObject.md), `string`, [`Navigation`](Navigation.md), [`Resources`](Resources.md), [`DisplayOptions`](DisplayOptions.md)\]\>

Defined in: src/book.ts:88

***

### rendition

> **rendition**: [`Rendition`](Rendition.md) \| `undefined`

Defined in: src/book.ts:107

***

### replacementsReady

> **replacementsReady**: `Promise`\<`void`\> \| `undefined`

Defined in: src/book.ts:94

#### Member

replacementsReady resolves when all resource
replacement URLs (blob/base64) have been created. Undefined for
unarchived books or when replacements are "none".

***

### request

> **request**: [`RequestFunction`](../type-aliases/RequestFunction.md)

Defined in: src/book.ts:96

***

### resources

> **resources**: [`Resources`](Resources.md)

Defined in: src/book.ts:106

***

### settings

> **settings**: [`BookOptions`](../interfaces/BookOptions.md)

Defined in: src/book.ts:82

***

### spine

> **spine**: [`Spine`](Spine.md)

Defined in: src/book.ts:97

***

### storage

> **storage**: [`Store`](Store.md) \| `undefined`

Defined in: src/book.ts:105

***

### url

> **url**: `Url`

Defined in: src/book.ts:101

## Methods

### canonical()

> **canonical**(`path`): `string`

Defined in: src/book.ts:505

Get a canonical link to a path

#### Parameters

##### path

`string`

#### Returns

`string`

the canonical path string

***

### coverUrl()

> **coverUrl**(): `Promise`\<`string` \| `null`\>

Defined in: src/book.ts:791

Get the cover url

#### Returns

`Promise`\<`string` \| `null`\>

coverUrl

***

### destroy()

> **destroy**(): `void`

Defined in: src/book.ts:857

Destroy the Book and all associated objects

#### Returns

`void`

***

### getRange()

> **getRange**(`cfiRange`): `Promise`\<`Range`\>

Defined in: src/book.ts:829

Find a DOM Range for a given CFI Range

#### Parameters

##### cfiRange

`string`

a epub cfi range

#### Returns

`Promise`\<`Range`\>

***

### key()

> **key**(`identifier?`): `string`

Defined in: src/book.ts:849

Generates the Book Key using the identifier in the manifest or other string provided

#### Parameters

##### identifier?

`string`

to use instead of metadata identifier

#### Returns

`string`

key

***

### load()

> **load**(`path`, `type?`, `withCredentials?`, `headers?`, `signal?`): `Promise`\<`unknown`\>

Defined in: src/book.ts:457

Load a resource from the Book

#### Parameters

##### path

`string`

path to the resource to load

##### type?

`string`

parse type to use, overriding the path extension

##### withCredentials?

`boolean`

overrides the book's requestCredentials setting

##### headers?

`Record`\<`string`, `string`\>

overrides the book's requestHeaders setting

##### signal?

`AbortSignal`

cancels the in-flight request

#### Returns

`Promise`\<`unknown`\>

returns a promise with the requested resource

These apply to the network path only: an archived book reads from the zip,
and a configured store issues its own requests.

***

### open()

> **open**(`input`, `what?`): `Promise`\<`void`\>

Defined in: src/book.ts:319

Open a epub or url

#### Parameters

##### input

Url, Path or ArrayBuffer

`string` | `Blob` | `ArrayBuffer`

##### what?

`string`

force opening as a certain type

#### Returns

`Promise`\<`void`\>

of when the book has been loaded

#### Example

```ts
book.open("/path/to/book.epub")
```

***

### renderTo()

> **renderTo**(`element`, `options?`): [`Rendition`](Rendition.md)

Defined in: src/book.ts:695

Sugar to render a book to an element

#### Parameters

##### element

element or string to add a rendition to

`string` | `HTMLElement`

##### options?

[`RenditionOptions`](../interfaces/RenditionOptions.md)

#### Returns

[`Rendition`](Rendition.md)

***

### resolve()

> **resolve**(`path`, `absolute?`): `string`

Defined in: src/book.ts:478

Resolve a path to it's absolute position in the Book

#### Parameters

##### path

`string`

##### absolute?

`boolean`

force resolving the full URL

#### Returns

`string`

the resolved path string

***

### section()

> **section**(`target`): [`Section`](Section.md) \| `null`

Defined in: src/book.ts:685

Gets a Section of the Book from the Spine
Alias for `book.spine.get`

#### Parameters

##### target

`string` | `number`

#### Returns

[`Section`](Section.md) \| `null`

***

### setRequestCredentials()

> **setRequestCredentials**(`credentials`): `void`

Defined in: src/book.ts:706

Set if request should use withCredentials

#### Parameters

##### credentials

`boolean`

#### Returns

`void`

***

### setRequestHeaders()

> **setRequestHeaders**(`headers`): `void`

Defined in: src/book.ts:714

Set headers request should use

#### Parameters

##### headers

`Record`\<`string`, `string`\>

#### Returns

`void`
