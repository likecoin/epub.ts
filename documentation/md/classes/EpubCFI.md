[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / EpubCFI

# Class: EpubCFI

Defined in: src/epubcfi.ts:26

Parsing and creation of EpubCFIs: http://www.idpf.org/epub/linking/cfi/epub-cfi.html

Implements:
- Character Offset: epubcfi(/6/4[chap01ref]!/4[body01]/10[para05]/2/1:3)
- Simple Ranges : epubcfi(/6/4[chap01ref]!/4[body01]/10[para05],/2/1:1,/3:4)

Does Not Implement:
- Temporal Offset (~)
- Spatial Offset (@)
- Temporal-Spatial Offset (~ + @)
- Text Location Assertion ([)

## Param

## Param

## Param

class to ignore when parsing DOM

## Constructors

### Constructor

> **new EpubCFI**(`cfiFrom?`, `base?`, `ignoreClass?`): `EpubCFI`

Defined in: src/epubcfi.ts:36

#### Parameters

##### cfiFrom?

`string` | `Node` | `Range` | `EpubCFI`

##### base?

`string` | [`EpubCFIComponent`](../interfaces/EpubCFIComponent.md)

##### ignoreClass?

`string`

#### Returns

`EpubCFI`

## Properties

### base

> **base**: [`EpubCFIComponent`](../interfaces/EpubCFIComponent.md)

Defined in: src/epubcfi.ts:28

***

### end

> **end**: [`EpubCFIComponent`](../interfaces/EpubCFIComponent.md) \| `null`

Defined in: src/epubcfi.ts:33

***

### id

> **id**: `string` \| `null`

Defined in: src/epubcfi.ts:34

***

### path

> **path**: [`EpubCFIComponent`](../interfaces/EpubCFIComponent.md)

Defined in: src/epubcfi.ts:31

***

### range

> **range**: `boolean`

Defined in: src/epubcfi.ts:30

***

### spinePos

> **spinePos**: `number`

Defined in: src/epubcfi.ts:29

***

### start

> **start**: [`EpubCFIComponent`](../interfaces/EpubCFIComponent.md) \| `null`

Defined in: src/epubcfi.ts:32

***

### str

> **str**: `string`

Defined in: src/epubcfi.ts:27

## Methods

### collapse()

> **collapse**(`toStart?`): `void`

Defined in: src/epubcfi.ts:1050

Collapse a CFI Range to a single CFI Position

#### Parameters

##### toStart?

`boolean`

#### Returns

`void`

***

### compare()

> **compare**(`cfiOne`, `cfiTwo`): `number`

Defined in: src/epubcfi.ts:345

Compare which of two CFIs is earlier in the text

#### Parameters

##### cfiOne

`string` | `EpubCFI`

##### cfiTwo

`string` | `EpubCFI`

#### Returns

`number`

First is earlier = -1, Second is earlier = 1, They are equal = 0

***

### equalStep()

> **equalStep**(`stepA`, `stepB`): `boolean`

Defined in: src/epubcfi.ts:499

#### Parameters

##### stepA

[`EpubCFIStep`](../interfaces/EpubCFIStep.md)

##### stepB

[`EpubCFIStep`](../interfaces/EpubCFIStep.md)

#### Returns

`boolean`

***

### filter()

> **filter**(`anchor`, `ignoreClass`): `false` \| `Node`

Defined in: src/epubcfi.ts:637

#### Parameters

##### anchor

`Node`

##### ignoreClass

`string`

#### Returns

`false` \| `Node`

***

### filteredPosition()

> **filteredPosition**(`anchor`, `ignoreClass`): `number`

Defined in: src/epubcfi.ts:764

#### Parameters

##### anchor

`Node`

##### ignoreClass

`string`

#### Returns

`number`

***

### filteredStep()

> **filteredStep**(`node`, `ignoreClass`): [`EpubCFIStep`](../interfaces/EpubCFIStep.md) \| `undefined`

Defined in: src/epubcfi.ts:432

#### Parameters

##### node

`Node`

##### ignoreClass

`string`

#### Returns

[`EpubCFIStep`](../interfaces/EpubCFIStep.md) \| `undefined`

***

### findNode()

> **findNode**(`steps`, `_doc?`, `ignoreClass?`): `Node` \| `undefined`

Defined in: src/epubcfi.ts:889

#### Parameters

##### steps

[`EpubCFIStep`](../interfaces/EpubCFIStep.md)[]

##### \_doc?

`Document`

##### ignoreClass?

`string`

#### Returns

`Node` \| `undefined`

***

### fixMiss()

> **fixMiss**(`steps`, `offset`, `_doc?`, `ignoreClass?`): `object`

Defined in: src/epubcfi.ts:906

#### Parameters

##### steps

[`EpubCFIStep`](../interfaces/EpubCFIStep.md)[]

##### offset

`number`

##### \_doc?

`Document`

##### ignoreClass?

`string`

#### Returns

`object`

##### container

> **container**: `Node`

##### offset

> **offset**: `number`

***

### fromNode()

> **fromNode**(`anchor`, `base`, `ignoreClass?`): `Partial`\<`Pick`\<`EpubCFI`, `"spinePos"` \| `"range"` \| `"base"` \| `"path"` \| `"start"` \| `"end"`\>\>

Defined in: src/epubcfi.ts:615

Create a CFI object from a Node

#### Parameters

##### anchor

`Node`

##### base

`string` | [`EpubCFIComponent`](../interfaces/EpubCFIComponent.md)

##### ignoreClass?

`string`

#### Returns

`Partial`\<`Pick`\<`EpubCFI`, `"spinePos"` \| `"range"` \| `"base"` \| `"path"` \| `"start"` \| `"end"`\>\>

cfi

***

### fromRange()

> **fromRange**(`range`, `base`, `ignoreClass?`): `Partial`\<`Pick`\<`EpubCFI`, `"spinePos"` \| `"range"` \| `"base"` \| `"path"` \| `"start"` \| `"end"`\>\>

Defined in: src/epubcfi.ts:520

Create a CFI object from a Range

#### Parameters

##### range

`Range`

##### base

`string` | [`EpubCFIComponent`](../interfaces/EpubCFIComponent.md)

##### ignoreClass?

`string`

#### Returns

`Partial`\<`Pick`\<`EpubCFI`, `"spinePos"` \| `"range"` \| `"base"` \| `"path"` \| `"start"` \| `"end"`\>\>

cfi

***

### generateChapterComponent()

> **generateChapterComponent**(`_spineNodeIndex`, `_pos`, `id?`): `string`

Defined in: src/epubcfi.ts:1032

#### Parameters

##### \_spineNodeIndex

`number`

##### \_pos

`string` | `number`

##### id?

`string`

#### Returns

`string`

***

### getChapterComponent()

> **getChapterComponent**(`cfiStr`): `string`

Defined in: src/epubcfi.ts:233

#### Parameters

##### cfiStr

`string`

#### Returns

`string`

***

### getCharecterOffsetComponent()

> **getCharecterOffsetComponent**(`cfiStr`): `string`

Defined in: src/epubcfi.ts:265

#### Parameters

##### cfiStr

`string`

#### Returns

`string`

***

### getPathComponent()

> **getPathComponent**(`cfiStr`): `string` \| `undefined`

Defined in: src/epubcfi.ts:240

#### Parameters

##### cfiStr

`string`

#### Returns

`string` \| `undefined`

***

### getRange()

> **getRange**(`cfiStr`): `false` \| \[`string`, `string`\]

Defined in: src/epubcfi.ts:251

#### Parameters

##### cfiStr

`string`

#### Returns

`false` \| \[`string`, `string`\]

***

### isCfiString()

> **isCfiString**(`str`): `boolean`

Defined in: src/epubcfi.ts:1022

Check if a string is wrapped with "epubcfi()"

#### Parameters

##### str

`unknown`

#### Returns

`boolean`

***

### joinSteps()

> **joinSteps**(`steps`): `string`

Defined in: src/epubcfi.ts:270

#### Parameters

##### steps

[`EpubCFIStep`](../interfaces/EpubCFIStep.md)[]

#### Returns

`string`

***

### normalizedMap()

> **normalizedMap**(`children`, `nodeType`, `ignoreClass`): `Record`\<`number`, `number`\>

Defined in: src/epubcfi.ts:713

#### Parameters

##### children

`NodeListOf`\<`ChildNode`\>

##### nodeType

`number`

##### ignoreClass

`string`

#### Returns

`Record`\<`number`, `number`\>

***

### parse()

> **parse**(`cfiStr`): `Partial`\<`Pick`\<`EpubCFI`, `"spinePos"` \| `"range"` \| `"base"` \| `"path"` \| `"start"` \| `"end"`\>\>

Defined in: src/epubcfi.ts:104

Parse a cfi string to a CFI object representation

#### Parameters

##### cfiStr

`string`

#### Returns

`Partial`\<`Pick`\<`EpubCFI`, `"spinePos"` \| `"range"` \| `"base"` \| `"path"` \| `"start"` \| `"end"`\>\>

cfi

***

### parseComponent()

> **parseComponent**(`componentStr`): [`EpubCFIComponent`](../interfaces/EpubCFIComponent.md)

Defined in: src/epubcfi.ts:151

#### Parameters

##### componentStr

`string`

#### Returns

[`EpubCFIComponent`](../interfaces/EpubCFIComponent.md)

***

### parseStep()

> **parseStep**(`stepStr`): [`EpubCFIStep`](../interfaces/EpubCFIStep.md) \| `undefined`

Defined in: src/epubcfi.ts:179

#### Parameters

##### stepStr

`string`

#### Returns

[`EpubCFIStep`](../interfaces/EpubCFIStep.md) \| `undefined`

***

### parseTerminal()

> **parseTerminal**(`termialStr`): `object`

Defined in: src/epubcfi.ts:210

#### Parameters

##### termialStr

`string`

#### Returns

`object`

##### assertion

> **assertion**: `string` \| `null`

##### offset

> **offset**: `number` \| `null`

***

### patchOffset()

> **patchOffset**(`anchor`, `offset`, `ignoreClass`): `number`

Defined in: src/epubcfi.ts:680

#### Parameters

##### anchor

`Node`

##### offset

`number`

##### ignoreClass

`string`

#### Returns

`number`

***

### pathTo()

> **pathTo**(`node`, `offset`, `ignoreClass?`): [`EpubCFIComponent`](../interfaces/EpubCFIComponent.md)

Defined in: src/epubcfi.ts:451

#### Parameters

##### node

`Node`

##### offset

`number` | `null`

##### ignoreClass?

`string`

#### Returns

[`EpubCFIComponent`](../interfaces/EpubCFIComponent.md)

***

### position()

> **position**(`anchor`): `number`

Defined in: src/epubcfi.ts:748

#### Parameters

##### anchor

`Node`

#### Returns

`number`

***

### segmentString()

> **segmentString**(`segment`): `string`

Defined in: src/epubcfi.ts:296

#### Parameters

##### segment

[`EpubCFIComponent`](../interfaces/EpubCFIComponent.md)

#### Returns

`string`

***

### step()

> **step**(`node`): [`EpubCFIStep`](../interfaces/EpubCFIStep.md)

Defined in: src/epubcfi.ts:421

#### Parameters

##### node

`Node`

#### Returns

[`EpubCFIStep`](../interfaces/EpubCFIStep.md)

***

### stepsToQuerySelector()

> **stepsToQuerySelector**(`steps`): `string`

Defined in: src/epubcfi.ts:821

#### Parameters

##### steps

[`EpubCFIStep`](../interfaces/EpubCFIStep.md)[]

#### Returns

`string`

***

### stepsToXpath()

> **stepsToXpath**(`steps`): `string`

Defined in: src/epubcfi.ts:787

#### Parameters

##### steps

[`EpubCFIStep`](../interfaces/EpubCFIStep.md)[]

#### Returns

`string`

***

### textNodes()

> **textNodes**(`container`, `ignoreClass?`): `Node`[]

Defined in: src/epubcfi.ts:841

#### Parameters

##### container

`Node`

##### ignoreClass?

`string`

#### Returns

`Node`[]

***

### toRange()

> **toRange**(`_doc?`, `ignoreClass?`): `Range` \| `null`

Defined in: src/epubcfi.ts:949

Creates a DOM range representing a CFI

#### Parameters

##### \_doc?

`Document`

document referenced in the base

##### ignoreClass?

`string`

#### Returns

`Range` \| `null`

***

### toString()

> **toString**(): `string`

Defined in: src/epubcfi.ts:316

Convert CFI to a epubcfi(...) string

#### Returns

`string`

epubcfi

***

### walkToNode()

> **walkToNode**(`steps`, `_doc?`, `ignoreClass?`): `Node` \| `undefined`

Defined in: src/epubcfi.ts:853

#### Parameters

##### steps

[`EpubCFIStep`](../interfaces/EpubCFIStep.md)[]

##### \_doc?

`Document`

##### ignoreClass?

`string`

#### Returns

`Node` \| `undefined`
