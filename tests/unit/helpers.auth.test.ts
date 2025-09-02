import { describe, it, expect, vi } from 'vitest'
import { ensureLoggedIn } from '../../src/helpers/auth'

type MockPage = {
  waitForLoadState: ReturnType<typeof vi.fn>
  waitForURL: ReturnType<typeof vi.fn>
}

function makePage(overrides: Partial<MockPage> = {}): MockPage {
  return {
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    waitForURL: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('ensureLoggedIn', () => {
  it('waits for networkidle and URL when provided', async () => {
    const page = makePage()
    await ensureLoggedIn(page as any, { url: /dashboard/, timeout: 5000 })

    expect(page.waitForLoadState).toHaveBeenCalledWith('networkidle', { timeout: 5000 })
    expect(page.waitForURL).toHaveBeenCalledWith(/dashboard/, { timeout: 5000 })
  })

  it('does not throw if networkidle times out', async () => {
    const page = makePage({ waitForLoadState: vi.fn().mockRejectedValue(new Error('timeout')) })

    await expect(ensureLoggedIn(page as any)).resolves.toBeUndefined()
    expect(page.waitForLoadState).toHaveBeenCalled()
  })

  it('skips waiting for URL if none provided', async () => {
    const page = makePage()
    await ensureLoggedIn(page as any)
    expect(page.waitForURL).not.toHaveBeenCalled()
  })
})
