/**
 * useAuth Hook
 *
 * Custom hook to access Auth Context
 * Provides easy access to authentication state and methods
 *
 * Usage:
 * ```javascript
 * import { useAuth } from '../hooks/useAuth'
 *
 * function MyComponent() {
 *   const { user, signIn, signOut, isAuthenticated } = useAuth()
 *
 *   if (!isAuthenticated) {
 *     return <LoginButton onClick={() => signIn(email, password)} />
 *   }
 *
 *   return <div>Welcome, {user.email}!</div>
 * }
 * ```
 */

import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export default useAuth
