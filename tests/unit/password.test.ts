import { describe, it, expect } from 'vitest'
import { createPasswordHash, checkPassword } from '../../server/utils/password'

describe('password utils', () => {
  it('should hash and verify a password', async () => {
    const hash = await createPasswordHash('mypassword123')
    expect(hash).toContain(':')
    expect(await checkPassword('mypassword123', hash)).toBe(true)
  })

  it('should reject wrong password', async () => {
    const hash = await createPasswordHash('correctpassword')
    expect(await checkPassword('wrongpassword', hash)).toBe(false)
  })

  it('should return false for malformed hash', async () => {
    expect(await checkPassword('test', 'nocolon')).toBe(false)
    expect(await checkPassword('test', '')).toBe(false)
  })

  it('should produce different hashes for same password (different salt)', async () => {
    const hash1 = await createPasswordHash('samepassword')
    const hash2 = await createPasswordHash('samepassword')
    expect(hash1).not.toBe(hash2)
    // But both should verify
    expect(await checkPassword('samepassword', hash1)).toBe(true)
    expect(await checkPassword('samepassword', hash2)).toBe(true)
  })
})
