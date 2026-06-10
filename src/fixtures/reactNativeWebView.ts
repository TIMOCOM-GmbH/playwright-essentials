import { type TestType } from '@playwright/test'

export type ReactNativeWebViewFixtures = {
  /**
   * Mock ReactNativeWebView before page scripts run.
   * Usage: test.use({ reactNativeWebView: true })
   */
  reactNativeWebView: boolean
}

type ReactNativeWebViewWindow = Window &
  typeof globalThis & {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
      injectedObjectJson: () => string
    }
  }

type PageWithInitScript = {
  addInitScript: (script: () => void) => Promise<void>
}

export async function setupReactNativeWebView(page: PageWithInitScript): Promise<void> {
  await page.addInitScript(() => {
    ;(window as ReactNativeWebViewWindow).ReactNativeWebView = {
      postMessage: () => {},
      injectedObjectJson: () => '{}',
    }
  })
}

type ReactNativeWebViewFixtureDefinition = {
  reactNativeWebView: [boolean, { option: true }]
  page: (
    args: { page: PageWithInitScript; reactNativeWebView: boolean },
    use: (page: PageWithInitScript) => Promise<void>
  ) => Promise<void>
}

export const reactNativeWebViewFixtures: ReactNativeWebViewFixtureDefinition = {
  reactNativeWebView: [false, { option: true }] as [boolean, { option: true }],

  page: async ({ page, reactNativeWebView }, use) => {
    if (reactNativeWebView) {
      await setupReactNativeWebView(page)
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
