import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, ShoppingBag, Package, BarChart3,
  DollarSign, Settings, LogOut, CheckSquare, Warehouse, ClipboardCheck
} from 'lucide-react';
import useStore from '../../store/useStore';
import { logout } from '../../api/endpoints/auth';

const navItems = [
  { to: '/dashboard',        label: 'Dashboard',       icon: LayoutDashboard, roles: ['ADMIN','BRANCH_MANAGER'] },
  { to: '/dispatch',         label: 'Dispatch',        icon: Truck,           roles: ['ADMIN','BRANCH_MANAGER'] },
  { to: '/shop-sales',       label: 'Shop Sales',      icon: ShoppingBag,     roles: ['ADMIN','BRANCH_MANAGER'] },
  { to: '/live-stock',       label: 'Live Stock',      icon: Warehouse,       roles: ['ADMIN','BRANCH_MANAGER'] },
  { to: '/closing',          label: 'Day Closing',     icon: ClipboardCheck,  roles: ['ADMIN','BRANCH_MANAGER'] },
  { to: '/products',         label: 'Products',        icon: Package,         roles: ['ADMIN','BRANCH_MANAGER'] },
  { to: '/expenses',         label: 'Expenses',        icon: DollarSign,      roles: ['ADMIN','BRANCH_MANAGER'] },
  { to: '/reports',          label: 'Reports',         icon: BarChart3,       roles: ['ADMIN','BRANCH_MANAGER'] },
  { to: '/settings',         label: 'Settings',        icon: Settings,        roles: ['ADMIN'] },
];

export default function Sidebar() {
  const { user, clearAuth, addToast } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const rt = localStorage.getItem('refreshToken');
      if (rt) await logout({ refreshToken: rt });
    } catch {}
    clearAuth();
    navigate('/login');
  };

  const visible = navItems.filter((n) => n.roles.includes(user?.role));

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">InvenTrack</p>
            <p className="text-xs text-gray-400 mt-0.5">Kulfi ICE</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {visible.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
