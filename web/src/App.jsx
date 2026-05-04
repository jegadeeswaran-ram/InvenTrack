import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ToastContainer from './components/ui/Toast';
import Login           from './pages/Login';
import Dashboard       from './pages/Dashboard';
import Dispatch        from './pages/Dispatch';
import ShopSales       from './pages/ShopSales';
import LiveStock       from './pages/LiveStock';
import ClosingApproval from './pages/ClosingApproval';
import Products        from './pages/Products';
import Expenses        from './pages/Expenses';
import Reports         from './pages/Reports';
import Settings        from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* All authenticated users */}
        <Route element={<ProtectedRoute roles={['ADMIN','BRANCH_MANAGER','SALESPERSON']} title="Dashboard" />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Admin & Branch Manager routes */}
        <Route element={<ProtectedRoute roles={['ADMIN','BRANCH_MANAGER']} title="Dispatch" />}>
          <Route path="/dispatch" element={<Dispatch />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN','BRANCH_MANAGER']} title="Shop Sales" />}>
          <Route path="/shop-sales" element={<ShopSales />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN','BRANCH_MANAGER','SALESPERSON']} title="Live Stock" />}>
          <Route path="/live-stock" element={<LiveStock />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN','BRANCH_MANAGER']} title="Day Closing" />}>
          <Route path="/closing" element={<ClosingApproval />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN','BRANCH_MANAGER']} title="Products" />}>
          <Route path="/products" element={<Products />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN','BRANCH_MANAGER']} title="Expenses" />}>
          <Route path="/expenses" element={<Expenses />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN','BRANCH_MANAGER']} title="Reports" />}>
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN']} title="Settings" />}>
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
