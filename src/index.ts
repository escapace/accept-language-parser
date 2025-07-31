import { basicFilter as basic, lookup } from 'bcp-47-match'
import { bcp47Normalize } from 'bcp-47-normalize'
import { parseAccept } from 'hono/utils/accept'
import { uniq as _uniq } from 'es-toolkit'

/**
 * Configuration options for language matching behavior.
 */
interface Options {
  /**
   * Controls how malformed language tags are handled during normalization.
   *
   * When `false` (default), malformed tags are rejected entirely.
   * When `true`, partial information from malformed tags is preserved.
   *
   * @defaultValue false
   */
  forgiving?: boolean

  /**
   * Matching algorithm to use when finding language matches.
   *
   * - `'basic'`: Returns all matching languages using RFC 4647 basic filtering
   * - `'lookup'`: Returns single best match using RFC 4647 lookup algorithm
   *
   * @defaultValue 'basic'
   */
  type?: 'basic' | 'lookup'
}

/**
 * Removes duplicate values and filters out non-string or empty values from an array.
 * Ensures clean input for language matching operations.
 */
const uniq = <T>(value: T[]) =>
  _uniq(value.filter((value) => typeof value === 'string' && value.length !== 0))

/**
 * Normalizes an array of language tags using BCP 47 standards.
 * Converts tags to canonical form and removes invalid entries.
 *
 * @param tags - Array of language tags to normalize
 * @param options - Normalization options
 * @returns Array of normalized, unique language tags
 */
const normalizeTags = (tags: string[], options: Options): string[] =>
  uniq(
    tags
      // Normalize each tag to BCP 47 canonical form (en-us → en, deprecated codes replaced)
      .map((tag) => bcp47Normalize(tag, { forgiving: options.forgiving })),
  )

/**
 * Parses and normalizes Accept-Language header into array of language ranges.
 * Handles quality scores and converts languages to canonical BCP 47 form.
 *
 * @param acceptLanguage - Accept-Language header value
 * @param options - Normalization options
 * @returns Array of normalized language ranges with wildcard support
 */
const normalizeRanges = (acceptLanguage: string, options: Options): string[] =>
  uniq(
    parseAccept(acceptLanguage)
      // Extract language types from parsed Accept-Language (ignores quality scores at this stage)
      .map((value) => value.type)
      // Normalize each language range, preserving wildcard '*' as-is
      .map((tag) => (tag === '*' ? '*' : bcp47Normalize(tag, { forgiving: options.forgiving }))),
  )

/**
 * Matches user language preferences from Accept-Language header against available language tags.
 *
 * Parses the Accept-Language header, normalizes both the header languages and available tags
 * to BCP 47 standard, then performs RFC 4647 matching to find the best language matches.
 *
 * @param acceptLanguage - Accept-Language header value
 * @param tags - Array of available language tags to match against
 * @param options - Matching and normalization options
 * @returns Array of matched language tags in preference order
 */
export function pick(acceptLanguage: string, tags: string[], options: Options = {}): string[] {
  // Select matching algorithm: basic filtering or lookup for best single match
  const match = (
    {
      basic,
      lookup,
    } as const
  )[options.type ?? 'basic']

  // Perform matching between normalized available tags and normalized ranges from Accept-Language
  const value = match(normalizeTags(tags, options), normalizeRanges(acceptLanguage, options))

  // Normalize return type: lookup returns string|undefined, basic returns string[]|undefined
  return typeof value === 'string' ? [value] : (value ?? [])
}
