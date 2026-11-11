import type { SerovalJSON } from 'seroval';
import { fromJSON } from 'seroval';
import { describe, expect, it } from 'vitest';
import { createTanstackImageUrl } from '../src/index';

function isSerovalJSON(value: unknown): value is SerovalJSON {
  return typeof value === 'object' && value !== null && 't' in value;
}

/** Reads the payload the way TanStack Start's server function handler does for a GET. */
function readPayload(url: string): unknown {
  const payload = new URL(url, 'http://localhost').searchParams.get('payload');
  if (payload === null) {
    return {};
  }
  const json: unknown = JSON.parse(payload);
  if (!isSerovalJSON(json)) {
    throw new TypeError('payload is not seroval JSON');
  }
  return fromJSON(json);
}

describe('createTanstackImageUrl', () => {
  it('encodes the values as the payload data TanStack Start decodes', () => {
    const values = ['hello', 42, { nested: true }, null];
    const url = createTanstackImageUrl('/_serverFn/abc', values);
    expect(url.startsWith('/_serverFn/abc?payload=')).toBe(true);
    expect(readPayload(url)).toEqual({ data: { values } });
  });

  it('appends to a url that already has a query', () => {
    const url = createTanstackImageUrl('/_serverFn/abc?x=1', []);
    expect(url.startsWith('/_serverFn/abc?x=1&payload=')).toBe(true);
    expect(readPayload(url)).toEqual({ data: { values: [] } });
  });
});
