import { describe, it, expect, vi } from 'vitest'
import { registerAuthSetup, DEFAULT_AUTH_FILE } from '../../src/auth.setup'

function makePage() {
  const context = { storageState: vi.fn().mockResolvedValue(undefined) }
  return {
    goto: vi.fn().mockResolvedValue(undefined),
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    getByTestId: vi.fn((_id: string) => ({
      fill: vi.fn().mockResolvedValue(undefined),
      click: vi.fn().mockResolvedValue(undefined),
    })),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    context: () => context,
  }
}

describe('registerAuthSetup', () => {
  it('navigates, fills, submits and saves storage state', async () => {
    const page = makePage()

    // mock ensureLoggedIn via module factory
    const ensureMod = await import('../../src/helpers/auth')
    const ensureSpy = vi.spyOn(ensureMod, 'ensureLoggedIn').mockResolvedValue(undefined)

    await registerAuthSetup(page as any, {
      baseURL: 'https://example.com/app/',
      user: 'john@example.com',
      pass: 'secret',
      successUrl: /done/,
    })

    expect(page.goto).toHaveBeenCalledWith('https://example.com/app/weblogin/')
    expect(page.getByTestId).toHaveBeenCalledWith('email')
    expect(page.getByTestId).toHaveBeenCalledWith('password')
    expect(page.getByTestId).toHaveBeenCalledWith('submit-button')

    expect(ensureSpy).toHaveBeenCalled()

    // storage state path default
    expect(page.context().storageState).toHaveBeenCalledWith({ path: DEFAULT_AUTH_FILE })
  })

  it('uses provided statePath', async () => {
    const page = makePage()
    const ensureMod = await import('../../src/helpers/auth')
    vi.spyOn(ensureMod, 'ensureLoggedIn').mockResolvedValue(undefined)

    await registerAuthSetup(page as any, {
      user: 'u',
      pass: 'p',
      statePath: 'custom/state.json',
    })

    expect(page.context().storageState).toHaveBeenCalledWith({ path: 'custom/state.json' })
  })
})
