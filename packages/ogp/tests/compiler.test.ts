import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { format } from 'prettier';
import { describe, expect, it } from 'vitest';
import type { Runtime } from '../src/compiler';
import { compile } from '../src/compiler';

interface FixtureOptions {
  error?: string;
}

// The fixture outputs are stored in this prettier style, so the comparison
// ignores how the compiler lays out its output.
async function formatCode(code: string, parser: string): Promise<string> {
  return await format(code, { parser, semi: false, singleQuote: true });
}

function readOptions(dir: string): FixtureOptions {
  const file = join(dir, 'options.json');
  if (!existsSync(file)) {
    return {};
  }
  const options: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (typeof options === 'object' && options !== null && 'error' in options) {
    return { error: String(options.error) };
  }
  return {};
}

const RUNTIMES: [Runtime, string][] = [
  ['Solid', 'solid'],
  ['TanstackStart', 'tanstack-start'],
];

for (const [runtime, folder] of RUNTIMES) {
  const root = join(import.meta.dirname, 'fixtures', folder);
  describe(`compile (${runtime})`, () => {
    for (const name of readdirSync(root)) {
      const dir = join(root, name);
      it(name, async () => {
        const isTs = existsSync(join(dir, 'code.tsx'));
        const file = join(dir, isTs ? 'code.tsx' : 'code.js');
        const code = readFileSync(file, 'utf8');
        const options = readOptions(dir);
        if (options.error) {
          expect(() => compile(file, code, { runtime })).toThrow(options.error);
          return;
        }
        const result = compile(file, code, { runtime });
        const actual = await formatCode(result?.code ?? code, isTs ? 'babel-ts' : 'babel');
        const outputFile = join(dir, 'output.js');
        // UPDATE=1 writes the outputs, so a new fixture only needs its code.
        if (process.env.UPDATE === '1') {
          writeFileSync(outputFile, actual);
        }
        expect(actual).toBe(readFileSync(outputFile, 'utf8'));
      });
    }
  });
}
