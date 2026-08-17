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

/**
 * Replay the init script that was registered via `addInitScript(fn, arg)`
 * against a fake `window`, and return the resulting `ReactNativeWebView`.
 */
function replayInitScript(page: ReturnType<typeof makePage>) {
  const [script, arg] = page.addInitScript.mock.calls[0]
  const fakeWindow: { ReactNativeWebView?: unknown } = {}
  const originalWindow = (globalThis as { window?: unknown }).window
  ;(globalThis as { window?: unknown }).window = fakeWindow
  try {
    ;(script as (a: unknown) => void)(arg)
  } finally {
    ;(globalThis as { window?: unknown }).window = originalWindow
  }
  return fakeWindow.ReactNativeWebView as {
    postMessage: (message: string) => void
    injectedObjectJson: () => string
  }
}

describe('reactNativeWebView fixture', () => {
  it('registers ReactNativeWebView before page scripts run', async () => {
    const page = makePage()

    await setupReactNativeWebView(page as any)

    expect(page.addInitScript).toHaveBeenCalledWith(expect.any(Function), {})
  })

  it('injects an empty object by default', async () => {
    const page = makePage()

    await setupReactNativeWebView(page as any)

    const bridge = replayInitScript(page)
    expect(JSON.parse(bridge.injectedObjectJson())).toEqual({})
    expect(bridge.postMessage).toBeTypeOf('function')
  })

  it('injects the provided token via injectedObjectJson', async () => {
    const page = makePage()

    await setupReactNativeWebView(page as any, { token: 'my-token' })

    const bridge = replayInitScript(page)
    expect(JSON.parse(bridge.injectedObjectJson())).toEqual({ token: 'my-token' })
  })

  it('is disabled by default', () => {
    expect(reactNativeWebViewFixtures.reactNativeWebView).toEqual([false, { option: true }])
  })

  it('injects an empty object when the option is enabled with `true`', async () => {
    const page = makePage()
    const use = vi.fn().mockResolvedValue(undefined)
    const pageFixture = reactNativeWebViewFixtures.page as any

    await pageFixture({ page, reactNativeWebView: true }, use)

    const bridge = replayInitScript(page)
    expect(JSON.parse(bridge.injectedObjectJson())).toEqual({})
    expect(use).toHaveBeenCalledWith(page)
  })

  it('injects token and hiwayStandalone when the option is an object', async () => {
    const page = makePage()
    const use = vi.fn().mockResolvedValue(undefined)
    const pageFixture = reactNativeWebViewFixtures.page as any

    await pageFixture({ page, reactNativeWebView: { token: 'abc', hiwayStandalone: true } }, use)

    const bridge = replayInitScript(page)
    expect(JSON.parse(bridge.injectedObjectJson())).toEqual({
      token: 'abc',
      hiwayStandalone: true,
    })
    expect(use).toHaveBeenCalledWith(page)
  })

  it('lets injectedObject fully override token and hiwayStandalone', async () => {
    const page = makePage()
    const use = vi.fn().mockResolvedValue(undefined)
    const pageFixture = reactNativeWebViewFixtures.page as any

    await pageFixture(
      {
        page,
        reactNativeWebView: {
          token: 'ignored',
          injectedObject: { token: 'override', custom: 42 },
        },
      },
      use
    )

    const bridge = replayInitScript(page)
    expect(JSON.parse(bridge.injectedObjectJson())).toEqual({
      token: 'override',
      custom: 42,
    })
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
