[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Section

# Class: Section

Defined in: section.ts:17

Represents a Section of the Book

In most books this is equivalent to a Chapter

## Param

The spine item representing the section

## Param

hooks for serialize and content

## Constructors

### Constructor

> **new Section**(`item`, `hooks?`): `Section`

Defined in: section.ts:34

#### Parameters

##### item

[`SpineItem`](../interfaces/SpineItem.md)

##### hooks?

###### content

`Hook`

###### serialize

`Hook`

#### Returns

`Section`

## Properties

### canonical

> **canonical**: `string`

Defined in: section.ts:24

***

### cfiBase

> **cfiBase**: `string`

Defined in: section.ts:27

***

### contents

> **contents**: `Element` \| `undefined`

Defined in: section.ts:30

***

### document

> **document**: `Document` \| `undefined`

Defined in: section.ts:29

***

### hooks

> **hooks**: `object`

Defined in: section.ts:28

#### content

> **content**: `Hook`

#### serialize

> **serialize**: `Hook`

***

### href

> **href**: `string`

Defined in: section.ts:22

***

### idref

> **idref**: `string`

Defined in: section.ts:18

***

### index

> **index**: `number`

Defined in: section.ts:21

***

### linear

> **linear**: `boolean`

Defined in: section.ts:19

***

### next()

> **next**: () => `Section` \| `undefined`

Defined in: section.ts:25

#### Returns

`Section` \| `undefined`

***

### output

> **output**: `string` \| `undefined`

Defined in: section.ts:31

***

### prev()

> **prev**: () => `Section` \| `undefined`

Defined in: section.ts:26

#### Returns

`Section` \| `undefined`

***

### properties

> **properties**: `string`[]

Defined in: section.ts:20

***

### request

> **request**: [`RequestFunction`](../type-aliases/RequestFunction.md)

Defined in: section.ts:32

***

### url

> **url**: `string`

Defined in: section.ts:23

## Methods

### cfiFromElement()

> **cfiFromElement**(`el`): `string`

Defined in: section.ts:307

Get a CFI from an Element in the Section

#### Parameters

##### el

`Element`

#### Returns

`string`

cfi an EpubCFI string

***

### cfiFromRange()

> **cfiFromRange**(`_range`): `string`

Defined in: section.ts:298

Get a CFI from a Range in the Section

#### Parameters

##### \_range

`Range`

#### Returns

`string`

cfi an EpubCFI string

***

### destroy()

> **destroy**(): `void`

Defined in: section.ts:320

#### Returns

`void`

***

### find()

> **find**(`_query`): [`SearchResult`](../interfaces/SearchResult.md)[]

Defined in: section.ts:143

Find a string in a section

#### Parameters

##### \_query

`string`

The query string to find

#### Returns

[`SearchResult`](../interfaces/SearchResult.md)[]

A list of matches, with form {cfi, excerpt}

***

### load()

> **load**(`_request?`): `Promise`\<`Element`\>

Defined in: section.ts:65

Load the section from its url

#### Parameters

##### \_request?

[`RequestFunction`](../type-aliases/RequestFunction.md)

a request method to use for loading

#### Returns

`Promise`\<`Element`\>

a promise with the xml document

***

### reconcileLayoutSettings()

> **reconcileLayoutSettings**(`globalLayout`): `Record`\<`string`, `string`\>

Defined in: section.ts:269

Reconciles the current chapters layout properties with
the global layout properties.

#### Parameters

##### globalLayout

[`GlobalLayout`](../interfaces/GlobalLayout.md)

The global layout settings object, chapter properties string

#### Returns

`Record`\<`string`, `string`\>

layoutProperties Object with layout properties

***

### render()

> **render**(`_request?`): `Promise`\<`string`\>

Defined in: section.ts:106

Render the contents of a section

#### Parameters

##### \_request?

[`RequestFunction`](../type-aliases/RequestFunction.md)

a request method to use for loading

#### Returns

`Promise`\<`string`\>

output a serialized XML Document

***

### search()

> **search**(`_query`, `maxSeqEle?`): [`SearchResult`](../interfaces/SearchResult.md)[]

Defined in: section.ts:202

Search a string in multiple sequential Element of the section. If the document.createTreeWalker api is missed(eg: IE8), use `find` as a fallback.

#### Parameters

##### \_query

`string`

The query string to search

##### maxSeqEle?

`number` = `5`

The maximum number of Element that are combined for search, default value is 5.

#### Returns

[`SearchResult`](../interfaces/SearchResult.md)[]

A list of matches, with form {cfi, excerpt}

***

### unload()

> **unload**(): `void`

Defined in: section.ts:314

Unload the section document

#### Returns

`void`
