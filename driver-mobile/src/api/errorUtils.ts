import type { Alert } from '../types'

type ErrorPayload = {
  error?: {
    code?: string
    message?: string
    category?: string
    status?: number
    requestId?: string
    retryable?: boolean
  }
  detail?: string | { msg?: string }[]
}

export const DEFAULT_ERROR_AUTO_HIDE_MS = 7000

function parseLegacyDetail(detail: ErrorPayload['detail'], fallback: string): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === 'object' && d && 'msg' in d ? String(d.msg) : JSON.stringify(d)))
      .join(', ')
  }
  return fallback
}

export async function parseApiError(response: Response, fallback: string): Promise<Error> {
  let payload: ErrorPayload | null = null
  try {
    payload = (await response.json()) as ErrorPayload
  } catch {
    payload = null
  }
  const message = payload?.error?.message || parseLegacyDetail(payload?.detail, fallback)
  return new Error(message)
}

export function toFriendlyMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) return "You're offline. Reconnect and try again."
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

export function isBlockingMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('sign in') ||
    normalized.includes('permission') ||
    normalized.includes('access') ||
    normalized.includes('invalid') ||
    normalized.includes('required')
  )
}

export function openIssueSummary(alerts: Alert[], tripId: number): string | null {
  const pending = alerts.filter((a) => a.tripId === tripId && !a.resolved).length
  if (pending <= 0) return null
  if (pending === 1) return '1 pending issue needs attention.'
  return `${pending} pending issues need attention.`
}
