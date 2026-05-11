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
import Profile from './pages/Profile';
import Branches from './pages/Branches';
import Trucks from './pages/Trucks';
import TruckSessions from './pages/TruckSessions';
import Expenses from './pages/Expenses';
import BulkOrders from './pages/BulkOrders';
import Customers from './pages/Customers';
import DocumentView from './pages/DocumentView';
import Users from './pages/Users';

function AppRoutes() {
  const { token, isAuthReady } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!isAuthReady ? null : (token ? <Navigate to="/" replace /> : <Login />)} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/purchase" element={<ProtectedRoute><Layout><PurchaseEntry /></Layout></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><Layout><SalesEntry /></Layout></ProtectedRoute>} />
      <Route path="/stock" element={<ProtectedRoute><Layout><CurrentStock /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
      <Route path="/media" element={<ProtectedRoute><Layout><Media /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
      <Route path="/branches" element={<ProtectedRoute><Layout><Branches /></Layout></ProtectedRoute>} />
      <Route path="/trucks" element={<ProtectedRoute><Layout><Trucks /></Layout></ProtectedRoute>} />
      <Route path="/truck-sessions" element={<ProtectedRoute><Layout><TruckSessions /></Layout></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><Layout><Expenses /></Layout></ProtectedRoute>} />
      <Route path="/bulk-orders" element={<ProtectedRoute><Layout><BulkOrders /></Layout></ProtectedRoute>} />
      <Route path="/bulk-orders/:id/document" element={<ProtectedRoute><Layout><DocumentView /></Layout></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
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
