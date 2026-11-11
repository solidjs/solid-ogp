<p>
  <img src="https://assets.solidjs.com/banner?project=OGP&type=core" alt="Solid OGP" />
</p>

# @solidjs/ogp

[![NPM Version](https://img.shields.io/npm/v/@solidjs/ogp.svg?style=for-the-badge)](https://www.npmjs.com/package/@solidjs/ogp)
[![NPM Downloads](https://img.shields.io/npm/dm/@solidjs/ogp.svg?style=for-the-badge)](https://www.npmjs.com/package/@solidjs/ogp)
[![Discord](https://img.shields.io/discord/722131463138705510?style=for-the-badge)](https://discord.com/invite/solidjs)

Dynamic images and Open Graph images for Solid, written as JSX.

You write the image inside a `<DynamicImage>` in a component. At build time, a compiler plugin moves that JSX into a server function. The server function renders it to a PNG with [`@vercel/og`](https://vercel.com/docs/functions/og-image-generation) (satori and resvg). In the component, `<DynamicImage>` becomes the URL of that image. Signals and other values used in the JSX are sent to the server function as arguments, so the image updates when they change.

- Use `<Image>` to show the image in an `<img>` tag.
- Use `<OpenGraph>` to add it as the page's `og:image` meta tag.
- Works with Solid 2.0 server functions, and with TanStack Start.

## Installation

```sh
pnpm add @solidjs/ogp
# or
npm install @solidjs/ogp
```

Requirements:

- Node.js 22 or later
- `solid-js` and `@solidjs/web` 2.0 (peer dependencies)
- An SSR setup that runs server functions: Solid's [`@solidjs/vite-plugin`](https://www.npmjs.com/package/@solidjs/vite-plugin) with `serverFunctions` turned on, or TanStack Start

## Setup

Add the compiler plugin to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';
import { vitePlugin as ogp } from '@solidjs/ogp/unplugin';

export default defineConfig({
  plugins: [ogp(), solid({ ssr: true, serverFunctions: true })],
});
```

The plugin runs before Solid's own compiler (`enforce: 'pre'`), so `<DynamicImage>` is rewritten before the JSX is compiled. By default it only transforms files under `src/`. See [Plugin options](#plugin-options).

Other bundlers are supported through [unplugin](https://unplugin.unjs.io/). Use `rollupPlugin`, `webpackPlugin`, `rspackPlugin` or `esbuildPlugin` from `@solidjs/ogp/unplugin`.

### TanStack Start

Set the `runtime` option so the compiler generates a TanStack Start server function (`createServerFn`) instead of a Solid one:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/solid-start/plugin/vite';
import { vitePlugin as ogp } from '@solidjs/ogp/unplugin';

export default defineConfig({
  plugins: [ogp({ runtime: 'TanstackStart' }), tanstackStart()],
});
```

## Usage

### Show an image with `<Image>`

```tsx
import { createSignal } from 'solid-js';
import { DynamicImage, Image } from '@solidjs/ogp';

export default function Home() {
  const [count, setCount] = createSignal(0);
  return (
    <main>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
      <Image>
        <DynamicImage>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'font-size': '128px',
              background: 'lavender',
            }}
          >
            {`Hello ${count() * 2}!`}
          </div>
        </DynamicImage>
      </Image>
    </main>
  );
}
```

The image is rendered on the server. When `count` changes, the image URL changes and the browser loads the new image.

### Add an Open Graph image with `<OpenGraph>`

`<OpenGraph>` renders nothing in the page. It adds an `og:image` meta tag to the document head with `useHead` from `@solidjs/web`. Crawlers need an absolute URL, so pass your site's `origin`:

```tsx
import { DynamicImage, OpenGraph } from '@solidjs/ogp';

export default function Post(props: { title: string }) {
  return (
    <>
      <OpenGraph origin="https://example.com">
        <DynamicImage>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'font-size': '72px',
              color: 'white',
              background: '#2c4f7c',
            }}
          >
            {props.title}
          </div>
        </DynamicImage>
      </OpenGraph>
      <article>{/* ... */}</article>
    </>
  );
}
```

This produces:

```html
<meta property="og:image" content="https://example.com/_server/data/<id>?args=..." />
```

### Get the URL with `urlFromImage`

To use the URL yourself, for example in a link or a CSS background, pass a `<DynamicImage>` to `urlFromImage`. It returns an accessor:

```tsx
import { DynamicImage, urlFromImage } from '@solidjs/ogp';

const imageUrl = urlFromImage(
  <DynamicImage>
    <div style={{ display: 'flex' }}>Hello!</div>
  </DynamicImage>,
);

<a href={imageUrl()} download="hello.png">
  Download
</a>;
```

### Image options

`imageOptions` is passed to `@vercel/og`'s `ImageResponse`. Use it to set `width`, `height`, `fonts`, `emoji` and the other [`ImageResponseOptions`](https://vercel.com/docs/functions/og-image-generation/og-image-api):

```tsx
<DynamicImage imageOptions={{ width: 1200, height: 630, emoji: 'openmoji' }}>
  <div style={{ display: 'flex' }}>Hi! 👋</div>
</DynamicImage>
```

`imageOptions` must be an **inline object literal**. The compiler copies the literal into the server function. A variable or any other expression is ignored, and the defaults are used instead.

## How it works

Take this component:

```tsx
<DynamicImage>
  <div>{count()}</div>
</DynamicImage>
```

The compiler turns it into roughly the following (Solid runtime):

```tsx
const DynamicImage1ServerFunction = GET((...args) => {
  'use server';
  const [r0] = args;
  return createOpenGraphImage(<div>{r0}</div>);
});

const DynamicImage1 = (props) => {
  const url = createMemo(() => serverFunctionUrl(DynamicImage1ServerFunction, ...props.values));
  return url;
};

DynamicImage1({ values: [count()] });
```

- Every identifier, call or member expression inside the JSX, such as `count()`, `props.title` or `user?.name`, becomes an argument of the server function. This includes values inside objects, such as `style={{ color: color() }}`. Static text and literals stay in the server function.
- With the Solid runtime, the URL is built with `serverFunctionUrl` and looks like `/_server/data/<id>?args=[...]`. With TanStack Start, the arguments are encoded with seroval in a `payload` search parameter.
- The server function renders the JSX with Solid's SSR compiler and passes the HTML to satori, which draws the image.
- `<DynamicImage>` is replaced with an accessor of the image URL. `<Image>`, `<OpenGraph>` and `urlFromImage` read that URL.

## Limitations

- **Images use satori's layout engine.** Satori supports a [subset of CSS](https://github.com/vercel/satori#css). It uses flexbox only, so an element with more than one child needs `display: flex`.
- **Arguments go in the URL.** Each expression in the JSX is evaluated in the component, and its value is sent in the image URL. With the Solid runtime, values must be JSON-safe (strings, numbers, booleans, `null`, arrays and plain objects), and the whole URL must stay under 2000 characters. Otherwise `serverFunctionUrl` throws. Pass the data the image needs, not large objects.
- **Static text and literals stay in the JSX.** Only identifiers, calls and member expressions are replaced with arguments. The server function is generated in the same module, so tags such as `<div>` render on the server as written.
- **The content must render synchronously.** Async content inside `<DynamicImage>` throws `DynamicImage content must render synchronously`.
- **`<DynamicImage>` needs at least one child element.** Text on its own is not enough. Several child elements are wrapped in a single `<div>`.
- **Only the compiled form works.** `<DynamicImage>` throws if it runs without the compiler, for example in a file the plugin's `filter` excludes.

## API

### `@solidjs/ogp`

| Export                                | Description                                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `DynamicImage`                        | Marks JSX to render as an image. Props: `children`, `imageOptions`. Compiled into an accessor of the image URL. |
| `Image`                               | Renders `<img src={url}>` for the `DynamicImage` it wraps.                                                      |
| `OpenGraph`                           | Adds `<meta property="og:image">` for the `DynamicImage` it wraps. Props: `origin`.                             |
| `urlFromImage(image)`                 | Returns an accessor of the URL of a compiled `DynamicImage`.                                                    |
| `createTanstackImageUrl(url, values)` | Builds the GET URL of a TanStack Start server function. The compiled code uses it.                              |

### `@solidjs/ogp/server`

For server-only code, such as API routes.

| Export                                | Description                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| `createOpenGraphImage(jsx, options?)` | Renders JSX, or a function that returns JSX, to an `ImageResponse` (a PNG `Response`). |
| `createBase64Image(jsx)`              | Renders JSX to a `data:image/png;base64,...` string.                                   |
| `parseSolidJSX(jsx)`                  | Converts Solid's SSR output to satori's virtual DOM. Removes hydration keys.           |
| `getArguments(url)`                   | Reads server function arguments from the `args` search parameter of a URL.             |

You can also render images yourself without the compiler. For example, in a request handler that returns a `Response` (the exact route shape depends on your framework):

```tsx
import { createOpenGraphImage } from '@solidjs/ogp/server';

export function GET() {
  return createOpenGraphImage(
    () => <div style={{ display: 'flex', 'font-size': '64px' }}>Hello!</div>,
    { width: 1200, height: 630 },
  );
}
```

### `@solidjs/ogp/unplugin`

| Export                                                                         | Description                           |
| ------------------------------------------------------------------------------ | ------------------------------------- |
| `vitePlugin`, `rollupPlugin`, `webpackPlugin`, `rspackPlugin`, `esbuildPlugin` | The compiler plugin for each bundler. |
| `unplugin`                                                                     | The underlying unplugin instance.     |

#### Plugin options

| Option           | Type                         | Default                                       | Description                                                                                       |
| ---------------- | ---------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `runtime`        | `'Solid' \| 'TanstackStart'` | `'Solid'`                                     | Which server function runtime the generated code targets.                                         |
| `filter.include` | `FilterPattern`              | `'src/**/*.{jsx,tsx,ts,js,mjs,cjs}'`          | Files to transform.                                                                               |
| `filter.exclude` | `FilterPattern`              | `'node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}'` | Files to skip.                                                                                    |
| `log`            | `boolean \| RegExp`          | `false`                                       | Prints the compiled output of every file, or of files whose id matches the RegExp. For debugging. |

## Contributing

This is a pnpm workspace. The package lives in `packages/ogp`.

```sh
pnpm install
pnpm build       # build the package
pnpm test        # run the tests
pnpm typecheck
pnpm lint
pnpm format
```

Releases are managed with [changesets](https://github.com/changesets/changesets). Run `pnpm changeset` to describe your change. When it's merged, the release workflow publishes it to npm.

## License

MIT
