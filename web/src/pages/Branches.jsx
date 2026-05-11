import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/branches');
      setBranches(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', location: '' }); setError(''); setShowForm(true); };
  const openEdit = (b) => { setEditing(b); setForm({ name: b.name, location: b.location }); setError(''); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) {
        await api.put(`/branches/${editing.id}`, form);
      } else {
        await api.post('/branches', form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving branch');
    } finally { setSaving(false); }
  };

  const toggleActive = async (b) => {
    await api.put(`/branches/${b.id}`, { ...b, isActive: !b.isActive });
    load();
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Branches</h1>
          <p>Manage your business branches and locations</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New Branch</button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 420, padding: 28 }}>
            <h3 style={{ marginBottom: 20, fontSize: 16 }}>{editing ? 'Edit Branch' : 'New Branch'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Branch Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Branch" required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Chennai - Headquarters" />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {branches.map(b => (
            <div key={b.id} className="card" style={{ borderLeft: `4px solid ${b.isActive ? 'var(--primary)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>{b.location || '—'}</div>
                </div>
                <span className={`badge ${b.isActive ? 'badge-healthy' : 'badge-out'}`}>{b.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{b._count?.users ?? 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Users</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{b._count?.trucks ?? 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Trucks</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn-secondary btn-sm" onClick={() => openEdit(b)}>Edit</button>
                <button className="btn-ghost btn-sm" onClick={() => toggleActive(b)}>{b.isActive ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
