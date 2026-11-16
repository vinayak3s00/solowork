import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

/**
 * Derives a 32-byte key from the APP_ENCRYPTION_KEY env var.
 * Accepts either a 64-char hex string (preferred) or any passphrase,
 * which is hashed to 32 bytes via SHA-256.
 */
function getKey() {
  const secret = process.env.APP_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('APP_ENCRYPTION_KEY environment variable is not set')
  }
  if (/^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, 'hex')
  }
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypts a plaintext string. Returns a compact, self-describing token:
 *   v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encrypt(plaintext) {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * Decrypts a token produced by encrypt(). Returns the original plaintext.
 * Throws if the token is malformed or authentication fails.
 */
export function decrypt(token) {
  if (typeof token !== 'string') throw new Error('Invalid ciphertext')
  const parts = token.split(':')
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Unrecognized ciphertext format')
  }
  const [, ivHex, tagHex, dataHex] = parts
  const key = getKey()
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

/** Returns a masked representation of a secret, e.g. "***abcd". */
export function mask(secret) {
  const s = String(secret ?? '')
  return '***' + s.slice(-4)
}
