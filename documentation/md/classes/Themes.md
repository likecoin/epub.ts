[**@likecoin/epub-ts**](../README.md)

***

[@likecoin/epub-ts](../README.md) / Themes

# Class: Themes

Defined in: themes.ts:11

Themes to apply to displayed content

## Param

## Constructors

### Constructor

> **new Themes**(`rendition`): `Themes`

Defined in: themes.ts:18

#### Parameters

##### rendition

[`Rendition`](Rendition.md)

#### Returns

`Themes`

## Properties

### \_current

> **\_current**: `string`

Defined in: themes.ts:15

***

### \_injected

> **\_injected**: `string`[]

Defined in: themes.ts:16

***

### \_overrides

> **\_overrides**: `Record`\<`string`, \{ `priority`: `boolean`; `value`: `string`; \}\>

Defined in: themes.ts:14

***

### \_themes

> **\_themes**: `Record`\<`string`, [`ThemeEntry`](../interfaces/ThemeEntry.md)\>

Defined in: themes.ts:13

***

### rendition

> **rendition**: [`Rendition`](Rendition.md)

Defined in: themes.ts:12

## Methods

### add()

> **add**(`name`, `contents`): `void`

Defined in: themes.ts:189

Add Theme to contents

#### Parameters

##### name

`string`

##### contents

[`Contents`](Contents.md)

#### Returns

`void`

***

### default()

> **default**(`theme`): `void`

Defined in: themes.ts:65

Add a default theme to be used by a rendition

#### Parameters

##### theme

`string` | `Record`\<`string`, `Record`\<`string`, `string`\>\>

#### Returns

`void`

#### Examples

```ts
themes.register("http://example.com/default.css")
```

```ts
themes.register({ "body": { "color": "purple"}})
```

***

### destroy()

> **destroy**(): `void`

Defined in: themes.ts:266

#### Returns

`void`

***

### font()

> **font**(`f`): `void`

Defined in: themes.ts:262

Adjust the font-family of a rendition

#### Parameters

##### f

`string`

#### Returns

`void`

***

### fontSize()

> **fontSize**(`size`): `void`

Defined in: themes.ts:254

Adjust the font size of a rendition

#### Parameters

##### size

`string`

#### Returns

`void`

***

### inject()

> **inject**(`contents`): `void`

Defined in: themes.ts:164

Inject all themes into contents

#### Parameters

##### contents

[`Contents`](Contents.md)

#### Returns

`void`

***

### override()

> **override**(`name`, `value`, `priority?`): `void`

Defined in: themes.ts:213

Add override

#### Parameters

##### name

`string`

##### value

`string`

##### priority?

`boolean`

#### Returns

`void`

***

### overrides()

> **overrides**(`contents`): `void`

Defined in: themes.ts:240

Add all overrides

#### Parameters

##### contents

[`Contents`](Contents.md)

contents to apply overrides to

#### Returns

`void`

***

### register()

> **register**(...`_args`): `void`

Defined in: themes.ts:41

Add themes to be used by a rendition

#### Parameters

##### \_args

...`any`[]

#### Returns

`void`

#### Examples

```ts
themes.register("light", "http://example.com/light.css")
```

```ts
themes.register("light", { "body": { "color": "purple"}})
```

```ts
themes.register({ "light" : {...}, "dark" : {...}})
```

***

### registerCss()

> **registerCss**(`name`, `css`): `void`

Defined in: themes.ts:99

Register a theme by passing its css as string

#### Parameters

##### name

`string`

##### css

`string`

#### Returns

`void`

***

### registerRules()

> **registerRules**(`name`, `rules`): `void`

Defined in: themes.ts:124

Register rule

#### Parameters

##### name

`string`

##### rules

`Record`\<`string`, `Record`\<`string`, `string`\>\>

#### Returns

`void`

***

### registerThemes()

> **registerThemes**(`themes`): `void`

Defined in: themes.ts:81

Register themes object

#### Parameters

##### themes

`Record`\<`string`, `string` \| `Record`\<`string`, `Record`\<`string`, `string`\>\>\>

#### Returns

`void`

***

### registerUrl()

> **registerUrl**(`name`, `input`): `void`

Defined in: themes.ts:111

Register a url

#### Parameters

##### name

`string`

##### input

`string`

#### Returns

`void`

***

### removeOverride()

> **removeOverride**(`name`): `void`

Defined in: themes.ts:226

#### Parameters

##### name

`string`

#### Returns

`void`

***

### select()

> **select**(`name`): `void`

Defined in: themes.ts:136

Select a theme

#### Parameters

##### name

`string`

#### Returns

`void`

***

### update()

> **update**(`name`): `void`

Defined in: themes.ts:153

Update a theme

#### Parameters

##### name

`string`

#### Returns

`void`
