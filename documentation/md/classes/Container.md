[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Container

# Class: Container

Defined in: src/container.ts:9

Handles Parsing and Accessing an Epub Container

## Param

xml document

## Constructors

### Constructor

> **new Container**(`containerDocument?`): `Container`

Defined in: src/container.ts:14

#### Parameters

##### containerDocument?

`Document`

#### Returns

`Container`

## Properties

### directory

> **directory**: `string` \| `undefined`

Defined in: src/container.ts:11

***

### encoding

> **encoding**: `string` \| `undefined`

Defined in: src/container.ts:12

***

### packagePath

> **packagePath**: `string` \| `undefined`

Defined in: src/container.ts:10

## Methods

### destroy()

> **destroy**(): `void`

Defined in: src/container.ts:45

#### Returns

`void`

***

### parse()

> **parse**(`containerDocument`): `void`

Defined in: src/container.ts:28

Parse the Container XML

#### Parameters

##### containerDocument

`Document`

#### Returns

`void`
