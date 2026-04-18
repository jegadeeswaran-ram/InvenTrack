import { useState, useEffect } from 'react';
import api from '../api/axios';

function today() { return new Date().toISOString().split('T')[0]; }

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: 520, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function PurchaseEntry() {
  const [products, setProducts] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [purchases, setPurchases] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [form, setForm] = useState({ date: today(), productId: '', manufacturer: '', quantity: '', costPerUnit: '', notes: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });
  const [editLoading, setEditLoading] = useState(false);

  const totalCost = form.quantity && form.costPerUnit
    ? (parseFloat(form.quantity) * parseFloat(form.costPerUnit)).toFixed(2) : '0.00';

  const editTotal = editForm.quantity && editForm.costPerUnit
    ? (parseFloat(editForm.quantity) * parseFloat(editForm.costPerUnit)).toFixed(2) : '0.00';

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data));
    api.get('/reports/stock').then(r => {
      const map = {};
      r.data.forEach(p => { map[p.productId] = p.avgCostPerUnit; });
      setStockMap(map);
    });
    loadPurchases();
    const interval = setInterval(() => loadPurchases(dateFilter), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPurchases = async (date = '') => {
    const url = date ? `/purchases?date=${date}` : '/purchases';
    const r = await api.get(url);
    setPurchases(r.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setLoading(true);
    try {
      await api.post('/purchases', { ...form, quantity: parseFloat(form.quantity), costPerUnit: parseFloat(form.costPerUnit) });
      setMsg({ type: 'success', text: 'Purchase entry saved!' });
      setForm({ date: today(), productId: '', manufacturer: '', quantity: '', costPerUnit: '', notes: '' });
      loadPurchases(dateFilter);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error saving purchase' });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (p) => {
    setEditItem(p);
    setEditForm({
      date: new Date(p.date).toISOString().split('T')[0],
      productId: String(p.productId),
      manufacturer: p.manufacturer,
      quantity: String(p.quantity),
      costPerUnit: String(p.costPerUnit),
      notes: p.notes || '',
    });
    setEditMsg({ type: '', text: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMsg({ type: '', text: '' });
    try {
      await api.put(`/purchases/${editItem.id}`, { ...editForm, quantity: parseFloat(editForm.quantity), costPerUnit: parseFloat(editForm.costPerUnit) });
      setEditMsg({ type: 'success', text: 'Updated!' });
      setEditItem(null);
      loadPurchases(dateFilter);
    } catch (err) {
      setEditMsg({ type: 'error', text: err.response?.data?.message || 'Error updating' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this purchase entry?')) return;
    await api.delete(`/purchases/${id}`);
    loadPurchases(dateFilter);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Purchase Entry</h1>
        <p>Record stock purchased from manufacturer</p>
      </div>

      {/* New Purchase Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">New Purchase</div>
        <form onSubmit={handleSubmit}>
          <div className="form-row cols-3">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Product</label>
              <select value={form.productId} onChange={e => {
                const id = e.target.value;
                const avg = stockMap[parseInt(id)];
                setForm({ ...form, productId: id, costPerUnit: avg ? avg.toFixed(2) : form.costPerUnit });
              }} required>
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Manufacturer</label>
              <input placeholder="Manufacturer name" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} required />
            </div>
          </div>
          <div className="form-row cols-3">
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" min="0" step="any" placeholder="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Cost per Unit (₹)</label>
              <input type="number" min="0" step="any" placeholder="0.00" value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Total Cost</label>
              <input readOnly value={`₹ ${totalCost}`} style={{ background: 'var(--th-bg)', fontWeight: 600, color: 'var(--primary)' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <input placeholder="Any notes…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          {msg.text && <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'}>{msg.text}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save Purchase'}</button>
        </form>
      </div>

      {/* History */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="section-title" style={{ margin: 0 }}>Purchase History</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost btn-sm" onClick={() => loadPurchases(dateFilter)} title="Refresh">⟳ Refresh</button>
            <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); loadPurchases(e.target.value); }} style={{ width: 160 }} />
            {dateFilter && <button className="btn-ghost btn-sm" onClick={() => { setDateFilter(''); loadPurchases(''); }}>Clear</button>}
          </div>
        </div>
        {purchases.length === 0 ? (
          <p className="empty-state">No purchases found</p>
        ) : (
          <table>
            <thead>
              <tr><th>Date</th><th>Product</th><th>Manufacturer</th><th>Qty</th><th>Cost/Unit</th><th>Total</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.date).toLocaleDateString('en-IN')}</td>
                  <td>{p.product?.name}</td>
                  <td>{p.manufacturer}</td>
                  <td>{p.quantity}</td>
                  <td>₹{p.costPerUnit}</td>
                  <td style={{ fontWeight: 600 }}>₹{p.totalCost.toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ghost btn-sm" onClick={() => setViewItem(p)}>View</button>
                      <button className="btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Modal */}
      {viewItem && (
        <Modal title="Purchase Details" onClose={() => setViewItem(null)}>
          <table style={{ width: '100%' }}>
            <tbody>
              {[
                ['Date', new Date(viewItem.date).toLocaleDateString('en-IN')],
                ['Product', viewItem.product?.name],
                ['Manufacturer', viewItem.manufacturer],
                ['Quantity', viewItem.quantity],
                ['Cost per Unit', `₹${viewItem.costPerUnit}`],
                ['Total Cost', `₹${viewItem.totalCost.toFixed(2)}`],
                ['Notes', viewItem.notes || '—'],
                ['Created', new Date(viewItem.createdAt).toLocaleString('en-IN')],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: '8px 12px 8px 0', color: 'var(--text-muted)', width: 140, verticalAlign: 'top' }}>{k}</td>
                  <td style={{ padding: '8px 0', fontWeight: 500 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setViewItem(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editItem && (
        <Modal title="Edit Purchase" onClose={() => setEditItem(null)}>
          <form onSubmit={handleEditSubmit}>
            <div className="form-row cols-2">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Product</label>
                <select value={editForm.productId} onChange={e => setEditForm({ ...editForm, productId: e.target.value })} required>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Manufacturer</label>
              <input value={editForm.manufacturer} onChange={e => setEditForm({ ...editForm, manufacturer: e.target.value })} required />
            </div>
            <div className="form-row cols-3">
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" min="0" step="any" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Cost per Unit (₹)</label>
                <input type="number" min="0" step="any" value={editForm.costPerUnit} onChange={e => setEditForm({ ...editForm, costPerUnit: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Total Cost</label>
                <input readOnly value={`₹ ${editTotal}`} style={{ background: 'var(--th-bg)', fontWeight: 600, color: 'var(--primary)' }} />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
            {editMsg.text && <p className={editMsg.type === 'success' ? 'success-msg' : 'error-msg'}>{editMsg.text}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={editLoading}>{editLoading ? 'Saving…' : 'Update Purchase'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
