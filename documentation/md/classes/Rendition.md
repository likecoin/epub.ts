[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Rendition

# Class: Rendition

Defined in: rendition.ts:57

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)

## Constructors

### Constructor

> **new Rendition**(`book`, `options?`): `Rendition`

Defined in: rendition.ts:78

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

Defined in: rendition.ts:71

***

### annotations

> **annotations**: [`Annotations`](Annotations.md)

Defined in: rendition.ts:62

***

### book

> **book**: [`Book`](Book.md) \| `undefined`

Defined in: rendition.ts:59

***

### displaying

> **displaying**: `defer` \| `undefined`

Defined in: rendition.ts:72

***

### emit()

> **emit**: (`type`, ...`args`) => `void`

Defined in: rendition.ts:76

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

Defined in: rendition.ts:63

***

### hooks

> **hooks**: `RenditionHooks`

Defined in: rendition.ts:60

***

### location

> **location**: [`Location`](../interfaces/Location.md) \| `undefined`

Defined in: rendition.ts:65

***

### manager

> **manager**: `DefaultViewManager` \| `undefined`

Defined in: rendition.ts:68

***

### off()

> **off**: (`type`, `fn?`) => `any`

Defined in: rendition.ts:75

#### Parameters

##### type

`string`

##### fn?

(...`args`) => `void`

#### Returns

`any`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`off`](../interfaces/IEventEmitter.md#off)

***

### on()

> **on**: (`type`, `fn`) => `any`

Defined in: rendition.ts:74

#### Parameters

##### type

`string`

##### fn

(...`args`) => `void`

#### Returns

`any`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`on`](../interfaces/IEventEmitter.md#on)

***

### q

> **q**: `Queue`

Defined in: rendition.ts:64

***

### settings

> **settings**: [`RenditionOptions`](../interfaces/RenditionOptions.md) & `Record`\<`string`, `any`\>

Defined in: rendition.ts:58

***

### started

> **started**: `Promise`\<`void`\>

Defined in: rendition.ts:67

***

### starting

> **starting**: `defer`

Defined in: rendition.ts:66

***

### themes

> **themes**: [`Themes`](Themes.md)

Defined in: rendition.ts:61

***

### View

> **View**: `Function` \| *typeof* `IframeView`

Defined in: rendition.ts:70

***

### ViewManager

> **ViewManager**: `Function` \| *typeof* `DefaultViewManager` \| *typeof* `ContinuousViewManager`

Defined in: rendition.ts:69

## Methods

### attachTo()

> **attachTo**(`element`): `Promise`\<`void`\>

Defined in: rendition.ts:310

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

Defined in: rendition.ts:563

Clear all rendered views

#### Returns

`void`

***

### currentLocation()

> **currentLocation**(): [`Location`](../interfaces/Location.md) \| `undefined`

Defined in: rendition.ts:790

Get the Current Location object

#### Returns

[`Location`](../interfaces/Location.md) \| `undefined`

location (may be a promise)

***

### destroy()

> **destroy**(): `void`

Defined in: rendition.ts:876

Remove and Clean Up the Rendition

#### Returns

`void`

***

### direction()

> **direction**(`dir?`): `void`

Defined in: rendition.ts:705

Adjust the direction of the rendition

#### Parameters

##### dir?

`string`

#### Returns

`void`

***

### display()

> **display**(`target?`): `Promise`\<[`Section`](Section.md)\>

Defined in: rendition.ts:339

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

Defined in: rendition.ts:624

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

Defined in: rendition.ts:1027

Get the Contents object of each rendered view

#### Returns

[`Contents`](Contents.md)[]

***

### getRange()

> **getRange**(`cfi`, `ignoreClass?`): `Range` \| `undefined`

Defined in: rendition.ts:967

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

Defined in: rendition.ts:660

Adjust the layout of the rendition to reflowable or pre-paginated

#### Parameters

##### settings?

[`GlobalLayout`](../interfaces/GlobalLayout.md)

#### Returns

[`Layout`](Layout.md) \| `undefined`

***

### moveTo()

> **moveTo**(`offset`): `void`

Defined in: rendition.ts:540

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

Defined in: rendition.ts:571

Go to the next "page" in the rendition

#### Returns

`Promise`\<`void`\>

***

### prev()

> **prev**(): `Promise`\<`void`\>

Defined in: rendition.ts:580

Go to the previous "page" in the rendition

#### Returns

`Promise`\<`void`\>

***

### reportLocation()

> **reportLocation**(): `Promise`\<`void`\>

Defined in: rendition.ts:723

Report the current location.
Emits "relocated" and "locationChanged" events.

#### Returns

`Promise`\<`void`\>

***

### requireManager()

> **requireManager**(`manager`): `Function` \| *typeof* `DefaultViewManager` \| *typeof* `ContinuousViewManager`

Defined in: rendition.ts:207

Require the manager from passed string, or as a class function

#### Parameters

##### manager

[description]

`string` | `object` | `Function`

#### Returns

`Function` \| *typeof* `DefaultViewManager` \| *typeof* `ContinuousViewManager`

***

### requireView()

> **requireView**(`view`): `Function` \| *typeof* `IframeView`

Defined in: rendition.ts:228

Require the view from passed string, or as a class function

#### Parameters

##### view

`string` | `object` | `Function`

#### Returns

`Function` \| *typeof* `IframeView`

***

### resize()

> **resize**(`width?`, `height?`, `epubcfi?`): `void`

Defined in: rendition.ts:550

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

Defined in: rendition.ts:198

Set the manager function

#### Parameters

##### manager

`DefaultViewManager`

#### Returns

`void`

***

### spread()

> **spread**(`spread`, `min?`): `void`

Defined in: rendition.ts:684

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

Defined in: rendition.ts:246

Start the rendering

#### Returns

`void`

rendering has started

***

### views()

> **views**(): `Views` \| `IframeView`[]

Defined in: rendition.ts:1035

Get the views member from the manager

#### Returns

`Views` \| `IframeView`[]
