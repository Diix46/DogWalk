import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Mirror the schema from server/api/reviews/index.post.ts
const reviewSchema = z.object({
  route_id: z.string().min(1, 'route_id requis'),
  walk_id: z.number().optional(),
  rating: z.number().int().min(1).max(5, 'Rating entre 1 et 5'),
  comment: z.string().max(1000).optional(),
})

describe('review validation schema', () => {
  it('accepts valid review', () => {
    const result = reviewSchema.safeParse({ route_id: 'abc', rating: 4, comment: 'Great!' })
    expect(result.success).toBe(true)
  })

  it('rejects missing route_id', () => {
    const result = reviewSchema.safeParse({ rating: 3 })
    expect(result.success).toBe(false)
  })

  it('rejects rating outside 1-5', () => {
    expect(reviewSchema.safeParse({ route_id: 'x', rating: 0 }).success).toBe(false)
    expect(reviewSchema.safeParse({ route_id: 'x', rating: 6 }).success).toBe(false)
  })

  it('rejects non-integer rating', () => {
    expect(reviewSchema.safeParse({ route_id: 'x', rating: 3.5 }).success).toBe(false)
  })

  it('rejects comment over 1000 chars', () => {
    const result = reviewSchema.safeParse({ route_id: 'x', rating: 3, comment: 'a'.repeat(1001) })
    expect(result.success).toBe(false)
  })

  it('accepts review without comment', () => {
    const result = reviewSchema.safeParse({ route_id: 'x', rating: 5 })
    expect(result.success).toBe(true)
  })
})
