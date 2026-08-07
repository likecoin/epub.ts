[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Contents

# Class: Contents

Defined in: src/contents.ts:42

## Implements

- [`IEventEmitter`](../interfaces/IEventEmitter.md)\<[`ContentsEvents`](../interfaces/ContentsEvents.md)\>

## Constructors

### Constructor

> **new Contents**(`doc`, `content?`, `cfiBase?`, `sectionIndex?`): `Contents`

Defined in: src/contents.ts:68

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

### \_\_listeners

> **\_\_listeners**: `Record`\<`string`, (...`args`) => `void`[]\> \| `undefined`

Defined in: src/contents.ts:46

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`__listeners`](../interfaces/IEventEmitter.md#__listeners)

***

### \_expanding

> **\_expanding**: `boolean`

Defined in: src/contents.ts:60

***

### \_layoutStyle

> **\_layoutStyle**: `string`

Defined in: src/contents.ts:66

***

### \_mediaQueryHandlers

> **\_mediaQueryHandlers**: `object`[]

Defined in: src/contents.ts:64

#### handler()

> **handler**: (`e`) => `void`

##### Parameters

###### e

`MediaQueryListEvent`

##### Returns

`void`

#### mql

> **mql**: `MediaQueryList`

***

### \_onSelectionChange

> **\_onSelectionChange**: (`e`) => `void` \| `undefined`

Defined in: src/contents.ts:63

***

### \_resizeCheck

> **\_resizeCheck**: () => `void` \| `undefined`

Defined in: src/contents.ts:61

***

### \_size

> **\_size**: `object`

Defined in: src/contents.ts:53

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### \_triggerEvent

> **\_triggerEvent**: (`e`) => `void` \| `undefined`

Defined in: src/contents.ts:62

***

### active

> **active**: `boolean`

Defined in: src/contents.ts:57

***

### called

> **called**: `number`

Defined in: src/contents.ts:56

***

### cfiBase

> **cfiBase**: `string`

Defined in: src/contents.ts:55

***

### content

> **content**: `HTMLElement`

Defined in: src/contents.ts:51

***

### document

> **document**: `Document`

Defined in: src/contents.ts:49

***

### documentElement

> **documentElement**: `HTMLElement`

Defined in: src/contents.ts:50

***

### emit()

> **emit**: \<`K`\>(`type`, ...`args`) => `void`

Defined in: src/contents.ts:45

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### args

...[`ContentsEvents`](../interfaces/ContentsEvents.md)\[`K`\]

#### Returns

`void`

#### Implementation of

[`IEventEmitter`](../interfaces/IEventEmitter.md).[`emit`](../interfaces/IEventEmitter.md#emit)

***

### epubcfi

> **epubcfi**: [`EpubCFI`](EpubCFI.md)

Defined in: src/contents.ts:48

***

### observer

> **observer**: `ResizeObserver` \| `MutationObserver` \| `undefined`

Defined in: src/contents.ts:58

***

### off()

> **off**: \<`K`\>(`type`, `fn?`) => `void`

Defined in: src/contents.ts:44

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

Defined in: src/contents.ts:43

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

### onResize

> **onResize**: (`size`) => `void` \| `undefined`

Defined in: src/contents.ts:59

***

### sectionIndex

> **sectionIndex**: `number`

Defined in: src/contents.ts:54

***

### selectionEndTimeout

> **selectionEndTimeout**: `Timeout` \| `undefined`

Defined in: src/contents.ts:65

***

### window

> **window**: `Window`

Defined in: src/contents.ts:52

## Accessors

### listenedEvents

#### Get Signature

> **get** `static` **listenedEvents**(): readonly \[`"keydown"`, `"keyup"`, `"keypress"`, `"mouseup"`, `"mousedown"`, `"mousemove"`, `"click"`, `"dblclick"`, `"touchend"`, `"touchstart"`, `"touchmove"`\]

Defined in: src/contents.ts:95

Get DOM events that are listened for and passed along

##### Returns

readonly \[`"keydown"`, `"keyup"`, `"keypress"`, `"mouseup"`, `"mousedown"`, `"mousemove"`, `"click"`, `"dblclick"`, `"touchend"`, `"touchstart"`, `"touchmove"`\]

## Methods

### \_getStylesheetNode()

> **\_getStylesheetNode**(`key?`): `false` \| `HTMLStyleElement`

Defined in: src/contents.ts:805

#### Parameters

##### key?

`string`

#### Returns

`false` \| `HTMLStyleElement`

***

### addClass()

> **addClass**(`className`): `void`

Defined in: src/contents.ts:939

Add a class to the contents container

#### Parameters

##### className

`string`

#### Returns

`void`

***

### addScript()

> **addScript**(`src`): `Promise`\<`boolean`\>

Defined in: src/contents.ts:907

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

> **addStylesheet**(`src`, `key?`): `Promise`\<`boolean`\>

Defined in: src/contents.ts:744

Append a stylesheet link to the document head

#### Parameters

##### src

`string`

url

##### key?

`string`

If the key is the same, the link will be replaced instead of inserted

#### Returns

`Promise`\<`boolean`\>

***

### addStylesheetCss()

> **addStylesheetCss**(`serializedCss`, `key?`): `boolean`

Defined in: src/contents.ts:827

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

Defined in: src/contents.ts:844

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

Defined in: src/contents.ts:1096

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

Defined in: src/contents.ts:1086

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

Defined in: src/contents.ts:1139

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

Defined in: src/contents.ts:171

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

Defined in: src/contents.ts:149

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

Defined in: src/contents.ts:292

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

Defined in: src/contents.ts:1366

#### Returns

`void`

***

### direction()

> **direction**(`dir?`): `void`

Defined in: src/contents.ts:1281

Set the direction of the text

#### Parameters

##### dir?

`string`

"rtl" | "ltr"

#### Returns

`void`

***

### fit()

> **fit**(`width`, `height`, `section?`): `boolean`

Defined in: src/contents.ts:1226

Fit contents into a fixed width and height

#### Parameters

##### width

`number`

##### height

`number`

##### section?

[`Section`](Section.md)

#### Returns

`boolean`

whether the contents could be fitted

***

### height()

> **height**(`h?`): `number`

Defined in: src/contents.ts:127

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

Defined in: src/contents.ts:648

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

### mapPage()

> **mapPage**(`cfiBase`, `layout`, `start`, `end`, `dev?`): [`EpubCFIPair`](../interfaces/EpubCFIPair.md) \| `undefined`

Defined in: src/contents.ts:1287

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

Defined in: src/contents.ts:251

Set overflow css style of the contents

#### Parameters

##### overflow?

`string`

#### Returns

`string`

***

### overflowX()

> **overflowX**(`overflow?`): `string`

Defined in: src/contents.ts:264

Set overflowX css style of the documentElement

#### Parameters

##### overflow?

`string`

#### Returns

`string`

***

### overflowY()

> **overflowY**(`overflow?`): `string`

Defined in: src/contents.ts:277

Set overflowY css style of the documentElement

#### Parameters

##### overflow?

`string`

#### Returns

`string`

***

### range()

> **range**(`_cfi`, `ignoreClass?`): `Range`

Defined in: src/contents.ts:1075

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

Defined in: src/contents.ts:954

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

Defined in: src/contents.ts:637

Get the documentElement

#### Returns

`HTMLElement` \| `null`

documentElement

***

### scaler()

> **scaler**(`scale`, `offsetX?`, `offsetY?`): `void`

Defined in: src/contents.ts:1205

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

Defined in: src/contents.ts:241

Get documentElement scrollHeight

#### Returns

`number`

height

***

### scrollWidth()

> **scrollWidth**(): `number`

Defined in: src/contents.ts:231

Get documentElement scrollWidth

#### Returns

`number`

width

***

### size()

> **size**(`width?`, `height?`): `void`

Defined in: src/contents.ts:1105

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

Defined in: src/contents.ts:215

Get the height of the text using Range

#### Returns

`number`

height

***

### textWidth()

> **textWidth**(): `number`

Defined in: src/contents.ts:191

Get the width of the text using Range

#### Returns

`number`

width

***

### viewport()

> **viewport**(`options?`): [`ViewportSettings`](../interfaces/ViewportSettings.md)

Defined in: src/contents.ts:331

Get or Set the viewport element

#### Parameters

##### options?

`Partial`\<`Record`\<keyof [`ViewportSettings`](../interfaces/ViewportSettings.md), `string` \| `number`\>\>

#### Returns

[`ViewportSettings`](../interfaces/ViewportSettings.md)

***

### width()

> **width**(`w?`): `number`

Defined in: src/contents.ts:104

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

Defined in: src/contents.ts:1307

Set the writingMode of the text

#### Parameters

##### mode?

`string`

"horizontal-tb" | "vertical-rl" | "vertical-lr"

#### Returns

`string`
