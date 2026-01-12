import { describe, it, expect, vi } from 'vitest'
import { blockPendo } from '../../src/utils'

function makePage() {
  return {
    route: vi.fn().mockImplementation(async (pattern, handler) => {
      // Simulate Playwright's route registration
      const mockRoute = { abort: vi.fn().mockResolvedValue(undefined) }
      await handler(mockRoute)
      return mockRoute
    }),
    addInitScript: vi.fn().mockResolvedValue(undefined),
  }
}

describe('blockPendo', () => {
  it('registers a route to abort Pendo requests', async () => {
    const page = makePage()
    await blockPendo(page as any)
    expect(page.route).toHaveBeenCalledWith('https://cdn.eu.pendo.io/**', expect.any(Function))
    // Check that abort was called on the mock route
    const [[, handler]] = page.route.mock.calls
    const mockRoute = { abort: vi.fn().mockResolvedValue(undefined) }
    await handler(mockRoute)
    expect(mockRoute.abort).toHaveBeenCalled()
  })
})
