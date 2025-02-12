export type MapLocales = (value: string) => string
import { basicFilter as basic, lookup } from 'bcp-47-match'
import { bcp47Normalize } from 'bcp-47-normalize'
import { parseAccept } from 'hono/utils/accept'

interface Options {
  /**
   * By default, when an error is encountered, an empty object is returned.
   * When in forgiving mode, all found values up to the point of the error
   * are included (`boolean`, default: `false`).
   * So, for example, where by default `en-GB-abcdefghi` an empty object is
   * returned (as the language variant is too long), in `forgiving` mode the
   * `language` of `schema` is populated with `en` and the `region` is
   * populated with `GB`.
   *
   * See https://github.com/wooorm/bcp-47
   */
  forgiving?: boolean
  /**
   *
   * See https://github.com/wooorm/bcp-47-match
   */
  type?: 'basic' | 'lookup'
}

const uniq = <T>(value: T[]) => [
  ...new Set(value.filter((value) => typeof value === 'string' && value.length !== 0)),
]

const normalizeTags = (tags: string[], options: Options): string[] =>
  uniq(
    tags
      .map((tag) => bcp47Normalize(tag, { forgiving: options.forgiving }))
      .filter((value) => typeof value === 'string' && value.trim().length !== 0),
  )

const normalizeRanges = (acceptLanguage: string, options: Options): string[] =>
  uniq(
    parseAccept(acceptLanguage)
      .map((value) => value.type)
      .map((tag) => (tag === '*' ? '*' : bcp47Normalize(tag, { forgiving: options.forgiving }))),
  )

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
