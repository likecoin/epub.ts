[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Locations

# Class: Locations

Defined in: locations.ts:16

Find Locations for a Book

## Param

## Param

## Param

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)

## Constructors

### Constructor

> **new Locations**(`spine`, `request`, `pause?`): `Locations`

Defined in: locations.ts:35

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

> **\_current**: `number`

Defined in: locations.ts:30

***

### \_currentCfi

> **\_currentCfi**: `string`

Defined in: locations.ts:32

***

### \_locations

> **\_locations**: `string`[]

Defined in: locations.ts:26

***

### \_locationsWords

> **\_locationsWords**: `object`[]

Defined in: locations.ts:27

#### cfi

> **cfi**: `string`

#### wordCount

> **wordCount**: `number`

***

### \_wordCounter

> **\_wordCounter**: `number`

Defined in: locations.ts:31

***

### break

> **break**: `number`

Defined in: locations.ts:29

***

### emit()

> **emit**: (`type`, ...`args`) => `void`

Defined in: locations.ts:19

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

### epubcfi

> **epubcfi**: [`EpubCFI`](EpubCFI.md)

Defined in: locations.ts:25

***

### off()

> **off**: (`type`, `fn?`) => `this`

Defined in: locations.ts:18

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

Defined in: locations.ts:17

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

### pause

> **pause**: `number`

Defined in: locations.ts:23

***

### processingTimeout

> **processingTimeout**: `Timeout` \| `undefined`

Defined in: locations.ts:33

***

### q

> **q**: `Queue`

Defined in: locations.ts:24

***

### request

> **request**: [`RequestFunction`](../type-aliases/RequestFunction.md)

Defined in: locations.ts:22

***

### spine

> **spine**: [`Spine`](Spine.md)

Defined in: locations.ts:21

***

### total

> **total**: `number`

Defined in: locations.ts:28

## Accessors

### currentLocation

#### Get Signature

> **get** **currentLocation**(): `number`

Defined in: locations.ts:481

Get the current location

##### Returns

`number`

#### Set Signature

> **set** **currentLocation**(`curr`): `void`

Defined in: locations.ts:488

Set the current location

##### Parameters

###### curr

`string` | `number`

##### Returns

`void`

## Methods

### cfiFromLocation()

> **cfiFromLocation**(`loc`): `string` \| `number`

Defined in: locations.ts:389

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

Defined in: locations.ts:408

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

Defined in: locations.ts:255

#### Parameters

##### s

`string`

#### Returns

`number`

***

### createRange()

> **createRange**(): `object`

Defined in: locations.ts:89

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

Defined in: locations.ts:499

#### Returns

`void`

***

### generate()

> **generate**(`chars?`): `Promise`\<`string`[]\>

Defined in: locations.ts:62

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

Defined in: locations.ts:207

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

Defined in: locations.ts:447

#### Returns

`number`

***

### length()

> **length**(): `number`

Defined in: locations.ts:495

Locations length

#### Returns

`number`

***

### load()

> **load**(`locations`): `string`[]

Defined in: locations.ts:429

Load locations from JSON

#### Parameters

##### locations

`string` | `string`[]

#### Returns

`string`[]

***

### locationFromCfi()

> **locationFromCfi**(`cfi`): `number`

Defined in: locations.ts:338

Get a location from an EpubCFI

#### Parameters

##### cfi

`string` | [`EpubCFI`](EpubCFI.md)

#### Returns

`number`

***

### parse()

> **parse**(`contents`, `cfiBase`, `chars?`): `string`[]

Defined in: locations.ts:114

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

Defined in: locations.ts:262

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

Defined in: locations.ts:361

Get a percentage position in locations from an EpubCFI

#### Parameters

##### cfi

`string` | [`EpubCFI`](EpubCFI.md)

#### Returns

`number` \| `null`

***

### percentageFromLocation()

> **percentageFromLocation**(`loc`): `number`

Defined in: locations.ts:376

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

Defined in: locations.ts:98

#### Parameters

##### section

[`Section`](Section.md)

#### Returns

`Promise`\<`string`[]\>

***

### processWords()

> **processWords**(`section`, `wordCount`, `startCfi?`, `count?`): `Promise`\<`object`[]\>

Defined in: locations.ts:235

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

Defined in: locations.ts:443

Save locations to JSON

#### Returns

`string`

***

### setCurrent()

> **setCurrent**(`curr`): `void`

Defined in: locations.ts:451

#### Parameters

##### curr

`string` | `number`

#### Returns

`void`
