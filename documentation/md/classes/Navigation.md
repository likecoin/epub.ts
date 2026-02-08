[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Navigation

# Class: Navigation

Defined in: navigation.ts:8

Navigation Parser

## Param

navigation html / xhtml / ncx

## Constructors

### Constructor

> **new Navigation**(`xml?`): `Navigation`

Defined in: navigation.ts:16

#### Parameters

##### xml?

`Document` | [`NavItem`](../interfaces/NavItem.md)[]

#### Returns

`Navigation`

## Properties

### landmarks

> **landmarks**: [`LandmarkItem`](../interfaces/LandmarkItem.md)[]

Defined in: navigation.ts:12

***

### landmarksByType

> **landmarksByType**: `Record`\<`string`, `number`\>

Defined in: navigation.ts:13

***

### length

> **length**: `number`

Defined in: navigation.ts:14

***

### toc

> **toc**: [`NavItem`](../interfaces/NavItem.md)[]

Defined in: navigation.ts:9

***

### tocByHref

> **tocByHref**: `Record`\<`string`, `number`\>

Defined in: navigation.ts:10

***

### tocById

> **tocById**: `Record`\<`string`, `number`\>

Defined in: navigation.ts:11

## Methods

### forEach()

> **forEach**(`fn`): `void`

Defined in: navigation.ts:362

forEach pass through

#### Parameters

##### fn

(`item`, `index`, `array`) => `void`

function to run on each item

#### Returns

`void`

forEach loop

***

### get()

> **get**(`target?`): [`NavItem`](../interfaces/NavItem.md) \| [`NavItem`](../interfaces/NavItem.md)[] \| `undefined`

Defined in: navigation.ts:91

Get an item from the navigation

#### Parameters

##### target?

`string`

#### Returns

[`NavItem`](../interfaces/NavItem.md) \| [`NavItem`](../interfaces/NavItem.md)[] \| `undefined`

navItem

***

### getByIndex()

> **getByIndex**(`target`, `index`, `navItems`): [`NavItem`](../interfaces/NavItem.md) \| `undefined`

Defined in: navigation.ts:114

Get an item from navigation subitems recursively by index

#### Parameters

##### target

`string`

##### index

`number` | `undefined`

##### navItems

[`NavItem`](../interfaces/NavItem.md)[]

#### Returns

[`NavItem`](../interfaces/NavItem.md) \| `undefined`

navItem

***

### landmark()

> **landmark**(`type?`): [`LandmarkItem`](../interfaces/LandmarkItem.md) \| [`LandmarkItem`](../interfaces/LandmarkItem.md)[] \| `undefined`

Defined in: navigation.ts:140

Get a landmark by type
List of types: https://idpf.github.io/epub-vocabs/structure/

#### Parameters

##### type?

`string`

#### Returns

[`LandmarkItem`](../interfaces/LandmarkItem.md) \| [`LandmarkItem`](../interfaces/LandmarkItem.md)[] \| `undefined`

landmarkItem

***

### load()

> **load**(`json`): [`NavItem`](../interfaces/NavItem.md)[]

Defined in: navigation.ts:349

Load Spine Items

#### Parameters

##### json

`any`[]

the items to be loaded

#### Returns

[`NavItem`](../interfaces/NavItem.md)[]

navItems

***

### parse()

> **parse**(`xml`): `void`

Defined in: navigation.ts:34

Parse out the navigation items

#### Parameters

##### xml

navigation html / xhtml / ncx

`Document` | [`NavItem`](../interfaces/NavItem.md)[]

#### Returns

`void`

***

### parseNavList()

> **parseNavList**(`navListHtml`, `parent?`): [`NavItem`](../interfaces/NavItem.md)[]

Defined in: navigation.ts:175

Parses lists in the toc

#### Parameters

##### navListHtml

`Element`

##### parent?

`string`

id

#### Returns

[`NavItem`](../interfaces/NavItem.md)[]

navigation list
