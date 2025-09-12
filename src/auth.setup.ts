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
  // Determine path and remove only the first directory segment (relative) for a clean auth state.
  const storageStatePath = statePath ?? process.env.AUTH_STATE_PATH ?? DEFAULT_AUTH_FILE
  try {
    if (!path.isAbsolute(storageStatePath)) {
      const segments = storageStatePath.split(/[\\/]/).filter(Boolean)
      // Remove leading '.' or './'
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
  await page.goto(`${baseURL}weblogin/`)
  await page.waitForLoadState('networkidle')
  await page.getByTestId('email').fill(user)
  await page.getByTestId('password').fill(pass)
  await page.getByTestId('submit-button').click()
  await ensureLoggedIn(page, { url: successUrl, timeout: 10_000 })
  await page.context().storageState({ path: storageStatePath })
}
