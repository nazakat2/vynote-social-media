'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'
import { initializeFirebaseAnalytics } from './firebase'
import { authRedirectUrl } from './siteUrl'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    initializeFirebaseAnalytics().catch((error) => {
      console.warn('Firebase Analytics initialization failed:', error)
    })

    async function initializeAuth() {
      try {
        // Supabase can return OAuth credentials in the URL hash (implicit flow).
        // Explicitly persist them so login also works when the provider falls
        // back to the site root instead of /auth/callback.
        if (window.location.hash.includes('access_token=')) {
          const params = new URLSearchParams(window.location.hash.slice(1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            if (error) throw error
          }

          // Preserve Next.js' internal history state while removing OAuth tokens.
          // Replacing it with an empty object breaks the App Router.
          window.history.replaceState(
            window.history.state,
            document.title,
            window.location.pathname + window.location.search
          )
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!mounted) return

        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
      } catch (error) {
        console.error('Authentication initialization failed:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data)
  }

  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, display_name: username } }
    })
    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectUrl('/auth/callback') }
    })
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    return { error }
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
