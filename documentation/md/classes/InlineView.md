[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / InlineView

# Class: InlineView

Defined in: src/managers/views/inline.ts:29

Renders a section directly into the host document instead of an iframe.

Exported for compatibility with epubjs deep imports. Unlike IframeView
there is no iframe and no sandbox — the section's markup is assigned to
`innerHTML` in the host document, so handler attributes such as `onerror` run
with the host origin's authority. Do not use it with untrusted books.
See https://github.com/likecoin/epub.ts/blob/master/SECURITY.md

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<[`InlineViewEvents`](../interfaces/InlineViewEvents.md)\>

## Constructors

### Constructor

> **new InlineView**(`section`, `options?`): `InlineView`

Defined in: src/managers/views/inline.ts:66

#### Parameters

##### section

[`Section`](Section.md)

##### options?

[`ViewSettings`](../interfaces/ViewSettings.md)

#### Returns

`InlineView`

## Properties

### \_expanding

> **\_expanding**: `boolean`

Defined in: src/managers/views/inline.ts:51

***

### \_height

> **\_height**: `number` \| `undefined`

Defined in: src/managers/views/inline.ts:47

***

### \_needsReframe

> **\_needsReframe**: `boolean`

Defined in: src/managers/views/inline.ts:50

***

### \_textHeight

> **\_textHeight**: `number` \| `undefined`

Defined in: src/managers/views/inline.ts:49

***

### \_textWidth

> **\_textWidth**: `number` \| `undefined`

Defined in: src/managers/views/inline.ts:48

***

### \_width

> **\_width**: `number` \| `undefined`

Defined in: src/managers/views/inline.ts:46

***

### added

> **added**: `boolean`

Defined in: src/managers/views/inline.ts:35

***

### contents

> **contents**: [`Contents`](Contents.md) \| `undefined`

Defined in: src/managers/views/inline.ts:58

***

### displayed

> **displayed**: `boolean`

Defined in: src/managers/views/inline.ts:36

***

### document

> **document**: `Document`

Defined in: src/managers/views/inline.ts:56

***

### element

> **element**: `HTMLElement`

Defined in: src/managers/views/inline.ts:34

***

### elementBounds

> **elementBounds**: [`SizeObject`](../interfaces/SizeObject.md) \| `undefined`

Defined in: src/managers/views/inline.ts:52

***

### emit()

> **emit**: \<`K`\>(`type`, ...`args`) => `void`

Defined in: src/managers/views/inline.ts:64

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### args

...[`InlineViewEvents`](../interfaces/InlineViewEvents.md)\[`K`\]

#### Returns

`void`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`emit`](../interfaces/IEventEmitter.md#emit)

***

### epubcfi

> **epubcfi**: [`EpubCFI`](EpubCFI.md)

Defined in: src/managers/views/inline.ts:42

***

### fixedHeight

> **fixedHeight**: `number`

Defined in: src/managers/views/inline.ts:41

***

### fixedWidth

> **fixedWidth**: `number`

Defined in: src/managers/views/inline.ts:40

***

### frame

> **frame**: `HTMLDivElement` \| `undefined`

Defined in: src/managers/views/inline.ts:44

***

### height

> **height**: `number`

Defined in: src/managers/views/inline.ts:39

***

### id

> **id**: `string`

Defined in: src/managers/views/inline.ts:31

***

### index

> **index**: `number`

Defined in: src/managers/views/inline.ts:33

***

### layout

> **layout**: [`Layout`](Layout.md)

Defined in: src/managers/views/inline.ts:43

***

### lockedHeight

> **lockedHeight**: `number`

Defined in: src/managers/views/inline.ts:55

***

### lockedWidth

> **lockedWidth**: `number`

Defined in: src/managers/views/inline.ts:54

***

### off()

> **off**: \<`K`\>(`type`, `fn?`) => `void`

Defined in: src/managers/views/inline.ts:63

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

Defined in: src/managers/views/inline.ts:62

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

### prevBounds

> **prevBounds**: [`SizeObject`](../interfaces/SizeObject.md) \| `undefined`

Defined in: src/managers/views/inline.ts:53

***

### rendered

> **rendered**: `boolean`

Defined in: src/managers/views/inline.ts:37

***

### rendering

> **rendering**: `boolean`

Defined in: src/managers/views/inline.ts:59

***

### resizing

> **resizing**: `boolean`

Defined in: src/managers/views/inline.ts:45

***

### section

> **section**: [`Section`](Section.md)

Defined in: src/managers/views/inline.ts:32

***

### settings

> **settings**: [`ViewSettings`](../interfaces/ViewSettings.md) & `object`

Defined in: src/managers/views/inline.ts:30

#### Type Declaration

##### layout

> **layout**: [`Layout`](Layout.md)

***

### stopExpanding

> **stopExpanding**: `boolean`

Defined in: src/managers/views/inline.ts:60

***

### width

> **width**: `number`

Defined in: src/managers/views/inline.ts:38

***

### window

> **window**: `Window`

Defined in: src/managers/views/inline.ts:57

## Methods

### addListeners()

> **addListeners**(): `void`

Defined in: src/managers/views/inline.ts:384

#### Returns

`void`

***

### bounds()

> **bounds**(): [`SizeObject`](../interfaces/SizeObject.md)

Defined in: src/managers/views/inline.ts:460

#### Returns

[`SizeObject`](../interfaces/SizeObject.md)

***

### container()

> **container**(`axis?`): `HTMLElement`

Defined in: src/managers/views/inline.ts:101

#### Parameters

##### axis?

`string`

#### Returns

`HTMLElement`

***

### contentHeight()

> **contentHeight**(`_min?`): `number`

Defined in: src/managers/views/inline.ts:299

#### Parameters

##### \_min?

`number`

#### Returns

`number`

***

### contentWidth()

> **contentWidth**(`_min?`): `number`

Defined in: src/managers/views/inline.ts:295

#### Parameters

##### \_min?

`number`

#### Returns

`number`

***

### create()

> **create**(): `HTMLDivElement`

Defined in: src/managers/views/inline.ts:125

#### Returns

`HTMLDivElement`

***

### destroy()

> **destroy**(): `void`

Defined in: src/managers/views/inline.ts:467

#### Returns

`void`

***

### display()

> **display**(`request`): `Promise`\<`InlineView`\>

Defined in: src/managers/views/inline.ts:390

#### Parameters

##### request

[`RequestFunction`](../type-aliases/RequestFunction.md)

#### Returns

`Promise`\<`InlineView`\>

***

### expand()

> **expand**(`_force?`): `void`

Defined in: src/managers/views/inline.ts:268

#### Parameters

##### \_force?

`boolean`

#### Returns

`void`

***

### hide()

> **hide**(): `void`

Defined in: src/managers/views/inline.ts:429

#### Returns

`void`

***

### load()

> **load**(`contents`): `Promise`\<[`Contents`](Contents.md)\>

Defined in: src/managers/views/inline.ts:336

#### Parameters

##### contents

`string`

#### Returns

`Promise`\<[`Contents`](Contents.md)\>

***

### locationOf()

> **locationOf**(`target`): `object`

Defined in: src/managers/views/inline.ts:442

#### Parameters

##### target

`string`

#### Returns

`object`

##### left

> **left**: `number`

##### top

> **top**: `number`

***

### lock()

> **lock**(`what`, `width`, `height`): `void`

Defined in: src/managers/views/inline.ts:235

#### Parameters

##### what

`string`

##### width

`number`

##### height

`number`

#### Returns

`void`

***

### onDisplayed()

> **onDisplayed**(`_view`): `void`

Defined in: src/managers/views/inline.ts:452

#### Parameters

##### \_view

`InlineView`

#### Returns

`void`

***

### onResize()

> **onResize**(`_view`, `_e?`): `void`

Defined in: src/managers/views/inline.ts:456

#### Parameters

##### \_view

`InlineView`

##### \_e?

[`ReframeBounds`](../interfaces/ReframeBounds.md)

#### Returns

`void`

***

### position()

> **position**(): `DOMRect`

Defined in: src/managers/views/inline.ts:438

#### Returns

`DOMRect`

***

### removeListeners()

> **removeListeners**(): `void`

Defined in: src/managers/views/inline.ts:387

#### Returns

`void`

***

### render()

> **render**(`request`, `show?`): `Promise`\<`void`\>

Defined in: src/managers/views/inline.ts:166

#### Parameters

##### request

[`RequestFunction`](../type-aliases/RequestFunction.md)

##### show?

`boolean`

#### Returns

`Promise`\<`void`\>

***

### resize()

> **resize**(`width`, `height`): `void`

Defined in: src/managers/views/inline.ts:304

#### Parameters

##### width

`number` | `false`

##### height

`number` | `false`

#### Returns

`void`

***

### resizeListenters()

> **resizeListenters**(): `void`

Defined in: src/managers/views/inline.ts:378

#### Returns

`void`

***

### setLayout()

> **setLayout**(`layout`): `void`

Defined in: src/managers/views/inline.ts:373

#### Parameters

##### layout

[`Layout`](Layout.md)

#### Returns

`void`

***

### show()

> **show**(): `void`

Defined in: src/managers/views/inline.ts:418

#### Returns

`void`

***

### size()

> **size**(`_width?`, `_height?`): `void`

Defined in: src/managers/views/inline.ts:220

#### Parameters

##### \_width?

`number`

##### \_height?

`number`

#### Returns

`void`
