import type babel from '@babel/core';
import type { ResultFormatter } from 'babel-plugin-tester';
import { pluginTester, prettierFormatter } from 'babel-plugin-tester';
import { join } from 'node:path';
import { transformOG } from '../src/compiler';

const plugins: babel.ParserOptions['plugins'] = ['typescript', 'jsx'];

// The fixture outputs are stored in this prettier style. Pinning it here keeps
// the outputs stable whatever formatter config the repo uses.
const prettierOptions = { semi: false, singleQuote: true };

const formatResult: ResultFormatter = async (code, options) =>
  prettierFormatter(code, { ...options, prettierOptions });

pluginTester({
  pluginName: 'OGPlugin',
  formatResult,
  plugin: transformOG('SolidStart'),
  babelOptions: {
    presets: [['@babel/preset-typescript']],
    parserOpts: {
      plugins,
    },
  },
  fixtures: join(import.meta.dirname, 'fixtures/solid-start'),
});
pluginTester({
  pluginName: 'OGPlugin',
  formatResult,
  plugin: transformOG('TanstackStart'),
  babelOptions: {
    presets: [['@babel/preset-typescript']],
    parserOpts: {
      plugins,
    },
  },
  fixtures: join(import.meta.dirname, 'fixtures/tanstack-start'),
});
