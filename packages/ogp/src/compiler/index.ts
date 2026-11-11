import type babel from '@babel/core';
import type { PluginObj } from '@babel/core';
import { babel as babelUtils } from '@solid-mediakit/shared';
import { addDynamicImages, addDynamicImagesTanstack, replaceDynamicImages } from './utils';

/**
 * Which server function runtime the compiled output targets. `Solid` is Solid
 * 2.0's own, compiled by @solidjs/vite-plugin with `serverFunctions` on.
 */
export type Runtime = 'Solid' | 'TanstackStart';

type PluginFactory = (api: { types: typeof babel.types }) => PluginObj;

export function transformOG(runtime?: Runtime): PluginFactory {
  return ({ types: t }) => ({
    visitor: {
      Program(path) {
        const dynamicImages = replaceDynamicImages(t, path);
        if (dynamicImages.length === 0) {
          return;
        }
        babelUtils.importIfNotThere(path, t, 'createMemo', 'solid-js');
        babelUtils.importIfNotThere(path, t, 'createOpenGraphImage', '@solidjs/ogp/server');
        if (runtime === 'TanstackStart') {
          addDynamicImagesTanstack(dynamicImages, t, path);
          return;
        }
        // Solid 2.0 server functions: GET declares a read with a url,
        // and serverFunctionUrl builds that url with the arguments.
        babelUtils.importIfNotThere(path, t, 'GET', '@solidjs/web/server-functions');
        babelUtils.importIfNotThere(path, t, 'serverFunctionUrl', '@solidjs/web/server-functions');
        addDynamicImages(dynamicImages, t, path);
      },
    },
  });
}
