import { parse, pick, ParseResult } from './index.js'
import { assert } from 'chai'

const assertResult = function (
  expected: Partial<ParseResult>,
  actual: Partial<ParseResult>
): void {
  assert.equal(actual.code, expected.code)

  if (actual.script !== undefined || expected.script !== undefined) {
    assert.equal(actual.script, expected.script)
  }

  if (actual.region !== undefined || expected.region !== undefined) {
    assert.equal(actual.region, expected.region)
  }

  assert.equal(actual.quality, expected.quality)
}

describe('accept-language#parse()', function () {
  it('empty', function () {
    const result = parse('')

    assert.equal(result.length, 0)
  })

  it('should correctly parse the language with quality', function () {
    const result = parse('en-GB;q=0.8')

    assertResult({ code: 'en', region: 'GB', quality: 0.8 }, result[0])
  })

  it('should correctly parse the language without quality (default 1)', function () {
    const result = parse('en-GB')
    assertResult({ code: 'en', region: 'GB', quality: 1.0 }, result[0])
  })

  it('should correctly parse the language without region', function () {
    const result = parse('en;q=0.8')
    assertResult({ code: 'en', quality: 0.8 }, result[0])
  })

  // This needs to be changed to preserve the full code.
  it('should ignore extra characters in the region code', function () {
    const result = parse('az-AZ')
    assertResult({ code: 'az', region: 'AZ', quality: 1.0 }, result[0])
  })

  it('should correctly parse a multi-language set', function () {
    const result = parse('fr-CA,fr;q=0.8')
    assertResult({ code: 'fr', region: 'CA', quality: 1.0 }, result[0])
    assertResult({ code: 'fr', quality: 0.8 }, result[1])
  })

  it('should correctly parse a wildcard', function () {
    const result = parse('fr-CA,*;q=0.8')
    assertResult({ code: 'fr', region: 'CA', quality: 1.0 }, result[0])
    assertResult({ code: '*', quality: 0.8 }, result[1])
  })

  it('should correctly parse a region with numbers', function () {
    const result = parse('fr-150')
    assertResult({ code: 'fr', region: '150', quality: 1.0 }, result[0])
  })

  it('should correctly parse complex set', function () {
    const result = parse('fr-CA,fr;q=0.8,en-US;q=0.6,en;q=0.4,*;q=0.1')
    assertResult({ code: 'fr', region: 'CA', quality: 1.0 }, result[0])
    assertResult({ code: 'fr', quality: 0.8 }, result[1])
    assertResult({ code: 'en', region: 'US', quality: 0.6 }, result[2])
    assertResult({ code: 'en', quality: 0.4 }, result[3])
    assertResult({ code: '*', quality: 0.1 }, result[4])
  })

  it('should cope with random whitespace', function () {
    const result = parse('fr-CA, fr;q=0.8,  en-US;q=0.6,en;q=0.4,    *;q=0.1')
    assertResult({ code: 'fr', region: 'CA', quality: 1.0 }, result[0])
    assertResult({ code: 'fr', quality: 0.8 }, result[1])
    assertResult({ code: 'en', region: 'US', quality: 0.6 }, result[2])
    assertResult({ code: 'en', quality: 0.4 }, result[3])
    assertResult({ code: '*', quality: 0.1 }, result[4])
  })

  it('should sort based on quality value', function () {
    const result = parse('fr-CA,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5')
    assertResult({ code: 'fr', region: 'CA', quality: 1.0 }, result[0])
    assertResult({ code: 'en', region: 'US', quality: 0.6 }, result[1])
    assertResult({ code: '*', quality: 0.5 }, result[2])
    assertResult({ code: 'en', quality: 0.4 }, result[3])
    assertResult({ code: 'fr', quality: 0.2 }, result[4])
  })

  it('should correctly identify script', function () {
    const result = parse('zh-Hant-cn')
    assertResult(
      { code: 'zh', script: 'Hant', region: 'cn', quality: 1.0 },
      result[0]
    )
  })

  it('should cope with script and a quality value', function () {
    const result = parse('zh-Hant-cn;q=1, zh-cn;q=0.6, zh;q=0.4')
    assertResult(
      { code: 'zh', script: 'Hant', region: 'cn', quality: 1.0 },
      result[0]
    )
    assertResult({ code: 'zh', region: 'cn', quality: 0.6 }, result[1])
    assertResult({ code: 'zh', quality: 0.4 }, result[2])
  })
})

describe('accept-language#pick()', function () {
  it('empty', function () {
    const result = pick([], 'fr-CA,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5')

    assert.equal(result, undefined)
  })

  it('empty', function () {
    const result = pick(
      // @ts-expect-error test incorrect type
      [true],
      'fr-CA,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5'
    )

    assert.equal(result, undefined)
  })

  it('should pick a specific regional language', function () {
    const result = pick(
      ['en-US', 'fr-CA'],
      'fr-CA,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5'
    )
    assert.equal(result, 'fr-CA')
  })

  // it('should pick a specific regional language when accept-language is parsed', function () {
  //   const result = pick(
  //     ['en-US', 'fr-CA'],
  //     parse('fr-CA,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5')
  //   )
  //
  //   assert.equal(result, 'fr-CA')
  // })

  it('should pick a specific script (if specified)', function () {
    const result = pick(
      ['zh-Hant-cn', 'zh-cn'],
      'zh-Hant-cn,zh-cn;q=0.6,zh;q=0.4'
    )
    assert.equal(result, 'zh-Hant-cn')
  })

  it('should pick proper language regardless of casing', function () {
    const result = pick(
      ['eN-Us', 'Fr-cA'],
      'fR-Ca,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5'
    )

    assert.equal(result, 'Fr-cA')
  })

  it('should pick a specific language', function () {
    const result = pick(['en', 'fr-CA'], 'ja-JP,ja;1=0.5,en;q=0.2')
    assert.equal(result, 'en')
  })

  it('should pick a language when culture is not specified', function () {
    const result = pick(['en-us', 'it-IT'], 'pl-PL,en')
    assert.equal(result, 'en-us')
  })

  it('should return null if no matches are found', function () {
    const result = pick(
      ['ko-KR'],
      'fr-CA,fr;q=0.8,en-US;q=0.6,en;q=0.4,*;q=0.1'
    )
    assert.equal(result, null)
  })

  it('should return null if support no languages', function () {
    const result = pick([], 'fr-CA,fr;q=0.8,en-US;q=0.6,en;q=0.4,*;q=0.1')
    assert.equal(result, null)
  })

  // it('should return null if invalid support', function () {
  //   const result = pick(
  //     undefined,
  //     'fr-CA,fr;q=0.8,en-US;q=0.6,en;q=0.4,*;q=0.1'
  //   )
  //   assert.equal(result, null)
  // })

  it('should return null if invalid accept-language', function () {
    const result = pick(['en'], '')
    assert.equal(result, undefined)
  })

  it('by default should be strict when selecting language', function () {
    const result = pick(['en', 'pl'], 'en-US;q=0.6')
    assert.equal(result, null)
  })

  it('can select language loosely with an option', function () {
    const result = pick(['en', 'pl'], 'en-US;q=0.6', { loose: true })
    assert.equal(result, 'en')
  })

  it('selects the first matching language in loose mode, even when supported language is more restrictive', function () {
    const result = pick(['en-US', 'en', 'pl'], 'en;q=0.6', {
      loose: true
    })
    assert.equal(result, 'en-US')
  })

  it('selects the first matching language in loose mode, even when the accepted language is more restrictive', function () {
    const result = pick(['en', 'en-US', 'pl'], 'en-US;q=0.6', {
      loose: true
    })
    assert.equal(result, 'en')
  })

  it('quality is more important than order when matching loosely', function () {
    const result = pick(
      ['en', 'fr'],
      'fr-CA,fr;q=0.8,en-US;q=0.6,en;q=0.4,*;q=0.1',
      { loose: true }
    )
    const result2 = pick(
      ['fr', 'en'],
      'fr-CA,fr;q=0.8,en-US;q=0.6,en;q=0.4,*;q=0.1',
      { loose: true }
    )
    assert.equal(result, result2)
  })

  it('quality is more important than order when matching loosely2', function () {
    const result = pick(
      ['en', 'fr'],
      'fr-CA,en-US;q=0.7,fr;q=0.6,en;q=0.4,*;q=0.1',
      { loose: true }
    )
    const result2 = pick(
      ['fr', 'en'],
      'fr-CA,en-US;q=0.7,fr;q=0.6,en;q=0.4,*;q=0.1',
      { loose: true }
    )
    assert.equal(result, result2)
  })

  it('quality is more important than order when matching loosely3', function () {
    const result = pick(['en', 'fr'], 'en-US;q=0.7,fr;q=0.6,en;q=0.4,*;q=0.1', {
      loose: true
    })
    const result2 = pick(
      ['fr', 'en'],
      'en-US;q=0.7,fr;q=0.6,en;q=0.4,*;q=0.1',
      { loose: true }
    )
    assert.equal(result, result2)
  })

  it('should map zh-CHT => zh-Hant: Traditional Chinese', function () {
    const result = pick(
      ['zh-Hans', 'zh-Hant-CN', 'zh-Hant'],
      'zh-CHT,zh-cn;q=0.6,zh;q=0.4'
    )
    assert.equal(result, 'zh-Hant')
  })

  it('should map zh-TW => zh-Hant-TW: Traditional Chinese / Taiwan', function () {
    const result = pick(
      ['zh-Hans-CN', 'zh-Hans-SG', 'zh-Hans', 'zh-Hant-TW'],
      'zh-TW;q=0.6,zh;q=0.4'
    )
    assert.equal(result, 'zh-Hant-TW')
  })

  it('should map zh-HK => zh-Hant-HK: Traditional Chinese / Hong Kong', function () {
    const result = pick(
      ['zh-Hans-CN', 'zh-Hans-SG', 'zh-Hans', 'zh-Hant-HK', 'zh-Hant-TW'],
      'zh-HK;q=0.6,zh;q=0.4'
    )
    assert.equal(result, 'zh-Hant-HK')
  })

  it('should map zh-MO => zh-Hant-MO: Traditional Chinese / Macau', function () {
    const result = pick(
      ['zh-Hans-CN', 'zh-Hans-SG', 'zh-Hans', 'zh-Hant-TW', 'zh-Hant-MO'],
      'zh-MO;q=0.8,zh-TW;q=0.6,zh;q=0.4'
    )
    assert.equal(result, 'zh-Hant-MO')
  })

  it('should map zh-CHS to zh-Hans: Simplified Chinese', function () {
    const result = pick(
      ['zh-Hans-CN', 'zh-Hans', 'zh-Hans'],
      'zh-CHS,zh-cn;q=0.6,zh;q=0.4'
    )
    assert.equal(result, 'zh-Hans')
  })

  it('should map zh-cn => zh-Hans-CN: Simplied Chinese / China', function () {
    const result = pick(
      ['zh-Hans-CN', 'zh-Hans-SG', 'zh-Hans', 'zh-Hant'],
      'zh-cn;q=0.6,zh;q=0.4'
    )
    assert.equal(result, 'zh-Hans-CN')
  })

  it('should map zh-sg => zh-Hans-SG: Simplied Chinese / Singapore', function () {
    const result = pick(
      ['zh-Hans-CN', 'zh-Hans-SG', 'zh-Hans', 'zh-Hant'],
      'zh-sg;q=0.6,zh;q=0.4'
    )
    assert.equal(result, 'zh-Hans-SG')
  })
})

describe('readme examples', function () {
  it('parse()', function () {
    const result = parse('en-GB,en;q=0.8')
    assert.deepEqual(result, [
      { code: 'en', script: undefined, region: 'GB', quality: 1 },
      { code: 'en', script: undefined, region: undefined, quality: 0.8 }
    ])
  })

  it('pick() strict', function () {
    const result = pick(
      ['fr-CA', 'fr-FR', 'fr'],
      'en-GB,en-US;q=0.9,fr-CA;q=0.7,en;q=0.8'
    )
    assert.equal(result, 'fr-CA')
  })

  it('pick() loose', function () {
    const result = pick(
      ['fr', 'en'],
      'en-GB,en-US;q=0.9,fr-CA;q=0.7,en;q=0.8',
      { loose: true }
    )
    assert.equal(result, 'en')
  })
})
