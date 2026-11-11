---
'@solidjs/ogp': patch
---

- The compiler runs on oxc and returns a source map. Babel is no longer a dependency.
- Values inside objects in a `DynamicImage`, such as `style={{ color: color() }}`, are passed to the server function.
- An aliased import, such as `import { createMemo as memo }`, no longer stops the compiler from adding the import it needs.
