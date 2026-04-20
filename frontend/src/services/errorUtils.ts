export interface AppErrorPayload {
  error?: {
    code?: string
    message?: string
    category?: string
    status?: number
    details?: Record<string, unknown>
    requestId?: string | null
    retryable?: boolean
  }
  detail?: string | { msg?: string }[]
}

export interface AppError {
  message: string
  code: string
  category: string
  status: number
  requestId?: string | null
  retryable: boolean
}

export const DEFAULT_ERROR_AUTO_HIDE_MS = 7000

const offlineMessage = "You're offline. Reconnect and try again."

function parseLegacyDetail(detail: AppErrorPayload['detail'], fallback: string): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === 'object' && d && 'msg' in d ? String(d.msg) : JSON.stringify(d)))
      .join(', ')
  }
  return fallback
}

export async function readApiError(response: Response, fallback: string): Promise<AppError> {
  let payload: AppErrorPayload | null = null
  try {
    payload = (await response.json()) as AppErrorPayload
  } catch {
    payload = null
  }

  const message = payload?.error?.message || parseLegacyDetail(payload?.detail, fallback)
  return {
    message,
    code: payload?.error?.code || `HTTP_${response.status}`,
    category: payload?.error?.category || 'system',
    status: payload?.error?.status || response.status,
    requestId: payload?.error?.requestId,
    retryable: payload?.error?.retryable ?? response.status >= 500,
  }
}

export function userMessageFromUnknown(error: unknown, fallback: string): string {
  if (error instanceof TypeError) return offlineMessage
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
