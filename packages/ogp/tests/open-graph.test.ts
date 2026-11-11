import type { JSX } from '@solidjs/web';
import { renderToString } from '@solidjs/web';
import { createComponent } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { OpenGraph } from '../src/index';

// The compiled DynamicImage is an accessor of the image url, which the JSX
// types do not describe.
// oxlint-disable-next-line no-unsafe-type-assertion
const compiledImage = (() => '/_server/image?args=%5B1%5D') as unknown as JSX.Element;

describe('OpenGraph', () => {
  it('adds an og:image meta tag with the origin and the image url', () => {
    let head = '';
    renderToString(
      () =>
        createComponent(OpenGraph, {
          origin: 'https://example.com',
          children: compiledImage,
        }),
      // The output has no </head>, so the head tags arrive here.
      {
        onHead(value) {
          head = value;
        },
      },
    );
    expect(head).toContain('property="og:image"');
    expect(head).toContain('content="https://example.com/_server/image?args=%5B1%5D"');
  });
});
