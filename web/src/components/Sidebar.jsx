import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const DashboardIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const PurchaseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const SalesIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const StockIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const ReportsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
const ProductsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
const BranchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const TruckIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const TruckSessionIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const ExpenseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const BulkOrderIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const CustomerIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const MediaIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const UsersIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const ProfileIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const SunIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const LogoutIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

const SECTION_DIVIDER = null;

const buildNav = (role) => {
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'ADMIN' || role === 'BRANCH_MANAGER';
  return [
    { path: '/', label: 'Dashboard', Icon: DashboardIcon },
    SECTION_DIVIDER,
    { path: '/purchase', label: 'Purchase Entry', Icon: PurchaseIcon, show: isAdmin },
    { path: '/sales', label: 'Sales Entry', Icon: SalesIcon },
    { path: '/stock', label: 'Current Stock', Icon: StockIcon },
    SECTION_DIVIDER,
    { path: '/truck-sessions', label: 'Truck Sessions', Icon: TruckSessionIcon, show: isManager },
    { path: '/expenses', label: 'Expenses', Icon: ExpenseIcon, show: isManager },
    { path: '/customers', label: 'Customers', Icon: CustomerIcon, show: isManager },
    { path: '/bulk-orders', label: 'Bulk Orders', Icon: BulkOrderIcon, show: isManager },
    SECTION_DIVIDER,
    { path: '/reports', label: 'Reports', Icon: ReportsIcon, show: isManager },
    { path: '/products', label: 'Products', Icon: ProductsIcon, show: isAdmin },
    { path: '/branches', label: 'Branches', Icon: BranchIcon, show: isAdmin },
    { path: '/trucks', label: 'Trucks', Icon: TruckIcon, show: isAdmin },
    { path: '/users', label: 'Users', Icon: UsersIcon, show: isAdmin },
    { path: '/media', label: 'Media', Icon: MediaIcon, show: isAdmin },
    { path: '/settings', label: 'Settings', Icon: SettingsIcon, show: isAdmin },
    { path: '/profile', label: 'My Profile', Icon: ProfileIcon },
  ].filter(item => item === null || item.show !== false);
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const nav = buildNav(user?.role);

  return (
    <aside style={{
      width: 224, minHeight: '100vh', background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0,
      transition: 'background 0.2s',
    }}>
      <div style={{ padding: '18px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <img src="/logo_sidebar.svg" alt="InvenTrack" style={{ width: 160, display: 'block' }} />
      </div>

      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {nav.map((item, i) => {
          if (item === null) return (
            <div key={`divider-${i}`} style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 8px' }} />
          );
          const { path, label, Icon } = item;
          return (
            <NavLink key={path} to={path} end={path === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fff' : 'var(--sidebar-text)',
                background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                borderRadius: 9, marginBottom: 2,
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.15s', textDecoration: 'none',
              })}
            >
              <Icon /><span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding: '14px 12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => setDark(d => !d)} style={{
          width: '100%', background: 'rgba(255,255,255,0.06)', color: 'var(--sidebar-text)',
          padding: '8px 12px', borderRadius: 8, fontSize: 12, display: 'flex',
          alignItems: 'center', gap: 8, marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
        }}>
          {dark ? <SunIcon /> : <MoonIcon />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>

        <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 2px', textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {user?.photo
              ? <img src={`data:image/jpeg;base64,${user.photo}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{user?.name?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: 'var(--sidebar-text)', marginTop: 1 }}>{user?.role}</div>
          </div>
        </NavLink>

        <button onClick={handleLogout} style={{
          width: '100%', background: 'rgba(229,57,53,0.1)', color: '#FF7675',
          padding: '8px 12px', borderRadius: 8, fontSize: 12, display: 'flex',
          alignItems: 'center', gap: 8, border: '1px solid rgba(229,57,53,0.18)', cursor: 'pointer',
        }}>
          <LogoutIcon /> Logout
        </button>
      </div>
    </aside>
  );
}
