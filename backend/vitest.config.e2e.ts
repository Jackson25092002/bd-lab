import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    setupFiles: ['./test/env.setup.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    setupFiles: ['./test/env.setup.ts'],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
