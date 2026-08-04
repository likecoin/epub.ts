[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Spine

# Class: Spine

Defined in: src/spine.ts:11

A collection of Spine Items

## Constructors

### Constructor

> **new Spine**(): `Spine`

Defined in: src/spine.ts:24

#### Returns

`Spine`

## Properties

### baseUrl

> **baseUrl**: `string`

Defined in: src/spine.ts:21

***

### epubcfi

> **epubcfi**: [`EpubCFI`](EpubCFI.md)

Defined in: src/spine.ts:16

***

### hooks

> **hooks**: `object`

Defined in: src/spine.ts:15

#### content

> **content**: `Hook`

#### serialize

> **serialize**: `Hook`

***

### items

> **items**: [`SpineItem`](../interfaces/SpineItem.md)[]

Defined in: src/spine.ts:18

***

### length

> **length**: `number`

Defined in: src/spine.ts:22

***

### loaded

> **loaded**: `boolean`

Defined in: src/spine.ts:17

***

### manifest

> **manifest**: [`PackagingManifestObject`](../interfaces/PackagingManifestObject.md)

Defined in: src/spine.ts:19

***

### spineByHref

> **spineByHref**: `Record`\<`string`, `number`\>

Defined in: src/spine.ts:13

***

### spineById

> **spineById**: `Record`\<`string`, `number`\>

Defined in: src/spine.ts:14

***

### spineItems

> **spineItems**: [`Section`](Section.md)[]

Defined in: src/spine.ts:12

***

### spineNodeIndex

> **spineNodeIndex**: `number`

Defined in: src/spine.ts:20

## Methods

### destroy()

> **destroy**(): `void`

Defined in: src/spine.ts:268

#### Returns

`void`

***

### each()

> **each**(`fn`): `void`

Defined in: src/spine.ts:229

Loop over the Sections in the Spine

#### Parameters

##### fn

(`section`, `index`, `array`) => `void`

#### Returns

`void`

forEach

***

### first()

> **first**(): [`Section`](Section.md) \| `undefined`

Defined in: src/spine.ts:237

Find the first Section in the Spine

#### Returns

[`Section`](Section.md) \| `undefined`

first section

***

### get()

> **get**(`target?`): [`Section`](Section.md) \| `null`

Defined in: src/spine.ts:137

Get an item from the spine

#### Parameters

##### target?

`string` | `number`

#### Returns

[`Section`](Section.md) \| `null`

section

#### Examples

```ts
spine.get();
```

```ts
spine.get(1);
```

```ts
spine.get("chap1.html");
```

```ts
spine.get("#id1234");
```

***

### last()

> **last**(): [`Section`](Section.md) \| `undefined`

Defined in: src/spine.ts:255

Find the last Section in the Spine

#### Returns

[`Section`](Section.md) \| `undefined`

last section

***

### unpack()

> **unpack**(`_package`, `resolver`, `canonical`): `void`

Defined in: src/spine.ts:55

Unpack items from a opf into spine items

#### Parameters

##### \_package

[`Packaging`](Packaging.md) & `object`

##### resolver

(`href`, `absolute?`) => `string`

URL resolver

##### canonical

(`href`) => `string`

Resolve canonical url

#### Returns

`void`
