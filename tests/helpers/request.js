// Builds a minimal NextRequest-like object that our handlers rely on:
// .method, .url, .headers.get(), .cookies.get(), and async .json().

export function makeRequest({
  method = 'GET',
  url = 'http://localhost/api',
  body = undefined,
  headers = {},
  cookies = {},
} = {}) {
  const lowerHeaders = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  )
  return {
    method,
    url,
    headers: { get: (k) => lowerHeaders[k.toLowerCase()] ?? null },
    cookies: { get: (name) => (name in cookies ? { value: cookies[name] } : undefined) },
    json: async () => body,
  }
}

/** Reads a handler's Response into { status, json }. */
export async function readResponse(res) {
  return { status: res.status, json: await res.json() }
}

/** Extracts the session token from a response's Set-Cookie header. */
export function sessionTokenFrom(res) {
  const setCookie = res.headers.get('set-cookie') || ''
  const match = setCookie.match(/solocrm_session=([^;]+)/)
  return match ? match[1] : null
}
