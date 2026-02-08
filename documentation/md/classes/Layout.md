[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Layout

# Class: Layout

Defined in: layout.ts:17

Figures out the CSS values to apply for a layout

## Param

## Param

## Param

## Param

## Param

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)

## Constructors

### Constructor

> **new Layout**(`settings`): `Layout`

Defined in: layout.ts:38

#### Parameters

##### settings

[`LayoutSettings`](../interfaces/LayoutSettings.md)

#### Returns

`Layout`

## Properties

### \_evenSpreads

> **\_evenSpreads**: `boolean`

Defined in: layout.ts:26

***

### \_flow

> **\_flow**: `string`

Defined in: layout.ts:27

***

### \_minSpreadWidth

> **\_minSpreadWidth**: `number`

Defined in: layout.ts:25

***

### \_spread

> **\_spread**: `boolean`

Defined in: layout.ts:24

***

### columnWidth

> **columnWidth**: `number`

Defined in: layout.ts:32

***

### delta

> **delta**: `number`

Defined in: layout.ts:31

***

### divisor

> **divisor**: `number`

Defined in: layout.ts:34

***

### emit()

> **emit**: (`type`, ...`args`) => `void`

Defined in: layout.ts:20

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

### gap

> **gap**: `number`

Defined in: layout.ts:33

***

### height

> **height**: `number`

Defined in: layout.ts:29

***

### name

> **name**: `string`

Defined in: layout.ts:23

***

### off()

> **off**: (`type`, `fn?`) => `this`

Defined in: layout.ts:19

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

Defined in: layout.ts:18

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

### pageWidth

> **pageWidth**: `number`

Defined in: layout.ts:35

***

### props

> **props**: [`LayoutProps`](../interfaces/LayoutProps.md)

Defined in: layout.ts:36

***

### settings

> **settings**: [`LayoutSettings`](../interfaces/LayoutSettings.md)

Defined in: layout.ts:22

***

### spreadWidth

> **spreadWidth**: `number`

Defined in: layout.ts:30

***

### width

> **width**: `number`

Defined in: layout.ts:28

## Methods

### calculate()

> **calculate**(`_width`, `_height`, `_gap?`): `void`

Defined in: layout.ts:126

Calculate the dimensions of the pagination

#### Parameters

##### \_width

`number`

width of the rendering

##### \_height

`number`

height of the rendering

##### \_gap?

`number`

width of the gap between columns

#### Returns

`void`

***

### count()

> **count**(`totalLength`, `pageLength?`): `object`

Defined in: layout.ts:235

Count number of pages

#### Parameters

##### totalLength

`number`

##### pageLength?

`number`

#### Returns

`object`

##### pages

> **pages**: `number`

##### spreads

> **spreads**: `number`

***

### flow()

> **flow**(`flow?`): `string`

Defined in: layout.ts:83

Switch the flow between paginated and scrolled

#### Parameters

##### flow?

`string`

paginated | scrolled

#### Returns

`string`

simplified flow

***

### format()

> **format**(`contents`, `section?`, `axis?`): `void`

Defined in: layout.ts:213

Apply Css to a Document

#### Parameters

##### contents

[`Contents`](Contents.md)

##### section?

[`Section`](Section.md)

##### axis?

`string`

#### Returns

`void`

***

### spread()

> **spread**(`spread?`, `min?`): `boolean`

Defined in: layout.ts:105

Switch between using spreads or not, and set the
width at which they switch to single.

#### Parameters

##### spread?

`string`

"none" | "always" | "auto"

##### min?

`number`

integer in pixels

#### Returns

`boolean`

spread true | false
