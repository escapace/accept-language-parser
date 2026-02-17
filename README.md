# @escapace/accept-language-parser

Matches HTTP `Accept-Language` preferences to supported language tags with deterministic ordering, fallback, and normalized results.

## Installation

```bash
pnpm add @escapace/accept-language-parser
```

## Usage

```typescript
import { pick } from '@escapace/accept-language-parser'

// Basic mode returns all compatible matches in output order.
pick('de-CH,de;q=0.9,en;q=0.8', ['de', 'de-AT', 'en'])
// => ['de', 'de-AT', 'en']

// Lookup mode returns a single best match.
pick('de-CH,de;q=0.9,en;q=0.8', ['de', 'de-AT', 'en'], { type: 'lookup' })
// => ['de']
```

## Behavioral guarantees

- Return type is always `string[]`.
- Returned tags are normalized supported tags, not raw input strings.
- Ranges with `q=0` are excluded before matching.
- Duplicate, empty, and unusable values are removed before matching.
- Default behavior is strict normalization with `basic` matching:
  - `forgiving: false`
  - `type: 'basic'`

## Choosing a matching mode

| Need                                                   | Mode     |
| ------------------------------------------------------ | -------- |
| Candidate set for additional ranking or fallback logic | `basic`  |
| Single best match for direct locale selection          | `lookup` |

## Quality, strictness, and ordering examples

```typescript
import { pick } from '@escapace/accept-language-parser'

// q=0 means "not acceptable" and is excluded.
pick('en;q=0,fr;q=0.8', ['en', 'fr'])
// => ['fr']

// In basic mode, wildcard can match remaining acceptable tags.
pick('en;q=0.8,*;q=0.1', ['en', 'de', 'it'])
// => ['en', 'de', 'it']

// Normalization can collapse supported tags before matching.
pick('en-US;q=1', ['en-US', 'en'])
// => ['en']

// Strict mode excludes malformed language values.
pick('en_US,fr;q=0.8', ['en', 'fr'])
// => ['fr']

// Forgiving mode can recover malformed language values.
pick('en_US,fr;q=0.8', ['en', 'fr'], { forgiving: true })
// => ['en', 'fr']

// Tie behavior: when quality values are equal, earlier header entries are prioritized.
pick('fr;q=0.8,en;q=0.8', ['en', 'fr'])
// => ['fr', 'en']
```

## Cache integration example

Language-varying cacheable responses should vary on `Accept-Language`.

```http
GET /content HTTP/1.1
Accept-Language: fr-CA,fr;q=0.8,en;q=0.6

HTTP/1.1 200 OK
Content-Language: fr-CA
Vary: Accept-Language
```

# API

## function pick [↗](src/index.ts#L115-L126 'pick')

Matches an HTTP `Accept-Language` value against supported language tags.

```typescript
export declare function pick(acceptLanguage: string, tags: string[], options?: Options): string[]
```

### Parameters

| Parameter        | Type                                                          | Description                               |
| ---------------- | ------------------------------------------------------------- | ----------------------------------------- |
| `acceptLanguage` | <pre>string</pre>                                             | Raw `Accept-Language` header field value. |
| `tags`           | <pre>string\[]</pre>                                          | Supported language tags.                  |
| `options`        | <pre>[Options](#interface-options- 'interface Options')</pre> | Matching and normalization configuration. |

### Returns

Matched supported tags in output order. The result is empty when no acceptable range remains or when no supported tag matches. In `lookup` mode, the array has zero or one element.

### Remarks

Quality values (`q`) determine preference priority, and entries with `q=0` are excluded. Wildcard `*` is supported. Returned tags are normalized supported tags. Return type is always `string[]`.

Integration code for cacheable language-varying responses should emit `Vary: Accept-Language`.

## interface Options [↗](src/index.ts#L18-L52 'Options')

Configuration for language matching behavior.

```typescript
export interface Options
```

### Remarks

The configuration controls strictness for malformed language values and matching cardinality (candidate set versus single best tag).

When options are omitted, default behavior is `forgiving: false` and `type: 'basic'`.

Returned tags are normalized forms of supplied supported tags.

### Options.forgiving

Controls strictness when language values are malformed.

```typescript
forgiving?: boolean;
```

#### Remarks

Strict mode (`false`) excludes malformed values from matching input. Forgiving mode (`true`) attempts partial recovery when possible.

### Options.type

Selects the matching mode used for language negotiation.

```typescript
type?: 'basic' | 'lookup';
```

#### Remarks

`basic` returns zero or more compatible supported tags.

`lookup` returns at most one best supported tag.

In lookup mode, a wildcard-only preference does not guarantee a concrete result.

Independent of mode, [pick](#function-pick-) returns `string[]`.
