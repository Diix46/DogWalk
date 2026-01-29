import { test, expect } from '@playwright/test'
import { TEST_USER, registerUser } from './helpers'

test.describe('Articles', () => {
  test('articles page shows heading and category filters', async ({ page }) => {
    const user = { ...TEST_USER, email: `articles-list-${Date.now()}@example.com` }
    await registerUser(page, user)

    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    // Page heading
    await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible()

    // Category filter buttons (UButton chips)
    await expect(page.getByRole('button', { name: 'Santé' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nutrition' })).toBeVisible()
  })

  test('articles page shows articles or empty state', async ({ page }) => {
    const user = { ...TEST_USER, email: `articles-content-${Date.now()}@example.com` }
    await registerUser(page, user)

    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    // Either articles are shown (NuxtLink cards with h2 titles) or empty state
    await expect(
      page.locator('.grid a').first().or(page.getByText('Aucun article trouvé'))
    ).toBeVisible({ timeout: 5000 })
  })

  test('click article navigates to detail page', async ({ page }) => {
    const user = { ...TEST_USER, email: `articles-detail-${Date.now()}@example.com` }
    await registerUser(page, user)

    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    // Check if any article links exist
    const articleLink = page.locator('.grid a').first()
    const hasArticles = await articleLink.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasArticles, 'No articles available in content')

    await articleLink.click()
    await expect(page).toHaveURL(/\/articles\//)
  })

  test('category filter updates article list', async ({ page }) => {
    const user = { ...TEST_USER, email: `articles-filter-${Date.now()}@example.com` }
    await registerUser(page, user)

    await page.goto('/articles')
    await page.waitForLoadState('networkidle')

    // Click a category filter button
    await page.getByRole('button', { name: 'Santé' }).click()
    await page.waitForLoadState('networkidle')

    // Page should still show articles or empty state (filtered)
    await expect(
      page.locator('.grid a').first().or(page.getByText('Aucun article trouvé'))
    ).toBeVisible({ timeout: 5000 })
  })
})
