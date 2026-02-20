import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_HEX = process.env.ENCRYPTION_KEY // 64 hex chars = 32 bytes

function getKey(): Buffer {
  if (!KEY_HEX || KEY_HEX.length !== 64) {
    throw new Error('ENCRYPTION_KEY env var must be a 64-char hex string (32 bytes)')
  }
  return Buffer.from(KEY_HEX, 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12) // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag() // 16-byte auth tag

  // Format: iv(12) + tag(16) + ciphertext — all base64-encoded together
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decrypt(encoded: string): string {
  const key = getKey()
  const buf = Buffer.from(encoded, 'base64')

  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const ciphertext = buf.subarray(28)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return decipher.update(ciphertext) + decipher.final('utf8')
}
