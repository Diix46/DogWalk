import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    articles: defineCollection({
      type: 'page',
      source: 'articles/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        category: z.enum(['sante', 'nutrition', 'comportement', 'equipement', 'races']),
        image: z.string().optional(),
        publishedAt: z.string(),
      }),
    }),
  },
})
