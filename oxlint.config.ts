import config from '@lxsmnsyc/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [config],
  // Compiler fixtures are test data: their outputs must match the compiler byte for byte.
  // Agent worktrees under .claude/ hold other branches' work in progress.
  ignorePatterns: ['dist/**', '**/tests/fixtures/**', '.claude/**'],
});
