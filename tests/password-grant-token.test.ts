import { describe, it, expect } from 'vitest'
import { fetchPasswordGrantToken, getPasswordGrantAuthorizationHeader } from '../src/helpers/token'

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
          authServerHost: 'auth.example.com',
          clientId: 'cid',
          clientSecret: 'secret',
          username: 'user',
          password: 'pw',
        })
        expect(token.access_token).toBe('tok123')
        expect(calls[0].url).toBe('https://auth.example.com/auth/oauth/token')
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
        const header = await getPasswordGrantAuthorizationHeader({
          authServerHost: 'auth.example.com',
          clientId: 'cid',
          clientSecret: 'secret',
          username: 'user',
          password: 'pw',
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
        authServerHost: '',
        clientId: 'c',
        clientSecret: 's',
        username: 'u',
        password: 'p',
      } as any)
    ).rejects.toThrow(/Missing required/)
  })

  it('throws on non-json', async () => {
    await withStubbedFetch(
      async () => {
        await expect(
          fetchPasswordGrantToken({
            authServerHost: 'auth.example.com',
            clientId: 'c',
            clientSecret: 's',
            username: 'u',
            password: 'p',
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
            authServerHost: 'auth.example.com',
            clientId: 'c',
            clientSecret: 's',
            username: 'u',
            password: 'p',
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
            authServerHost: 'auth.example.com',
            clientId: 'c',
            clientSecret: 's',
            username: 'u',
            password: 'p',
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
