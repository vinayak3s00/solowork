import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/server/auth/password'

describe('password hashing', () => {
  it('verifies a correct password', () => {
    const hash = hashPassword('hunter2pass')
    expect(verifyPassword('hunter2pass', hash)).toBe(true)
  })

  it('rejects a wrong password', () => {
    const hash = hashPassword('hunter2pass')
    expect(verifyPassword('wrong', hash)).toBe(false)
  })

  it('uses a unique salt per hash', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'))
  })

  it('returns false for malformed stored hashes', () => {
    expect(verifyPassword('x', 'garbage')).toBe(false)
    expect(verifyPassword('x', null)).toBe(false)
    expect(verifyPassword('x', 'scrypt$only$three')).toBe(false)
  })

  it('emits a self-describing scrypt string', () => {
    expect(hashPassword('abc')).toMatch(/^scrypt\$\d+\$\d+\$\d+\$[0-9a-f]+\$[0-9a-f]+$/)
  })
})
