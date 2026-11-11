import type { FilterPattern } from 'unplugin';
import { createUnplugin } from 'unplugin';
import { createFilter } from 'unplugin-utils';
import type { Runtime } from '../compiler';
import { compile } from '../compiler';

export type Options = {
  filter?: {
    include?: FilterPattern;
    exclude?: FilterPattern;
  };
  log?: boolean | RegExp;
  runtime?: Runtime;
};

const DEFAULT_INCLUDE = 'src/**/*.{jsx,tsx,ts,js,mjs,cjs}';
const DEFAULT_EXCLUDE = 'node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}';

export const unplugin = createUnplugin((opts?: Options) => {
  const filter = createFilter(
    opts?.filter?.include ?? DEFAULT_INCLUDE,
    opts?.filter?.exclude ?? DEFAULT_EXCLUDE,
  );
  const log = opts?.log;
  return {
    enforce: 'pre',
    name: 'unplugin-dynamic-image',
    transform(code, id) {
      if (!filter(id.split('?')[0])) {
        return null;
      }
      const result = compile(id, code, { runtime: opts?.runtime });
      if (!result) {
        return null;
      }
      // The log option prints the compiled output for debugging.
      if (log === true || (log instanceof RegExp && log.test(id))) {
        // oxlint-disable-next-line no-console
        console.log(id, result.code);
      }
      return result;
    },
  };
});
export const vitePlugin = unplugin.vite;
export const rollupPlugin = unplugin.rollup;
export const webpackPlugin = unplugin.webpack;
export const rspackPlugin = unplugin.rspack;
export const esbuildPlugin = unplugin.esbuild;
