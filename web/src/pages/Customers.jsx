import { useState, useEffect } from 'react';
import api from '../api/axios';
import Pagination from '../components/Pagination';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const EMPTY_FORM = { name: '', phone: '', email: '', address: '', city: '', gstin: '', notes: '', branchId: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = async (q = '') => {
    setLoading(true);
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : '';
      const [{ data: c }, { data: b }] = await Promise.all([
        api.get(`/customers${params}`),
        api.get('/branches'),
      ]);
      setCustomers(c);
      setBranches(b);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setMsg({ type: '', text: '' });
    setShowForm(true);
    setSelected(null);
  };

  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name || '', phone: c.phone || '', email: c.email || '',
      address: c.address || '', city: c.city || '', gstin: c.gstin || '',
      notes: c.notes || '', branchId: c.branchId || '',
    });
    setMsg({ type: '', text: '' });
    setShowForm(true);
    setSelected(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg({ type: '', text: '' });
    try {
      if (editId) {
        await api.put(`/customers/${editId}`, form);
        setMsg({ type: 'success', text: 'Customer updated!' });
      } else {
        await api.post('/customers', form);
        setMsg({ type: 'success', text: 'Customer created!' });
      }
      setShowForm(false);
      setEditId(null);
      load(search);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this customer?')) return;
    await api.delete(`/customers/${id}`);
    setSelected(null);
    load(search);
  };

  const openDetail = async (id) => {
    const { data } = await api.get(`/customers/${id}`);
    setSelected(data);
    setShowForm(false);
  };

  const f = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  let searchTimer;
  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => load(val), 350);
  };

  const STATUS_COLOR = { INQUIRY: '#6B7280', QUOTATION_SENT: '#7C3AED', CONFIRMED: '#0EA5E9', DELIVERED: '#10B981', PAID: '#10B981', CANCELLED: '#EF4444' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Customers</h1>
          <p>Manage B2B and institutional customers</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New Customer</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Search by name, phone or email…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected || showForm ? '1fr 400px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* List */}
        <div>
          {loading ? <div className="empty-state">Loading…</div> : customers.length === 0 ? (
            <div className="empty-state">No customers found{search ? ` for "${search}"` : ''}</div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr><th>Customer</th><th>Contact</th><th>City</th><th>Orders</th><th></th></tr>
                </thead>
                <tbody>
                  {customers.slice((page - 1) * pageSize, page * pageSize).map(c => (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(c.id)}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        {c.gstin && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>GSTIN: {c.gstin}</div>}
                      </td>
                      <td>
                        {c.phone && <div style={{ fontSize: 13 }}>{c.phone}</div>}
                        {c.email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div>}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.city || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{c._count?.bulkOrders ?? 0}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>orders</span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-secondary btn-sm" onClick={() => openDetail(c.id)}>View</button>
                          <button className="btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} pageSize={pageSize} total={customers.length} onPage={setPage} onPageSize={setPageSize} />
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && !showForm && (
          <div className="card" style={{ position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{selected.name}</div>
                {selected.branch && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selected.branch.name}</div>}
              </div>
              <button className="btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16, fontSize: 13 }}>
              {[
                { label: 'Phone', val: selected.phone },
                { label: 'Email', val: selected.email },
                { label: 'City', val: selected.city },
                { label: 'GSTIN', val: selected.gstin },
              ].map(({ label, val }) => val ? (
                <div key={label}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                  <div style={{ fontWeight: 600, fontFamily: label === 'GSTIN' ? 'monospace' : undefined }}>{val}</div>
                </div>
              ) : null)}
            </div>
            {selected.address && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {selected.address}{selected.city ? `, ${selected.city}` : ''}
              </div>
            )}

            {selected.bulkOrders?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 10 }}>Order History</div>
                {selected.bulkOrders.slice(0, 5).map(o => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>{o.orderNumber}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{fmtDate(o.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700 }}>{fmt(o.totalAmount)}</div>
                      <div style={{ fontSize: 10, color: STATUS_COLOR[o.status] || 'var(--text-muted)', fontWeight: 600 }}>{o.status.replace('_', ' ')}</div>
                    </div>
                  </div>
                ))}
                {selected.bulkOrders.length > 5 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>+{selected.bulkOrders.length - 5} more orders</div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(selected)}>Edit</button>
              <button className="btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleDelete(selected.id)}>Remove</button>
            </div>
          </div>
        )}

        {/* Form Panel */}
        {showForm && (
          <div className="card" style={{ position: 'sticky', top: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              {editId ? 'Edit Customer' : 'New Customer'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input value={form.name} onChange={f('name')} placeholder="Company or person name" required autoFocus />
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={f('phone')} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="text" value={form.email} onChange={f('email')} placeholder="orders@company.com" />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={form.address} onChange={f('address')} placeholder="Street address" />
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>City</label>
                  <input value={form.city} onChange={f('city')} placeholder="Chennai" />
                </div>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input value={form.gstin} onChange={f('gstin')} placeholder="22AAAAA0000A1Z5" maxLength={15} style={{ fontFamily: 'monospace' }} />
                </div>
              </div>
              <div className="form-group">
                <label>Branch</label>
                <select value={form.branchId} onChange={f('branchId')}>
                  <option value="">No branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input value={form.notes} onChange={f('notes')} placeholder="Any notes…" />
              </div>
              {msg.text && <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'} style={{ marginBottom: 10 }}>{msg.text}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
