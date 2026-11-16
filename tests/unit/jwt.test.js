import { describe, it, expect } from 'vitest'
import { signToken, verifyToken } from '@/lib/server/auth/jwt'

describe('jwt (HS256)', () => {
  it('signs and verifies a payload', () => {
    const token = signToken({ sub: 'u1', email: 'a@b.com' }, 3600)
    const payload = verifyToken(token)
    expect(payload).toMatchObject({ sub: 'u1', email: 'a@b.com' })
    expect(payload.iat).toBeTypeOf('number')
    expect(payload.exp).toBeGreaterThan(payload.iat)
  })

  it('returns null for a tampered signature', () => {
    const token = signToken({ sub: 'u1' }, 3600)
    expect(verifyToken(token.slice(0, -2) + 'xy')).toBeNull()
  })

  it('returns null for an expired token', () => {
    expect(verifyToken(signToken({ sub: 'u1' }, -10))).toBeNull()
  })

  it('returns null for malformed tokens', () => {
    expect(verifyToken('not.a.jwt')).toBeNull()
    expect(verifyToken('only.two')).toBeNull()
    expect(verifyToken(null)).toBeNull()
  })
})
