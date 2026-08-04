[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Layout

# Class: Layout

Defined in: src/layout.ts:42

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<[`LayoutEvents`](../interfaces/LayoutEvents.md)\>

## Constructors

### Constructor

> **new Layout**(`settings`): `Layout`

Defined in: src/layout.ts:63

#### Parameters

##### settings

[`LayoutSettings`](../interfaces/LayoutSettings.md)

#### Returns

`Layout`

## Properties

### \_evenSpreads

> **\_evenSpreads**: `boolean`

Defined in: src/layout.ts:51

***

### \_flow

> **\_flow**: `string`

Defined in: src/layout.ts:52

***

### \_minSpreadWidth

> **\_minSpreadWidth**: `number`

Defined in: src/layout.ts:50

***

### \_spread

> **\_spread**: `boolean`

Defined in: src/layout.ts:49

***

### columnWidth

> **columnWidth**: `number`

Defined in: src/layout.ts:57

***

### delta

> **delta**: `number`

Defined in: src/layout.ts:56

***

### divisor

> **divisor**: `number`

Defined in: src/layout.ts:59

***

### emit()

> **emit**: \<`K`\>(`type`, ...`args`) => `void`

Defined in: src/layout.ts:45

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

Defined in: src/layout.ts:58

***

### height

> **height**: `number`

Defined in: src/layout.ts:54

***

### name

> **name**: `string`

Defined in: src/layout.ts:48

***

### off()

> **off**: \<`K`\>(`type`, `fn?`) => `void`

Defined in: src/layout.ts:44

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

Defined in: src/layout.ts:43

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

Defined in: src/layout.ts:60

***

### props

> **props**: [`LayoutProps`](../interfaces/LayoutProps.md)

Defined in: src/layout.ts:61

***

### settings

> **settings**: [`LayoutSettings`](../interfaces/LayoutSettings.md)

Defined in: src/layout.ts:47

***

### spreadWidth

> **spreadWidth**: `number`

Defined in: src/layout.ts:55

***

### width

> **width**: `number`

Defined in: src/layout.ts:53

## Methods

### calculate()

> **calculate**(`_width`, `_height`, `_gap?`): `void`

Defined in: src/layout.ts:151

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

Defined in: src/layout.ts:266

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

Defined in: src/layout.ts:108

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

Defined in: src/layout.ts:238

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

Defined in: src/layout.ts:130

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
