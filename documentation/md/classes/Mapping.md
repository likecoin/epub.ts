[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Mapping

# Class: Mapping

Defined in: mapping.ts:15

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

> **new Mapping**(`layout`, `direction?`, `axis?`, `dev?`): `Mapping`

Defined in: mapping.ts:21

#### Parameters

##### layout

[`LayoutProps`](../interfaces/LayoutProps.md)

##### direction?

`string`

##### axis?

`string`

##### dev?

`boolean` = `false`

#### Returns

`Mapping`

## Properties

### \_dev

> **\_dev**: `boolean`

Defined in: mapping.ts:19

***

### direction

> **direction**: `string`

Defined in: mapping.ts:18

***

### horizontal

> **horizontal**: `boolean`

Defined in: mapping.ts:17

***

### layout

> **layout**: [`LayoutProps`](../interfaces/LayoutProps.md)

Defined in: mapping.ts:16

## Methods

### axis()

> **axis**(`axis?`): `boolean`

Defined in: mapping.ts:508

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

Defined in: mapping.ts:112

#### Parameters

##### view

`IframeView`

#### Returns

[`RangePair`](../interfaces/RangePair.md)[]

***

### page()

> **page**(`contents`, `cfiBase`, `start`, `end`): [`EpubCFIPair`](../interfaces/EpubCFIPair.md) \| `undefined`

Defined in: mapping.ts:45

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

Defined in: mapping.ts:489

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

Defined in: mapping.ts:31

Find CFI pairs for entire section at once

#### Parameters

##### view

`IframeView`

#### Returns

[`EpubCFIPair`](../interfaces/EpubCFIPair.md)[]
