import { NextResponse } from 'next/server'

/**
 * Applies permissive-but-configurable CORS headers to a response.
 */
export function withCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

/** Success JSON response with CORS applied. */
export function json(data, init) {
  return withCORS(NextResponse.json(data, init))
}

/**
 * JSON response that also sets one or more Set-Cookie headers.
 * @param {any} data
 * @param {string|string[]} cookies  Cookie header value(s).
 * @param {object} [init]
 */
export function jsonWithCookies(data, cookies, init) {
  const res = withCORS(NextResponse.json(data, init))
  const list = Array.isArray(cookies) ? cookies : [cookies]
  for (const c of list) res.headers.append('Set-Cookie', c)
  return res
}

/** Standardized error response. Never leaks internal details. */
export function errorResponse(message, status = 400, extra = {}) {
  return withCORS(NextResponse.json({ error: message, ...extra }, { status }))
}

/**
 * Thin custom error we can throw from handlers to produce a clean HTTP
 * response with a specific status code and safe, user-facing message.
 */
export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.extra = extra
  }
}

/**
 * Converts any thrown value into a safe HTTP response.
 * - HttpError -> its own status/message
 * - ZodError  -> 400 with field issues
 * - anything else -> 500 with a generic message (details logged, not returned)
 */
export function toErrorResponse(err) {
  if (err instanceof HttpError) {
    return errorResponse(err.message, err.status, err.extra)
  }
  // Duck-type ZodError to avoid importing zod here.
  if (err && err.name === 'ZodError' && Array.isArray(err.issues)) {
    const fields = err.issues.map((i) => ({
      field: i.path.join('.') || '(root)',
      message: i.message,
    }))
    return errorResponse('Validation failed', 400, { fields })
  }
  // Unknown error: log server-side, return generic message to the client.
  console.error('Unhandled API error:', err)
  return errorResponse('Internal server error', 500)
}
