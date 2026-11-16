import { describe, it, expect } from 'vitest'
import { enforceRateLimit, getClientIp } from '@/lib/server/rateLimit'
import { HttpError } from '@/lib/server/http'

describe('enforceRateLimit', () => {
  it('allows requests up to the limit then throws 429', () => {
    const key = `test-${Math.random()}`
    for (let i = 0; i < 3; i++) {
      expect(() => enforceRateLimit(key, 3, 60_000)).not.toThrow()
    }
    let err
    try {
      enforceRateLimit(key, 3, 60_000)
    } catch (e) {
      err = e
    }
    expect(err).toBeInstanceOf(HttpError)
    expect(err.status).toBe(429)
    expect(err.extra.retryAfter).toBeGreaterThan(0)
  })

  it('resets after the window elapses', async () => {
    const key = `test-window-${Math.random()}`
    enforceRateLimit(key, 1, 20) // 20ms window
    expect(() => enforceRateLimit(key, 1, 20)).toThrow()
    await new Promise((r) => setTimeout(r, 30))
    expect(() => enforceRateLimit(key, 1, 20)).not.toThrow()
  })
})

describe('getClientIp', () => {
  const req = (headers) => ({ headers: { get: (k) => headers[k.toLowerCase()] ?? null } })

  it('uses the first x-forwarded-for entry', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip then unknown', () => {
    expect(getClientIp(req({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9')
    expect(getClientIp(req({}))).toBe('unknown')
  })
})
