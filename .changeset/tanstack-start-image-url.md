---
'@solidjs/ogp': minor
---

- The `TanstackStart` runtime works with current TanStack Start: the image url encodes its payload the way TanStack Start reads it, and the compiled code imports `createServerFn`.
- New `createTanstackImageUrl(url, values)` export, which the compiled code uses to build that url.
