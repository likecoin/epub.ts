[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Rendition

# Class: Rendition

Defined in: src/rendition.ts:73

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<[`RenditionEvents`](../interfaces/RenditionEvents.md)\>

## Constructors

### Constructor

> **new Rendition**(`book`, `options?`): `Rendition`

Defined in: src/rendition.ts:94

#### Parameters

##### book

[`Book`](Book.md)

##### options?

[`RenditionOptions`](../interfaces/RenditionOptions.md)

#### Returns

`Rendition`

## Properties

### \_layout

> **\_layout**: [`Layout`](Layout.md) \| `undefined`

Defined in: src/rendition.ts:87

***

### annotations

> **annotations**: [`Annotations`](Annotations.md)

Defined in: src/rendition.ts:78

***

### book

> **book**: [`Book`](Book.md)

Defined in: src/rendition.ts:75

***

### displaying

> **displaying**: `defer`\<[`Section`](Section.md) \| `undefined`\> \| `undefined`

Defined in: src/rendition.ts:88

***

### emit()

> **emit**: \<`K`\>(`type`, ...`args`) => `void`

Defined in: src/rendition.ts:92

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

Defined in: src/rendition.ts:79

***

### hooks

> **hooks**: `RenditionHooks`

Defined in: src/rendition.ts:76

***

### location

> **location**: [`Location`](../interfaces/Location.md) \| `undefined`

Defined in: src/rendition.ts:81

***

### manager

> **manager**: `DefaultViewManager`

Defined in: src/rendition.ts:84

***

### off()

> **off**: \<`K`\>(`type`, `fn?`) => `void`

Defined in: src/rendition.ts:91

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

Defined in: src/rendition.ts:90

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

Defined in: src/rendition.ts:80

***

### settings

> **settings**: [`RenditionOptions`](../interfaces/RenditionOptions.md)

Defined in: src/rendition.ts:74

***

### started

> **started**: `Promise`\<`void`\>

Defined in: src/rendition.ts:83

***

### starting

> **starting**: `defer`\<`void`\>

Defined in: src/rendition.ts:82

***

### themes

> **themes**: [`Themes`](Themes.md)

Defined in: src/rendition.ts:77

***

### View

> **View**: [`ViewConstructor`](../type-aliases/ViewConstructor.md)

Defined in: src/rendition.ts:86

***

### ViewManager

> **ViewManager**: [`ViewManagerConstructor`](../type-aliases/ViewManagerConstructor.md)

Defined in: src/rendition.ts:85

## Methods

### attachTo()

> **attachTo**(`element`): `Promise`\<`void`\>

Defined in: src/rendition.ts:326

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

Defined in: src/rendition.ts:579

Clear all rendered views

#### Returns

`void`

***

### currentLocation()

> **currentLocation**(): [`Location`](../interfaces/Location.md) \| `undefined`

Defined in: src/rendition.ts:806

Get the Current Location object

#### Returns

[`Location`](../interfaces/Location.md) \| `undefined`

location (may be a promise)

***

### destroy()

> **destroy**(): `void`

Defined in: src/rendition.ts:892

Remove and Clean Up the Rendition

#### Returns

`void`

***

### direction()

> **direction**(`dir?`): `void`

Defined in: src/rendition.ts:721

Adjust the direction of the rendition

#### Parameters

##### dir?

`string`

#### Returns

`void`

***

### display()

> **display**(`target?`): `Promise`\<[`Section`](Section.md)\>

Defined in: src/rendition.ts:355

Display a point in the book
The request will be added to the rendering Queue,
so it will wait until book is opened, rendering started
and all other rendering tasks have finished to be called.

#### Parameters

##### target?

Url or EpubCFI

`string` | `number`

#### Returns

`Promise`\<[`Section`](Section.md)\>

***

### flow()

> **flow**(`flow`): `void`

Defined in: src/rendition.ts:640

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

Defined in: src/rendition.ts:1043

Get the Contents object of each rendered view

#### Returns

[`Contents`](Contents.md)[]

***

### getRange()

> **getRange**(`cfi`, `ignoreClass?`): `Range` \| `undefined`

Defined in: src/rendition.ts:985

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

Defined in: src/rendition.ts:676

Adjust the layout of the rendition to reflowable or pre-paginated

#### Parameters

##### settings?

[`GlobalLayout`](../interfaces/GlobalLayout.md)

#### Returns

[`Layout`](Layout.md) \| `undefined`

***

### moveTo()

> **moveTo**(`offset`): `void`

Defined in: src/rendition.ts:556

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

Defined in: src/rendition.ts:587

Go to the next "page" in the rendition

#### Returns

`Promise`\<`void`\>

***

### prev()

> **prev**(): `Promise`\<`void`\>

Defined in: src/rendition.ts:596

Go to the previous "page" in the rendition

#### Returns

`Promise`\<`void`\>

***

### reportLocation()

> **reportLocation**(): `Promise`\<`void`\>

Defined in: src/rendition.ts:739

Report the current location.
Emits "relocated" and "locationChanged" events.

#### Returns

`Promise`\<`void`\>

***

### requireManager()

> **requireManager**(`manager`): [`ViewManagerConstructor`](../type-aliases/ViewManagerConstructor.md)

Defined in: src/rendition.ts:223

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

Defined in: src/rendition.ts:244

Require the view from passed string, or as a class function

#### Parameters

##### view

`string` | `object` | [`ViewConstructor`](../type-aliases/ViewConstructor.md)

#### Returns

[`ViewConstructor`](../type-aliases/ViewConstructor.md)

***

### resize()

> **resize**(`width?`, `height?`, `epubcfi?`): `void`

Defined in: src/rendition.ts:566

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

Defined in: src/rendition.ts:214

Set the manager function

#### Parameters

##### manager

`DefaultViewManager`

#### Returns

`void`

***

### spread()

> **spread**(`spread`, `min?`): `void`

Defined in: src/rendition.ts:700

Adjust if the rendition uses spreads

#### Parameters

##### spread

`string`

none | auto (TODO: implement landscape, portrait, both)

##### min?

`number`

min width to use spreads at

#### Returns

`void`

***

### start()

> **start**(): `void`

Defined in: src/rendition.ts:262

Start the rendering

#### Returns

`void`

rendering has started

***

### views()

> **views**(): `IframeView`[] \| `Views`

Defined in: src/rendition.ts:1051

Get the views member from the manager

#### Returns

`IframeView`[] \| `Views`
