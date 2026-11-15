import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright E2E pour Yakro-Fê
 * Exécution locale sur le port 9005 ou sur l'URL cible (locale / prod).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 8000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:9005',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Pixel 7',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
