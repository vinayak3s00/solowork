import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../mongo'
import { json, jsonWithCookies, HttpError } from '../http'
import { registerSchema, loginSchema } from '../schemas'
import { hashPassword, verifyPassword } from '../auth/password'
import {
  createSessionToken,
  buildSessionCookie,
  buildClearCookie,
  getSession,
} from '../auth/session'
import { enforceRateLimit, getClientIp } from '../rateLimit'

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt })

/**
 * POST /auth/register — bootstraps the owner account.
 * Only allowed while there are zero users; afterwards registration is closed.
 */
export async function register(request) {
  enforceRateLimit(`auth:${getClientIp(request)}`, 10, 60_000)
  const data = registerSchema.parse(await request.json())

  const db = await getDb()
  const users = db.collection('users')

  const existingCount = await users.countDocuments({})
  if (existingCount > 0) {
    throw new HttpError(403, 'Registration is closed')
  }

  const user = {
    id: uuidv4(),
    name: data.name,
    email: data.email,
    passwordHash: hashPassword(data.password),
    createdAt: new Date(),
  }
  await users.insertOne(user)

  const token = createSessionToken(user)
  return jsonWithCookies(publicUser(user), buildSessionCookie(token), { status: 201 })
}

/** POST /auth/login — verifies credentials and issues a session cookie. */
export async function login(request) {
  enforceRateLimit(`auth:${getClientIp(request)}`, 10, 60_000)
  const data = loginSchema.parse(await request.json())

  const db = await getDb()
  const user = await db.collection('users').findOne({ email: data.email })

  // Constant-ish response regardless of whether the email exists.
  if (!user || !verifyPassword(data.password, user.passwordHash)) {
    throw new HttpError(401, 'Invalid email or password')
  }

  const token = createSessionToken(user)
  return jsonWithCookies(publicUser(user), buildSessionCookie(token))
}

/** POST /auth/logout — clears the session cookie. */
export async function logout() {
  return jsonWithCookies({ message: 'Logged out' }, buildClearCookie())
}

/**
 * GET /auth/me — returns the current user, or { authenticated, needsSetup }.
 * needsSetup is true when no owner account exists yet (so the UI shows register).
 */
export async function me(request) {
  const session = getSession(request)
  if (session && session.sub) {
    return json({
      authenticated: true,
      user: { id: session.sub, name: session.name, email: session.email },
    })
  }
  const db = await getDb()
  const needsSetup = (await db.collection('users').countDocuments({})) === 0
  return json({ authenticated: false, needsSetup })
}
