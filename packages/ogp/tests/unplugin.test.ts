import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Options } from '../src/unplugin';
import { unplugin } from '../src/unplugin';

/**
 * The plugin's `transform` never touches `this`, so the raw rollup form can be
 * driven directly instead of standing up a real bundler.
 */
type TransformResult = { code: string } | null;

async function transform(code: string, id: string, opts?: Options): Promise<TransformResult> {
  const plugin = unplugin.raw(opts, { framework: 'rollup' });
  if (Array.isArray(plugin) || typeof plugin.transform !== 'function') {
    throw new TypeError('expected a single plugin with a transform hook');
  }
  // oxlint-disable-next-line no-unsafe-type-assertion
  const run = plugin.transform as (code: string, id: string) => Promise<TransformResult>;
  return run(code, id);
}

function src(file: string): string {
  return join(process.cwd(), 'src', file);
}

const SOURCE = `const coolVar = <DynamicImage><div>{signal()}</div></DynamicImage>`;

describe('filtering', () => {
  it('transforms files under src by default', async () => {
    const res = await transform(SOURCE, src('routes/index.tsx'));
    expect(res?.code).toBeTypeOf('string');
  });

  it('skips files outside the default include', async () => {
    expect(await transform(SOURCE, join(process.cwd(), 'other/index.tsx'))).toBeNull();
    expect(await transform(SOURCE, src('styles.css'))).toBeNull();
  });

  it('honours a custom exclude', async () => {
    const filter = { exclude: '**/skipped.tsx' };
    expect(await transform(SOURCE, src('skipped.tsx'), { filter })).toBeNull();
    expect(await transform(SOURCE, src('kept.tsx'), { filter })).not.toBeNull();
  });
});

describe('transform', () => {
  it('replaces DynamicImage with a generated component and server function', async () => {
    const res = await transform(SOURCE, src('routes/index.tsx'));
    expect(res!.code).toContain('DynamicImage1ServerFunction');
    expect(res!.code).toContain("'use server'");
    expect(res!.code).toContain("import { createOpenGraphImage } from '@solidjs/ogp/server'");
    expect(res!.code).toContain('DynamicImage1({');
  });

  it('emits a TanStack server function when that runtime is selected', async () => {
    const res = await transform(SOURCE, src('routes/index.tsx'), {
      runtime: 'TanstackStart',
    });
    expect(res!.code).toContain('createServerFn(');
    expect(res!.code).toContain("import { createServerFn } from '@tanstack/solid-start'");
    expect(res!.code).not.toContain("'use server'");
  });

  it('leaves files without a DynamicImage alone', async () => {
    expect(await transform(`const x = <div>{signal()}</div>`, src('plain.tsx'))).toBeNull();
  });

  it('surfaces a DynamicImage that has no element child', async () => {
    await expect(
      transform(`const x = <DynamicImage>text only</DynamicImage>`, src('bad.tsx')),
    ).rejects.toThrow('DynamicImage must have a child element');
  });
});

describe('log option', () => {
  it('logs every transformed file when log is true', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await transform(SOURCE, src('routes/index.tsx'), { log: true });
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it('logs nothing when log is false', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await transform(SOURCE, src('routes/index.tsx'), { log: false });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('logs only ids matching a RegExp log filter', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await transform(SOURCE, src('routes/index.tsx'), { log: /routes/ });
    await transform(SOURCE, src('other.tsx'), { log: /routes/ });
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
