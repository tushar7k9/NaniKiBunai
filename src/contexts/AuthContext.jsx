/**
 * AuthContext - User Authentication Management
 *
 * Manages user authentication state using Supabase Auth
 * Provides login, register, logout, and user state
 *
 * Usage:
 * import { useAuth } from '../hooks/useAuth'
 *
 * const { user, signIn, signUp, signOut, loading } = useAuth()
 */

import React, { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext()

const ADMIN_EMAIL = 'nanikiibunai@gmail.com'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is already logged in on mount
  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log("session", session);
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('Error getting session:', err.message)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  /**
   * Sign up new user
   * @param {string} email
   * @param {string} password
   * @param {object} metadata - Additional user data (firstName, lastName, etc.)
   */
  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata, // Store additional user data
        },
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Error signing up:', err.message)
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign in existing user
   * @param {string} email
   * @param {string} password
   */
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Error signing in:', err.message)
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()

      if (error) throw error

      setUser(null)
      return { error: null }
    } catch (err) {
      console.error('Error signing out:', err.message)
      setError(err.message)
      return { error: err.message }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sign in with OAuth provider (Google, GitHub, etc.)
   * @param {string} provider - 'google', 'github', 'facebook', etc.
   */
  const signInWithProvider = async (provider) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error(`Error signing in with ${provider}:`, err.message)
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Send password reset email
   * @param {string} email
   */
  const resetPassword = async (email) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Error sending reset email:', err.message)
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update user password
   * @param {string} newPassword
   */
  const updatePassword = async (newPassword) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Error updating password:', err.message)
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update user metadata
   * @param {object} updates - User metadata to update
   */
  const updateUserMetadata = async (updates) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      })

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Error updating user metadata:', err.message)
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = !!user && user.email === ADMIN_EMAIL

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    signInWithProvider,
    resetPassword,
    updatePassword,
    updateUserMetadata,
    isAuthenticated: !!user,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
