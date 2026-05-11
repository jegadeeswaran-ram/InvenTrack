import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Trucks() {
  const [trucks, setTrucks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [drivers, setDrivers] = useState([]); // SALES + TRUCK users
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', plateNumber: '', branchId: '', driverId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterBranch, setFilterBranch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: t }, { data: b }, { data: u }] = await Promise.all([
        api.get('/trucks'),
        api.get('/branches'),
        api.get('/users'),
      ]);
      setTrucks(t);
      setBranches(b);
      setDrivers(u.filter(u => u.saleType === 'TRUCK'));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', plateNumber: '', branchId: branches[0]?.id || '', driverId: '' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (t) => {
    const driver = drivers.find(d => d.truckId === t.id);
    setEditing(t);
    setForm({ name: t.name, plateNumber: t.plateNumber || '', branchId: t.branchId, driverId: driver?.id || '' });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      let savedTruck;
      if (editing) {
        const { data } = await api.put(`/trucks/${editing.id}`, {
          name: form.name, plateNumber: form.plateNumber, branchId: form.branchId,
        });
        savedTruck = data;
      } else {
        const { data } = await api.post('/trucks', {
          name: form.name, plateNumber: form.plateNumber, branchId: form.branchId,
        });
        savedTruck = data;
      }

      // Update driver assignment: clear old driver, assign new one
      const prevDriver = drivers.find(d => d.truckId === savedTruck.id);
      const newDriverId = form.driverId ? parseInt(form.driverId) : null;

      if (prevDriver && prevDriver.id !== newDriverId) {
        await api.put(`/users/${prevDriver.id}`, { truckId: null });
      }
      if (newDriverId && newDriverId !== prevDriver?.id) {
        await api.put(`/users/${newDriverId}`, { truckId: savedTruck.id });
      }

      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving truck');
    } finally { setSaving(false); }
  };

  const toggleActive = async (t) => {
    await api.put(`/trucks/${t.id}`, { ...t, isActive: !t.isActive });
    load();
  };

  const filtered = filterBranch ? trucks.filter(t => t.branchId === parseInt(filterBranch)) : trucks;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Trucks</h1>
          <p>Manage ice cream trucks and driver assignments</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New Truck</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ width: 220 }}>
          <option value="">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 460, padding: 28 }}>
            <h3 style={{ marginBottom: 20, fontSize: 16 }}>{editing ? 'Edit Truck' : 'New Truck'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Truck Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Truck 1" required />
              </div>
              <div className="form-group">
                <label>Plate Number</label>
                <input value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} placeholder="e.g. TN01AB1234" />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} required>
                  <option value="">Select branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Assigned Driver</label>
                <select value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })}>
                  <option value="">— No driver —</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} (@{d.username}){d.truckId && d.truckId !== editing?.id ? ' ⚠ assigned elsewhere' : ''}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Only users with Sale Type = Truck are shown
                </span>
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
      ) : filtered.length === 0 ? (
        <div className="empty-state">No trucks found</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Truck</th><th>Plate</th><th>Branch</th><th>Driver</th><th>Status</th><th>Sessions</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const driver = drivers.find(d => d.truckId === t.id);
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>🚚 {t.name}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{t.plateNumber || '—'}</td>
                    <td>{t.branch?.name}</td>
                    <td style={{ fontSize: 13 }}>
                      {driver
                        ? <span>{driver.name} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>@{driver.username}</span></span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>— Unassigned —</span>
                      }
                    </td>
                    <td><span className={`badge ${t.isActive ? 'badge-healthy' : 'badge-out'}`}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>{t._count?.sessions ?? 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary btn-sm" onClick={() => openEdit(t)}>Edit</button>
                        <button className="btn-ghost btn-sm" onClick={() => toggleActive(t)}>{t.isActive ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
