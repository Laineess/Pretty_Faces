import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole, requiredRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  const roles = requiredRoles || (requiredRole ? [requiredRole] : null)
  if (roles && user.rol !== 'admin' && !roles.includes(user.rol)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}
