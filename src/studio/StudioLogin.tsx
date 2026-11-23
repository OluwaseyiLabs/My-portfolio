import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth, OWNER_EMAIL } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

export default function StudioLogin() {
  const { user, isOwner, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already authenticated
  if (!loading && user && isOwner) {
    return <Navigate to="/studio" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('Please enter your owner password.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { error: signInError } = await signIn(password)
    setSubmitting(false)

    if (signInError) {
      setError(signInError.message)
    } else {
      navigate('/studio', { replace: true })
    }
  }

  return (
    <div className="studio-root min-h-dvh bg-bg text-fg flex flex-col justify-between p-6 sm:p-12">
      {/* Top brand header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <a
          href="/"
          className="text-base font-bold tracking-tight text-fg hover:opacity-70 transition-opacity"
        >
          Oluwaseyi.
        </a>
        <div className="flex items-center gap-5">
          <a
            href="/"
            className="text-xs font-semibold text-muted hover:text-fg transition-colors"
          >
            ← Return to Public Portfolio
          </a>
          <ThemeToggle />
        </div>
      </div>

      {/* Login Box */}
      <div className="max-w-md w-full mx-auto my-12 border border-line p-8 sm:p-10 shadow-sm">
        <div className="border-b-2 border-fg pb-4 mb-6">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted mb-1">
            Private Access
          </p>
          <h1 className="text-2xl font-black tracking-tight text-fg">
            Studio CMS Login
          </h1>
        </div>

        <p className="text-xs text-muted mb-6 leading-relaxed">
          Sign in to manage and publish your portfolio projects.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 border border-fg bg-surface text-xs font-medium text-fg"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2">
              Owner Account
            </label>
            <input
              type="text"
              disabled
              value={OWNER_EMAIL}
              className="w-full border border-line bg-surface px-4 py-3 text-xs text-muted cursor-not-allowed select-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full border border-line focus:border-fg pl-4 pr-12 py-3 text-sm text-fg bg-bg transition-colors outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-muted hover:text-fg transition-colors focus:outline-none focus-visible:text-fg"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 6.1A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.9M6.6 7.6C4 9.3 2.5 12 2.5 12S6 18 12 18c1.5 0 2.8-.4 4-.9" />
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-fg text-bg text-xs font-bold uppercase tracking-wider border border-fg hover:bg-bg hover:text-fg transition-colors duration-200 disabled:opacity-50"
          >
            {submitting ? 'Verifying...' : 'Sign In to Studio →'}
          </button>
        </form>
      </div>

      {/* Footer hint */}
      <div className="max-w-5xl mx-auto w-full text-center">
        <p className="text-xs text-faint">
          Oluwaseyi Portfolio CMS &copy; {new Date().getFullYear()} — Private Owner Access
        </p>
      </div>
    </div>
  )
}
