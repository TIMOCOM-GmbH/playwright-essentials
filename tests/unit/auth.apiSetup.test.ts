import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { registerApiAuthSetup } from '../../src/auth.setup'

const REALM = 'https://iam.example.com/realms/timocom'
const BASE = 'https://my.example.com/app/'

const formPage = (action: string, fields: string[]) =>
  `<form id="kc-form" action="${action}" method="post">${fields
    .map(f => `<input name="${f}">`)
    .join('')}</form>`

function response(status: number, body = '', location?: string) {
  return {
    status: () => status,
    text: vi.fn().mockResolvedValue(body),
    headers: () => (location ? { location } : {}),
  }
}

function makeRequest(getBody: string, posts: ReturnType<typeof response>[]) {
  return {
    get: vi.fn().mockResolvedValue(response(200, getBody)),
    post: vi.fn(async () => posts.shift()),
    storageState: vi
      .fn()
      .mockResolvedValue({ cookies: [{ name: 'KEYCLOAK_IDENTITY' }], origins: [] }),
  }
}

describe('registerApiAuthSetup', () => {
  let dir: string
  let statePath: string

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-auth-'))
    statePath = path.join(dir, 'nested', 'user.json')
  })

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('posts username, password and OTP in separate steps and writes the state', async () => {
    const request = makeRequest(formPage('https://iam/step1?a=1&amp;b=2', ['username']), [
      response(200, formPage('https://iam/step2', ['password'])),
      response(200, formPage('https://iam/step3', ['otp'])),
      response(302, '', `${BASE}tcgate/#code=abc`),
    ])

    await registerApiAuthSetup(request as any, {
      realmUrl: REALM,
      baseURL: BASE,
      user: 'john@example.com',
      pass: 'secret',
      statePath,
      getAuthCode: () => '123456',
    })

    expect(request.post).toHaveBeenNthCalledWith(1, 'https://iam/step1?a=1&b=2', {
      form: { username: 'john@example.com' },
    })
    expect(request.post).toHaveBeenNthCalledWith(2, 'https://iam/step2', {
      form: { password: 'secret' },
      maxRedirects: 0,
    })
    expect(request.post).toHaveBeenNthCalledWith(3, 'https://iam/step3', {
      form: { otp: '123456' },
      maxRedirects: 0,
    })

    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    expect(state.cookies).toEqual([{ name: 'KEYCLOAK_IDENTITY' }])
    expect(state.origins).toEqual([
      {
        origin: 'https://my.example.com',
        localStorage: [{ name: 'timocom_joyride_inactive', value: 'true' }],
      },
    ])
  })

  it('starts the auth code flow with client, redirect URI and PKCE', async () => {
    const request = makeRequest(formPage('https://iam/login', ['username', 'password']), [
      response(302, '', `${BASE}tcgate/#code=abc`),
    ])

    await registerApiAuthSetup(request as any, {
      realmUrl: `${REALM}/`,
      baseURL: 'https://my.example.com/app',
      user: 'u',
      pass: 'p',
      statePath,
    })

    const url = new URL(request.get.mock.calls[0][0])
    expect(url.origin + url.pathname).toBe(`${REALM}/protocol/openid-connect/auth`)
    expect(url.searchParams.get('client_id')).toBe('web-ui-public-login')
    expect(url.searchParams.get('redirect_uri')).toBe(`${BASE}tcgate/`)
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.get('code_challenge')).toBeTruthy()
  })

  it('defaults the realm to AUTH_REALM_URL, then to the TIMOCOM realm', async () => {
    const run = async () => {
      const request = makeRequest(formPage('https://iam/login', ['username', 'password']), [
        response(302, '', `${BASE}tcgate/#code=abc`),
      ])
      await registerApiAuthSetup(request as any, { baseURL: BASE, user: 'u', pass: 'p', statePath })
      return new URL(request.get.mock.calls[0][0]).origin
    }

    vi.stubEnv('AUTH_REALM_URL', undefined)
    expect(await run()).toBe('https://iam.timocom.com')

    vi.stubEnv('AUTH_REALM_URL', 'https://iam.env.example.com/realms/timocom')
    expect(await run()).toBe('https://iam.env.example.com')
    vi.unstubAllEnvs()
  })

  it('posts username and password together when the form asks for both', async () => {
    const request = makeRequest(formPage('https://iam/login', ['username', 'password']), [
      response(302, '', `${BASE}tcgate/#code=abc`),
    ])

    await registerApiAuthSetup(request as any, {
      realmUrl: REALM,
      baseURL: BASE,
      user: 'u',
      pass: 'p',
      statePath,
      deactivateJoyridesAndNews: false,
    })

    expect(request.post).toHaveBeenCalledTimes(1)
    expect(request.post).toHaveBeenCalledWith('https://iam/login', {
      form: { username: 'u', password: 'p' },
      maxRedirects: 0,
    })
    expect(JSON.parse(fs.readFileSync(statePath, 'utf8')).origins).toEqual([])
  })

  it('fails when Keycloak does not redirect back to the app', async () => {
    const request = makeRequest(formPage('https://iam/login', ['username', 'password']), [
      response(200, formPage('https://iam/login', ['username', 'password']) + 'Invalid password'),
    ])

    await expect(
      registerApiAuthSetup(request as any, {
        realmUrl: REALM,
        baseURL: BASE,
        user: 'u',
        pass: 'wrong',
        statePath,
      })
    ).rejects.toThrow(/Keycloak login for u failed: 200/)
    expect(fs.existsSync(statePath)).toBe(false)
  })

  it('fails when OTP is required but no getAuthCode is given', async () => {
    const request = makeRequest(formPage('https://iam/login', ['username', 'password']), [
      response(200, formPage('https://iam/otp', ['otp'])),
    ])

    await expect(
      registerApiAuthSetup(request as any, {
        realmUrl: REALM,
        baseURL: BASE,
        user: 'u',
        pass: 'p',
        statePath,
      })
    ).rejects.toThrow(/Keycloak login for u failed/)
  })
})
