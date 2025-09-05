import { defineConfig } from '@playwright/test'
import 'dotenv/config'

// Basic local E2E configuration importing helpers directly from src.
// For a real app set BASE_URL env or modify baseURL below.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || 'https://example.com/', // replace with real target or override via env
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  reporter: [['list']],
})
