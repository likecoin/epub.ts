[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Packaging

# Class: Packaging

Defined in: src/packaging.ts:17

Open Packaging Format Parser

## Constructors

### Constructor

> **new Packaging**(`packageDocument?`): `Packaging`

Defined in: src/packaging.ts:28

#### Parameters

##### packageDocument?

`Document`

#### Returns

`Packaging`

## Properties

### coverPath

> **coverPath**: `string`

Defined in: src/packaging.ts:21

***

### manifest

> **manifest**: [`PackagingManifestObject`](../interfaces/PackagingManifestObject.md)

Defined in: src/packaging.ts:18

***

### metadata

> **metadata**: [`PackagingMetadataObject`](../interfaces/PackagingMetadataObject.md)

Defined in: src/packaging.ts:24

***

### navPath

> **navPath**: `string`

Defined in: src/packaging.ts:19

***

### ncxPath

> **ncxPath**: `string`

Defined in: src/packaging.ts:20

***

### spine

> **spine**: [`PackagingSpineItem`](../interfaces/PackagingSpineItem.md)[]

Defined in: src/packaging.ts:23

***

### spineNodeIndex

> **spineNodeIndex**: `number`

Defined in: src/packaging.ts:22

***

### toc

> **toc**: [`NavItem`](../interfaces/NavItem.md)[]

Defined in: src/packaging.ts:26

***

### uniqueIdentifier

> **uniqueIdentifier**: `string`

Defined in: src/packaging.ts:25

## Methods

### destroy()

> **destroy**(): `void`

Defined in: src/packaging.ts:386

#### Returns

`void`

***

### load()

> **load**(`json`): [`PackagingObject`](../interfaces/PackagingObject.md) & `object`

Defined in: src/packaging.ts:349

Load JSON Manifest

#### Parameters

##### json

`WebPubManifest`

JSON manifest data

#### Returns

[`PackagingObject`](../interfaces/PackagingObject.md) & `object`

parsed package parts

***

### parse()

> **parse**(`packageDocument`): [`PackagingObject`](../interfaces/PackagingObject.md)

Defined in: src/packaging.ts:47

Parse OPF XML

#### Parameters

##### packageDocument

`Document`

OPF XML

#### Returns

[`PackagingObject`](../interfaces/PackagingObject.md)

parsed package parts
