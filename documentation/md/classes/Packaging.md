[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Packaging

# Class: Packaging

Defined in: src/packaging.ts:15

Open Packaging Format Parser

## Constructors

### Constructor

> **new Packaging**(`packageDocument?`): `Packaging`

Defined in: src/packaging.ts:26

#### Parameters

##### packageDocument?

`Document`

#### Returns

`Packaging`

## Properties

### coverPath

> **coverPath**: `string`

Defined in: src/packaging.ts:19

***

### manifest

> **manifest**: [`PackagingManifestObject`](../interfaces/PackagingManifestObject.md)

Defined in: src/packaging.ts:16

***

### metadata

> **metadata**: [`PackagingMetadataObject`](../interfaces/PackagingMetadataObject.md)

Defined in: src/packaging.ts:22

***

### navPath

> **navPath**: `string`

Defined in: src/packaging.ts:17

***

### ncxPath

> **ncxPath**: `string`

Defined in: src/packaging.ts:18

***

### spine

> **spine**: [`PackagingSpineItem`](../interfaces/PackagingSpineItem.md)[]

Defined in: src/packaging.ts:21

***

### spineNodeIndex

> **spineNodeIndex**: `number`

Defined in: src/packaging.ts:20

***

### toc

> **toc**: [`NavItem`](../interfaces/NavItem.md)[]

Defined in: src/packaging.ts:24

***

### uniqueIdentifier

> **uniqueIdentifier**: `string`

Defined in: src/packaging.ts:23

## Methods

### destroy()

> **destroy**(): `void`

Defined in: src/packaging.ts:383

#### Returns

`void`

***

### load()

> **load**(`json`): [`PackagingObject`](../interfaces/PackagingObject.md) & `object`

Defined in: src/packaging.ts:346

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

Defined in: src/packaging.ts:45

Parse OPF XML

#### Parameters

##### packageDocument

`Document`

OPF XML

#### Returns

[`PackagingObject`](../interfaces/PackagingObject.md)

parsed package parts
