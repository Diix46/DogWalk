import { test, expect } from '@playwright/test'
import { TEST_USER, registerUser } from './helpers'

test.describe('Walk flow', () => {
  test('explore page loads and shows heading', async ({ page }) => {
    const user = { ...TEST_USER, email: `walk-explore-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/')

    await page.goto('/explore')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Explorer' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Parcours recommandés' })).toBeVisible()
  })

  test('explore page shows route cards when routes are seeded', async ({ page }) => {
    const user = { ...TEST_USER, email: `walk-routes-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/explore')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.grid article').first()).toBeVisible({ timeout: 5000 })
  })

  test('click route shows detail page with start button', async ({ page }) => {
    const user = { ...TEST_USER, email: `walk-detail-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/explore')
    await page.waitForLoadState('networkidle')

    const routeCard = page.locator('.grid article').first()
    const hasRoutes = await routeCard.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasRoutes, 'No routes seeded in database')

    await routeCard.click()
    await expect(page).toHaveURL(/\/routes\//)
    await expect(page.getByText("C'est parti !")).toBeVisible()
  })

  test('start walk navigates to tracker', async ({ page }) => {
    const user = { ...TEST_USER, email: `walk-start-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/explore')
    await page.waitForLoadState('networkidle')

    const routeCard = page.locator('.grid article').first()
    const hasRoutes = await routeCard.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasRoutes, 'No routes seeded in database')

    await routeCard.click()
    await expect(page).toHaveURL(/\/routes\//)
    await page.waitForLoadState('networkidle')
    await page.getByText("C'est parti !").click()
    await expect(page).toHaveURL(/\/walks\/\d+/, { timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Terminer la balade' })).toBeVisible({ timeout: 10000 })
  })

  test('complete walk shows summary', async ({ page }) => {
    const user = { ...TEST_USER, email: `walk-complete-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/explore')
    await page.waitForLoadState('networkidle')

    const routeCard = page.locator('.grid article').first()
    const hasRoutes = await routeCard.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!hasRoutes, 'No routes seeded in database')

    await routeCard.click()
    await expect(page).toHaveURL(/\/routes\//)
    await page.waitForLoadState('networkidle')
    await page.getByText("C'est parti !").click()
    await expect(page).toHaveURL(/\/walks\/\d+/, { timeout: 10000 })

    await page.getByRole('button', { name: 'Terminer la balade' }).click()
    await page.waitForURL(/\/walks\/summary-/, { timeout: 10000 })
    // Summary page shows encouraging heading
    await expect(
      page.getByRole('heading', { name: /joué|Incroyable|Super/i })
    ).toBeVisible()
  })
})
