# playwright-essentials

Leichtgewichtige Utilities rund um Playwright mit Fokus auf wiederverwendbare Authentifizierung und kleine Helper.

## Installation

Peer-Dependencies: `playwright` und `@playwright/test` sollten im Projekt vorhanden sein.

```
npm i -D playwright-essentials
```

## Exports/Struktur

- `playwright-essentials/auth.setup`
  - `registerAuthSetup(page, options)` – pure Funktion, führt den Login durch und speichert den Storage State.
- `playwright-essentials/helpers`
  - Aktuell: `ensureLoggedIn(page, { url?, timeout? })` – wartet bis der Login als stabil gilt.
- `playwright-essentials`
  - Namespace-Export `helpers` (entspricht `playwright-essentials/helpers`).

## Quickstart: Shared Login für alle Projekte

1. Setup-Test anlegen: `tests/auth.register.ts`

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

2. In der `playwright.config.ts` die Projekte vom Setup abhängig machen und `storageState` verwenden

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

3. `.env` Beispiel

```
BASE_URL=https://my.example.com/app
AUTH_USER=user@example.com
AUTH_PASS=secret
AUTH_STATE_PATH=playwright/.auth/user.json
```

Standardpfade/-werte:

- `DEFAULT_AUTH_FILE`: `playwright/.auth/user.json`
- `baseURL`: aus `process.env.BASE_URL`, sonst `https://my.timocom.com/app/`
- `successUrl`: Standard ist ein RegExp `/.*tcgate/`

## API

### `registerAuthSetup(page: Page, options: RegisterAuthOptions): Promise<void>`

Führt folgende Schritte aus:

- öffnet `${baseURL}weblogin/`
- füllt Email/Passwort (data-testid: `email`, `password`), klickt `submit-button`
- wartet via `ensureLoggedIn` auf erfolgreiche Anmeldung
- speichert den Storage State nach `statePath` bzw. `AUTH_STATE_PATH` bzw. `DEFAULT_AUTH_FILE`

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

Wartet auf `networkidle` und optional, dass die URL dem `url`-Pattern entspricht.

## Hinweise & Troubleshooting

- Node >= 18 empfohlen; ESM und CJS werden exportiert.
- Stelle sicher, dass `@playwright/test` und `playwright` nur einmal (im Consumer-Projekt) installiert sind.
- Wenn du das Paket lokal entwickelst, nutze ein Tarball (`npm pack`) statt Symlink, um Versions-/Cache-Probleme zu vermeiden.
- Falls selektoren (data-testid) abweichen, passe sie in deinem Fork/Projekt an.

## Versionshinweise

- 3.x: Umbenennung des Subpath-Exports von `auth.setup.with` zu `auth.setup` und Umstellung auf eine reine Funktion mit Signatur `(page, options)`.

## Lizenz

ISC
