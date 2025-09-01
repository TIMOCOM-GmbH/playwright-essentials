import type { Page } from '@playwright/test'

/**
 * Ensures a user is considered logged in.
 * By default waits for network idle and optionally for a URL pattern.
 */
export async function ensureLoggedIn(
  page: Page,
  opts: { url?: string | RegExp; timeout?: number } = {}
): Promise<void> {
  const { url, timeout = 10_000 } = opts
  // wait for the page to settle first
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {})
  if (url) {
    await page.waitForURL(url, { timeout })
  }
}
