import { test, expect } from '@playwright/test'
import { registerAuthSetup } from '../../src/auth.setup'
import { error } from 'console'

// Required env vars: BASE_URL, TEST_USER, TEST_PASS
const { BASE_URL, TEST_USER, TEST_PASS } = process.env

if (BASE_URL && TEST_USER && TEST_PASS) {
  test.describe('auth setup against stage', () => {
    async function readJoyrideFlags(page: import('@playwright/test').Page) {
      return await page.evaluate(() => ({
        joyride: localStorage.getItem('timocom_joyride_inactive'),
        news: localStorage.getItem('timocom_news_show_dialog'),
      }))
    }

    test('sets joyride flags by default', async ({ page }, testInfo) => {
      await registerAuthSetup(
        page,
        {
          baseURL: BASE_URL,
          user: TEST_USER,
          pass: TEST_PASS,
          successUrl: /tcgate/,
          statePath: testInfo.outputPath('state-default.json'),
        },
        true
      )
      const flags = await readJoyrideFlags(page)
      expect(flags).toEqual({ joyride: 'true', news: 'false' })
    })

    test('does not set joyride flags when deactivated = false', async ({ page }, testInfo) => {
      await registerAuthSetup(
        page,
        {
          baseURL: BASE_URL,
          user: TEST_USER,
          pass: TEST_PASS,
          successUrl: /tcgate/,
          statePath: testInfo.outputPath('state-nojoy.json'),
        },
        false
      )
      const flags = await readJoyrideFlags(page)
      expect(flags).toEqual({ joyride: null, news: null })
    })
  })
} else {
  error('Missing required env vars BASE_URL, TEST_USER, TEST_PASS')
}
