[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Section

# Class: Section

Defined in: src/section.ts:15

Represents a Section of the Book

In most books this is equivalent to a Chapter

## Param

The spine item representing the section

## Param

hooks for serialize and content

## Constructors

### Constructor

> **new Section**(`item`, `hooks?`): `Section`

Defined in: src/section.ts:32

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

Defined in: src/section.ts:22

***

### cfiBase

> **cfiBase**: `string` \| `undefined`

Defined in: src/section.ts:25

***

### contents

> **contents**: `Element` \| `undefined`

Defined in: src/section.ts:28

***

### document

> **document**: `Document` \| `undefined`

Defined in: src/section.ts:27

***

### hooks

> **hooks**: \{ `content`: `Hook`; `serialize`: `Hook`; \} \| `undefined`

Defined in: src/section.ts:26

***

### href

> **href**: `string` \| `undefined`

Defined in: src/section.ts:20

***

### idref

> **idref**: `string` \| `undefined`

Defined in: src/section.ts:16

***

### index

> **index**: `number` \| `undefined`

Defined in: src/section.ts:19

***

### linear

> **linear**: `boolean` \| `undefined`

Defined in: src/section.ts:17

***

### next

> **next**: () => `Section` \| `undefined` \| `undefined`

Defined in: src/section.ts:23

***

### output

> **output**: `string` \| `undefined`

Defined in: src/section.ts:29

***

### prev

> **prev**: () => `Section` \| `undefined` \| `undefined`

Defined in: src/section.ts:24

***

### properties

> **properties**: `string`[] \| `undefined`

Defined in: src/section.ts:18

***

### request

> **request**: [`RequestFunction`](../type-aliases/RequestFunction.md)

Defined in: src/section.ts:30

***

### url

> **url**: `string` \| `undefined`

Defined in: src/section.ts:21

## Methods

### cfiFromElement()

> **cfiFromElement**(`el`): `string`

Defined in: src/section.ts:267

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

Defined in: src/section.ts:258

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

Defined in: src/section.ts:280

#### Returns

`void`

***

### find()

> **find**(`_query`): [`SearchResult`](../interfaces/SearchResult.md)[]

Defined in: src/section.ts:106

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

Defined in: src/section.ts:63

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

Defined in: src/section.ts:229

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

Defined in: src/section.ts:92

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

Defined in: src/section.ts:165

Search a string in multiple sequential Element of the section.

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

Defined in: src/section.ts:274

Unload the section document

#### Returns

`void`
