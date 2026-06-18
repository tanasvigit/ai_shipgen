import { useState } from 'react'
import type { FormEvent } from 'react'

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextUsername = username.trim()
    if (!nextUsername) {
      setError('Please enter your username.')
      return
    }
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await onLogin(nextUsername, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface to-surface-container-low/60 p-4 sm:p-8">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center">
        <div className="w-full rounded-3xl border border-outline-variant/25 bg-surface-container-lowest/95 shadow-soft backdrop-blur">
          <div className="grid lg:grid-cols-[1fr_420px]">
            <section className="hidden rounded-l-3xl bg-slate-950 p-10 text-slate-100 lg:flex lg:flex-col lg:justify-between">
              <div>
                <img src="/logo.png" alt="ShipGen" className="h-11 w-auto object-contain" />
                <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Operations Console</p>
                <h1 className="mt-3 max-w-sm font-headline text-4xl font-semibold leading-tight text-white">Ship smarter with live AI dispatch intelligence.</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                  Monitor loads, optimize routing, and respond to incidents in one secure workspace built for logistics teams.
                </p>
              </div>
              <p className="text-xs text-slate-400">Protected system access. Authorized operators only.</p>
            </section>

            <section className="p-6 sm:p-8 lg:p-10">
              <div className="mb-8 text-center lg:text-left">
                <img src="/logo.png" alt="ShipGen" className="mx-auto h-10 w-auto object-contain lg:hidden" />
                <h2 className="mt-4 font-headline text-2xl font-semibold text-on-surface sm:text-[1.9rem]">Sign in to ShipGen</h2>
                <p className="mt-2 text-sm text-on-surface-variant">Use your operations credentials to continue.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Username</span>
                  <input
                    className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant/40 bg-white px-3.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    aria-invalid={!!error && !username.trim()}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Password</span>
                  <div className="mt-1.5 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="h-11 w-full rounded-xl border border-outline-variant/40 bg-white px-3.5 pr-11 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyUp={(event) => setCapsLockOn(Boolean(event.getModifierState?.('CapsLock')))}
                      autoComplete="current-password"
                      aria-invalid={!!error && !password.trim()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((previous) => !previous)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-on-surface-variant hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[19px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </label>

                <div className="flex min-h-[20px] items-center justify-between gap-3 text-xs text-on-surface-variant">
                  <span>{capsLockOn ? 'Caps Lock is on' : '\u00A0'}</span>
                  <a href="#" className="font-semibold text-primary/80 hover:text-primary">
                    Need help signing in?
                  </a>
                </div>

                {error ? (
                  <p role="alert" aria-live="polite" className="rounded-xl border border-error/20 bg-error-container px-3.5 py-2.5 text-sm font-medium text-on-error-container">
                    {error}
                  </p>
                ) : null}

                <button
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>

                <p className="pt-1 text-center text-xs leading-5 text-on-surface-variant">
                  By continuing, you acknowledge this is a secure operational system and activity may be logged.
                </p>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
