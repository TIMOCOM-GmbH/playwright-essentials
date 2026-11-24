import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { registerAuthSetupWithFallback } from '../../src/auth.setup'

const BASE = 'https://my.example.com/app/'
const LOGIN_FORM =
  '<form action="https://iam/login"><input name="username"><input name="password"></form>'

function makePage(apiPost: () => unknown) {
  const context = {
    storageState: vi.fn().mockResolvedValue(undefined),
    clearCookies: vi.fn().mockResolvedValue(undefined),
  }
  const locator = {
    fill: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    isVisible: vi.fn().mockResolvedValue(false),
    waitFor: vi.fn().mockResolvedValue(undefined),
    or: vi.fn().mockReturnThis(),
  }
  return {
    request: {
      get: vi.fn().mockResolvedValue({
        status: () => 200,
        text: async () => LOGIN_FORM,
        headers: () => ({}),
      }),
      post: vi.fn(async () => apiPost()),
      storageState: vi.fn().mockResolvedValue({ cookies: [], origins: [] }),
    },
    goto: vi.fn().mockResolvedValue(undefined),
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    getByTestId: vi.fn(() => locator),
    locator: vi.fn(() => locator),
    addInitScript: vi.fn().mockResolvedValue(undefined),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    context: () => context,
  }
}

describe('registerAuthSetupWithFallback', () => {
  let dir: string
  let statePath: string

  beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fallback-auth-'))
    statePath = path.join(dir, 'user.json')
    const ensureMod = await import('../../src/helpers/auth')
    vi.spyOn(ensureMod, 'ensureLoggedIn').mockResolvedValue(undefined)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('uses the API login and does not open the UI when it works', async () => {
    const page = makePage(() => ({
      status: () => 302,
      text: async () => '',
      headers: () => ({ location: `${BASE}tcgate/#code=abc` }),
    }))

    await registerAuthSetupWithFallback(page as any, {
      baseURL: BASE,
      user: 'u',
      pass: 'p',
      statePath,
    })

    expect(fs.existsSync(statePath)).toBe(true)
    expect(page.goto).not.toHaveBeenCalled()
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('clears cookies and falls back to the UI login when the API login fails', async () => {
    const page = makePage(() => {
      throw new Error('connection refused')
    })

    await registerAuthSetupWithFallback(page as any, {
      baseURL: BASE,
      user: 'u',
      pass: 'p',
      statePath,
    })

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('connection refused'))
    expect(page.context().clearCookies).toHaveBeenCalled()
    expect(page.goto).toHaveBeenCalledWith(BASE)
    expect(page.context().storageState).toHaveBeenCalledWith({ path: statePath })

    const clearOrder = page.context().clearCookies.mock.invocationCallOrder[0]
    const gotoOrder = page.goto.mock.invocationCallOrder[0]
    expect(clearOrder).toBeLessThan(gotoOrder)
    // No OTP was sent, so no need to wait for a fresh one
    expect(page.waitForTimeout).not.toHaveBeenCalled()
  })

  it('waits for a fresh OTP window before the UI login when the API already sent one', async () => {
    const responses = [
      {
        status: () => 200,
        text: async () => '<form action="https://iam/otp"><input name="otp"></form>',
        headers: () => ({}),
      },
      {
        status: () => 200,
        text: async () => '<form action="https://iam/otp">Invalid code</form>',
        headers: () => ({}),
      },
    ]
    const page = makePage(() => responses.shift())
    const getAuthCode = vi.fn(() => '123456')

    await registerAuthSetupWithFallback(page as any, {
      baseURL: BASE,
      user: 'u',
      pass: 'p',
      statePath,
      getAuthCode,
    })

    expect(page.waitForTimeout).toHaveBeenCalledWith(expect.any(Number))
    const waitMs = page.waitForTimeout.mock.calls[0][0]
    expect(waitMs).toBeGreaterThan(1000)
    expect(waitMs).toBeLessThanOrEqual(31_000)
    expect(page.waitForTimeout.mock.invocationCallOrder[0]).toBeLessThan(
      page.goto.mock.invocationCallOrder[0]
    )
    // once in the API attempt, once in the UI login
    expect(getAuthCode).toHaveBeenCalledTimes(2)
  })
})
