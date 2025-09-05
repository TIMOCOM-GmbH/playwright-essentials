import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Only run unit tests; exclude Playwright e2e specs
    include: ['tests/unit/**/*.{test,spec}.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
})
