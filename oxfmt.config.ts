import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  // Compiler fixtures are test data: their outputs must match the compiler byte for byte.
  ignorePatterns: ['**/tests/fixtures/**'],
});
