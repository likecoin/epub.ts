[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Locations

# Class: Locations

Defined in: src/locations.ts:24

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<[`LocationsEvents`](../interfaces/LocationsEvents.md)\>

## Constructors

### Constructor

> **new Locations**(`spine`, `request`, `pause?`): `Locations`

Defined in: src/locations.ts:44

#### Parameters

##### spine

[`Spine`](Spine.md)

##### request

[`RequestFunction`](../type-aliases/RequestFunction.md)

##### pause?

`number`

#### Returns

`Locations`

## Properties

### \_current

> **\_current**: `number` \| `undefined`

Defined in: src/locations.ts:38

***

### \_currentCfi

> **\_currentCfi**: `string` \| `undefined`

Defined in: src/locations.ts:40

***

### \_locations

> **\_locations**: `string`[] \| `undefined`

Defined in: src/locations.ts:34

***

### \_locationsWords

> **\_locationsWords**: `object`[]

Defined in: src/locations.ts:35

#### cfi

> **cfi**: `string`

#### wordCount

> **wordCount**: `number`

***

### \_wordCounter

> **\_wordCounter**: `number`

Defined in: src/locations.ts:39

***

### break

> **break**: `number` \| `undefined`

Defined in: src/locations.ts:37

***

### emit()

> **emit**: \<`K`\>(`type`, ...`args`) => `void`

Defined in: src/locations.ts:27

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### args

...[`LocationsEvents`](../interfaces/LocationsEvents.md)\[`K`\]

#### Returns

`void`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`emit`](../interfaces/IEventEmitter.md#emit)

***

### epubcfi

> **epubcfi**: [`EpubCFI`](EpubCFI.md) \| `undefined`

Defined in: src/locations.ts:33

***

### layout

> **layout**: `string` \| `undefined`

Defined in: src/locations.ts:42

***

### off()

> **off**: \<`K`\>(`type`, `fn?`) => `void`

Defined in: src/locations.ts:26

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

Defined in: src/locations.ts:25

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

### pause

> **pause**: `number` \| `undefined`

Defined in: src/locations.ts:31

***

### processingTimeout

> **processingTimeout**: `number` \| `Timeout` \| `undefined`

Defined in: src/locations.ts:41

***

### q

> **q**: `Queue` \| `undefined`

Defined in: src/locations.ts:32

***

### request

> **request**: [`RequestFunction`](../type-aliases/RequestFunction.md) \| `undefined`

Defined in: src/locations.ts:30

***

### spine

> **spine**: [`Spine`](Spine.md) \| `undefined`

Defined in: src/locations.ts:29

***

### total

> **total**: `number` \| `undefined`

Defined in: src/locations.ts:36

## Accessors

### currentLocation

#### Get Signature

> **get** **currentLocation**(): `number` \| `undefined`

Defined in: src/locations.ts:547

Get the current location

##### Returns

`number` \| `undefined`

#### Set Signature

> **set** **currentLocation**(`curr`): `void`

Defined in: src/locations.ts:554

Set the current location

##### Parameters

###### curr

`string` | `number` | `undefined`

##### Returns

`void`

## Methods

### cfiFromLocation()

> **cfiFromLocation**(`loc`): `string` \| `number`

Defined in: src/locations.ts:455

Get an EpubCFI from location index

#### Parameters

##### loc

`string` | `number`

#### Returns

`string` \| `number`

cfi

***

### cfiFromPercentage()

> **cfiFromPercentage**(`percentage`): `string` \| `number`

Defined in: src/locations.ts:474

Get an EpubCFI from location percentage

#### Parameters

##### percentage

`number`

#### Returns

`string` \| `number`

cfi

***

### countWords()

> **countWords**(`s`): `number`

Defined in: src/locations.ts:273

#### Parameters

##### s

`string`

#### Returns

`number`

***

### createRange()

> **createRange**(): `object`

Defined in: src/locations.ts:100

#### Returns

`object`

##### endContainer

> **endContainer**: `Node` \| `undefined`

##### endOffset

> **endOffset**: `number` \| `undefined`

##### startContainer

> **startContainer**: `Node` \| `undefined`

##### startOffset

> **startOffset**: `number` \| `undefined`

***

### destroy()

> **destroy**(): `void`

Defined in: src/locations.ts:565

#### Returns

`void`

***

### generate()

> **generate**(`chars?`): `Promise`\<`string`[]\>

Defined in: src/locations.ts:73

Load all of sections in the book to generate locations

#### Parameters

##### chars?

`number`

how many chars to split on

#### Returns

`Promise`\<`string`[]\>

locations

***

### generateFromWords()

> **generateFromWords**(`startCfi?`, `wordCount?`, `count?`): `Promise`\<`object`[]\>

Defined in: src/locations.ts:222

Load all of sections in the book to generate locations

#### Parameters

##### startCfi?

`string`

start position

##### wordCount?

`number`

how many words to split on

##### count?

`number`

result count

#### Returns

`Promise`\<`object`[]\>

locations

***

### getCurrent()

> **getCurrent**(): `number`

Defined in: src/locations.ts:513

#### Returns

`number`

***

### length()

> **length**(): `number`

Defined in: src/locations.ts:561

Locations length

#### Returns

`number`

***

### load()

> **load**(`locations`): `string`[]

Defined in: src/locations.ts:495

Load locations from JSON

#### Parameters

##### locations

`string` | `string`[]

#### Returns

`string`[]

***

### locationFromCfi()

> **locationFromCfi**(`cfi`): `number`

Defined in: src/locations.ts:356

Get a location from an EpubCFI

#### Parameters

##### cfi

`string` | [`EpubCFI`](EpubCFI.md)

#### Returns

`number`

***

### locationFromHref()

> **locationFromHref**(`href`): `number`

Defined in: src/locations.ts:394

Get a location index from a navigation href

Resolves to the first location of the section the href points at, so
entries sharing a section (`chapter.xhtml#a` and `chapter.xhtml#b`)
return the same index. Before locations are generated, pre-paginated
sections still resolve, since each one is exactly one page.

#### Parameters

##### href

`string`

#### Returns

`number`

location index, or -1 if it cannot be resolved

***

### parse()

> **parse**(`contents`, `cfiBase`, `chars?`): `string`[]

Defined in: src/locations.ts:126

#### Parameters

##### contents

`Element`

##### cfiBase

`string`

##### chars?

`number`

#### Returns

`string`[]

***

### parseWords()

> **parseWords**(`contents`, `section`, `wordCount`, `startCfi?`): `object`[]

Defined in: src/locations.ts:280

#### Parameters

##### contents

`Element`

##### section

[`Section`](Section.md)

##### wordCount

`number`

##### startCfi?

[`EpubCFI`](EpubCFI.md)

#### Returns

`object`[]

***

### percentageFromCfi()

> **percentageFromCfi**(`cfi`): `number` \| `null`

Defined in: src/locations.ts:427

Get a percentage position in locations from an EpubCFI

#### Parameters

##### cfi

`string` | [`EpubCFI`](EpubCFI.md)

#### Returns

`number` \| `null`

***

### percentageFromLocation()

> **percentageFromLocation**(`loc`): `number`

Defined in: src/locations.ts:442

Get a percentage position from a location index

#### Parameters

##### loc

`number`

location index

#### Returns

`number`

percentage

***

### process()

> **process**(`section`): `Promise`\<`string`[]\>

Defined in: src/locations.ts:109

#### Parameters

##### section

[`Section`](Section.md)

#### Returns

`Promise`\<`string`[]\>

***

### processWords()

> **processWords**(`section`, `wordCount`, `startCfi?`, `count?`): `Promise`\<`object`[]\>

Defined in: src/locations.ts:250

#### Parameters

##### section

[`Section`](Section.md)

##### wordCount

`number`

##### startCfi?

[`EpubCFI`](EpubCFI.md)

##### count?

`number`

#### Returns

`Promise`\<`object`[]\>

***

### save()

> **save**(): `string`

Defined in: src/locations.ts:509

Save locations to JSON

#### Returns

`string`

***

### setCurrent()

> **setCurrent**(`curr`): `void`

Defined in: src/locations.ts:517

#### Parameters

##### curr

`string` | `number` | `undefined`

#### Returns

`void`
