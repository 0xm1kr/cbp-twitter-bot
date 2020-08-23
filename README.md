
# Coinbase Pro Twitter Bot

Trade tokens on Coinbase using sentiment analysis of Twitter!

## Getting Started

1. `npm i`
2. `cp .env.example .env`
3. Get a [Coinbase Pro Key](https://docs.pro.coinbase.com/#authentication)
4. `npm run build` - build the code
5. `npm link` - link the node script
6. `cbp-bot` - run it

## Development

### Available Scripts

+ `clean` - remove coverage data, Jest cache and transpiled files,
+ `build` - transpile TypeScript to ES6,
+ `build:watch` - interactive watch mode to automatically transpile source files,
+ `lint` - lint source files and tests,
+ `test` - run tests,
+ `test:watch` - interactive watch mode to automatically re-run tests

### Services

+ coinbase: built on [coinbase-pro-node](https://github.com/bennyn/coinbase-pro-node)

### Commands

+ `viewBalances`: shows current balances
+ `viewBook [product]`: view a snapshot of a product book (e.g. "BTC-USD")
+ `watchTicker [product]`: watch a product ticker
+ `watchBook [product]`: watch a product book

### Dependencies

+ [TypeScript][typescript] [3.9][typescript-39]
+ [ESLint][eslint] with some initial rules recommendation
+ [Jest][jest] for fast unit testing and code coverage
+ Type definitions for Node.js and Jest
+ [Prettier][prettier] to enforce consistent code style
+ NPM [scripts](#available-scripts) for common operations
+ Simple example of TypeScript code and unit test
+ .editorconfig for consistent file format
+ Reproducible environments thanks to [Volta][volta]
+ Example configuration for [Travis CI][travis]

### Volta?

[Volta][volta]’s toolchain always keeps track of where you are, it makes sure the tools you use always respect the settings of the project you’re working on. This means you don’t have to worry about changing the state of your installed software when switching between projects. Pretty neat stuff.

I recommend to [install][volta-getting-started] Volta and use it to manage your project's toolchain.

## License

🤲 Free as in speech: available under the APLv2 license.

Licensed under the APLv2. See the [LICENSE](https://github.com/jsynowiec/node-typescript-boilerplate/blob/master/LICENSE) file for details.

[ts-badge]: https://img.shields.io/badge/TypeScript-3.9-blue.svg
[nodejs-badge]: https://img.shields.io/badge/Node.js->=%2012.13-blue.svg
[nodejs]: https://nodejs.org/dist/latest-v12.x/docs/api/
[travis-badge]: https://travis-ci.org/jsynowiec/node-typescript-boilerplate.svg?branch=master
[travis-ci]: https://travis-ci.org/jsynowiec/node-typescript-boilerplate
[typescript]: https://www.typescriptlang.org/
[typescript-39]: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html
[license-badge]: https://img.shields.io/badge/license-APLv2-blue.svg
[license]: https://github.com/manymikes/cbp-twitter-bot/blob/master/LICENSE

[sponsor-badge]: https://img.shields.io/badge/♥-Sponsor-fc0fb5.svg
[sponsor]: https://github.com/sponsors/manymikes

[jest]: https://facebook.github.io/jest/
[eslint]: https://github.com/eslint/eslint
[prettier]: https://prettier.io
[volta]: https://volta.sh
[volta-getting-started]: https://docs.volta.sh/guide/getting-started
[volta-tomdale]: https://twitter.com/tomdale/status/1162017336699838467?s=20

[travis]: https://travis-ci.org
