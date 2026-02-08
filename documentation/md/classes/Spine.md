[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Spine

# Class: Spine

Defined in: spine.ts:10

A collection of Spine Items

## Constructors

### Constructor

> **new Spine**(): `Spine`

Defined in: spine.ts:23

#### Returns

`Spine`

## Properties

### baseUrl

> **baseUrl**: `string`

Defined in: spine.ts:20

***

### epubcfi

> **epubcfi**: [`EpubCFI`](EpubCFI.md)

Defined in: spine.ts:15

***

### hooks

> **hooks**: `object`

Defined in: spine.ts:14

#### content

> **content**: `Hook`

#### serialize

> **serialize**: `Hook`

***

### items

> **items**: [`SpineItem`](../interfaces/SpineItem.md)[]

Defined in: spine.ts:17

***

### length

> **length**: `number`

Defined in: spine.ts:21

***

### loaded

> **loaded**: `boolean`

Defined in: spine.ts:16

***

### manifest

> **manifest**: [`PackagingManifestObject`](../interfaces/PackagingManifestObject.md)

Defined in: spine.ts:18

***

### spineByHref

> **spineByHref**: `Record`\<`string`, `number`\>

Defined in: spine.ts:12

***

### spineById

> **spineById**: `Record`\<`string`, `number`\>

Defined in: spine.ts:13

***

### spineItems

> **spineItems**: [`Section`](Section.md)[]

Defined in: spine.ts:11

***

### spineNodeIndex

> **spineNodeIndex**: `number`

Defined in: spine.ts:19

## Methods

### destroy()

> **destroy**(): `void`

Defined in: spine.ts:266

#### Returns

`void`

***

### each()

> **each**(`fn`): `void`

Defined in: spine.ts:227

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

Defined in: spine.ts:235

Find the first Section in the Spine

#### Returns

[`Section`](Section.md) \| `undefined`

first section

***

### get()

> **get**(`target?`): [`Section`](Section.md) \| `null`

Defined in: spine.ts:135

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

Defined in: spine.ts:253

Find the last Section in the Spine

#### Returns

[`Section`](Section.md) \| `undefined`

last section

***

### unpack()

> **unpack**(`_package`, `resolver`, `canonical`): `void`

Defined in: spine.ts:54

Unpack items from a opf into spine items

#### Parameters

##### \_package

[`PackagingObject`](../interfaces/PackagingObject.md) & `object`

##### resolver

(`href`, `absolute?`) => `string`

URL resolver

##### canonical

(`href`) => `string`

Resolve canonical url

#### Returns

`void`
