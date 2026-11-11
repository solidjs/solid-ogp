import solid from '@solidjs/vite-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Compiles the runtime's JSX. Tests run on the server, so the output is SSR.
  plugins: [solid({ ssr: true })],
  test: {
    // The plugin sets a browser environment. These tests run on the server.
    environment: 'node',
    // babel-plugin-tester calls `describe`/`it` off the global scope.
    globals: true,
  },
});
