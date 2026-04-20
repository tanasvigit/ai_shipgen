import type { AuthSession } from '../types'
import { readApiError } from './errorUtils'

const API_BASE = 'http://127.0.0.1:8000'
const AUTH_STORAGE_KEY = 'shipgen-auth-session'

export function getStoredSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function clearSession(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) {
    const parsed = await readApiError(response, 'Sign-in failed. Please check your credentials.')
    throw new Error(parsed.message)
  }
  const session = (await response.json()) as AuthSession
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  return session
}
