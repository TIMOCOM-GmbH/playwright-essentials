export interface PasswordGrantOptions {
  authServerHost: string
  clientId: string
  clientSecret: string
  username: string
  password: string
  grant_type?: string
  extra?: Record<string, string>
}

export interface PasswordGrantTokenResponse {
  access_token: string
  token_type?: string
  expires_in?: number
  scope?: string
  [k: string]: any
}

function toBasic(id: string, secret: string) {
  return Buffer.from(`${id}:${secret}`, 'utf8').toString('base64')
}

export async function fetchPasswordGrantToken(
  opts: PasswordGrantOptions
): Promise<PasswordGrantTokenResponse> {
  const {
    authServerHost,
    clientId,
    clientSecret,
    username,
    password,
    grant_type = 'password',
    extra = {},
  } = opts
  if (!authServerHost || !clientId || !clientSecret || !username || !password) {
    throw new Error('Missing required password grant fields')
  }
  // Normalize host: add https:// if protocol missing, remove trailing slashes
  const normalizedHost = (() => {
    let h = authServerHost.trim()
    if (!/^http?:\/\//i.test(h)) {
      h = `https://${h}`
    }
    // remove trailing slashes
    h = h.replace(/\/+$/, '')
    return h
  })()
  const url = `${normalizedHost}/auth/oauth/token`
  const bodyParams: Record<string, string> = {
    grant_type: grant_type,
    username,
    password,
    ...extra,
  }
  const body = new URLSearchParams(bodyParams).toString()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${toBasic(clientId, clientSecret)}`,
    },
    body,
  } as any)

  const text = await res.text()
  let json: any
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`Non-JSON token response (status ${res.status}): ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    const msg = json.error_description || json.error || res.statusText
    throw new Error(`Token request failed (${res.status}): ${msg}`)
  }
  if (!json.access_token) throw new Error('No access_token in response')
  return json as PasswordGrantTokenResponse
}

/** Convenience helper returning Authorization header string */
export async function getPasswordGrantAuthorizationHeader(
  opts: PasswordGrantOptions
): Promise<string> {
  const token = await fetchPasswordGrantToken(opts)
  return `${token.token_type || 'Bearer'} ${token.access_token}`
}
