import { test, expect } from '@playwright/test'
import { TEST_USER, registerUser } from './helpers'

test.describe('Premium features', () => {
  test('premium page shows pricing and CTA', async ({ page }) => {
    const user = { ...TEST_USER, email: `premium-page-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/premium')
    await page.waitForLoadState('networkidle')

    // Page heading
    await expect(page.getByText('Explorez sans limites')).toBeVisible({ timeout: 10000 })

    // Pricing
    await expect(page.getByText('9,99€')).toBeVisible()
    await expect(page.getByText('/mois')).toBeVisible()

    // CTA button
    await expect(page.getByRole('button', { name: 'Découvrir Premium' })).toBeVisible()
  })

  test('non-premium user sees premium gate on premium route', async ({ page }) => {
    const user = { ...TEST_USER, email: `premium-gate-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/explore')
    await page.waitForLoadState('networkidle')

    const premiumBadge = page.locator('text=Premium').first()
    const hasPremium = await premiumBadge.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasPremium, 'No premium routes available in database')

    await premiumBadge.click()
    await expect(page.getByText('Parcours Premium')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Découvrir Premium' })).toBeVisible()
  })
})
