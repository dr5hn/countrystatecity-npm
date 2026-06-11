import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  define: {
    '__VERSION__': JSON.stringify('0.0.0-test'),
  },
});
