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
    addInitScript: vi.fn().mockResolvedValue(undefined),
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

  describe('joyride deactivation', () => {
    it('calls addInitScript with localStorage deactivation function by default', async () => {
      const page = makePage()
      const ensureMod = await import('../../src/helpers/auth')
      vi.spyOn(ensureMod, 'ensureLoggedIn').mockResolvedValue(undefined)

      await registerAuthSetup(page as any, {
        user: 'test@example.com',
        pass: 'password',
      })

      // Simple, clear assertion - verify function is called with a function
      expect(page.addInitScript).toHaveBeenCalledTimes(1)
      expect(page.addInitScript).toHaveBeenCalledWith(expect.any(Function))
    })

    it('calls addInitScript when explicitly enabled', async () => {
      const page = makePage()
      const ensureMod = await import('../../src/helpers/auth')
      vi.spyOn(ensureMod, 'ensureLoggedIn').mockResolvedValue(undefined)

      await registerAuthSetup(
        page as any,
        {
          user: 'test@example.com',
          pass: 'password',
        },
        true
      ) // explicitly set deactivateJoyrides to true

      expect(page.addInitScript).toHaveBeenCalledTimes(1)
      expect(page.addInitScript).toHaveBeenCalledWith(expect.any(Function))
    })

    it('does not call addInitScript when explicitly disabled', async () => {
      const page = makePage()
      const ensureMod = await import('../../src/helpers/auth')
      vi.spyOn(ensureMod, 'ensureLoggedIn').mockResolvedValue(undefined)

      await registerAuthSetup(
        page as any,
        {
          user: 'test@example.com',
          pass: 'password',
        },
        false
      ) // explicitly set deactivateJoyrides to false

      // Should not call addInitScript when joyrides are not deactivated
      expect(page.addInitScript).not.toHaveBeenCalled()
    })

    it('calls addInitScript before page navigation', async () => {
      const page = makePage()
      const ensureMod = await import('../../src/helpers/auth')
      vi.spyOn(ensureMod, 'ensureLoggedIn').mockResolvedValue(undefined)

      await registerAuthSetup(page as any, {
        user: 'test@example.com',
        pass: 'password',
      })

      // Verify addInitScript is called before goto for proper timing
      const addInitScriptCall = (page.addInitScript as any).mock.invocationCallOrder[0]
      const gotoCall = (page.goto as any).mock.invocationCallOrder[0]

      expect(addInitScriptCall).toBeLessThan(gotoCall)
    })

    it('only calls addInitScript when joyrides should be deactivated', async () => {
      const page = makePage()
      const ensureMod = await import('../../src/helpers/auth')
      vi.spyOn(ensureMod, 'ensureLoggedIn').mockResolvedValue(undefined)

      // Test that it's called when enabled (default behavior)
      await registerAuthSetup(page as any, {
        user: 'test@example.com',
        pass: 'password',
      })

      expect(page.addInitScript).toHaveBeenCalledTimes(1)

      // Reset the mock and test that it's NOT called when disabled
      vi.clearAllMocks()

      await registerAuthSetup(
        page as any,
        {
          user: 'test@example.com',
          pass: 'password',
        },
        false
      )

      expect(page.addInitScript).not.toHaveBeenCalled()
    })
  })
})
