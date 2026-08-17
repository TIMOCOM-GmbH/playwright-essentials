import { type TestType } from '@playwright/test'

/**
 * Data injected into the emulated React Native WebView bridge.
 *
 * Mirrors the object a real native host exposes via
 * `ReactNativeWebView.injectedObjectJson()`. The web app reads `token` from
 * here to authenticate instead of using the browser Keycloak session, so a
 * missing token leaves in-webview tests unauthenticated.
 */
export type ReactNativeWebViewInjectedObject = {
  /** Access token the web app uses for authenticated requests inside the WebView. */
  token?: string
  /** Whether HiWay runs in standalone mode inside the native shell. */
  hiwayStandalone?: boolean
  [key: string]: unknown
}

export type ReactNativeWebViewOptions = {
  /** Access token exposed to the web app via the injected bridge object. */
  token?: string
  /** Whether HiWay runs in standalone mode inside the native shell. */
  hiwayStandalone?: boolean
  /**
   * Full override of the object returned by `injectedObjectJson()`.
   * Takes precedence over `token` / `hiwayStandalone`.
   */
  injectedObject?: ReactNativeWebViewInjectedObject
}

/**
 * Fixture option value.
 *
 * - `false` (default): do not emulate a WebView.
 * - `true`: emulate a WebView with an empty injected object (`{}`).
 * - object: emulate a WebView and inject the given token / data.
 */
export type ReactNativeWebViewConfig = boolean | ReactNativeWebViewOptions

export type ReactNativeWebViewFixtures = {
  /**
   * Mock ReactNativeWebView before page scripts run.
   *
   * Usage:
   *   test.use({ reactNativeWebView: true })
   *   test.use({ reactNativeWebView: { token: myToken } })
   */
  reactNativeWebView: ReactNativeWebViewConfig
}

type ReactNativeWebViewWindow = Window &
  typeof globalThis & {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
      injectedObjectJson: () => string
    }
  }

type PageWithInitScript = {
  addInitScript: <Arg>(script: (arg: Arg) => void, arg?: Arg) => Promise<void>
}

/**
 * Resolve the fixture option value into the object that the emulated bridge
 * should expose via `injectedObjectJson()`.
 */
function resolveInjectedObject(
  config: ReactNativeWebViewConfig
): ReactNativeWebViewInjectedObject | undefined {
  if (config === false) {
    return undefined
  }
  if (config === true) {
    return {}
  }

  if (config.injectedObject) {
    return config.injectedObject
  }

  const injected: ReactNativeWebViewInjectedObject = {}
  if (config.token !== undefined) {
    injected.token = config.token
  }
  if (config.hiwayStandalone !== undefined) {
    injected.hiwayStandalone = config.hiwayStandalone
  }
  return injected
}

/**
 * Emulate a React Native WebView on the given page.
 *
 * @param page          Playwright page (or compatible object exposing `addInitScript`).
 * @param injectedObject Object exposed via `injectedObjectJson()`. Defaults to `{}`.
 */
export async function setupReactNativeWebView(
  page: PageWithInitScript,
  injectedObject: ReactNativeWebViewInjectedObject = {}
): Promise<void> {
  await page.addInitScript<ReactNativeWebViewInjectedObject>(data => {
    ;(window as ReactNativeWebViewWindow).ReactNativeWebView = {
      postMessage: () => {},
      injectedObjectJson: () => JSON.stringify(data),
    }
  }, injectedObject)
}

type ReactNativeWebViewFixtureDefinition = {
  reactNativeWebView: [ReactNativeWebViewConfig, { option: true }]
  page: (
    args: { page: PageWithInitScript; reactNativeWebView: ReactNativeWebViewConfig },
    use: (page: PageWithInitScript) => Promise<void>
  ) => Promise<void>
}

export const reactNativeWebViewFixtures: ReactNativeWebViewFixtureDefinition = {
  reactNativeWebView: [false, { option: true }] as [ReactNativeWebViewConfig, { option: true }],

  page: async ({ page, reactNativeWebView }, use) => {
    const injectedObject = resolveInjectedObject(reactNativeWebView)
    if (injectedObject !== undefined) {
      await setupReactNativeWebView(page, injectedObject)
    }

    await use(page)
  },
}

export function extendWithReactNativeWebView<
  TestArgs extends { page: unknown },
  WorkerArgs extends object,
>(
  test: TestType<TestArgs, WorkerArgs>
): TestType<TestArgs & ReactNativeWebViewFixtures, WorkerArgs> {
  return test.extend<ReactNativeWebViewFixtures>(reactNativeWebViewFixtures as any)
}
