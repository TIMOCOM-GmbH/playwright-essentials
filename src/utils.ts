import type { Page } from '@playwright/test'

/**
 * Blocks all future Pendo requests for the given page.
 * @param page Playwright Page instance
 */
export async function blockPendo(page: Page): Promise<void> {
  await page.route('https://cdn.eu.pendo.io/**', route => route.abort())
  // deactivate pendo consent banner
  await page.addInitScript(() => {
    window.localStorage.setItem('timocom_appheader_pendoAnalyticsEnabled', 'false')
  })
}

/**
 * Blocks all eum requests for the given page.
 * @param page Playwright Page instance
 */
export async function blockEum(page: Page): Promise<void> {
  await page.route('https://eum.timocom.com/**', route => route.abort())
}

/** Blocks all analytics requests (Pendo and EUM) for the given page.
 * @param page Playwright Page instance
 */
export async function blockAllAnalytics(page: Page): Promise<void> {
  await blockPendo(page)
  await blockEum(page)
}
