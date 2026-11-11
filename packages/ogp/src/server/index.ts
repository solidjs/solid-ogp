import type { JSX } from '@solidjs/web';
import { ImageResponse } from '@vercel/og';
import type { ImageResponseOptions } from '@vercel/og';
import { html } from 'satori-html';

/**
 * The object Solid's SSR compiler returns for a template. `t` is a string, or
 * a list of strings when the template has holes, with `h` holding the holes
 * that still have to resolve.
 */
export interface SSRTemplate {
  t: string | string[];
  h?: unknown[];
}

export type OpenGraphSource =
  | string
  | JSX.Element
  | SSRTemplate
  | (() => string | JSX.Element | SSRTemplate | Promise<string | JSX.Element | SSRTemplate>);

export type SatoriNode = ReturnType<typeof html>;

// Solid 2.0 marks hydrated elements with `_hk=<key>`. satori does not need it.
const HYDRATION_KEY = /\s_hk=[^\s>]*/g;

function isSSRTemplate(value: unknown): value is SSRTemplate {
  return typeof value === 'object' && value !== null && Object.hasOwn(value, 't');
}

function readTemplate(template: SSRTemplate): string {
  if (typeof template.t === 'string') {
    return template.t;
  }
  if (template.h && template.h.length > 0) {
    throw new Error('DynamicImage content must render synchronously');
  }
  return template.t.join('');
}

export async function parseSolidJSX(jsx?: OpenGraphSource): Promise<SatoriNode | undefined> {
  // Unwrap the function form, then read the markup off the SSR template.
  let value: unknown = typeof jsx === 'function' ? await jsx() : jsx;
  if (isSSRTemplate(value)) {
    value = readTemplate(value).replace(HYDRATION_KEY, '');
  }
  if (typeof value !== 'string' || value === '') {
    return undefined;
  }
  return html(value);
}

/**
 * Renders JSX, or a function that returns JSX, to an image response.
 * Only works on the server.
 */
export async function createOpenGraphImage(
  jsx?: OpenGraphSource,
  opts?: ImageResponseOptions,
): Promise<ImageResponse> {
  const converted = await parseSolidJSX(jsx);
  // ImageResponse is typed for React elements, but satori reads the vnode tree as is.
  return new ImageResponse(converted, {
    ...opts,
    // Tells the server function handler to send the response as is.
    headers: { 'X-Content-Raw': '' },
  });
}

export async function createBase64Image(jsx?: OpenGraphSource): Promise<string> {
  const img = await createOpenGraphImage(jsx);
  const buf = await new Response(img.body).arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buf).toString('base64')}`;
}

/** Reads the server function arguments from the `args` search parameter of a url. */
export function getArguments(url: string): unknown[] {
  const argsStr = new URL(url).searchParams.get('args');
  if (!argsStr) {
    return [];
  }
  const args: unknown = JSON.parse(argsStr);
  return Array.isArray(args) ? args : [];
}
