# accept-language-parser

Parses the accept-language header from an HTTP request and produces an array of
language objects sorted by quality.

## Installation

1. Authenticate to GitHub Packages. For more information, see "[Authenticating to
   GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages)."
2. In the same directory as your `package.json` file, create or edit an `.npmrc`
   file to include a line:

   `@escpace:registry=https://npm.pkg.github.com`

3. Install the package.
   
   `npm install @escpace/accept-language-parser`

## API

#### parse(acceptLanguageHeader)

```js
import { parse } from '@escapace/accept-language-parser'

const languages = parse('en-GB,en;q=0.8')

console.log(languages)
```

Output will be:

```js
[
  {
    code: "en",
    region: "GB",
    quality: 1.0
  },
  {
    code: "en",
    region: undefined,
    quality: 0.8
  }
];
```

Output is always sorted in quality order from highest -> lowest. As per the HTTP spec, omitting the quality value implies 1.0.

#### pick(supportedLangugagesArray, acceptLanguageHeader, options = {})

```js
import { pick } from '@escapace/accept-language-parser'

const language = pick(
  ['fr-CA', 'fr-FR', 'fr'],
  'en-GB,en-US;q=0.9,fr-CA;q=0.7,en;q=0.8'
)

console.log(language)
```

Output will be:

```js
'fr-CA'
```

The `options` supports the `loose` flag which allows partial matching on supported languages.

For example:

```js
pick(['fr', 'en'], 'en-GB,en-US;q=0.9,fr-CA;q=0.7,en;q=0.8', {
  loose: true
})
```

Would return:

```js
'fr'
```

In loose mode the order of `supportedLanguagesArray` matters, as it is the first partially matching language that is returned. It means that if you want to pick more specific langauges first, you should list it first as well.

For example:

```javascript
;['fr-CA', 'fr']
```
