/**
 * Supabase Client Configuration
 *
 * This file creates and exports the Supabase client instance
 * used throughout the application.
 *
 * Usage:
 * import { supabase } from '../lib/supabase'
 */

import { createClient } from '@supabase/supabase-js'

// Get environment variables (Vite uses import.meta.env and VITE_ prefix)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  console.error('See .env.example for reference')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist auth session in localStorage
    persistSession: true,
    // Auto refresh tokens
    autoRefreshToken: true,
    // Detect session from URL (for email confirmation links)
    detectSessionInUrl: true,
    // Storage key for auth session
    storageKey: 'nani-ki-bunai-auth',
  },
})

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session !== null
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error.message)
    throw error
  }
}

export default supabase
