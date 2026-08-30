import crypto from 'crypto'

const KEYLEN = 64
const SALT_BYTES = 16
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 }

/**
 * Hashes a password with scrypt. Returns a self-describing string:
 *   scrypt$<N>$<r>$<p>$<salt_hex>$<hash_hex>
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES)
  const hash = crypto.scryptSync(String(password), salt, KEYLEN, SCRYPT_PARAMS)
  const { N, r, p } = SCRYPT_PARAMS
  return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${hash.toString('hex')}`
}

/**
 * Verifies a plaintext password against a stored hash string.
 * Uses a constant-time comparison. Returns false on any malformed input.
 */
export function verifyPassword(password, stored) {
  try {
    if (typeof stored !== 'string') return false
    const parts = stored.split('$')
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false
    const [, N, r, p, saltHex, hashHex] = parts
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const actual = crypto.scryptSync(String(password), salt, expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    })
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}
