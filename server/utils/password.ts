/**
 * Password hashing using Web Crypto API (PBKDF2)
 * Compatible with Cloudflare Workers runtime
 */

const PBKDF2_ITERATIONS = 100_000
const SALT_LENGTH = 16
const KEY_LENGTH = 32

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  )
}

/**
 * Hash a password. Returns "salt:hash" (hex encoded).
 */
export async function createPasswordHash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const hash = await deriveKey(password, salt)
  return `${bufferToHex(salt)}:${bufferToHex(hash)}`
}

/**
 * Verify a password against a stored "salt:hash" string.
 * Uses constant-time comparison.
 */
export async function checkPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':')
  if (!saltHex || !hashHex) return false

  const salt = hexToBuffer(saltHex)
  const computed = await deriveKey(password, salt)
  const computedHex = bufferToHex(computed)

  // Constant-time comparison
  if (computedHex.length !== hashHex.length) return false
  let result = 0
  for (let i = 0; i < computedHex.length; i++) {
    result |= computedHex.charCodeAt(i) ^ hashHex.charCodeAt(i)
  }
  return result === 0
}
