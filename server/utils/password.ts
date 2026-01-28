import { scrypt } from '@noble/hashes/scrypt.js'
import { randomBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils.js'

// Scrypt parameters (OWASP recommended for 2026)
// N=2^14, r=8, p=1 provides ~100ms hashing time
const SCRYPT_PARAMS = { N: 2 ** 14, r: 8, p: 1, dkLen: 32 }

/**
 * Constant-time comparison to prevent timing attacks (fixes H3)
 * Compares two Uint8Arrays in constant time regardless of content
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result |= a[i]! ^ b[i]!
  }
  return result === 0
}

/**
 * Hash a password using scrypt
 * Returns format: salt:hash (both hex encoded)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scrypt(password, salt, SCRYPT_PARAMS)
  return `${bytesToHex(salt)}:${bytesToHex(hash)}`
}

/**
 * Verify a password against a stored hash
 * Uses constant-time comparison to prevent timing attacks
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(':')
  if (!saltHex || !hashHex) {
    return false
  }
  const salt = hexToBytes(saltHex)
  const computedHash = scrypt(password, salt, SCRYPT_PARAMS)
  const storedHashBytes = hexToBytes(hashHex)
  return constantTimeEqual(computedHash, storedHashBytes)
}
