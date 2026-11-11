import type babel from '@babel/core';
import { pluginTester, prettierFormatter } from 'babel-plugin-tester';
import { join } from 'node:path';
import { transformOG } from '../src/compiler';

const plugins: babel.ParserOptions['plugins'] = ['typescript', 'jsx']

// The fixture outputs are stored in this prettier style. Pinning it here keeps
// the outputs stable whatever formatter config the repo uses.
const prettierOptions = { semi: false, singleQuote: true }

pluginTester({
	pluginName: "OGPlugin",
  formatResult: (code, options) =>
    prettierFormatter(code, { ...options, prettierOptions }),
  plugin: transformOG("SolidStart"),
  babelOptions: {
    presets: [['@babel/preset-typescript']],
    parserOpts: {
      plugins,
    },
  },
	// snapshot: true,
  fixtures: join(import.meta.dirname, 'fixtures/solid-start'),
})
pluginTester({
	pluginName: "OGPlugin",
  formatResult: (code, options) =>
    prettierFormatter(code, { ...options, prettierOptions }),
  plugin: transformOG("TanstackStart"),
  babelOptions: {
    presets: [['@babel/preset-typescript']],
    parserOpts: {
      plugins,
    },
  },
	// snapshot: true,
  fixtures: join(import.meta.dirname, 'fixtures/tanstack-start'),
})
