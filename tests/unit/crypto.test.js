import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, mask } from '@/lib/server/crypto'

describe('crypto', () => {
  it('round-trips a plaintext value', () => {
    const secret = 'sk-proj-ABCDEF1234567890'
    const token = encrypt(secret)
    expect(token).toMatch(/^v1:/)
    expect(decrypt(token)).toBe(secret)
  })

  it('produces a different ciphertext each time (random IV)', () => {
    expect(encrypt('same')).not.toBe(encrypt('same'))
  })

  it('rejects a tampered token', () => {
    const token = encrypt('hello world')
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa')
    expect(() => decrypt(tampered)).toThrow()
  })

  it('rejects malformed input', () => {
    expect(() => decrypt('not-a-token')).toThrow()
    expect(() => decrypt('v2:a:b:c')).toThrow()
  })

  it('masks to last 4 chars', () => {
    expect(mask('sk-secret-1234')).toBe('***1234')
    expect(mask('')).toBe('***')
  })
})
