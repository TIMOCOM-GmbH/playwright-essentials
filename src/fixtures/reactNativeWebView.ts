import { type Fixtures, type Page, type TestType } from '@playwright/test'

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

export async function setupReactNativeWebView(page: Page): Promise<void> {
  await page.addInitScript(() => {
    ;(window as ReactNativeWebViewWindow).ReactNativeWebView = {
      postMessage: () => {},
      injectedObjectJson: () => '{}',
    }
  })
}

export const reactNativeWebViewFixtures: Fixtures<
  ReactNativeWebViewFixtures,
  object,
  { page: Page }
> = {
  reactNativeWebView: [false, { option: true }] as [boolean, { option: true }],

  page: async ({ page, reactNativeWebView }, use) => {
    if (reactNativeWebView) {
      await setupReactNativeWebView(page)
    }

    await use(page)
  },
}

export function extendWithReactNativeWebView<
  TestArgs extends { page: Page },
  WorkerArgs extends object,
>(
  test: TestType<TestArgs, WorkerArgs>
): TestType<TestArgs & ReactNativeWebViewFixtures, WorkerArgs> {
  return test.extend<ReactNativeWebViewFixtures>(reactNativeWebViewFixtures)
}
