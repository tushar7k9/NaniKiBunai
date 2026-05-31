import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const AdminRoute = ({ children }) => {
  const { isAdmin, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--warm-white)',
      }}>
        <div style={{
          width: 32, height: 32, border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--terracotta)', borderRadius: '50%',
          animation: 'spin 0.6s linear infinite',
        }} />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return children
}

export default AdminRoute
