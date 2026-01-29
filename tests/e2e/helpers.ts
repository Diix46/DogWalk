import { type Page } from '@playwright/test'

export const TEST_USER = {
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'E2E Test User',
}

// Seeded users (created by pnpm db:seed)
export const ADMIN_USER = {
  email: 'admin@dogwalk.test',
  password: 'Admin123!',
}

export const PREMIUM_USER = {
  email: 'premium@dogwalk.test',
  password: 'Premium123!',
}

export const SEEDED_USER = {
  email: 'user@dogwalk.test',
  password: 'User1234!',
}

export async function registerUser(page: Page, user = TEST_USER) {
  await page.goto('/register')
  await page.waitForLoadState('networkidle')
  if (user.name) {
    await page.getByLabel('Nom (optionnel)').fill(user.name)
  }
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Mot de passe').fill(user.password)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await page.waitForLoadState('networkidle')
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForLoadState('networkidle')
}
