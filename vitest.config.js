import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['example', 'node_modules', 'dist'],
    coverage: {
      include: ['src'],
      exclude: ['example', 'node_modules', 'dist'],
    },
  },
});
