[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Layout

# Class: Layout

Defined in: src/layout.ts:21

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<[`LayoutEvents`](../interfaces/LayoutEvents.md)\>

## Constructors

### Constructor

> **new Layout**(`settings`): `Layout`

Defined in: src/layout.ts:42

#### Parameters

##### settings

[`LayoutSettings`](../interfaces/LayoutSettings.md)

#### Returns

`Layout`

## Properties

### \_evenSpreads

> **\_evenSpreads**: `boolean`

Defined in: src/layout.ts:30

***

### \_flow

> **\_flow**: `string`

Defined in: src/layout.ts:31

***

### \_minSpreadWidth

> **\_minSpreadWidth**: `number`

Defined in: src/layout.ts:29

***

### \_spread

> **\_spread**: `boolean`

Defined in: src/layout.ts:28

***

### columnWidth

> **columnWidth**: `number`

Defined in: src/layout.ts:36

***

### delta

> **delta**: `number`

Defined in: src/layout.ts:35

***

### divisor

> **divisor**: `number`

Defined in: src/layout.ts:38

***

### emit()

> **emit**: \<`K`\>(`type`, ...`args`) => `void`

Defined in: src/layout.ts:24

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### args

...[`LayoutEvents`](../interfaces/LayoutEvents.md)\[`K`\]

#### Returns

`void`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`emit`](../interfaces/IEventEmitter.md#emit)

***

### gap

> **gap**: `number`

Defined in: src/layout.ts:37

***

### height

> **height**: `number`

Defined in: src/layout.ts:33

***

### name

> **name**: `string`

Defined in: src/layout.ts:27

***

### off()

> **off**: \<`K`\>(`type`, `fn?`) => `void`

Defined in: src/layout.ts:23

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

Defined in: src/layout.ts:22

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

### pageWidth

> **pageWidth**: `number`

Defined in: src/layout.ts:39

***

### props

> **props**: [`LayoutProps`](../interfaces/LayoutProps.md)

Defined in: src/layout.ts:40

***

### settings

> **settings**: [`LayoutSettings`](../interfaces/LayoutSettings.md)

Defined in: src/layout.ts:26

***

### spreadWidth

> **spreadWidth**: `number`

Defined in: src/layout.ts:34

***

### width

> **width**: `number`

Defined in: src/layout.ts:32

## Methods

### calculate()

> **calculate**(`_width`, `_height`, `_gap?`): `void`

Defined in: src/layout.ts:130

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

Defined in: src/layout.ts:239

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

Defined in: src/layout.ts:87

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

Defined in: src/layout.ts:217

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

Defined in: src/layout.ts:109

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
