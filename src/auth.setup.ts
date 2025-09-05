import type { Page } from '@playwright/test'
import { ensureLoggedIn } from './helpers/auth.js'

export const DEFAULT_AUTH_FILE = 'playwright/.auth/user.json'

export type RegisterAuthOptions = {
  // Optional base URL, defaults to process.env.BASE_URL or https://my.timocom.com/app/
  baseURL?: string
  user: string
  pass: string
  successUrl?: string | RegExp
  statePath?: string
  deactivateJoyridesAndNews?: boolean
}

export async function registerAuthSetup(page: Page, options: RegisterAuthOptions): Promise<void> {
  const {
    baseURL = process.env.BASE_URL ?? 'https://my.timocom.com/app/',
    user,
    pass,
    successUrl = /.*tcgate.*/,
    statePath,
    deactivateJoyridesAndNews = true,
  } = options

  if (deactivateJoyridesAndNews!) {
    await page.addInitScript(() => {
      window.localStorage.setItem('timocom_joyride_inactive', 'true')
      window.localStorage.setItem('timocom_news_show_dialog', 'false')
    })
  }
  await page.goto(`${baseURL}weblogin/`)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('email').fill(user)
  await page.getByTestId('password').fill(pass)
  await page.getByTestId('submit-button').click()
  await ensureLoggedIn(page, { url: successUrl, timeout: 10_000 })
  const path = statePath ?? process.env.AUTH_STATE_PATH ?? DEFAULT_AUTH_FILE
  await page.context().storageState({ path })
}
