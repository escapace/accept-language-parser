import { basicFilter as basic, lookup } from 'bcp-47-match'
import { bcp47Normalize } from 'bcp-47-normalize'
import { parseAccept } from 'hono/utils/accept'
import { uniq as _uniq } from 'es-toolkit'

/**
 * Configuration for language matching behavior.
 *
 * @remarks
 * The configuration controls strictness for malformed language values and
 * matching cardinality (candidate set versus single best tag).
 *
 * When options are omitted, default behavior is `forgiving: false` and
 * `type: 'basic'`.
 *
 * Returned tags are normalized forms of supplied supported tags.
 */
export interface Options {
  /**
   * Controls strictness when language values are malformed.
   *
   * @remarks
   * Strict mode (`false`) excludes malformed values from matching input.
   * Forgiving mode (`true`) attempts partial recovery when possible.
   *
   * @defaultValue false
   *
   * @see https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1
   * @see https://www.rfc-editor.org/rfc/rfc5646.html#section-4.5
   */
  forgiving?: boolean

  /**
   * Selects the matching mode used for language negotiation.
   *
   * @remarks
   * `basic` returns zero or more compatible supported tags.
   *
   * `lookup` returns at most one best supported tag.
   *
   * In lookup mode, a wildcard-only preference does not guarantee a concrete
   * result.
   *
   * Independent of mode, {@link pick} returns `string[]`.
   *
   * @defaultValue 'basic'
   *
   * @see https://www.rfc-editor.org/rfc/rfc4647.html#section-3.3.1
   * @see https://www.rfc-editor.org/rfc/rfc4647.html#section-3.4
   */
  type?: 'basic' | 'lookup'
}

/**
 * Removes duplicate, empty, and non-string values from an array.
 *
 * @param value - Candidate values.
 * @returns Sanitized values in first-seen order.
 */
const uniq = <T>(value: T[]) =>
  _uniq(value.filter((value) => typeof value === 'string' && value.length !== 0))

/**
 * Normalizes supported language tags before matching.
 *
 * @param tags - Supported language tags.
 * @param options - Normalization options.
 * @returns Canonical, unique tags suitable for matching.
 */
const normalizeTags = (tags: string[], options: Options): string[] =>
  uniq(tags.map((tag) => bcp47Normalize(tag, { forgiving: options.forgiving })))

/**
 * Parses and normalizes `Accept-Language` ranges before matching.
 *
 * @remarks
 * Ranges with quality value `q=0` are excluded because they are not acceptable
 * under HTTP quality semantics.
 *
 * @param acceptLanguage - Raw `Accept-Language` header value.
 * @param options - Normalization options.
 * @returns Canonical, unique language ranges in preference order.
 */
const normalizeRanges = (acceptLanguage: string, options: Options): string[] =>
  uniq(
    parseAccept(acceptLanguage)
      .filter((value) => value.q > 0)
      .map((value) => value.type)
      .map((tag) => (tag === '*' ? '*' : bcp47Normalize(tag, { forgiving: options.forgiving }))),
  )

/**
 * Matches an HTTP `Accept-Language` value against supported language tags.
 *
 * @remarks
 * Quality values (`q`) determine preference priority, and entries with `q=0`
 * are excluded. Wildcard `*` is supported. Returned tags are normalized
 * supported tags. Return type is always `string[]`.
 *
 * Integration code for cacheable language-varying responses should emit
 * `Vary: Accept-Language`.
 *
 * @param acceptLanguage - Raw `Accept-Language` header field value.
 * @param tags - Supported language tags.
 * @param options - Matching and normalization configuration.
 * @returns Matched supported tags in output order. The result is empty when no
 * acceptable range remains or when no supported tag matches. In `lookup` mode,
 * the array has zero or one element.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9110.html#name-accept-language
 * @see https://www.rfc-editor.org/rfc/rfc9110.html#name-quality-values
 * @see https://www.rfc-editor.org/rfc/rfc9110.html#name-vary
 * @see https://www.rfc-editor.org/rfc/rfc4647.html#section-3
 */
export function pick(acceptLanguage: string, tags: string[], options: Options = {}): string[] {
  const match = (
    {
      basic,
      lookup,
    } as const
  )[options.type ?? 'basic']

  const value = match(normalizeTags(tags, options), normalizeRanges(acceptLanguage, options))

  return typeof value === 'string' ? [value] : (value ?? [])
}
