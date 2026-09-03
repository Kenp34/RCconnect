import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();

  // Si pas de token → rediriger vers /login
  return token ? children : <Navigate to='/login' replace />;
}




export function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/" />;
  return children;
}

export function ManageRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'manager') return <Navigate to="/" />;
  return children;
}