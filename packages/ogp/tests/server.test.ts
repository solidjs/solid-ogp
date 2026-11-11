import { describe, expect, it } from 'vitest';
import { getArguments, parseSolidJSX } from '../src/server';

describe('parseSolidJSX', () => {
  it('returns undefined when given nothing', async () => {
    await expect(parseSolidJSX()).resolves.toBeUndefined();
    await expect(parseSolidJSX(undefined)).resolves.toBeUndefined();
  });

  it('converts an HTML string into a satori vnode tree', async () => {
    const vnode = await parseSolidJSX('<div>hi</div>');
    expect(vnode).toMatchObject({
      type: 'div',
      props: { children: [{ type: 'div', props: { children: 'hi' } }] },
    });
  });

  it('unwraps a function that returns markup', async () => {
    const vnode = await parseSolidJSX(() => '<span>sync</span>');
    expect(vnode).toMatchObject({
      props: { children: [{ type: 'span', props: { children: 'sync' } }] },
    });
  });

  it('awaits a function that returns a promise', async () => {
    const vnode = await parseSolidJSX(async () => await Promise.resolve('<span>async</span>'));
    expect(vnode).toMatchObject({
      props: { children: [{ type: 'span', props: { children: 'async' } }] },
    });
  });

  it("reads markup off Solid's `{ t }` server-rendered template object", async () => {
    const vnode = await parseSolidJSX({ t: '<div>from template</div>' });
    expect(vnode).toMatchObject({
      props: { children: [{ props: { children: 'from template' } }] },
    });
  });

  it('strips every hydration key so none reaches satori', async () => {
    const vnode = await parseSolidJSX({
      t: '<div _hk=0-0-1 id="keep"><span _hk=0-0-2>hi</span><b _hk=0-0-3>x</b></div>',
    });
    const serialized = JSON.stringify(vnode);
    expect(serialized).not.toContain('_hk');
    expect(serialized).toContain('keep');
  });

  it('joins the strings of a template that had holes', async () => {
    const vnode = await parseSolidJSX({ t: ['<div>', 'joined', '</div>'], h: [] });
    expect(vnode).toMatchObject({
      props: { children: [{ type: 'div', props: { children: 'joined' } }] },
    });
  });

  it('rejects a template with holes that have not resolved', async () => {
    await expect(parseSolidJSX({ t: ['<div>', '</div>'], h: [() => 'later'] })).rejects.toThrow(
      'DynamicImage content must render synchronously',
    );
  });

  it('returns undefined for values it cannot turn into markup', async () => {
    await expect(parseSolidJSX(123)).resolves.toBeUndefined();
    const unknownObject: object = { nope: true };
    await expect(parseSolidJSX(unknownObject)).resolves.toBeUndefined();
    await expect(parseSolidJSX(() => 42)).resolves.toBeUndefined();
  });
});

describe('getArguments', () => {
  it('returns an empty list when the url carries no args', () => {
    expect(getArguments('https://example.com/_server/')).toEqual([]);
    expect(getArguments('https://example.com/_server/?other=1')).toEqual([]);
  });

  it('round-trips the values encoded by the compiled component', () => {
    const values = ['hello', 42, { nested: true }, null];
    const url = `https://example.com/_server/?args=${encodeURIComponent(JSON.stringify(values))}`;
    expect(getArguments(url)).toEqual(values);
  });

  it('throws on an args param that is not valid JSON', () => {
    expect(() => getArguments('https://example.com/_server/?args=not-json')).toThrow();
  });
});
