---
'@solidjs/ogp': minor
---

- Support Solid 2.0. `solid-js` and `@solidjs/web` 2.0 are peer dependencies, and `@solidjs/meta` is no longer one.
- `DynamicImage` compiles to Solid 2.0 server functions (`@solidjs/vite-plugin` with `serverFunctions` on). The `runtime` value `SolidStart` is now `Solid`.
- `OpenGraph` adds its `og:image` tag with `useHead` from `@solidjs/web`.
- `parseSolidJSX` reads Solid 2.0 server-rendered templates and removes every hydration key.
- Node 22 or later is required.
