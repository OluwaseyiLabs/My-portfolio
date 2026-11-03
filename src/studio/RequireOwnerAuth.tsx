import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireOwnerAuth({ children }: { children: ReactNode }) {
  const { user, isOwner, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#555555] mb-2">
            Oluwaseyi Studio
          </p>
          <p className="text-sm font-semibold text-black">Verifying owner credentials...</p>
        </div>
      </div>
    )
  }

  if (!user || !isOwner) {
    return <Navigate to="/studio/login" replace />
  }

  return <>{children}</>
}
