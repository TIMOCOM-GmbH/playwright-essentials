import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import { registerAuthSetup, DEFAULT_AUTH_FILE } from '../../src/auth.setup'

// Helper to create a mock Page similar to existing tests
function makePage() {
  const context = { storageState: vi.fn().mockResolvedValue(undefined) }
  const locatorMethods = {
    fill: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    isVisible: vi.fn().mockResolvedValue(false),
    or: vi.fn().mockReturnThis(),
  }
  return {
    goto: vi.fn().mockResolvedValue(undefined),
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    getByTestId: vi.fn(() => locatorMethods),
    locator: vi.fn(() => locatorMethods),
    addInitScript: vi.fn().mockResolvedValue(undefined),
    context: () => context,
  }
}

// Spy on ensureLoggedIn so we don't execute any real logic
async function mockEnsureLoggedIn() {
  const ensureMod = await import('../../src/helpers/auth')
  return vi.spyOn(ensureMod, 'ensureLoggedIn').mockResolvedValue(undefined)
}

describe('registerAuthSetup cleanup (top-level directory removal)', () => {
  let rmSpy: any

  beforeEach(() => {
    rmSpy = vi.spyOn(fs, 'rmSync').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('removes top-level folder for default storage state path', async () => {
    const page = makePage()
    await mockEnsureLoggedIn()
    await registerAuthSetup(page as any, { user: 'u', pass: 'p' })

    const expectedTop = path.resolve('playwright')
    expect(rmSpy).toHaveBeenCalledWith(expectedTop, { force: true, recursive: true })
    // storage state written to default file
    expect(page.context().storageState).toHaveBeenCalledWith({ path: DEFAULT_AUTH_FILE })
  })

  it('removes first segment for custom nested path', async () => {
    const page = makePage()
    await mockEnsureLoggedIn()
    await registerAuthSetup(page as any, { user: 'u', pass: 'p', statePath: 'path/auth/user.json' })
    expect(rmSpy).toHaveBeenCalledWith(path.resolve('path'), { force: true, recursive: true })
  })

  it('removes first segment for another custom nested path', async () => {
    const page = makePage()
    await mockEnsureLoggedIn()
    await registerAuthSetup(page as any, {
      user: 'u',
      pass: 'p',
      statePath: 'storageState/auth/user.json',
    })
    expect(rmSpy).toHaveBeenCalledWith(path.resolve('storageState'), {
      force: true,
      recursive: true,
    })
  })

  it('removes first segment for relative path with leading ./', async () => {
    const page = makePage()
    await mockEnsureLoggedIn()
    await registerAuthSetup(page as any, {
      user: 'u',
      pass: 'p',
      statePath: './custom/state/user.json',
    })
    expect(rmSpy).toHaveBeenCalledWith(path.resolve('custom'), { force: true, recursive: true })
  })

  it('does NOT remove anything for absolute path', async () => {
    const page = makePage()
    await mockEnsureLoggedIn()
    const abs = path.resolve('abs/state/user.json')
    await registerAuthSetup(page as any, { user: 'u', pass: 'p', statePath: abs })
    expect(rmSpy).not.toHaveBeenCalledWith(expect.stringMatching(abs), expect.anything())
  })

  it('skips deletion for parent traversal (..)', async () => {
    const page = makePage()
    await mockEnsureLoggedIn()
    await registerAuthSetup(page as any, {
      user: 'u',
      pass: 'p',
      statePath: '../outside/state.json',
    })
    // Should not delete anything for illegal first segment
    expect(rmSpy).not.toHaveBeenCalled()
  })
})
