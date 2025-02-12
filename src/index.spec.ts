import { assert, describe, it } from 'vitest'
import { pick } from './index.js'

describe('accept-language', function () {
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
