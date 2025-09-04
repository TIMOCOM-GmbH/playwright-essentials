# playwright-essentials

Lightweight utilities for Playwright focused on reusable authentication and small helpers.

## Installation

Peer dependencies: `playwright` and `@playwright/test` must be present in your project.

```
npm i -D playwright-essentials
```

## Exports/structure

- `playwright-essentials/auth.setup`
  - `registerAuthSetup(page, options)` – pure function that performs login and writes the storage state.
- `playwright-essentials/helpers`
  - `ensureLoggedIn(page, { url?, timeout? })` – waits until the login is stable.
  - Navigation helpers (all simple wrappers around `page.goto()`):
    - Path constants: `FREIGHT_EDITOR_PATH`, `FREIGHT_SEARCH_PATH`, `PRICEPROPOSAL_PATH`, `VEHICLE_EDITOR_PATH`, `VEHICLE_SEARCH_PATH`, `WAREHOUSE_EDITOR_PATH`, `WAREHOUSE_SEARCH_PATH`, `EBID_TENDERS_PATH`, `EBID_BIDS_PATH`, `ROUTE_AND_COSTS_PATH`, `DEALS_MY_DEALS_PATH`, `DEALS_RECEIVED_DEALS_PATH`, `ORDER_MY_ORDERS_PATH`, `ORDER_RECEIVED_ORDERS_PATH`, `ORDER_STATISTICS_PRINCIPAL_PATH`, `ORDER_STATISTICS_CONTRACTOR_PATH`, `SHIPMENT_PATH`, `FLEET_MY_FLEET_PATH`, `SHRAK_PATH`, `SHRAK_SHARED_VEHICLES_PATH`, `SHRAK_RECEIVED_VEHICLES_PATH`, `VEHICLE_MANAGEMENT_PATH`.
    - Functions: `navigate(page, path)` plus matching `goto*` functions like `gotoFreightEditor`, `gotoFreightSearch`, `gotoVehicleEditor`, etc.
- `playwright-essentials`
  - Namespace export `helpers` (same as `playwright-essentials/helpers`).

## Quickstart: Shared login for all projects

1. Create setup test: `tests/auth.register.ts`

```ts
import { test } from '@playwright/test'
import { registerAuthSetup } from 'playwright-essentials/auth.setup'

test('authenticate', async ({ page }) => {
  await registerAuthSetup(page, {
    baseURL: process.env.BASE_URL,
    user: process.env.AUTH_USER!,
    pass: process.env.AUTH_PASS!,
    // optional: successUrl: /.*tcgate/, statePath: 'playwright/.auth/user.json'
  })
})
```

2. In `playwright.config.ts` make your projects depend on the setup and use `storageState`

```ts
import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.resolve(process.cwd(), '.env') })

export default defineConfig({
  testDir: './tests',
  projects: [
    { name: 'setup', testMatch: /auth\.register\.ts$/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: process.env.AUTH_STATE_PATH ?? 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: process.env.AUTH_STATE_PATH ?? 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: process.env.AUTH_STATE_PATH ?? 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
})
```

3. `.env` example

```
BASE_URL=https://my.example.com/app
AUTH_USER=user@example.com
AUTH_PASS=secret
AUTH_STATE_PATH=playwright/.auth/user.json
```

Defaults:

- `DEFAULT_AUTH_FILE`: `playwright/.auth/user.json`
- `baseURL`: from `process.env.BASE_URL`, otherwise `https://my.timocom.com/app/`
- `successUrl`: default RegExp `/.*tcgate/`

## API

### `registerAuthSetup(page: Page, options: RegisterAuthOptions): Promise<void>`

Performs the following steps:

- opens `${baseURL}weblogin/`
- fills email/password (data-testid: `email`, `password`), clicks `submit-button`
- waits for a successful login via `ensureLoggedIn`
- writes storage state to `statePath` or `AUTH_STATE_PATH` or `DEFAULT_AUTH_FILE`

```ts
type RegisterAuthOptions = {
  baseURL?: string
  user: string
  pass: string
  successUrl?: string | RegExp
  statePath?: string
}
```

### `helpers.ensureLoggedIn(page, { url?, timeout? }): Promise<void>`

### Navigation helpers

All navigation utilities are exported via the helpers namespace.

Example usage (direct imports):

```ts
import { gotoFreightEditor, gotoVehicleSearch, navigate } from 'playwright-essentials/helpers'

await gotoFreightEditor(page)
await gotoVehicleSearch(page)
await navigate(page, 'tccargo/freights/editor/')
await navigate(page, 'https://example.com/health') // absolute URL bypassing baseURL
```

They rely on Playwright's own `baseURL` resolution: if `use.baseURL` is set in `playwright.config.ts`, relative paths are resolved automatically.

Waits for `networkidle` and optionally that the URL matches the provided `url` pattern.

## Tips & troubleshooting

- Node >= 18 recommended; ESM and CJS are exported.
- Ensure `@playwright/test` and `playwright` are installed only once (in the consumer project).
- When developing this package locally, prefer a tarball (`npm pack`) over symlinks to avoid version/cache issues.

## License

ISC
