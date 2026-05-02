import { useState, useEffect } from 'react';
import api from '../api/axios';

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', emoji: '🍦' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = () => api.get('/products').then(r => setProducts(r.data));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await api.post('/products', form);
      setMsg({ type: 'success', text: 'Product added!' });
      setForm({ name: '', emoji: '🍦' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    await api.delete(`/products/${id}`);
    load();
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Add Product</div>
        <form onSubmit={handleAdd}>
          <div className="form-row cols-3">
            <div className="form-group">
              <label>Product Name</label>
              <input placeholder="e.g. Chocolate Bar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Emoji</label>
              <input placeholder="🍫" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} required />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Add Product</button>
            </div>
          </div>
          {msg.text && <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'}>{msg.text}</p>}
        </form>
      </div>

      <div className="card">
        <div className="section-title">Active Products</div>
        <table>
          <thead><tr><th>Name</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                <td><button className="btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Deactivate</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'SALES' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = () => api.get('/users').then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await api.post('/users', form);
      setMsg({ type: 'success', text: 'User created!' });
      setForm({ name: '', username: '', password: '', role: 'SALES' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error' });
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Add User</div>
        <form onSubmit={handleAdd}>
          <div className="form-row cols-2">
            <div className="form-group">
              <label>Full Name</label>
              <input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input placeholder="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="SALES">SALES</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          {msg.text && <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'}>{msg.text}</p>}
          <button type="submit" className="btn-primary">Create User</button>
        </form>
      </div>

      <div className="card">
        <div className="section-title">All Users</div>
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.username}</td>
                <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-healthy' : 'badge-out'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    className={u.isActive ? 'btn-danger btn-sm' : 'btn-ghost btn-sm'}
                    onClick={() => handleToggle(u.id)}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState('products');
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage products and users</p>
      </div>
      <div className="tabs">
        <button className={`tab-btn${tab === 'products' ? ' active' : ''}`} onClick={() => setTab('products')}>Products</button>
        <button className={`tab-btn${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>Users</button>
      </div>
      {tab === 'products' && <ProductsTab />}
      {tab === 'users' && <UsersTab />}
    </div>
  );
}
