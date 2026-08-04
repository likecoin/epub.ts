[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Mapping

# Class: Mapping

Defined in: src/mapping.ts:18

Map text locations to CFI ranges

## Param

Layout to apply

## Param

Text direction

## Param

vertical or horizontal axis

## Param

toggle developer highlighting

## Constructors

### Constructor

> **new Mapping**(`layout`, `direction?`, `axis?`, `dev?`, `measurer?`): `Mapping`

Defined in: src/mapping.ts:25

#### Parameters

##### layout

[`LayoutProps`](../interfaces/LayoutProps.md)

##### direction?

`string`

##### axis?

`string`

##### dev?

`boolean` = `false`

##### measurer?

`TextMeasurer`

#### Returns

`Mapping`

## Properties

### \_dev

> **\_dev**: `boolean`

Defined in: src/mapping.ts:22

***

### \_measurer

> **\_measurer**: `TextMeasurer` \| `null`

Defined in: src/mapping.ts:23

***

### direction

> **direction**: `string`

Defined in: src/mapping.ts:21

***

### horizontal

> **horizontal**: `boolean`

Defined in: src/mapping.ts:20

***

### layout

> **layout**: [`LayoutProps`](../interfaces/LayoutProps.md)

Defined in: src/mapping.ts:19

## Methods

### axis()

> **axis**(`axis?`): `boolean`

Defined in: src/mapping.ts:862

Set the axis for mapping

#### Parameters

##### axis?

`string`

horizontal | vertical

#### Returns

`boolean`

is it horizontal?

***

### findRanges()

> **findRanges**(`view`): [`RangePair`](../interfaces/RangePair.md)[]

Defined in: src/mapping.ts:138

#### Parameters

##### view

`IframeView`

#### Returns

[`RangePair`](../interfaces/RangePair.md)[]

***

### page()

> **page**(`contents`, `cfiBase`, `start`, `end`): [`EpubCFIPair`](../interfaces/EpubCFIPair.md) \| `undefined`

Defined in: src/mapping.ts:50

Find CFI pairs for a page

#### Parameters

##### contents

[`Contents`](Contents.md)

Contents from view

##### cfiBase

`string`

string of the base for a cfi

##### start

`number`

position to start at

##### end

`number`

position to end at

#### Returns

[`EpubCFIPair`](../interfaces/EpubCFIPair.md) \| `undefined`

***

### rangeListToCfiList()

> **rangeListToCfiList**(`cfiBase`, `columns`): [`EpubCFIPair`](../interfaces/EpubCFIPair.md)[]

Defined in: src/mapping.ts:843

#### Parameters

##### cfiBase

`string`

##### columns

[`RangePair`](../interfaces/RangePair.md)[]

#### Returns

[`EpubCFIPair`](../interfaces/EpubCFIPair.md)[]

***

### section()

> **section**(`view`): [`EpubCFIPair`](../interfaces/EpubCFIPair.md)[]

Defined in: src/mapping.ts:36

Find CFI pairs for entire section at once

#### Parameters

##### view

`IframeView`

#### Returns

[`EpubCFIPair`](../interfaces/EpubCFIPair.md)[]
