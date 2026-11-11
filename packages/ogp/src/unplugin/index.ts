import babel from '@babel/core';
import { babel as babelUtils } from '@solid-mediakit/shared';
import type { FilterPattern } from 'unplugin';
import { createUnplugin } from 'unplugin';
import type { Runtime } from '../compiler';
import { transformOG } from '../compiler';

export type Options = {
  filter?: {
    include?: FilterPattern;
    exclude?: FilterPattern;
  };
  log?: boolean | RegExp;
  runtime?: Runtime;
};

export const unplugin = createUnplugin((opts?: Options) => {
  const filter = babelUtils.getFilter(opts?.filter);
  const log = opts?.log;
  return {
    enforce: 'pre',
    name: 'unplugin-dynamic-image',
    async transform(code, id) {
      if (!filter(id)) {
        return null;
      }
      const plugins: babel.ParserOptions['plugins'] = ['typescript', 'jsx'];

      const res = await babel.transformAsync(code, {
        plugins: [[transformOG(opts?.runtime)]],
        parserOpts: { plugins },
      });
      if (!res?.code) {
        return null;
      }
      // The log option prints the compiled output for debugging.
      if (log === true || (log instanceof RegExp && log.test(id))) {
        // oxlint-disable-next-line no-console
        console.log(id, res.code);
      }
      return { code: res.code, map: res.map };
    },
  };
});
export const vitePlugin = unplugin.vite;
export const rollupPlugin = unplugin.rollup;
export const webpackPlugin = unplugin.webpack;
export const rspackPlugin = unplugin.rspack;
export const esbuildPlugin = unplugin.esbuild;
