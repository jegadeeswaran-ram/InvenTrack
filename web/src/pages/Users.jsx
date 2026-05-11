import { useState, useEffect } from 'react';
import api from '../api/axios';

const ROLES = ['SALES', 'BRANCH_MANAGER', 'ADMIN'];
const SALE_TYPES = ['SHOP', 'TRUCK'];

const ROLE_COLORS = {
  ADMIN: '#7C3AED',
  BRANCH_MANAGER: '#0EA5E9',
  SALES: '#10B981',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'SALES', saleType: 'SHOP', truckId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: u }, { data: t }] = await Promise.all([
        api.get('/users'),
        api.get('/trucks'),
      ]);
      setUsers(u);
      setTrucks(t.filter(t => t.isActive));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', username: '', password: '', role: 'SALES', saleType: 'SHOP', truckId: '' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name, username: u.username, password: '',
      role: u.role, saleType: u.saleType || 'SHOP',
      truckId: u.truckId || '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const body = {
        name: form.name, username: form.username, role: form.role,
        ...(form.role === 'SALES' && { saleType: form.saleType }),
        ...(form.role === 'SALES' && form.saleType === 'TRUCK' && { truckId: form.truckId ? parseInt(form.truckId) : null }),
        ...(form.role === 'SALES' && form.saleType !== 'TRUCK' && { truckId: null }),
      };
      if (form.password) body.password = form.password;

      if (editing) {
        await api.put(`/users/${editing.id}`, body);
      } else {
        if (!form.password) { setError('Password is required'); setSaving(false); return; }
        await api.post('/users', body);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving user');
    } finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    try {
      await api.patch(`/users/${u.id}/toggle`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting user');
    }
  };

  const filtered = filterRole ? users.filter(u => u.role === filterRole) : users;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Users</h1>
          <p>Manage user accounts, roles and truck assignments</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New User</button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 200 }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 460, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 20, fontSize: 16 }}>{editing ? 'Edit User' : 'New User'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Full Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Login username" required />
              </div>
              <div className="form-group">
                <label>{editing ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? 'Leave blank to keep current' : 'Set password'} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value, saleType: 'SHOP', truckId: '' })}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {form.role === 'SALES' && (
                <>
                  <div className="form-group">
                    <label>Sale Type</label>
                    <select value={form.saleType} onChange={e => setForm({ ...form, saleType: e.target.value, truckId: '' })}>
                      {SALE_TYPES.map(t => <option key={t} value={t}>{t === 'TRUCK' ? '🚚 Truck' : '🏪 Shop'}</option>)}
                    </select>
                  </div>
                  {form.saleType === 'TRUCK' && (
                    <div className="form-group">
                      <label>Assign Truck</label>
                      <select value={form.truckId} onChange={e => setForm({ ...form, truckId: e.target.value })}>
                        <option value="">— No truck assigned —</option>
                        {trucks.map(t => <option key={t.id} value={t.id}>{t.name}{t.branch ? ` (${t.branch.name})` : ''}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}
              {error && <p className="error-msg">{error}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No users found</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>User</th><th>Role</th><th>Sale Type</th><th>Truck</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.55 }}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 6,
                      fontSize: 11, fontWeight: 600,
                      background: (ROLE_COLORS[u.role] || '#6B7280') + '22',
                      color: ROLE_COLORS[u.role] || '#6B7280',
                    }}>{u.role}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {u.role === 'SALES' ? (u.saleType === 'TRUCK' ? '🚚 Truck' : '🏪 Shop') : '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {u.truck
                      ? <span style={{ fontWeight: 500 }}>{u.truck.name}</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-healthy' : 'badge-out'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                      <button className="btn-ghost btn-sm" onClick={() => toggleActive(u)}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteUser(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
