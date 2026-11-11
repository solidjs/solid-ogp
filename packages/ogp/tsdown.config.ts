import type { UserConfig } from 'tsdown';
import { defineConfig } from 'tsdown';

/**
 * The one entry whose output still contains JSX, so it is built separately in
 * order to get a `.jsx` extension — `outExtensions` applies per build, not per
 * chunk. It is ESM-only: a CJS consumer has no way to compile the JSX anyway.
 */
const jsxEntry = { index: 'src/index.tsx' };

/**
 * Plain TypeScript entries. The compiler is an implementation detail of the
 * unplugin entry and gets bundled into it, so it is not an entry of its own.
 */
const entry = {
  server: 'src/server/index.ts',
  unplugin: 'src/unplugin/index.ts',
};

/**
 * Pin the extensions instead of letting tsdown infer them, so the `exports`
 * map in package.json stays accurate. The package is ESM (`"type": "module"`),
 * so ESM keeps `.js` and only CJS needs a distinct extension.
 */
function outExtensions({ format }: { format: string }): { js: string; dts: string } {
  return format === 'cjs' ? { js: '.cjs', dts: '.d.cts' } : { js: '.js', dts: '.d.ts' };
}

// JSX is left preserved (via `jsx: "preserve"` in tsconfig.json) so that the
// consuming app's own Solid compiler decides between DOM and SSR output.
const sharedJsx: UserConfig = {
  entry: jsxEntry,
  platform: 'neutral',
  format: 'esm',
  dts: true,
  outExtensions: () => ({ js: '.jsx', dts: '.d.ts' }),
  clean: false,
};

const shared: UserConfig = {
  entry,
  platform: 'neutral',
  format: ['esm', 'cjs'],
  dts: true,
  outExtensions,
};

export default defineConfig([
  { ...sharedJsx, outDir: 'dist/dev', env: { PROD: false }, clean: true },
  { ...sharedJsx, outDir: 'dist', env: { PROD: true } },
  { ...shared, outDir: 'dist/dev', env: { PROD: false } },
  { ...shared, outDir: 'dist', env: { PROD: true } },
]);
