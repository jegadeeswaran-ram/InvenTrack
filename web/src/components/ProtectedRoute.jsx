import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, isAuthReady } = useAuth();
  if (!isAuthReady) return null;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
