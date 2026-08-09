import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // babel-plugin-tester calls `describe`/`it` off the global scope.
    globals: true,
  },
});
