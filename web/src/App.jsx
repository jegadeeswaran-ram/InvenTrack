import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PurchaseEntry from './pages/PurchaseEntry';
import SalesEntry from './pages/SalesEntry';
import CurrentStock from './pages/CurrentStock';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Products from './pages/Products';
import Media from './pages/Media';

function AppRoutes() {
  const { token, isAuthReady } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthReady ? null : (token ? <Navigate to="/" replace /> : <Login />)}
      />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/purchase" element={<ProtectedRoute><Layout><PurchaseEntry /></Layout></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><Layout><SalesEntry /></Layout></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute><Layout><CurrentStock /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
      <Route path="/media" element={<ProtectedRoute><Layout><Media /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
