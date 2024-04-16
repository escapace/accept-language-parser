export type MapLocales = (value: string) => string

export interface Options {
  loose: boolean
  mapLocales: MapLocales
}

export interface ParseResult {
  code: string
  quality: number
  region: string | undefined
  script: string | undefined
}

const regex = /((([A-Za-z]+(-[\dA-Za-z]+){0,2})|\*)(;q=[01](\.\d+)?)?)*/g

function isString(s: unknown): s is string {
  return typeof s === 'string'
}

export function parse(
  al: string,
  mapLocale: MapLocales = (x) => x
): ParseResult[] {
  const strings = (al.length > 0 ? al : '').match(regex)

  if (strings === null) {
    return []
  }

  return (
    strings
      .map((m) => {
        if (m.length === 0) {
          return
        }

        const bits = m.split(';')
        const ietf = mapLocale(bits[0]).split('-')
        const hasScript = ietf.length === 3

        const script = hasScript ? ietf[1] : undefined
        const region = hasScript ? ietf[2] : ietf[1]

        return {
          code: ietf[0],
          quality:
            isString(bits[1]) && bits[1].length !== 0
              ? parseFloat(bits[1].split('=')[1])
              : 1,
          region,
          script
        }
      })
      .filter((r) => r !== undefined) as ParseResult[]
  ).sort((a, b) => b.quality - a.quality)
}

// zh-CN = Simplified script with Mandarin grammar = Chinese as written in China
// zh-TW = Traditional script with Mandarin grammar = Chinese as written in Taiwan
// zh-HK = Traditional script with Cantonese grammar = Chinese as written in Hong Kong

const newLocales: Record<string, string> = {
  'zh-chs': 'zh-Hans',
  // https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-4.0/dd997383(v=vs.100)
  'zh-cht': 'zh-Hant',

  'zh-cn': 'zh-Hans-CN',
  'zh-hk': 'zh-Hant-HK',
  'zh-mo': 'zh-Hant-MO',

  // https://gist.github.com/amake/0ac7724681ac1c178c6f95a5b09f03ce
  'zh-sg': 'zh-Hans-SG',
  'zh-tw': 'zh-Hant-TW'
}

function mapLocales(locale: string): string {
  let value = locale.toLowerCase().replace(/_/g, '-')
  value = newLocales[value] ?? value

  return value
}

export function pick<T extends string>(
  languages: T[],
  acceptLanguage: string,
  options: Partial<Options> = {}
): T | undefined {
  const langs = languages.filter((string) => isString(string))

  if (langs.length === 0 || !isString(acceptLanguage)) {
    return undefined
  }

  const _options = { loose: false, mapLocales, ...options }

  const parsed = parse(acceptLanguage, _options.mapLocales)

  const supported = langs.map((support) => {
    const bits = support.split('-')
    const hasScript = bits.length === 3

    const script = hasScript ? bits[1] : undefined
    const region = hasScript ? bits[2] : bits[1]

    return {
      code: bits[0],
      region,
      script
    }
  })

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let index = 0; index < parsed.length; index++) {
    const lang = parsed[index]
    const langCode = lang.code?.toLowerCase()
    const langRegion = lang.region?.toLowerCase()
    const langScript = lang.script?.toLowerCase()

    for (let index = 0; index < supported.length; index++) {
      const value = supported[index]

      if (
        langCode === value.code?.toLowerCase() &&
        (_options.loose ||
          langScript === undefined ||
          langScript === value.script?.toLowerCase()) &&
        (_options.loose ||
          langRegion === undefined ||
          langRegion === value.region?.toLowerCase())
      ) {
        return languages[index]
      }
    }
  }

  return undefined
}
