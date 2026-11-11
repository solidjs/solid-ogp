import { Meta } from '@solidjs/meta';
import type { JSX } from '@solidjs/web';
import type { ImageResponseOptions } from '@vercel/og';
import type { ParentProps, ResolvedChildren } from 'solid-js';
import { children, createMemo } from 'solid-js';

export interface DynamicImageProps {
  children: JSX.Element | (() => JSX.Element | Promise<JSX.Element>);
  imageOptions?: ImageResponseOptions;
}

export function DynamicImage(_props: DynamicImageProps): JSX.Element {
  throw new Error('This should be compiled away');
}

/** The compiled `DynamicImage` resolves to the url of its image. */
function readUrl(value: ResolvedChildren): string {
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
  return <Meta property="og:image" content={props.origin + url()} />;
}

export function urlFromImage(comp: JSX.Element): () => string {
  // The compiler turns `DynamicImage` into an accessor of its url.
  return comp as unknown as () => string;
}
