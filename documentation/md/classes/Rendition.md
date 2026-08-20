[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Rendition

# Class: Rendition

Defined in: src/rendition.ts:83

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<[`RenditionEvents`](../interfaces/RenditionEvents.md)\>

## Constructors

### Constructor

> **new Rendition**(`book`, `options?`): `Rendition`

Defined in: src/rendition.ts:118

#### Parameters

##### book

[`Book`](Book.md)

##### options?

[`RenditionOptions`](../interfaces/RenditionOptions.md)

#### Returns

`Rendition`

## Properties

### \_containerResizeObserver

> **\_containerResizeObserver**: `ResizeObserver` \| `undefined`

Defined in: src/rendition.ts:112

***

### \_layout

> **\_layout**: [`Layout`](Layout.md) \| `undefined`

Defined in: src/rendition.ts:97

***

### \_reanchorCfi

> **\_reanchorCfi**: `string` \| `undefined`

Defined in: src/rendition.ts:105

***

### \_reanchoring

> **\_reanchoring**: `boolean` = `false`

Defined in: src/rendition.ts:108

***

### \_reanchorTimer

> **\_reanchorTimer**: `Timeout` \| `undefined`

Defined in: src/rendition.ts:107

***

### \_reanchorUntil

> **\_reanchorUntil**: `number` = `0`

Defined in: src/rendition.ts:106

***

### annotations

> **annotations**: [`Annotations`](Annotations.md)

Defined in: src/rendition.ts:88

***

### book

> **book**: [`Book`](Book.md)

Defined in: src/rendition.ts:85

***

### displaying

> **displaying**: `defer`\<[`Section`](Section.md) \| `undefined`\> \| `undefined`

Defined in: src/rendition.ts:98

***

### emit()

> **emit**: \<`K`\>(`type`, ...`args`) => `void`

Defined in: src/rendition.ts:116

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### args

...[`RenditionEvents`](../interfaces/RenditionEvents.md)\[`K`\]

#### Returns

`void`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`emit`](../interfaces/IEventEmitter.md#emit)

***

### epubcfi

> **epubcfi**: [`EpubCFI`](EpubCFI.md)

Defined in: src/rendition.ts:89

***

### hooks

> **hooks**: `RenditionHooks`

Defined in: src/rendition.ts:86

***

### location

> **location**: [`Location`](../interfaces/Location.md) \| `undefined`

Defined in: src/rendition.ts:91

***

### manager

> **manager**: `DefaultViewManager`

Defined in: src/rendition.ts:94

***

### off()

> **off**: \<`K`\>(`type`, `fn?`) => `void`

Defined in: src/rendition.ts:115

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

Defined in: src/rendition.ts:114

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

### q

> **q**: `Queue`

Defined in: src/rendition.ts:90

***

### settings

> **settings**: [`RenditionOptions`](../interfaces/RenditionOptions.md)

Defined in: src/rendition.ts:84

***

### started

> **started**: `Promise`\<`void`\>

Defined in: src/rendition.ts:93

***

### starting

> **starting**: `defer`\<`void`\>

Defined in: src/rendition.ts:92

***

### themes

> **themes**: [`Themes`](Themes.md)

Defined in: src/rendition.ts:87

***

### View

> **View**: [`ViewConstructor`](../type-aliases/ViewConstructor.md)

Defined in: src/rendition.ts:96

***

### ViewManager

> **ViewManager**: [`ViewManagerConstructor`](../type-aliases/ViewManagerConstructor.md)

Defined in: src/rendition.ts:95

## Methods

### attachTo()

> **attachTo**(`element`): `Promise`\<`void`\>

Defined in: src/rendition.ts:366

Call to attach the container to an element in the dom
Container must be attached before rendering can begin

#### Parameters

##### element

to attach to

`string` | `HTMLElement`

#### Returns

`Promise`\<`void`\>

***

### clear()

> **clear**(): `void`

Defined in: src/rendition.ts:778

Clear all rendered views

#### Returns

`void`

***

### currentLocation()

> **currentLocation**(): [`Location`](../interfaces/Location.md) \| `undefined`

Defined in: src/rendition.ts:1010

Get the Current Location object

#### Returns

[`Location`](../interfaces/Location.md) \| `undefined`

location (may be a promise)

***

### destroy()

> **destroy**(): `void`

Defined in: src/rendition.ts:1099

Remove and Clean Up the Rendition

#### Returns

`void`

***

### direction()

> **direction**(`dir?`): `void`

Defined in: src/rendition.ts:922

Adjust the direction of the rendition

#### Parameters

##### dir?

`string`

#### Returns

`void`

***

### display()

> **display**(`target?`): `Promise`\<[`Section`](Section.md) \| `undefined`\>

Defined in: src/rendition.ts:398

Display a point in the book
The request will be added to the rendering Queue,
so it will wait until book is opened, rendering started
and all other rendering tasks have finished to be called.

#### Parameters

##### target?

Url or EpubCFI

`string` | `number`

#### Returns

`Promise`\<[`Section`](Section.md) \| `undefined`\>

resolves the displayed section, or undefined if this
display was superseded by a later one or aborted

***

### flow()

> **flow**(`flow`): `void`

Defined in: src/rendition.ts:841

Adjust the flow of the rendition to paginated or scrolled
(scrolled-continuous vs scrolled-doc are handled by different view managers)

#### Parameters

##### flow

`string`

#### Returns

`void`

***

### getContents()

> **getContents**(): [`Contents`](Contents.md)[]

Defined in: src/rendition.ts:1265

Get the Contents object of each rendered view

#### Returns

[`Contents`](Contents.md)[]

***

### getRange()

> **getRange**(`cfi`, `ignoreClass?`): `Range` \| `undefined`

Defined in: src/rendition.ts:1203

Get a Range from a Visible CFI

#### Parameters

##### cfi

`string`

EpubCfi String

##### ignoreClass?

`string`

#### Returns

`Range` \| `undefined`

***

### layout()

> **layout**(`settings?`): [`Layout`](Layout.md) \| `undefined`

Defined in: src/rendition.ts:877

Adjust the layout of the rendition to reflowable or pre-paginated

#### Parameters

##### settings?

[`GlobalLayout`](../interfaces/GlobalLayout.md)

#### Returns

[`Layout`](Layout.md) \| `undefined`

***

### moveTo()

> **moveTo**(`offset`): `void`

Defined in: src/rendition.ts:755

Move the Rendition to a specific offset
Usually you would be better off calling display()

#### Parameters

##### offset

###### left

`number`

###### top

`number`

#### Returns

`void`

***

### next()

> **next**(): `Promise`\<`void`\>

Defined in: src/rendition.ts:786

Go to the next "page" in the rendition

#### Returns

`Promise`\<`void`\>

***

### prev()

> **prev**(): `Promise`\<`void`\>

Defined in: src/rendition.ts:796

Go to the previous "page" in the rendition

#### Returns

`Promise`\<`void`\>

***

### reportLocation()

> **reportLocation**(): `Promise`\<`void`\>

Defined in: src/rendition.ts:940

Report the current location.
Emits "relocated" and "locationChanged" events.

#### Returns

`Promise`\<`void`\>

***

### requireManager()

> **requireManager**(`manager`): [`ViewManagerConstructor`](../type-aliases/ViewManagerConstructor.md)

Defined in: src/rendition.ts:247

Require the manager from passed string, or as a class function

#### Parameters

##### manager

[description]

`string` | `object` | [`ViewManagerConstructor`](../type-aliases/ViewManagerConstructor.md)

#### Returns

[`ViewManagerConstructor`](../type-aliases/ViewManagerConstructor.md)

***

### requireView()

> **requireView**(`view`): [`ViewConstructor`](../type-aliases/ViewConstructor.md)

Defined in: src/rendition.ts:268

Require the view from passed string, or as a class function

#### Parameters

##### view

`string` | `object` | [`ViewConstructor`](../type-aliases/ViewConstructor.md)

#### Returns

[`ViewConstructor`](../type-aliases/ViewConstructor.md)

***

### resize()

> **resize**(`width?`, `height?`, `epubcfi?`): `void`

Defined in: src/rendition.ts:765

Trigger a resize of the views

#### Parameters

##### width?

`number`

##### height?

`number`

##### epubcfi?

`string`

(optional)

#### Returns

`void`

***

### setManager()

> **setManager**(`manager`): `void`

Defined in: src/rendition.ts:238

Set the manager function

#### Parameters

##### manager

`DefaultViewManager`

#### Returns

`void`

***

### spread()

> **spread**(`spread`, `min?`): `void`

Defined in: src/rendition.ts:901

Adjust if the rendition uses spreads

#### Parameters

##### spread

`string`

none | auto

##### min?

`number`

min width to use spreads at

#### Returns

`void`

***

### start()

> **start**(): `void`

Defined in: src/rendition.ts:286

Start the rendering

#### Returns

`void`

rendering has started

***

### views()

> **views**(): `IframeView`[] \| `Views`

Defined in: src/rendition.ts:1273

Get the views member from the manager

#### Returns

`IframeView`[] \| `Views`
