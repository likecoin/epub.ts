[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Contents

# Class: Contents

Defined in: contents.ts:26

Handles DOM manipulation, queries and events for View contents

## Param

Document

## Param

Parent Element (typically Body)

## Param

Section component of CFIs

## Param

Index in Spine of Conntent's Section

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)

## Constructors

### Constructor

> **new Contents**(`doc`, `content?`, `cfiBase?`, `sectionIndex?`): `Contents`

Defined in: contents.ts:51

#### Parameters

##### doc

`Document`

##### content?

`HTMLElement`

##### cfiBase?

`string`

##### sectionIndex?

`number`

#### Returns

`Contents`

## Properties

### \_expanding

> **\_expanding**: `boolean`

Defined in: contents.ts:44

***

### \_layoutStyle

> **\_layoutStyle**: `string`

Defined in: contents.ts:49

***

### \_onSelectionChange

> **\_onSelectionChange**: (`e`) => `void` \| `undefined`

Defined in: contents.ts:47

***

### \_resizeCheck

> **\_resizeCheck**: () => `void` \| `undefined`

Defined in: contents.ts:45

***

### \_size

> **\_size**: `object`

Defined in: contents.ts:36

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### \_triggerEvent

> **\_triggerEvent**: (`e`) => `void` \| `undefined`

Defined in: contents.ts:46

***

### active

> **active**: `boolean`

Defined in: contents.ts:40

***

### called

> **called**: `number`

Defined in: contents.ts:39

***

### cfiBase

> **cfiBase**: `string`

Defined in: contents.ts:38

***

### content

> **content**: `HTMLElement`

Defined in: contents.ts:34

***

### document

> **document**: `Document`

Defined in: contents.ts:32

***

### documentElement

> **documentElement**: `HTMLElement`

Defined in: contents.ts:33

***

### emit()

> **emit**: (`type`, ...`args`) => `void`

Defined in: contents.ts:29

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

Defined in: contents.ts:31

***

### expanding

> **expanding**: `Timeout` \| `undefined`

Defined in: contents.ts:42

***

### observer

> **observer**: `ResizeObserver` \| `MutationObserver` \| `undefined`

Defined in: contents.ts:41

***

### off()

> **off**: (`type`, `fn?`) => `this`

Defined in: contents.ts:28

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

Defined in: contents.ts:27

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

### onResize

> **onResize**: (`size`) => `void` \| `undefined`

Defined in: contents.ts:43

***

### sectionIndex

> **sectionIndex**: `number`

Defined in: contents.ts:37

***

### selectionEndTimeout

> **selectionEndTimeout**: `Timeout` \| `undefined`

Defined in: contents.ts:48

***

### window

> **window**: `Window`

Defined in: contents.ts:35

## Accessors

### listenedEvents

#### Get Signature

> **get** `static` **listenedEvents**(): readonly \[`"keydown"`, `"keyup"`, `"keypress"`, `"mouseup"`, `"mousedown"`, `"mousemove"`, `"click"`, `"touchend"`, `"touchstart"`, `"touchmove"`\]

Defined in: contents.ts:77

Get DOM events that are listened for and passed along

##### Returns

readonly \[`"keydown"`, `"keyup"`, `"keypress"`, `"mouseup"`, `"mousedown"`, `"mousemove"`, `"click"`, `"touchend"`, `"touchstart"`, `"touchmove"`\]

## Methods

### \_getStylesheetNode()

> **\_getStylesheetNode**(`key?`): `false` \| `HTMLStyleElement`

Defined in: contents.ts:753

#### Parameters

##### key?

`string`

#### Returns

`false` \| `HTMLStyleElement`

***

### addClass()

> **addClass**(`className`): `void`

Defined in: contents.ts:877

Add a class to the contents container

#### Parameters

##### className

`string`

#### Returns

`void`

***

### addScript()

> **addScript**(`src`): `Promise`\<`boolean`\>

Defined in: contents.ts:845

Append a script tag to the document head

#### Parameters

##### src

`string`

url

#### Returns

`Promise`\<`boolean`\>

loaded

***

### addStylesheet()

> **addStylesheet**(`src`): `Promise`\<`boolean`\>

Defined in: contents.ts:717

Append a stylesheet link to the document head

#### Parameters

##### src

`string`

url

#### Returns

`Promise`\<`boolean`\>

***

### addStylesheetCss()

> **addStylesheetCss**(`serializedCss`, `key?`): `boolean`

Defined in: contents.ts:775

Append stylesheet css

#### Parameters

##### serializedCss

`string`

##### key?

`string`

If the key is the same, the CSS will be replaced instead of inserted

#### Returns

`boolean`

***

### addStylesheetRules()

> **addStylesheetRules**(`rules`, `key?`): `void`

Defined in: contents.ts:792

Append stylesheet rules to a generate stylesheet
Array: https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule
Object: https://github.com/desirable-objects/json-to-css

#### Parameters

##### rules

`Record`\<`string`, `Record`\<`string`, `string`\> \| `Record`\<`string`, `string`\>[]\> | (`string` \| `string`[])[][]

##### key?

`string`

If the key is the same, the CSS will be replaced instead of inserted

#### Returns

`void`

***

### cfiFromNode()

> **cfiFromNode**(`node`, `ignoreClass?`): `string`

Defined in: contents.ts:1027

Get an EpubCFI from a Dom node

#### Parameters

##### node

`Node`

##### ignoreClass?

`string`

#### Returns

`string`

cfi

***

### cfiFromRange()

> **cfiFromRange**(`range`, `ignoreClass?`): `string`

Defined in: contents.ts:1017

Get an EpubCFI from a Dom Range

#### Parameters

##### range

`Range`

##### ignoreClass?

`string`

#### Returns

`string`

cfi

***

### columns()

> **columns**(`width`, `height`, `columnWidth`, `gap`, `dir?`): `void`

Defined in: contents.ts:1072

Apply columns to the contents for pagination

#### Parameters

##### width

`number`

##### height

`number`

##### columnWidth

`number`

##### gap

`number`

##### dir?

`string`

#### Returns

`void`

***

### contentHeight()

> **contentHeight**(`h?`): `number`

Defined in: contents.ts:153

Get or Set height of the contents

#### Parameters

##### h?

`string` | `number`

#### Returns

`number`

height

***

### contentWidth()

> **contentWidth**(`w?`): `number`

Defined in: contents.ts:131

Get or Set width of the contents

#### Parameters

##### w?

`string` | `number`

#### Returns

`number`

width

***

### css()

> **css**(`property`, `value?`, `priority?`): `string`

Defined in: contents.ts:274

Set Css styles on the contents element (typically Body)

#### Parameters

##### property

`string`

##### value?

`string`

##### priority?

`boolean`

set as "important"

#### Returns

`string`

***

### destroy()

> **destroy**(): `void`

Defined in: contents.ts:1279

#### Returns

`void`

***

### direction()

> **direction**(`dir?`): `void`

Defined in: contents.ts:1195

Set the direction of the text

#### Parameters

##### dir?

`string`

"rtl" | "ltr"

#### Returns

`void`

***

### fit()

> **fit**(`width`, `height`, `section?`): `void`

Defined in: contents.ts:1154

Fit contents into a fixed width and height

#### Parameters

##### width

`number`

##### height

`number`

##### section?

[`Section`](Section.md)

#### Returns

`void`

***

### height()

> **height**(`h?`): `number`

Defined in: contents.ts:109

Get or Set height

#### Parameters

##### h?

`string` | `number`

#### Returns

`number`

height

***

### locationOf()

> **locationOf**(`target`, `ignoreClass?`): `object`

Defined in: contents.ts:623

Get the location offset of a EpubCFI or an #id

#### Parameters

##### target

`string`

##### ignoreClass?

`string`

for the cfi

#### Returns

`object`

##### left

> **left**: `number`

##### top

> **top**: `number`

***

### map()

> **map**(`layout`): [`EpubCFIPair`](../interfaces/EpubCFIPair.md)[]

Defined in: contents.ts:1032

#### Parameters

##### layout

[`LayoutProps`](../interfaces/LayoutProps.md)

#### Returns

[`EpubCFIPair`](../interfaces/EpubCFIPair.md)[]

***

### mapPage()

> **mapPage**(`cfiBase`, `layout`, `start`, `end`, `dev?`): [`EpubCFIPair`](../interfaces/EpubCFIPair.md) \| `undefined`

Defined in: contents.ts:1201

#### Parameters

##### cfiBase

`string`

##### layout

[`LayoutProps`](../interfaces/LayoutProps.md)

##### start

`number`

##### end

`number`

##### dev?

`boolean`

#### Returns

[`EpubCFIPair`](../interfaces/EpubCFIPair.md) \| `undefined`

***

### overflow()

> **overflow**(`overflow?`): `string`

Defined in: contents.ts:233

Set overflow css style of the contents

#### Parameters

##### overflow?

`string`

#### Returns

`string`

***

### overflowX()

> **overflowX**(`overflow?`): `string`

Defined in: contents.ts:246

Set overflowX css style of the documentElement

#### Parameters

##### overflow?

`string`

#### Returns

`string`

***

### overflowY()

> **overflowY**(`overflow?`): `string`

Defined in: contents.ts:259

Set overflowY css style of the documentElement

#### Parameters

##### overflow?

`string`

#### Returns

`string`

***

### range()

> **range**(`_cfi`, `ignoreClass?`): `Range`

Defined in: contents.ts:1006

Get a Dom Range from EpubCFI

#### Parameters

##### \_cfi

`string`

##### ignoreClass?

`string`

#### Returns

`Range`

range

***

### removeClass()

> **removeClass**(`className`): `void`

Defined in: contents.ts:892

Remove a class from the contents container

#### Parameters

##### className

`string`

class name to remove

#### Returns

`void`

***

### root()

> **root**(): `HTMLElement` \| `null`

Defined in: contents.ts:612

Get the documentElement

#### Returns

`HTMLElement` \| `null`

documentElement

***

### scaler()

> **scaler**(`scale`, `offsetX?`, `offsetY?`): `void`

Defined in: contents.ts:1136

Scale contents from center

#### Parameters

##### scale

`number`

##### offsetX?

`number`

##### offsetY?

`number`

#### Returns

`void`

***

### scrollHeight()

> **scrollHeight**(): `number`

Defined in: contents.ts:223

Get documentElement scrollHeight

#### Returns

`number`

height

***

### scrollWidth()

> **scrollWidth**(): `number`

Defined in: contents.ts:213

Get documentElement scrollWidth

#### Returns

`number`

width

***

### size()

> **size**(`width?`, `height?`): `void`

Defined in: contents.ts:1042

Size the contents to a given width and height

#### Parameters

##### width?

`number`

##### height?

`number`

#### Returns

`void`

***

### textHeight()

> **textHeight**(): `number`

Defined in: contents.ts:197

Get the height of the text using Range

#### Returns

`number`

height

***

### textWidth()

> **textWidth**(): `number`

Defined in: contents.ts:173

Get the width of the text using Range

#### Returns

`number`

width

***

### viewport()

> **viewport**(`options?`): [`ViewportSettings`](../interfaces/ViewportSettings.md)

Defined in: contents.ts:296

Get or Set the viewport element

#### Parameters

##### options?

`Partial`\<`Record`\<keyof [`ViewportSettings`](../interfaces/ViewportSettings.md), `string` \| `number`\>\>

#### Returns

[`ViewportSettings`](../interfaces/ViewportSettings.md)

***

### width()

> **width**(`w?`): `number`

Defined in: contents.ts:86

Get or Set width

#### Parameters

##### w?

`string` | `number`

#### Returns

`number`

width

***

### writingMode()

> **writingMode**(`mode?`): `string`

Defined in: contents.ts:1221

Set the writingMode of the text

#### Parameters

##### mode?

`string`

"horizontal-tb" | "vertical-rl" | "vertical-lr"

#### Returns

`string`
