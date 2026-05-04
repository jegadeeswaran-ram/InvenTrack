import { Navigate, Outlet } from 'react-router-dom';
import useStore from '../../store/useStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function ProtectedRoute({ roles, title }) {
  const { user, accessToken } = useStore();

  if (!accessToken || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
