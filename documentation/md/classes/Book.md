[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Book

# Class: Book

Defined in: book.ts:75

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

## Examples

```ts
new Book("/path/to/book.epub", {})
```

```ts
new Book({ replacements: "blobUrl" })
```

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)

## Constructors

### Constructor

> **new Book**(`url?`, `options?`): `Book`

Defined in: book.ts:106

#### Parameters

##### url?

`string` | `ArrayBuffer` | `Blob` | [`BookOptions`](../interfaces/BookOptions.md)

##### options?

[`BookOptions`](../interfaces/BookOptions.md)

#### Returns

`Book`

## Properties

### archive

> **archive**: [`Archive`](Archive.md) \| `undefined`

Defined in: book.ts:92

***

### archived

> **archived**: `boolean`

Defined in: book.ts:91

***

### container

> **container**: `Container` \| `undefined`

Defined in: book.ts:96

***

### cover

> **cover**: `string`

Defined in: book.ts:100

***

### displayOptions

> **displayOptions**: [`DisplayOptions`](DisplayOptions.md) \| `undefined`

Defined in: book.ts:98

***

### emit()

> **emit**: (`type`, ...`args`) => `void`

Defined in: book.ts:104

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

### isOpen

> **isOpen**: `boolean`

Defined in: book.ts:79

***

### isRendered

> **isRendered**: `boolean`

Defined in: book.ts:83

***

### loaded

> **loaded**: `BookLoadedState` \| `undefined`

Defined in: book.ts:81

***

### loading

> **loading**: `BookLoadingState` \| `undefined`

Defined in: book.ts:80

***

### locations

> **locations**: [`Locations`](Locations.md) \| `undefined`

Defined in: book.ts:86

***

### navigation

> **navigation**: [`Navigation`](Navigation.md) \| `undefined`

Defined in: book.ts:87

***

### off()

> **off**: (`type`, `fn?`) => `any`

Defined in: book.ts:103

#### Parameters

##### type

`string`

##### fn?

(...`args`) => `void`

#### Returns

`any`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`off`](../interfaces/IEventEmitter.md#off)

***

### on()

> **on**: (`type`, `fn`) => `any`

Defined in: book.ts:102

#### Parameters

##### type

`string`

##### fn

(...`args`) => `void`

#### Returns

`any`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`on`](../interfaces/IEventEmitter.md#on)

***

### opened

> **opened**: `Promise`\<`Book`\> \| `undefined`

Defined in: book.ts:78

***

### opening

> **opening**: `defer`

Defined in: book.ts:77

***

### package

> **package**: [`Packaging`](Packaging.md) \| `undefined`

Defined in: book.ts:99

***

### packaging

> **packaging**: [`Packaging`](Packaging.md) \| `undefined`

Defined in: book.ts:97

***

### pageList

> **pageList**: [`PageList`](PageList.md) \| `undefined`

Defined in: book.ts:88

***

### path

> **path**: `Path` \| `undefined`

Defined in: book.ts:90

***

### ready

> **ready**: `Promise`\<\[[`PackagingManifestObject`](../interfaces/PackagingManifestObject.md), [`Spine`](Spine.md), [`PackagingMetadataObject`](../interfaces/PackagingMetadataObject.md), `string`, [`Navigation`](Navigation.md), [`Resources`](Resources.md), [`DisplayOptions`](DisplayOptions.md)\]\> \| `undefined`

Defined in: book.ts:82

***

### rendition

> **rendition**: [`Rendition`](Rendition.md) \| `undefined`

Defined in: book.ts:95

***

### request

> **request**: [`RequestFunction`](../type-aliases/RequestFunction.md)

Defined in: book.ts:84

***

### resources

> **resources**: [`Resources`](Resources.md) \| `undefined`

Defined in: book.ts:94

***

### settings

> **settings**: [`BookOptions`](../interfaces/BookOptions.md) & `Record`\<`string`, `any`\>

Defined in: book.ts:76

***

### spine

> **spine**: [`Spine`](Spine.md) \| `undefined`

Defined in: book.ts:85

***

### storage

> **storage**: [`Store`](Store.md) \| `undefined`

Defined in: book.ts:93

***

### url

> **url**: `Url` \| `undefined`

Defined in: book.ts:89

## Methods

### canonical()

> **canonical**(`path`): `string`

Defined in: book.ts:443

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

Defined in: book.ts:722

Get the cover url

#### Returns

`Promise`\<`string` \| `null`\>

coverUrl

***

### destroy()

> **destroy**(): `void`

Defined in: book.ts:785

Destroy the Book and all associated objects

#### Returns

`void`

***

### getRange()

> **getRange**(`cfiRange`): `Promise`\<`Range`\>

Defined in: book.ts:757

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

Defined in: book.ts:777

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

> **load**(`path`, `_type?`): `Promise`\<`any`\>

Defined in: book.ts:401

Load a resource from the Book

#### Parameters

##### path

`string`

path to the resource to load

##### \_type?

`string`

#### Returns

`Promise`\<`any`\>

returns a promise with the requested resource

***

### open()

> **open**(`input`, `what?`): `Promise`\<`void`\>

Defined in: book.ts:302

Open a epub or url

#### Parameters

##### input

Url, Path or ArrayBuffer

`string` | `ArrayBuffer` | `Blob`

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

Defined in: book.ts:628

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

Defined in: book.ts:416

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

Defined in: book.ts:618

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

Defined in: book.ts:639

Set if request should use withCredentials

#### Parameters

##### credentials

`boolean`

#### Returns

`void`

***

### setRequestHeaders()

> **setRequestHeaders**(`headers`): `void`

Defined in: book.ts:647

Set headers request should use

#### Parameters

##### headers

`Record`\<`string`, `string`\>

#### Returns

`void`
