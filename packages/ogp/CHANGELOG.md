# @solidjs/ogp

## 0.1.0

### Minor Changes

- 7c0154d: - Support Solid 2.0. `solid-js` and `@solidjs/web` 2.0 are peer dependencies, and `@solidjs/meta` is no longer one.
  - `DynamicImage` compiles to Solid 2.0 server functions (`@solidjs/vite-plugin` with `serverFunctions` on). The `runtime` value `SolidStart` is now `Solid`.
  - `OpenGraph` adds its `og:image` tag with `useHead` from `@solidjs/web`.
  - `parseSolidJSX` reads Solid 2.0 server-rendered templates and removes every hydration key.
  - Node 22 or later is required.
- 7348fa3: - The `TanstackStart` runtime works with current TanStack Start: the image url encodes its payload the way TanStack Start reads it, and the compiled code imports `createServerFn`.
  - New `createTanstackImageUrl(url, values)` export, which the compiled code uses to build that url.

### Patch Changes

- e73a387: - The compiler runs on oxc and returns a source map. Babel is no longer a dependency.
  - Values inside objects in a `DynamicImage`, such as `style={{ color: color() }}`, are passed to the server function.
  - An aliased import, such as `import { createMemo as memo }`, no longer stops the compiler from adding the import it needs.
