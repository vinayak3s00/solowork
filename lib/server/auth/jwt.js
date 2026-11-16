import crypto from 'crypto'

// Minimal, dependency-free HS256 JWT implementation for session tokens.

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64urlJson(obj) {
  return base64url(JSON.stringify(obj))
}

function fromBase64url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.APP_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('AUTH_SECRET (or APP_ENCRYPTION_KEY) environment variable is not set')
  }
  return secret
}

function sign(data) {
  return base64url(crypto.createHmac('sha256', getSecret()).update(data).digest())
}

/**
 * Creates a signed JWT. `payload` is any JSON-serializable object.
 * @param {object} payload
 * @param {number} expiresInSeconds  Token lifetime (default 7 days).
 */
export function signToken(payload, expiresInSeconds = 7 * 24 * 60 * 60) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = { ...payload, iat: now, exp: now + expiresInSeconds }
  const encoded = `${base64urlJson(header)}.${base64urlJson(body)}`
  return `${encoded}.${sign(encoded)}`
}

/**
 * Verifies and decodes a JWT. Returns the payload, or null if invalid/expired.
 */
export function verifyToken(token) {
  try {
    if (typeof token !== 'string') return null
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, sig] = parts

    const expectedSig = sign(`${headerB64}.${payloadB64}`)
    const a = fromBase64url(sig)
    const b = fromBase64url(expectedSig)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

    const payload = JSON.parse(fromBase64url(payloadB64).toString('utf8'))
    if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) return null
    return payload
  } catch {
    return null
  }
}
