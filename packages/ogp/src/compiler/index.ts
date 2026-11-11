import type babel from '@babel/core';
import type { PluginObj } from '@babel/core';
import { babel as babelUtils } from '@solid-mediakit/shared';
import { addDynamicImages, addDynamicImagesTanstack, replaceDynamicImages } from './utils';
export type Runtime = 'SolidStart' | 'TanstackStart';
export const transformOG =
  (runtime?: Runtime) =>
  ({ types: t }: { types: typeof babel.types }): PluginObj => {
    return {
      visitor: {
        Program(path) {
          const dynamicImages = replaceDynamicImages(t, path);
          if (dynamicImages.length) {
            babelUtils.importIfNotThere(path, t, 'createMemo', 'solid-js');
            babelUtils.importIfNotThere(path, t, 'createOpenGraphImage', '@solidjs/ogp/server');
            if (runtime == 'TanstackStart') {
              addDynamicImagesTanstack(dynamicImages, t, path);
            } else {
              addDynamicImages(dynamicImages, t, path);
            }
          }
          return path;
        },
      },
    };
  };
