# [1.5.0](https://github.com/TIMOCOM-GmbH/playwright-essentials/compare/v1.4.3...v1.5.0) (2025-09-16)

### Features

- add password grant token helpers and corresponding tests ([dfa0977](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/dfa0977d1ddbe440c5f50ee3f8efadf19171aab9))

## [1.4.3](https://github.com/TIMOCOM-GmbH/playwright-essentials/compare/v1.4.2...v1.4.3) (2025-09-12)

### Bug Fixes

- improve auth cleanup logic to remove only the first directory segment for custom paths ([98e82cb](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/98e82cb862f83cfffb6c318957f0dc334ec19fb5))
- simplify absolute path check in registerAuthSetup cleanup tests ([abdecc2](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/abdecc2ee6f3a9948a1aa49aa3e68e746e2ba01d))
- update paths in navigation helper to include 'app/' prefix ([676658c](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/676658c967838ace0482ef9f91fdf4e2cfbc88fe))

## [1.4.2](https://github.com/TIMOCOM-GmbH/playwright-essentials/compare/v1.4.1...v1.4.2) (2025-09-12)

### Bug Fixes

- normalize baseURL to ensure it ends with a trailing slash in registerAuthSetup ([78068b6](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/78068b6dca3934e7cc9fa776f7c23f1d4b5774f3))

## [1.4.1](https://github.com/TIMOCOM-GmbH/playwright-essentials/compare/v1.4.0...v1.4.1) (2025-09-12)

### Bug Fixes

- update base URL in README and auth setup, clear auth state before login ([48f6bfb](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/48f6bfb821b6ba26da5f10db9b70d4727211366f))

# [1.4.0](https://github.com/TIMOCOM-GmbH/playwright-essentials/compare/v1.3.0...v1.4.0) (2025-09-12)

### Bug Fixes

- add support for ignoring all environment variable files ([3a004ed](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/3a004edd9385328c325b0e54c31ebd46b59e5de3))
- change localStorage to sessionStorage for news dialog setting ([0203568](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/02035680519461523fd2bd3e3d0d31826cb2cddd))
- remove unnecessary non-null assertion for deactivateJoyridesAndNews ([f67a9cb](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/f67a9cbc074766b6455ee824396d6e89c2562dc4))
- space ([92c18ad](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/92c18ad3d1a554180789bac5012e5e63148ae64f))

### Features

- add Playwright configuration and update test scripts ([dbcdb25](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/dbcdb258ea8771b9e334462788f2b961afd49e88))
- enhance registerAuthSetup with joyride deactivation option and add corresponding tests ([a80417c](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/a80417c1a4958a896789d5737306ddee4d868caa))
- update @playwright/test to version 1.55.0 in package.json and package-lock.json ([88d997d](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/88d997d828d86e555573c6fd93452d02d9a7e899))

# [1.3.0](https://github.com/TIMOCOM-GmbH/playwright-essentials/compare/v1.2.0...v1.3.0) (2025-09-05)

### Features

- **auth:** optional joyride/news deactivation + Playwright & Vitest setup ([f99f59a](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/f99f59a45070daa2a519d5c5919b6f1b3453f730))

# [1.2.0](https://github.com/TIMOCOM-GmbH/playwright-essentials/compare/v1.1.0...v1.2.0) (2025-09-04)

### Bug Fixes

- remove redundant wait for load state in registerAuthSetup function ([093c647](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/093c647a612deb624f76b162bdaf5468d47fede7))

### Features

- add navigation helpers and tests for page navigation functions ([43b87c7](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/43b87c7aac63847af0adf2465941e6b20ba7e60c))

# [1.1.0](https://github.com/TIMOCOM-GmbH/playwright-essentials/compare/v1.0.1...v1.1.0) (2025-09-02)

### Features

- add initial tests for auth setup and ensureLoggedIn functions ([5977f66](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/5977f6629c22686df74cd90b6f68f05670014ba2))

## [1.0.1](https://github.com/TIMOCOM-GmbH/playwright-essentials/compare/v1.0.0...v1.0.1) (2025-09-01)

### Bug Fixes

- trigger release ([11f1c37](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/11f1c37dd72d93f56306f9e476405c685090f4ce))

# 1.0.0 (2025-09-01)

### Features

- initialize Playwright essentials package with authentication helpers ([d2332b2](https://github.com/TIMOCOM-GmbH/playwright-essentials/commit/d2332b22ccbf385f2198d6f96eb26e64e4f74d3e))
