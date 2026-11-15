import { defineConfig } from '@playwright/test';

const port = Number(process.env.ELITE_TEST_PORT || 3107);
const baseURL = process.env.ELITE_TEST_URL || `http://127.0.0.1:${port}`;
process.env.ELITE_TEST_SECRET ??= 'automated-test-owner-session-key-123456789';

export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.ts',
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 17_000 },
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    ...(process.env.ELITE_CHROME ? { launchOptions: { executablePath: process.env.ELITE_CHROME } } : {}),
    trace: 'retain-on-failure',
  },
  webServer: process.env.ELITE_TEST_URL ? undefined : {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    timeout: 120_000,
    env: { ELITE_NEXT_DIST: '.next-test', ELITE_MODE: 'preview', ELITE_ADMIN_SECRET: process.env.ELITE_TEST_SECRET, ELITE_DATA_PATH: `.data/test-${Date.now()}.sqlite`, ELITE_MEDIA_PATH: `.data/test-media-${Date.now()}` },
  },
});
