import type { Page } from '@playwright/test'

/**
 * Blocks all future Pendo requests for the given page.
 * @param page Playwright Page instance
 */
export async function blockPendo(page: Page): Promise<void> {
  await page.route('https://cdn.eu.pendo.io/**', route => route.abort())
}
