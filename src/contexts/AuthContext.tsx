import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '../firebase'
import { getUserProfile } from '../services/auth'
import type { UserProfile } from '../types'
import i18n from '../i18n'

interface AuthContextValue {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  userProfile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    const user = auth.currentUser
    if (!user) return
    const profile = await getUserProfile(user.uid)
    setUserProfile(profile)
    if (profile?.lang) i18n.changeLanguage(profile.lang)
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setLoading(true)
      setCurrentUser(user)
      if (user) {
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)
        if (profile?.lang) {
          i18n.changeLanguage(profile.lang)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
