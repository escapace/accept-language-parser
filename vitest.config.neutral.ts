import { defineConfig, mergeConfig } from 'vitest/config'
import { version } from './package.json'
import { builds } from './scripts/constants.json'
import configShared from './vitest.config'

export default mergeConfig(
  configShared,
  defineConfig({
    define: {
      ...['neutral', 'browser', 'node']
        .map(
          (target) =>
            (Reflect.get(builds, target) as { define?: Record<string, string> } | undefined)
              ?.define,
        )
        .find((value) => value !== undefined),
      __ENVIRONMENT__: JSON.stringify('development'),
      __VERSION__: JSON.stringify(version),
      __VITEST_PROJECT__: JSON.stringify('neutral'),
    },
    test: {
      environment: 'node',
      include: ['{src,test}/**/+([a-zA-Z0-9-]).{test,spec}.?(c|m)[jt]s?(x)'],
      name: 'neutral',
      sequence: {
        hooks: 'list',
      },
    },
  }),
)
