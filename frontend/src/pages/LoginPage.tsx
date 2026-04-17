import { useState } from 'react'
import type { FormEvent } from 'react'

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await onLogin(username, password)
    } catch {
      setError('Login failed. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-black/5 p-8 space-y-4">
        <img src="/logo.png" alt="ShipGen" className="h-12 w-auto object-contain" />
        <h1 className="text-xl font-bold">Sign in to ShipGen</h1>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Username</span>
          <input className="mt-1 w-full h-10 rounded-lg border border-outline-variant/30 px-3" value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Password</span>
          <div className="mt-1 relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full h-10 rounded-lg border border-outline-variant/30 px-3 pr-10"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </label>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <button disabled={isSubmitting} className="w-full h-11 rounded-lg bg-primary text-white font-bold disabled:opacity-60">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage
