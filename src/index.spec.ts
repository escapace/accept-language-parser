import { assert, describe, it } from 'vitest'
import { pick } from './index.js'

describe('accept-language', function () {
  describe('forgiving mode', function () {
    it('should handle malformed tags gracefully when forgiving: true', function () {
      const result = pick('en-GB-abcdefghi,fr;q=0.8', ['en', 'fr'], { forgiving: true })
      assert.deepEqual(result, ['fr'])
    })

    it('should reject malformed tags when forgiving: false', function () {
      const result = pick('en-GB-abcdefghi,fr;q=0.8', ['en', 'fr'], { forgiving: false })
      assert.deepEqual(result, ['fr'])
    })

    it('should handle multiple malformed tags in forgiving mode', function () {
      const result = pick('de-de-1901-invalid,en-us-toolong', ['de', 'en'], { forgiving: true })
      assert.deepEqual(result, [])
    })
  })

  describe('lookup algorithm', function () {
    it('should return single best match with lookup algorithm', function () {
      const result = pick('en-US,en;q=0.9,fr;q=0.8', ['en-GB', 'en', 'fr'], { type: 'lookup' })
      assert.deepEqual(result, ['en'])
    })

    it('should return empty array when lookup finds no matches', function () {
      const result = pick('zh-CN,ja;q=0.8', ['ko-KR', 'th-TH'], { type: 'lookup' })
      assert.deepEqual(result, [])
    })

    it('should prefer exact regional match in lookup mode', function () {
      const result = pick('de-CH,de;q=0.8', ['de-DE', 'de-CH', 'de'], { type: 'lookup' })
      assert.deepEqual(result, ['de'])
    })
  })

  describe('RFC 4647 compliance', function () {
    it('should handle wildcard matching correctly', function () {
      const result = pick('*;q=0.1', ['ko-KR', 'th-TH', 'vi-VN'])
      assert.deepEqual(result, ['ko', 'th', 'vi'])
    })

    it('should prioritize specific languages over wildcard', function () {
      const result = pick('en;q=0.8,*;q=0.1', ['fr', 'de', 'en'])
      assert.deepEqual(result, ['en', 'fr', 'de'])
    })

    it('should handle language-script-region combinations', function () {
      const result = pick('zh-Hant-TW,zh-Hans-CN;q=0.8', ['zh-Hant-TW', 'zh-Hans-CN', 'zh'])
      assert.deepEqual(result, ['zh-TW', 'zh'])
    })
  })

  describe('malformed input handling', function () {
    it('should handle malformed Accept-Language headers', function () {
      const result = pick('en;q=invalid,fr;q=0.8', ['en', 'fr'])
      assert.deepEqual(result, ['en', 'fr'])
    })

    it('should handle empty quality scores', function () {
      const result = pick('en;q=,fr;q=0.8', ['en', 'fr'])
      assert.deepEqual(result, ['en', 'fr'])
    })

    it('should handle duplicate language tags', function () {
      const result = pick('en,en;q=0.8,fr;q=0.6', ['en', 'fr'])
      assert.deepEqual(result, ['en', 'fr'])
    })
  })

  describe('edge cases and boundary conditions', function () {
    it('should handle quality scores at boundaries', function () {
      const result = pick('en;q=0.000,fr;q=1.000,de;q=0.001', ['en', 'fr', 'de'])
      assert.deepEqual(result, ['fr', 'de', 'en'])
    })

    it('should handle whitespace variations', function () {
      const result = pick(' en-US , fr ; q = 0.8 ', ['en-US', 'fr'])
      assert.deepEqual(result, ['en', 'fr'])
    })
  })

  describe('integration - real-world scenarios', function () {
    it('should handle typical browser Accept-Language header', function () {
      const browserHeader = 'en-US,en;q=0.9,es;q=0.8,fr;q=0.7,de;q=0.6,it;q=0.5,ja;q=0.4'
      const result = pick(browserHeader, ['ja', 'ko', 'en'])
      assert.deepEqual(result, ['en', 'ja'])
    })

    it('should handle mobile Safari header with region preferences', function () {
      const safariHeader = 'en-US,en;q=0.9,zh-Hans-US;q=0.8,zh-Hans;q=0.7'
      const result = pick(safariHeader, ['en', 'zh-Hans', 'zh'])
      assert.deepEqual(result, ['en', 'zh'])
    })

    it('should handle i18n application scenario', function () {
      const appSupportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar']
      const result = pick('pt-BR,pt;q=0.9,en;q=0.8', appSupportedLanguages)
      assert.deepEqual(result, ['pt', 'en'])
    })
  })

  describe('existing tests', function () {
    it('empty', function () {
      const result = pick('fr-CA,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5', [])

      assert.deepEqual(result, [])
    })

    it('empty', function () {
      const result = pick('', [''])

      assert.deepEqual(result, [])
    })

    it('should pick a specific regional language', function () {
      const result = pick('fr-CA,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5', ['en-US', 'fr-CA'])
      assert.deepEqual(result, ['fr-CA', 'en'])
    })

    it('should pick a specific regional language when accept-language is parsed', function () {
      const result = pick('fr-CA,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5', ['en-US', 'fr-CA'])

      assert.deepEqual(result, ['fr-CA', 'en'])
    })

    it('should pick a specific script (if specified)', function () {
      const result = pick('zh-Hant-cn,zh-cn;q=0.6,zh;q=0.4', ['zh-Hant-cn', 'zh-cn'])
      assert.deepEqual(result, ['zh-Hant-CN', 'zh'])
    })

    it('should pick proper language regardless of casing', function () {
      const result = pick('fR-Ca,fr;q=0.2,en-US;q=0.6,en;q=0.4,*;q=0.5', ['eN-Us', 'Fr-cA'])

      assert.deepEqual(result, ['fr-CA', 'en'])
    })

    it('should pick a specific language', function () {
      const result = pick('ja-JP,ja;1=0.5,en;q=0.2', ['en', 'fr-CA'])
      assert.deepEqual(result, ['en'])
    })

    it('should pick a language when culture is not specified', function () {
      const result = pick('pl-PL,en', ['en-us', 'it-IT'])
      assert.deepEqual(result, ['en'])
    })

    it('should return null if no matches are found', function () {
      const result = pick('fr-CA,fr;q=0.8,en-US;q=0.6,en;q=0.4', ['ko-KR'])
      assert.deepEqual(result, [])
    })

    it('should return null if support no languages', function () {
      const result = pick('fr-CA,fr;q=0.8,en-US;q=0.6,en;q=0.4,*;q=0.1', [])
      assert.deepEqual(result, [])
    })

    it('should return null if invalid accept-language', function () {
      const result = pick('', ['en'])
      assert.deepEqual(result, [])
    })

    it('by default should be strict when selecting language', function () {
      const result = pick('en-US;q=0.6', ['en', 'pl'])
      assert.deepEqual(result, ['en'])
    })

    it('selects the first matching language, even when supported language is more restrictive', function () {
      const result = pick('en;q=0.6', ['en-US', 'en', 'pl'])
      assert.deepEqual(result, ['en'])
    })

    it('selects the first matching language, even when the accepted language is more restrictive', function () {
      const result = pick('en-US;q=0.6', ['en', 'en-US', 'pl'])
      assert.deepEqual(result, ['en'])
    })

    it('quality is more important than order', function () {
      const result = pick('fr-CA,fr;q=0.8,en-US;q=0.6,en;q=0.4,*;q=0.1', ['en', 'fr'])
      const result2 = pick('fr-CA,fr;q=0.8,en-US;q=0.6,en;q=0.4,*;q=0.1', ['fr', 'en'])
      assert.deepEqual(result, result2)
    })

    it('quality is more important than order', function () {
      const result = pick('fr-CA,en-US;q=0.7,fr;q=0.6,en;q=0.4,*;q=0.1', ['en', 'fr'])
      const result2 = pick('fr-CA,en-US;q=0.7,fr;q=0.6,en;q=0.4,*;q=0.1', ['fr', 'en'])
      assert.deepEqual(result, result2)
    })

    it('quality is more important than order when matching loosely3', function () {
      const result = pick('en-US;q=0.7,fr;q=0.6,en;q=0.4,*;q=0.1', ['en', 'fr'])
      const result2 = pick('en-US;q=0.7,fr;q=0.6,en;q=0.4,*;q=0.1', ['fr', 'en'])
      assert.deepEqual(result, result2)
    })

    it('should map zh-CHT => zh-Hant: Traditional Chinese', function () {
      const result = pick('zh-CHT,zh-cn;q=0.6,zh;q=0.4', ['zh-Hans', 'zh-Hant-CN', 'zh-Hant'], {
        type: 'lookup',
      })
      assert.deepEqual(result, ['zh'])
    })
  })
})
