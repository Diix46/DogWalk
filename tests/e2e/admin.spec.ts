import { test, expect } from '@playwright/test'
import { TEST_USER, ADMIN_USER, registerUser, login } from './helpers'

test.describe('Admin', () => {
  test('non-admin cannot access /admin', async ({ page }) => {
    const user = { ...TEST_USER, email: `admin-denied-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Accès refusé')).toBeVisible({ timeout: 10000 })
  })

  test('admin sees dashboard with stats', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password)
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Dashboard Admin')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Statistiques' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Utilisateurs' })).toBeVisible()
  })

  test('admin sees "Gérer les articles" link', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password)
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Gérer les articles')).toBeVisible({ timeout: 10000 })
  })

  test('unauthenticated user is redirected from /admin', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    await expect(page).not.toHaveURL('/admin')
  })
})
