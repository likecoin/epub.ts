[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / DisplayOptions

# Class: DisplayOptions

Defined in: src/displayoptions.ts:8

Open DisplayOptions Format Parser

## Param

XML

## Constructors

### Constructor

> **new DisplayOptions**(`displayOptionsDocument?`): `DisplayOptions`

Defined in: src/displayoptions.ts:14

#### Parameters

##### displayOptionsDocument?

`Document`

#### Returns

`DisplayOptions`

## Properties

### fixedLayout

> **fixedLayout**: `string` \| `undefined`

Defined in: src/displayoptions.ts:10

***

### interactive

> **interactive**: `string` \| `undefined`

Defined in: src/displayoptions.ts:9

***

### openToSpread

> **openToSpread**: `string` \| `undefined`

Defined in: src/displayoptions.ts:11

***

### orientationLock

> **orientationLock**: `string` \| `undefined`

Defined in: src/displayoptions.ts:12

## Methods

### destroy()

> **destroy**(): `void`

Defined in: src/displayoptions.ts:67

#### Returns

`void`

***

### parse()

> **parse**(`displayOptionsDocument`): `this`

Defined in: src/displayoptions.ts:30

Parse XML

#### Parameters

##### displayOptionsDocument

`Document`

XML

#### Returns

`this`

self
