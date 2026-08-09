import type babel from '@babel/core';
import { pluginTester } from 'babel-plugin-tester';
import { join } from 'node:path';
import { transformOG } from '../src/compiler';

const plugins: babel.ParserOptions['plugins'] = ['typescript', 'jsx']

pluginTester({
	pluginName: "OGPlugin",
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
