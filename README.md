# @escapace/accept-language-parser

Parses HTTP Accept-Language header and returns matched language tags using RFC 4647 algorithms and BCP 47 normalization standards.

## Installation

```bash
pnpm install @escapace/accept-language-parser
```

## Usage

```typescript
import { pick } from '@escapace/accept-language-parser'

// Basic language matching with quality scores
pick('en-US;q=0.6', ['en', 'pl'])
// Returns: ['en']

// Lookup algorithm for single best match
pick('en-US,en;q=0.9,fr;q=0.8', ['en-GB', 'en', 'fr'], { type: 'lookup' })
// Returns: ['en']

// Empty result when no matches found
pick('', ['en'])
// Returns: []
```

## API

### `pick(acceptLanguage, tags, options?)`

Parses an Accept-Language header and returns matching language tags in preference order.

**Parameters:**

- `acceptLanguage` (string): The Accept-Language header value
- `tags` (string[]): Array of supported BCP 47 language tags
- `options` (Options, optional): Configuration options

**Returns:** `string[]` - Array of matched language tags ordered by preference

**Options:**

- `forgiving` (boolean, default: false): Handle malformed language tags gracefully
- `type` ('basic' | 'lookup', default: 'basic'): Language matching algorithm

**Language Matching Algorithms:**

- `'basic'`: Implements RFC 4647 Section 3.3.1 Basic Filtering. Returns all matching language tags using prefix matching. More specific tags match less specific ranges (e.g., 'en' range matches 'en-GB' tag). Processes all available language tags and returns every tag that matches the Accept-Language preferences.

- `'lookup'`: Implements RFC 4647 Section 3.4 Lookup matching. Returns the single best matching language tag, prioritizing more specific matches. Finds and returns only the most appropriate match from the available options, following language tag hierarchy and preference order.

## Accept-Language Header Format

The Accept-Language header specifies language preferences using quality scores:

```
Accept-Language: en-US,en;q=0.9,fr;q=0.8,*;q=0.1
```

- Languages without quality scores default to `q=1.0` (highest priority)
- Quality scores range from 0.0 to 1.0
- The `*` wildcard matches any language

## BCP 47 Language Tags

Follows BCP 47 standards for language tag formatting and matching. Language tags use formats like:

- `en` (language)
- `en-US` (language-region)
- `zh-Hant-CN` (language-script-region)

Tags are automatically normalized for consistent matching using Unicode CLDR recommendations.

## Credits

Uses functionality from:

- **[bcp-47-normalize](https://github.com/wooorm/bcp-47-normalize)** - BCP 47 language tag normalization and canonicalization
- **[bcp-47-match](https://github.com/wooorm/bcp-47-match)** - RFC 4647 compliant language tag matching algorithms
- **[Hono](https://github.com/honojs/hono)** - Accept header parsing utilities ([accept.ts](https://github.com/honojs/hono/blob/main/src/utils/accept.ts))
