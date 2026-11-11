import config from '@lxsmnsyc/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [config],
  // Compiler fixtures are test data: their outputs must match the compiler byte for byte.
  // Agent worktrees under .claude/ hold other branches' work in progress.
  ignorePatterns: ['dist/**', '**/tests/fixtures/**', '.claude/**'],
  overrides: [
    {
      // The compiler works on a structural AST type, so property access is
      // untyped there.
      files: ['packages/ogp/src/compiler/**'],
      rules: {
        'typescript/no-unsafe-argument': 'off',
        'typescript/no-unsafe-assignment': 'off',
        'typescript/no-unsafe-call': 'off',
        'typescript/no-unsafe-member-access': 'off',
        'typescript/no-unsafe-return': 'off',
        'typescript/no-unsafe-type-assertion': 'off',
        'typescript/no-explicit-any': 'off',
      },
    },
  ],
});
