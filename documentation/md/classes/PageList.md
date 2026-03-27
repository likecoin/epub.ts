[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / PageList

# Class: PageList

Defined in: src/pagelist.ts:15

Page List Parser

## Param

## Constructors

### Constructor

> **new PageList**(`xml?`): `PageList`

Defined in: src/pagelist.ts:26

#### Parameters

##### xml?

`Document`

#### Returns

`PageList`

## Properties

### epubcfi

> **epubcfi**: [`EpubCFI`](EpubCFI.md) \| `undefined`

Defined in: src/pagelist.ts:18

***

### firstPage

> **firstPage**: `number`

Defined in: src/pagelist.ts:19

***

### lastPage

> **lastPage**: `number`

Defined in: src/pagelist.ts:20

***

### locations

> **locations**: `string`[] \| `undefined`

Defined in: src/pagelist.ts:17

***

### ncx

> **ncx**: `Document` \| `undefined`

Defined in: src/pagelist.ts:23

***

### pageList

> **pageList**: [`PageListItem`](../interfaces/PageListItem.md)[] \| `undefined`

Defined in: src/pagelist.ts:24

***

### pages

> **pages**: `number`[] \| `undefined`

Defined in: src/pagelist.ts:16

***

### toc

> **toc**: `Document` \| `undefined`

Defined in: src/pagelist.ts:22

***

### totalPages

> **totalPages**: `number`

Defined in: src/pagelist.ts:21

## Methods

### cfiFromPage()

> **cfiFromPage**(`pg`): `string` \| `number`

Defined in: src/pagelist.ts:221

Get an EpubCFI from a Page List Item

#### Parameters

##### pg

`string` | `number`

#### Returns

`string` \| `number`

cfi

***

### destroy()

> **destroy**(): `void`

Defined in: src/pagelist.ts:272

Destroy

#### Returns

`void`

***

### ncxItem()

> **ncxItem**(`item`): [`PageListItem`](../interfaces/PageListItem.md)

Defined in: src/pagelist.ts:112

#### Parameters

##### item

`Element`

#### Returns

[`PageListItem`](../interfaces/PageListItem.md)

***

### pageFromCfi()

> **pageFromCfi**(`cfi`): `number`

Defined in: src/pagelist.ts:183

Get a PageList result from a EpubCFI

#### Parameters

##### cfi

`string`

EpubCFI String

#### Returns

`number`

page

***

### pageFromPercentage()

> **pageFromPercentage**(`percent`): `number`

Defined in: src/pagelist.ts:243

Get a Page from Book percentage

#### Parameters

##### percent

`number`

#### Returns

`number`

page

***

### parse()

> **parse**(`xml`): [`PageListItem`](../interfaces/PageListItem.md)[]

Defined in: src/pagelist.ts:51

Parse PageList Xml

#### Parameters

##### xml

`Document`

#### Returns

[`PageListItem`](../interfaces/PageListItem.md)[]

***

### parseNcx()

> **parseNcx**(`navXml`): [`PageListItem`](../interfaces/PageListItem.md)[]

Defined in: src/pagelist.ts:88

#### Parameters

##### navXml

`Document`

#### Returns

[`PageListItem`](../interfaces/PageListItem.md)[]

***

### percentageFromCfi()

> **percentageFromCfi**(`cfi`): `number`

Defined in: src/pagelist.ts:263

Returns a value between 0 - 1 corresponding to the location of a cfi

#### Parameters

##### cfi

`string`

EpubCFI String

#### Returns

`number`

percentage

***

### percentageFromPage()

> **percentageFromPage**(`pg`): `number`

Defined in: src/pagelist.ts:253

Returns a value between 0 - 1 corresponding to the location of a page

#### Parameters

##### pg

`number`

the page

#### Returns

`number`

percentage
