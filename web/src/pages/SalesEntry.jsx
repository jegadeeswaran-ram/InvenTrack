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

function packetLabel(product) {
  if (!product) return 'Packets';
  const n = product.name || '';
  if (n.includes('Stick')) return 'Packets (1 pkt = 6 pcs)';
  if (n.includes('Plate')) return 'Packets (1 pkt = 16 pcs)';
  if (n.includes('Pot'))   return 'Boxes (1 box = 12 pcs)';
  return `Packets (1 pkt = ${product.piecesPerPacket ?? 1} pcs)`;
}

function packetsDisplay(item) {
  const qty = item.quantity;
  const ppc = item.product?.piecesPerPacket ?? 1;
  if (ppc <= 1) return `${qty} pcs`;
  const pkts = qty / ppc;
  return `${Number.isInteger(pkts) ? pkts : pkts.toFixed(1)} pkts (${qty} pcs)`;
}

export default function SalesEntry() {
  const [products, setProducts] = useState([]);
  const [sales, setSales]       = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [form, setForm] = useState({ date: today(), productId: '', quantity: '', pricePerUnit: '', notes: '' });
  const [msg, setMsg]   = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const [viewItem, setViewItem]   = useState(null);
  const [editItem, setEditItem]   = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [editMsg, setEditMsg]     = useState({ type: '', text: '' });
  const [editLoading, setEditLoading] = useState(false);

  const pieces = parseFloat(form.quantity) || 0;
  const totalRevenue = pieces && form.pricePerUnit ? (pieces * parseFloat(form.pricePerUnit)).toFixed(2) : '0.00';

  const editPieces  = parseFloat(editForm.quantity) || 0;
  const editRevenue = editPieces && editForm.pricePerUnit ? (editPieces * parseFloat(editForm.pricePerUnit)).toFixed(2) : '0.00';

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data));
    loadSales();
    const interval = setInterval(() => loadSales(dateFilter), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSales = async (date = '') => {
    const r = await api.get(date ? `/sales?date=${date}` : '/sales');
    setSales(r.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setLoading(true);
    try {
      await api.post('/sales', {
        date: form.date,
        productId: parseInt(form.productId),
        quantity: parseFloat(form.quantity),
        pricePerUnit: parseFloat(form.pricePerUnit),
        notes: form.notes || null,
      });
      setMsg({ type: 'success', text: 'Sale entry saved!' });
      setForm({ date: today(), productId: '', quantity: '', pricePerUnit: '', notes: '' });
      loadSales(dateFilter);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error saving sale' });
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (s) => {
    setEditItem(s);
    setEditForm({
      date: new Date(s.date).toISOString().split('T')[0],
      productId: String(s.productId),
      quantity: String(s.quantity),
      pricePerUnit: String(s.pricePerUnit),
      notes: s.notes || '',
    });
    setEditMsg({ type: '', text: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditMsg({ type: '', text: '' });
    try {
      await api.put(`/sales/${editItem.id}`, {
        date: editForm.date,
        productId: parseInt(editForm.productId),
        quantity: parseFloat(editForm.quantity),
        pricePerUnit: parseFloat(editForm.pricePerUnit),
        notes: editForm.notes || null,
      });
      setEditMsg({ type: 'success', text: 'Updated!' });
      setEditItem(null);
      loadSales(dateFilter);
    } catch (err) {
      setEditMsg({ type: 'error', text: err.response?.data?.message || 'Error updating' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sale entry?')) return;
    await api.delete(`/sales/${id}`);
    loadSales(dateFilter);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Sales Entry</h1>
        <p>Record end-of-day sales</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title">New Sale</div>
        <form onSubmit={handleSubmit}>
          <div className="form-row cols-3">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Product</label>
              <select value={form.productId} onChange={e => {
                const p = products.find(p => String(p.id) === e.target.value);
                setForm({ ...form, productId: e.target.value, quantity: '', pricePerUnit: p ? String(p.sellingPrice) : form.pricePerUnit });
              }} required>
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Pieces</label>
              <input type="number" min="0" step="any" placeholder="0" value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })} required />
            </div>
          </div>
          <div className="form-row cols-3">
            <div className="form-group">
              <label>Price per Piece (₹)</label>
              <input type="number" min="0" step="any" placeholder="0.00" value={form.pricePerUnit}
                onChange={e => setForm({ ...form, pricePerUnit: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Total Revenue</label>
              <input readOnly value={`₹ ${totalRevenue}`} style={{ background: 'var(--th-bg)', fontWeight: 600, color: 'var(--success)' }} />
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <input placeholder="Any notes…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          {msg.text && <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'}>{msg.text}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save Sale'}</button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="section-title" style={{ margin: 0 }}>Sales History</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost btn-sm" onClick={() => loadSales(dateFilter)} title="Refresh">⟳ Refresh</button>
            <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); loadSales(e.target.value); }} style={{ width: 160 }} />
            {dateFilter && <button className="btn-ghost btn-sm" onClick={() => { setDateFilter(''); loadSales(''); }}>Clear</button>}
          </div>
        </div>
        {sales.length === 0 ? (
          <p className="empty-state">No sales found</p>
        ) : (
          <table>
            <thead>
              <tr><th>Date</th><th>Product</th><th>Sold by</th><th>Pieces</th><th>Price/Pc</th><th>Revenue</th><th>Profit</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.date).toLocaleDateString('en-IN')}</td>
                  <td>{s.product?.name}</td>
                  <td>{s.user?.name}</td>
                  <td>{s.quantity}</td>
                  <td>₹{s.pricePerUnit}</td>
                  <td>₹{s.totalRevenue.toFixed(2)}</td>
                  <td style={{ fontWeight: 600, color: s.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{s.profit.toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-ghost btn-sm" onClick={() => setViewItem(s)}>View</button>
                      <button className="btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewItem && (
        <Modal title="Sale Details" onClose={() => setViewItem(null)}>
          <table style={{ width: '100%' }}>
            <tbody>
              {[
                ['Date',          new Date(viewItem.date).toLocaleDateString('en-IN')],
                ['Product',       viewItem.product?.name],
                ['Sold By',       viewItem.user?.name],
                ['Pieces',        viewItem.quantity],
                ['Price per Piece', `₹${viewItem.pricePerUnit}`],
                ['Total Revenue', `₹${viewItem.totalRevenue.toFixed(2)}`],
                ['Avg Cost/Pc',   `₹${viewItem.avgCostUnit?.toFixed(2)}`],
                ['Profit',        `₹${viewItem.profit?.toFixed(2)}`],
                ['Notes',         viewItem.notes || '—'],
                ['Created',       new Date(viewItem.createdAt).toLocaleString('en-IN')],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ padding: '8px 12px 8px 0', color: 'var(--text-muted)', width: 150, verticalAlign: 'top' }}>{k}</td>
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

      {editItem && (
        <Modal title="Edit Sale" onClose={() => setEditItem(null)}>
          <form onSubmit={handleEditSubmit}>
            <div className="form-row cols-2">
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Product</label>
                <select value={editForm.productId} onChange={e => {
                  const p = products.find(p => String(p.id) === e.target.value);
                  setEditForm({ ...editForm, productId: e.target.value, pricePerUnit: p ? String(p.sellingPrice) : editForm.pricePerUnit });
                }} required>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row cols-3">
              <div className="form-group">
                <label>Pieces</label>
                <input type="number" min="0" step="any" value={editForm.quantity}
                  onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Price per Piece (₹)</label>
                <input type="number" min="0" step="any" value={editForm.pricePerUnit}
                  onChange={e => setEditForm({ ...editForm, pricePerUnit: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Total Revenue</label>
                <input readOnly value={`₹ ${editRevenue}`} style={{ background: 'var(--th-bg)', fontWeight: 600, color: 'var(--success)' }} />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
            {editMsg.text && <p className={editMsg.type === 'success' ? 'success-msg' : 'error-msg'}>{editMsg.text}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={editLoading}>{editLoading ? 'Saving…' : 'Update Sale'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
