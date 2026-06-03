import { describe, expect, it, vi } from 'vitest'
import {
  reactNativeWebViewFixtures,
  setupReactNativeWebView,
} from '../../src/fixtures/reactNativeWebView'

function makePage() {
  return {
    addInitScript: vi.fn().mockResolvedValue(undefined),
  }
}

describe('reactNativeWebView fixture', () => {
  it('registers ReactNativeWebView before page scripts run', async () => {
    const page = makePage()

    await setupReactNativeWebView(page as any)

    expect(page.addInitScript).toHaveBeenCalledWith(expect.any(Function))
  })

  it('is disabled by default', () => {
    expect(reactNativeWebViewFixtures.reactNativeWebView).toEqual([false, { option: true }])
  })

  it('injects ReactNativeWebView when the option is enabled', async () => {
    const page = makePage()
    const use = vi.fn().mockResolvedValue(undefined)
    const pageFixture = reactNativeWebViewFixtures.page as any

    await pageFixture({ page, reactNativeWebView: true }, use)

    expect(page.addInitScript).toHaveBeenCalledWith(expect.any(Function))
    expect(use).toHaveBeenCalledWith(page)
  })

  it('does not inject ReactNativeWebView when the option is disabled', async () => {
    const page = makePage()
    const use = vi.fn().mockResolvedValue(undefined)
    const pageFixture = reactNativeWebViewFixtures.page as any

    await pageFixture({ page, reactNativeWebView: false }, use)

    expect(page.addInitScript).not.toHaveBeenCalled()
    expect(use).toHaveBeenCalledWith(page)
  })
})
