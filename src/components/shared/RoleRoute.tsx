import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface RoleRouteProps {
  role: 'vendor' | 'customer'
  children: React.ReactNode
}

export function RoleRoute({ role, children }: RoleRouteProps) {
  const { userProfile, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-white">Loading…</div>
  if (!userProfile) return <Navigate to="/login" replace />
  if (userProfile.role !== role) {
    return <Navigate to={userProfile.role === 'vendor' ? '/vendor' : '/browse'} replace />
  }
  return <>{children}</>
}
