import type { APIRequestContext, APIResponse, Page } from '@playwright/test'
import { ensureLoggedIn } from './helpers/auth.js'
import { createHash, randomBytes } from 'crypto'
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
  const newMailInput = page.locator('#username')
  const newPassInput = page.locator('#password')
  const newSubmitButton = page.locator('#kc-login')
  const newTanInput = page.getByTestId('tan').or(page.locator('#otp'))
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
    await newTanInput.waitFor({ state: 'visible' })
    const code = await getAuthCode()
    await newTanInput.fill(code)
    await newSubmitTanButton.or(newSubmitButton).click()
  }
  await ensureLoggedIn(page, { url: successUrl, timeout: 10_000 })
  await page.context().storageState({ path: storageStatePath })
}

export type RegisterApiAuthOptions = {
  // Optional Keycloak realm URL, defaults to process.env.AUTH_REALM_URL or https://iam.timocom.com/realms/timocom
  realmUrl?: string
  // Optional base URL, defaults to process.env.BASE_URL or https://my.timocom.com/app/
  baseURL?: string
  user: string
  pass: string
  // Keycloak client the web app uses, defaults to web-ui-public-login
  clientId?: string
  // Where Keycloak redirects after login, defaults to `${baseURL}tcgate/`
  redirectUri?: string
  statePath?: string
  deactivateJoyridesAndNews?: boolean
  // Optional callback to retrieve the 2FA auth code (expects a 6 digit code)
  getAuthCode?: () => Promise<string> | string
}

type KeycloakForm = { action: string; asksPassword: boolean; asksOtp: boolean }

const base64url = (buffer: Buffer) => buffer.toString('base64url')

// Keycloak login pages are plain HTML forms; each step posts to the action of the current form.
function keycloakForm(html: string): KeycloakForm {
  const match = /<form[^>]*\baction="([^"]+)"/.exec(html)
  if (!match) {
    throw new Error(`No form on the Keycloak page:\n${html.slice(0, 1000)}`)
  }
  return {
    action: match[1].replace(/&amp;/g, '&'),
    asksPassword: /name="password"/.test(html),
    asksOtp: /name="otp"/.test(html),
  }
}

/**
 * Logs in against Keycloak with plain HTTP calls instead of the login UI: the same
 * username, password and optional OTP steps the login page asks for. The Keycloak
 * session cookies end up in the storage state, so the app signs in on its own.
 */
export async function registerApiAuthSetup(
  request: APIRequestContext,
  options: RegisterApiAuthOptions
): Promise<void> {
  const {
    realmUrl = process.env.AUTH_REALM_URL ?? 'https://iam.timocom.com/realms/timocom',
    baseURL = process.env.BASE_URL ?? 'https://my.timocom.com/app/',
    user,
    pass,
    clientId = 'web-ui-public-login',
    statePath,
    deactivateJoyridesAndNews = true,
    getAuthCode,
  } = options
  const normalizedBaseURL = baseURL.endsWith('/') ? baseURL : baseURL + '/'
  const redirectUri = options.redirectUri ?? `${normalizedBaseURL}tcgate/`
  const storageStatePath = statePath ?? process.env.AUTH_STATE_PATH ?? DEFAULT_AUTH_FILE

  const verifier = base64url(randomBytes(48))
  const authUrl = `${realmUrl.replace(/\/+$/, '')}/protocol/openid-connect/auth?${new URLSearchParams(
    {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      response_mode: 'fragment',
      scope: 'openid',
      state: base64url(randomBytes(8)),
      nonce: base64url(randomBytes(8)),
      code_challenge: base64url(createHash('sha256').update(verifier).digest()),
      code_challenge_method: 'S256',
    }
  )}`

  let form = keycloakForm(await (await request.get(authUrl)).text())
  let response: APIResponse
  if (form.asksPassword) {
    response = await request.post(form.action, {
      form: { username: user, password: pass },
      maxRedirects: 0,
    })
  } else {
    // Two-step login: username first, then password on the next page
    form = keycloakForm(
      await (await request.post(form.action, { form: { username: user } })).text()
    )
    response = await request.post(form.action, { form: { password: pass }, maxRedirects: 0 })
  }

  if (response.status() === 200 && getAuthCode) {
    form = keycloakForm(await response.text())
    if (form.asksOtp) {
      response = await request.post(form.action, {
        form: { otp: await getAuthCode() },
        maxRedirects: 0,
      })
    }
  }

  const location = response.headers().location ?? ''
  const redirected = response.status() >= 300 && response.status() < 400
  if (!redirected || !location.startsWith(redirectUri)) {
    throw new Error(
      `Keycloak login for ${user} failed: ${response.status()} ${location}\n${(await response.text()).slice(0, 1000)}`
    )
  }

  const state = await request.storageState()
  if (deactivateJoyridesAndNews) {
    // No page to run an init script in, so the flag goes straight into the state
    state.origins.push({
      origin: new URL(normalizedBaseURL).origin,
      localStorage: [{ name: 'timocom_joyride_inactive', value: 'true' }],
    })
  }
  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true })
  fs.writeFileSync(storageStatePath, JSON.stringify(state, null, 2))
}

const TOTP_PERIOD_MS = 30_000

export type RegisterAuthWithFallbackOptions = RegisterAuthOptions &
  Pick<RegisterApiAuthOptions, 'realmUrl' | 'clientId' | 'redirectUri'>

/**
 * Tries the login via API first and falls back to the UI login if that fails,
 * e.g. when Keycloak changes its login flow.
 */
export async function registerAuthSetupWithFallback(
  page: Page,
  options: RegisterAuthWithFallbackOptions
): Promise<void> {
  const { getAuthCode } = options
  let otpSentAt: number | undefined
  const trackedGetAuthCode = getAuthCode
    ? () => {
        otpSentAt = Date.now()
        return getAuthCode()
      }
    : undefined

  try {
    await registerApiAuthSetup(page.request, { ...options, getAuthCode: trackedGetAuthCode })
  } catch (error) {
    console.warn(
      `API login for ${options.user} failed, falling back to UI login: ${error instanceof Error ? error.message : error}`
    )
    // A half-finished Keycloak session would make the login page skip steps
    await page.context().clearCookies()
    if (otpSentAt !== undefined) {
      // Keycloak rejects a reused OTP, so wait for the next 30 s TOTP window
      await page.waitForTimeout(TOTP_PERIOD_MS - (otpSentAt % TOTP_PERIOD_MS) + 1000)
    }
    await registerAuthSetup(page, options)
  }
}
