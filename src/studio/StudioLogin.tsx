import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth, OWNER_EMAIL } from '../context/AuthContext'

export default function StudioLogin() {
  const { user, isOwner, signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen bg-white text-black flex flex-col justify-between p-6 sm:p-12">
      {/* Top brand header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <a
          href="/"
          className="text-base font-bold tracking-tight text-black hover:opacity-70 transition-opacity"
        >
          Oluwaseyi.
        </a>
        <a
          href="/"
          className="text-xs font-semibold text-[#555555] hover:text-black transition-colors"
        >
          ← Return to Public Portfolio
        </a>
      </div>

      {/* Login Box */}
      <div className="max-w-md w-full mx-auto my-12 border border-[#E5E5E5] p-8 sm:p-10 shadow-sm">
        <div className="border-b-2 border-black pb-4 mb-6">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#555555] mb-1">
            Private Access
          </p>
          <h1 className="text-2xl font-black tracking-tight text-black">
            Studio CMS Login
          </h1>
        </div>

        <p className="text-xs text-[#555555] mb-6 leading-relaxed">
          Sign in to manage and publish your portfolio projects.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 border border-black bg-[#FBFBFB] text-xs font-medium text-black"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#555555] mb-2">
              Owner Account
            </label>
            <input
              type="text"
              disabled
              value={OWNER_EMAIL}
              className="w-full border border-[#E5E5E5] bg-[#F5F5F5] px-4 py-3 text-xs text-[#777777] cursor-not-allowed select-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#555555]"
              >
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full border border-[#E5E5E5] focus:border-black px-4 py-3 text-sm text-black bg-white transition-colors outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-black text-white text-xs font-bold uppercase tracking-wider border border-black hover:bg-white hover:text-black transition-colors duration-200 disabled:opacity-50"
          >
            {submitting ? 'Verifying...' : 'Sign In to Studio →'}
          </button>
        </form>
      </div>

      {/* Footer hint */}
      <div className="max-w-5xl mx-auto w-full text-center">
        <p className="text-xs text-[#888888]">
          Oluwaseyi Portfolio CMS &copy; {new Date().getFullYear()} — Private Owner Access
        </p>
      </div>
    </div>
  )
}
