[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Annotations

# Class: Annotations

Defined in: src/annotations.ts:23

Handles managing adding & removing Annotations

## Param

## Constructors

### Constructor

> **new Annotations**(`rendition`): `Annotations`

Defined in: src/annotations.ts:31

#### Parameters

##### rendition

[`Rendition`](Rendition.md)

#### Returns

`Annotations`

## Properties

### \_annotations

> **\_annotations**: `Record`\<`string`, `Annotation`\>

Defined in: src/annotations.ts:28

***

### \_annotationsBySectionIndex

> **\_annotationsBySectionIndex**: `Record`\<`number`, `string`[]\>

Defined in: src/annotations.ts:29

***

### highlights

> **highlights**: `Annotation`[]

Defined in: src/annotations.ts:25

***

### marks

> **marks**: `Annotation`[]

Defined in: src/annotations.ts:27

***

### rendition

> **rendition**: [`Rendition`](Rendition.md)

Defined in: src/annotations.ts:24

***

### underlines

> **underlines**: `Annotation`[]

Defined in: src/annotations.ts:26

## Methods

### add()

> **add**(`type`, `cfiRange`, `data?`, `cb?`, `className?`, `styles?`): `Annotation`

Defined in: src/annotations.ts:53

Add an annotation to store

#### Parameters

##### type

`string`

Type of annotation to add: "highlight", "underline", "mark"

##### cfiRange

`string`

EpubCFI range to attach annotation to

##### data?

`Record`\<`string`, `any`\>

Data to assign to annotation

##### cb?

`EventListener`

Callback after annotation is added

##### className?

`string`

CSS class to assign to annotation

##### styles?

`Record`\<`string`, `string`\>

CSS styles to assign to annotation

#### Returns

`Annotation`

annotation

***

### each()

> **each**(`fn`): `void`

Defined in: src/annotations.ts:167

iterate over annotations in the store

#### Parameters

##### fn

(`annotation`, `key`) => `void`

#### Returns

`void`

***

### hide()

> **hide**(): `void`

Defined in: src/annotations.ts:219

[Not Implemented] Hide annotations
@TODO: needs implementation in View

#### Returns

`void`

***

### highlight()

> **highlight**(`cfiRange`, `data?`, `cb?`, `className?`, `styles?`): `Annotation`

Defined in: src/annotations.ts:138

Add a highlight to the store

#### Parameters

##### cfiRange

`string`

EpubCFI range to attach annotation to

##### data?

`Record`\<`string`, `any`\>

Data to assign to annotation

##### cb?

`EventListener`

Callback after annotation is clicked

##### className?

`string`

CSS class to assign to annotation

##### styles?

`Record`\<`string`, `string`\>

CSS styles to assign to annotation

#### Returns

`Annotation`

***

### mark()

> **mark**(`cfiRange`, `data?`, `cb?`): `Annotation`

Defined in: src/annotations.ts:160

Add a mark to the store

#### Parameters

##### cfiRange

`string`

EpubCFI range to attach annotation to

##### data?

`Record`\<`string`, `any`\>

Data to assign to annotation

##### cb?

`EventListener`

Callback after annotation is clicked

#### Returns

`Annotation`

***

### remove()

> **remove**(`cfiRange`, `type?`): `void`

Defined in: src/annotations.ts:91

Remove an annotation from store

#### Parameters

##### cfiRange

`string`

EpubCFI range the annotation is attached to

##### type?

`string`

Type of annotation to add: "highlight", "underline", "mark"

#### Returns

`void`

***

### show()

> **show**(): `void`

Defined in: src/annotations.ts:211

[Not Implemented] Show annotations
@TODO: needs implementation in View

#### Returns

`void`

***

### underline()

> **underline**(`cfiRange`, `data?`, `cb?`, `className?`, `styles?`): `Annotation`

Defined in: src/annotations.ts:150

Add a underline to the store

#### Parameters

##### cfiRange

`string`

EpubCFI range to attach annotation to

##### data?

`Record`\<`string`, `any`\>

Data to assign to annotation

##### cb?

`EventListener`

Callback after annotation is clicked

##### className?

`string`

CSS class to assign to annotation

##### styles?

`Record`\<`string`, `string`\>

CSS styles to assign to annotation

#### Returns

`Annotation`
