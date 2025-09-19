export enum GRANT_TYPE {
  PASSWORD = 'password',
  CLIENT_CREDENTIALS = 'client_credentials',
}

type GrantBaseOptions = {
  authServer: string
  clientId: string
  clientSecret: string
  grant_type: GRANT_TYPE
  extra?: Record<string, string>
}
export type PasswordGrantOptions = GrantBaseOptions & {
  username: string
  password: string
  grant_type: GRANT_TYPE.PASSWORD
}
export type ClientCredentialsOptions = GrantBaseOptions & {
  grant_type: GRANT_TYPE.CLIENT_CREDENTIALS
}

export type TokenResponse = {
  access_token: string
  token_type?: string
  expires_in?: number
  scope?: string
  [k: string]: any
}

function toBasic(id: string, secret: string) {
  return Buffer.from(`${id}:${secret}`, 'utf8').toString('base64')
}

function normalizedHost(authServer: string): string {
  let h = authServer.trim()
  if (!/^https?:\/\//i.test(h)) {
    h = `https://${h}`
  }
  // remove trailing slashes
  h = h.replace(/\/+$/, '')
  return h
}

async function validateTokenResponse(res: Response): Promise<TokenResponse> {
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
  return json as TokenResponse
}

export async function fetchPasswordGrantToken(opts: PasswordGrantOptions): Promise<TokenResponse> {
  const {
    authServer,
    clientId,
    clientSecret,
    username,
    password,
    grant_type = GRANT_TYPE.PASSWORD,
    extra = {},
  } = opts
  if (!authServer || !clientId || !clientSecret || !username || !password) {
    throw new Error('Missing required password grant fields')
  }
  const url = normalizedHost(authServer)

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

  return validateTokenResponse(res)
}

export async function fetchClientCredentialsToken(
  opts: ClientCredentialsOptions
): Promise<TokenResponse> {
  const { authServer, clientId, clientSecret, extra = {} } = opts
  if (!authServer || !clientId || !clientSecret) {
    throw new Error('Missing required client credentials fields')
  }
  const bodyParams: Record<string, string> = {
    grant_type: GRANT_TYPE.CLIENT_CREDENTIALS,
    client_id: clientId,
    client_secret: clientSecret,
    ...extra,
  }
  const body = new URLSearchParams(bodyParams).toString()
  const url = normalizedHost(authServer)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  } as any)
  return validateTokenResponse(res)
}

/** Convenience helper returning Authorization header string */
export async function getOauthAccessToken(
  opts: PasswordGrantOptions | ClientCredentialsOptions
): Promise<string> {
  switch (opts.grant_type) {
    case GRANT_TYPE.PASSWORD:
      const passwordToken = await fetchPasswordGrantToken(opts)
      return `${passwordToken.token_type || 'Bearer'} ${passwordToken.access_token}`

    case GRANT_TYPE.CLIENT_CREDENTIALS:
      const clientCredentialsToken = await fetchClientCredentialsToken(opts)
      return `${clientCredentialsToken.token_type || 'Bearer'} ${clientCredentialsToken.access_token}`
  }
}
