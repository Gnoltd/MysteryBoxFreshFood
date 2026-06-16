import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-white">Loading…</div>
  if (!currentUser) return <Navigate to="/login" replace />
  return <>{children}</>
}
