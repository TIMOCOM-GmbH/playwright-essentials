import type { Page } from '@playwright/test'
import { ensureLoggedIn } from './helpers/auth.js'
import fs from 'fs'
import path from 'path'

export const DEFAULT_AUTH_FILE = 'playwright/.auth/user.json'

export type RegisterAuthOptions = {
  // Optional base URL, defaults to process.env.BASE_URL or https://my.timocom.com/app/
  baseURL?: string
  user: string
  pass: string
  successUrl?: string | RegExp
  statePath?: string
  deactivateJoyridesAndNews?: boolean
  // Optional callback to retrieve the 2FA auth code (expects a 6 digit code)
  getAuthCode?: () => Promise<string> | string
}

export async function registerAuthSetup(page: Page, options: RegisterAuthOptions): Promise<void> {
  const {
    baseURL = process.env.BASE_URL ?? 'https://my.timocom.com/app/',
    user,
    pass,
    successUrl = /.*tcgate.*/,
    statePath,
    deactivateJoyridesAndNews = true,
    getAuthCode,
  } = options
  // Ensure baseURL ends with a trailing slash for consistent concatenation
  const normalizedBaseURL = baseURL.endsWith('/') ? baseURL : baseURL + '/'
  // Resolve storage state path early and remove its top-level directory to ensure a clean auth state
  const storageStatePath = statePath ?? process.env.AUTH_STATE_PATH ?? DEFAULT_AUTH_FILE
  try {
    if (!path.isAbsolute(storageStatePath)) {
      const segments = storageStatePath.split(/[\\/]/).filter(Boolean)
      while (segments.length && (segments[0] === '.' || segments[0] === '')) segments.shift()
      const first = segments[0]
      if (first && first !== '.' && first !== '..' && !first.startsWith('..')) {
        fs.rmSync(path.resolve(first), { force: true, recursive: true })
      }
    }
  } catch {}
  if (deactivateJoyridesAndNews) {
    await page.addInitScript(() => {
      window.localStorage.setItem('timocom_joyride_inactive', 'true')
      window.sessionStorage.setItem('timocom_news_show_dialog', 'false')
    })
  }

  // old login locators:
  const oldMailInput = page.getByTestId('email')
  const oldPassInput = page.getByTestId('password')
  const oldSubmitButton = page.getByTestId('submit-button')
  // new login locators:
  const newMailInput = page.locator('input#username')
  const newPassInput = page.locator('input#password')
  const newSubmitButton = page.locator('button#kc-login')
  const newTanInput = page.locator('input#tan')
  const newSubmitTanButton = page.getByTestId('submit-tan-button')

  // Navigate to the login page
  await page.goto(normalizedBaseURL)
  await page.waitForLoadState('networkidle')
  await oldMailInput.or(newMailInput).fill(user)
  if (await newMailInput.isVisible()) {
    await newSubmitButton.click()
  }
  await oldPassInput.or(newPassInput).fill(pass)
  await oldSubmitButton.or(newSubmitButton).click()
  // Handle 2FA if callback is provided
  if (getAuthCode) {
    await newTanInput.waitFor({ state: 'visible', timeout: 10000 })
    const code = await getAuthCode()
    await newTanInput.fill(code)
    await newSubmitTanButton.click()
  }
  await ensureLoggedIn(page, { url: successUrl, timeout: 10_000 })
  await page.context().storageState({ path: storageStatePath })
}
