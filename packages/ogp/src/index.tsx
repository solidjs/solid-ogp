import type { JSX } from '@solidjs/web';
import { useHead } from '@solidjs/web';
import type { ImageResponseOptions } from '@vercel/og';
import type { ParentProps } from 'solid-js';
import { children, createMemo, flatten } from 'solid-js';
import { toJSON } from 'seroval';

export interface DynamicImageProps {
  children: JSX.Element | (() => JSX.Element | Promise<JSX.Element>);
  imageOptions?: ImageResponseOptions;
}

export function DynamicImage(_props: DynamicImageProps): JSX.Element {
  throw new Error('This should be compiled away');
}

/** The compiled `DynamicImage` resolves to the url of its image. */
function readUrl(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function Image(props: ParentProps): JSX.Element {
  const child = children(() => props.children);
  const url = createMemo(() => readUrl(child()));
  return <img src={url()} />;
}

export function OpenGraph(props: ParentProps<{ origin: string }>): JSX.Element {
  const child = children(() => props.children);
  const url = createMemo(() => readUrl(child()));
  // The head registry reads the getter, so the tag follows the url.
  useHead({
    tag: 'meta',
    props: {
      property: 'og:image',
      get content(): string {
        return props.origin + url();
      },
    },
  });
  return null;
}

export function urlFromImage(comp: JSX.Element): () => string {
  // The compiler turns `DynamicImage` into an accessor of its url.
  return () => readUrl(flatten(comp));
}

/**
 * Builds the GET url of a TanStack Start server function called with
 * `{ data: { values } }`. TanStack Start reads the `payload` search parameter
 * with seroval's `fromJSON`, so the payload is encoded with seroval too.
 */
export function createTanstackImageUrl(url: string, values: unknown[]): string {
  const payload = encodeURIComponent(JSON.stringify(toJSON({ data: { values } })));
  return `${url}${url.includes('?') ? '&' : '?'}payload=${payload}`;
}
