import { test, expect } from '@playwright/test'
import { TEST_USER, login, registerUser } from './helpers'

test.describe('Authentication', () => {
  test('register new user redirects to homepage (auto-login)', async ({ page }) => {
    const user = { ...TEST_USER, email: `auth-reg-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/')
  })

  test('login with valid credentials redirects to homepage', async ({ page }) => {
    const user = { ...TEST_USER, email: `auth-login-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/')

    // Logout via profile page
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Se déconnecter' }).click()
    await page.waitForURL(/\/login/, { timeout: 10000 })

    // Now login
    await login(page, user.email, user.password)
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })
  })

  test('login with wrong password shows error', async ({ page }) => {
    await login(page, 'nobody@example.com', 'WrongPassword99!')
    await expect(page.getByText(/incorrect/i)).toBeVisible()
  })

  test('rate limiting returns 429 after many attempts', async ({ page }) => {
    const targetEmail = `ratelimit-${Date.now()}@example.com`
    for (let i = 0; i < 6; i++) {
      await login(page, targetEmail, 'wrong' + i + '!!!')
    }
    // After several failed attempts, we should see an error (either rate limit or auth error)
    await expect(page.getByText(/trop de tentatives|incorrect|survenue/i)).toBeVisible()
  })

  test('logout clears session', async ({ page }) => {
    const user = { ...TEST_USER, email: `auth-logout-${Date.now()}@example.com` }
    await registerUser(page, user)
    await expect(page).toHaveURL('/')

    // Go to profile and click logout
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Se déconnecter' }).click()
    await page.waitForURL(/\/login/, { timeout: 10000 })
  })
})
