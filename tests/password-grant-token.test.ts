import { describe, it, expect } from 'vitest'
import { GRANT_TYPE, fetchPasswordGrantToken, getOauthAccessToken } from '../src/helpers/token'

// We stub global fetch to avoid real network
function withStubbedFetch(
  fn: (calls: any[]) => Promise<void> | void,
  impl: (req: RequestInfo | URL, init?: RequestInit) => Promise<any>
) {
  const original = globalThis.fetch as any
  const calls: any[] = []
  globalThis.fetch = (async (url: any, init?: any) => {
    calls.push({ url, init })
    return impl(url, init)
  }) as any
  return Promise.resolve(fn(calls)).finally(() => {
    globalThis.fetch = original
  })
}

describe('password grant token helper', () => {
  it('fetches token', async () => {
    await withStubbedFetch(
      async calls => {
        const token = await fetchPasswordGrantToken({
          authServer: 'auth.example.com/oauth/token',
          clientId: 'cid',
          clientSecret: 'secret',
          username: 'user',
          password: 'pw',
          grant_type: GRANT_TYPE.PASSWORD,
        })
        expect(token.access_token).toBe('tok123')
        expect(calls[0].url).toBe('https://auth.example.com/oauth/token')
      },
      async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ access_token: 'tok123', token_type: 'Bearer' }),
        statusText: 'OK',
      })
    )
  })

  it('builds Authorization header', async () => {
    await withStubbedFetch(
      async () => {
        const header = await getOauthAccessToken({
          authServer: 'auth.example.com/oauth/token',
          clientId: 'cid',
          clientSecret: 'secret',
          username: 'user',
          password: 'pw',
          grant_type: GRANT_TYPE.PASSWORD,
        })
        expect(header).toBe('Bearer tokABC')
      },
      async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ access_token: 'tokABC', token_type: 'Bearer' }),
        statusText: 'OK',
      })
    )
  })

  it('throws on missing field', async () => {
    await expect(
      fetchPasswordGrantToken({
        // missing host
        authServer: '',
        clientId: 'c',
        clientSecret: 's',
        username: 'u',
        password: 'p',
        grant_type: GRANT_TYPE.PASSWORD,
      } as any)
    ).rejects.toThrow(/Missing required/)
  })

  it('throws on non-json', async () => {
    await withStubbedFetch(
      async () => {
        await expect(
          fetchPasswordGrantToken({
            authServer: 'auth.example.com/oauth/token',
            clientId: 'c',
            clientSecret: 's',
            username: 'u',
            password: 'p',
            grant_type: GRANT_TYPE.PASSWORD,
          })
        ).rejects.toThrow(/Non-JSON/)
      },
      async () => ({ ok: true, status: 200, text: async () => 'plain', statusText: 'OK' })
    )
  })

  it('throws on error response', async () => {
    await withStubbedFetch(
      async () => {
        await expect(
          fetchPasswordGrantToken({
            authServer: 'auth.example.com/oauth/token',
            clientId: 'c',
            clientSecret: 's',
            username: 'u',
            password: 'p',
            grant_type: GRANT_TYPE.PASSWORD,
          })
        ).rejects.toThrow(/invalid_client/)
      },
      async () => ({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: 'invalid_client' }),
        statusText: 'Unauthorized',
      })
    )
  })

  it('throws when no access_token', async () => {
    await withStubbedFetch(
      async () => {
        await expect(
          fetchPasswordGrantToken({
            authServer: 'auth.example.com/oauth/token',
            clientId: 'c',
            clientSecret: 's',
            username: 'u',
            password: 'p',
            grant_type: GRANT_TYPE.PASSWORD,
          })
        ).rejects.toThrow(/No access_token/)
      },
      async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ token_type: 'Bearer' }),
        statusText: 'OK',
      })
    )
  })
})
