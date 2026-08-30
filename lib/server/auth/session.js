import { signToken, verifyToken } from './jwt'
import { HttpError } from '../http'

export const SESSION_COOKIE = 'solocrm_session'
const MAX_AGE = 7 * 24 * 60 * 60 // 7 days

/**
 * Builds a Set-Cookie header value for the session token.
 * httpOnly + SameSite=Lax + Secure (in production) to mitigate XSS/CSRF.
 */
export function buildSessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`
}

/** Builds a Set-Cookie header value that clears the session. */
export function buildClearCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
}

/** Signs a session token for a user. */
export function createSessionToken(user) {
  return signToken({ sub: user.id, email: user.email, name: user.name }, MAX_AGE)
}

/** Reads and verifies the session from the request cookies. Returns payload or null. */
export function getSession(request) {
  const raw = request.cookies?.get?.(SESSION_COOKIE)?.value
  if (!raw) return null
  return verifyToken(raw)
}

/**
 * Guard for protected handlers. Returns the session payload, or throws
 * HttpError(401) when there is no valid session.
 */
export function requireAuth(request) {
  const session = getSession(request)
  if (!session || !session.sub) {
    throw new HttpError(401, 'Authentication required')
  }
  return session
}
