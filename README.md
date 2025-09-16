# playwright-essentials

Lightweight utilities for Playwright focused on reusable authentication and small helpers.

## Installation

Peer dependencies: `playwright` and `@playwright/test` must be present in your project.

```
npm i https://github.com/TIMOCOM-GmbH/playwright-essentials/releases/download/v1.3.0/playwright-essentials-1.3.0.tgz
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
BASE_URL=https://my.example.com/
AUTH_USER=user@example.com
AUTH_PASS=secret
AUTH_STATE_PATH=playwright/.auth/user.json
```

Defaults:

- `DEFAULT_AUTH_FILE`: `playwright/.auth/user.json`
- `baseURL`: from `process.env.BASE_URL`, otherwise `https://my.timocom.com/`
- `successUrl`: default RegExp `/.*tcgate/`

Once you've done these steps, you no longer need to log in manually; the E2E test starts already authenticated via the storage state.

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

### Password grant token helpers

Two helper functions are provided to obtain an OAuth2 access token via the Resource Owner Password Credentials ("password") grant and to build an `Authorization` header string.

Exports (via `playwright-essentials/helpers` or the root `helpers` namespace):

- `fetchPasswordGrantToken(options: PasswordGrantOptions): Promise<PasswordGrantTokenResponse>`
- `getPasswordGrantAuthorizationHeader(options: PasswordGrantOptions): Promise<string>`

#### `PasswordGrantOptions`

```ts
type PasswordGrantOptions = {
  authServerHost: string
  clientId: string
  clientSecret: string
  username: string
  password: string
  grant_type?: string // default: 'password'
  extra?: Record<string, string> // optional extra form fields (e.g. scope)
}
```

#### `fetchPasswordGrantToken`

Builds a `POST` request to `${authServerHost}/auth/oauth/token` with form data:

- `grant_type` (defaults to `password`)
- `username`
- `password`
- any key/value pairs from `extra`

It adds an HTTP `Authorization: Basic <base64(clientId:clientSecret)>` header and `Content-Type: application/x-www-form-urlencoded`.

Returns the parsed JSON response (throws on non‑OK status, non‑JSON body, or missing `access_token`). The response is typed as:

```ts
interface PasswordGrantTokenResponse {
  access_token: string
  token_type?: string
  expires_in?: number
  scope?: string
  // any other provider specific properties are preserved
  [k: string]: any
}
```

Error cases (each throws an Error):

- Missing required option fields
- Non‑JSON response body
- Non‑2xx response (includes status + provider error message if available)
- Response without `access_token`

#### `getPasswordGrantAuthorizationHeader`

Convenience wrapper that internally calls `fetchPasswordGrantToken` and returns a ready to use header string:

```
"Bearer <access_token>" // or `${token_type} <access_token>` if token_type is present
```

#### Usage example

```ts
import {
  fetchPasswordGrantToken,
  getPasswordGrantAuthorizationHeader,
} from 'playwright-essentials/helpers'

// Option A: obtain full token payload
const token = await fetchPasswordGrantToken({
  authServerHost: process.env.AUTH_SERVER_HOST!,
  clientId: process.env.AUTH_CLIENT_ID!,
  clientSecret: process.env.AUTH_CLIENT_SECRET!,
  username: process.env.AUTH_USER!,
  password: process.env.AUTH_PASS!,
  // optional extra fields:
  extra: { scope: 'profile:company:read' },
})
console.log('access token length', token.access_token.length)

// Option B: directly build Authorization header
const authHeader = await getPasswordGrantAuthorizationHeader({
  authServerHost: process.env.AUTH_SERVER_HOST!,
  clientId: process.env.AUTH_CLIENT_ID!,
  clientSecret: process.env.AUTH_CLIENT_SECRET!,
  username: process.env.AUTH_USER!,
  password: process.env.AUTH_PASS!,
})
await page.request.get('/api/protected', { headers: { Authorization: authHeader } })
```

#### Environment variables example

```
AUTH_SERVER_HOST=https://my.host.com
AUTH_CLIENT_ID=yourClientId
AUTH_CLIENT_SECRET=yourClientSecret
AUTH_USER=user@example.com
AUTH_PASS=secret
```

#### Why not cache?

Caching is intentionally left out to keep the helper deterministic and transparent. If you need caching, build it externally (e.g. store the resolved promise keyed by username) so test isolation remains clear.

## Tips & troubleshooting

- Node >= 18 recommended; ESM and CJS are exported.
- Ensure `@playwright/test` and `playwright` are installed only once (in the consumer project).
- When developing this package locally, prefer a tarball (`npm pack`) over symlinks to avoid version/cache issues.

## License

ISC
