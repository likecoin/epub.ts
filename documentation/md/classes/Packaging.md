[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Packaging

# Class: Packaging

Defined in: packaging.ts:7

Open Packaging Format Parser

## Constructors

### Constructor

> **new Packaging**(`packageDocument?`): `Packaging`

Defined in: packaging.ts:18

#### Parameters

##### packageDocument?

`Document`

#### Returns

`Packaging`

## Properties

### coverPath

> **coverPath**: `string`

Defined in: packaging.ts:11

***

### manifest

> **manifest**: [`PackagingManifestObject`](../interfaces/PackagingManifestObject.md)

Defined in: packaging.ts:8

***

### metadata

> **metadata**: [`PackagingMetadataObject`](../interfaces/PackagingMetadataObject.md)

Defined in: packaging.ts:14

***

### navPath

> **navPath**: `string`

Defined in: packaging.ts:9

***

### ncxPath

> **ncxPath**: `string`

Defined in: packaging.ts:10

***

### spine

> **spine**: [`PackagingSpineItem`](../interfaces/PackagingSpineItem.md)[]

Defined in: packaging.ts:13

***

### spineNodeIndex

> **spineNodeIndex**: `number`

Defined in: packaging.ts:12

***

### toc

> **toc**: [`NavItem`](../interfaces/NavItem.md)[]

Defined in: packaging.ts:16

***

### uniqueIdentifier

> **uniqueIdentifier**: `string`

Defined in: packaging.ts:15

## Methods

### destroy()

> **destroy**(): `void`

Defined in: packaging.ts:368

#### Returns

`void`

***

### load()

> **load**(`json`): [`PackagingObject`](../interfaces/PackagingObject.md) & `object`

Defined in: packaging.ts:331

Load JSON Manifest

#### Parameters

##### json

`Record`\<`string`, `any`\>

JSON manifest data

#### Returns

[`PackagingObject`](../interfaces/PackagingObject.md) & `object`

parsed package parts

***

### parse()

> **parse**(`packageDocument`): [`PackagingObject`](../interfaces/PackagingObject.md)

Defined in: packaging.ts:37

Parse OPF XML

#### Parameters

##### packageDocument

`Document`

OPF XML

#### Returns

[`PackagingObject`](../interfaces/PackagingObject.md)

parsed package parts
