import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Pagination from '../components/Pagination';
const noNeg = e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); };

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_BADGE = {
  INQUIRY: 'badge-low',
  QUOTATION_SENT: 'badge-admin',
  CONFIRMED: 'badge-sales',
  DELIVERED: 'badge-healthy',
  PAID: 'badge-healthy',
  CANCELLED: 'badge-out',
};

const STATUSES = ['INQUIRY', 'QUOTATION_SENT', 'CONFIRMED', 'DELIVERED', 'PAID', 'CANCELLED'];

const EMPTY_FORM = { customerId: '', customerName: '', customerPhone: '', customerEmail: '', eventDate: '', branchId: '', discount: 0, notes: '', items: [{ productId: '', quantity: '', pricePerUnit: '' }] };

export default function BulkOrders() {
  const navigate = useNavigate();
  const [orders, setOrders]       = useState([]);
  const [branches, setBranches]   = useState([]);
  const [products, setProducts]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // view: 'list' | 'new'
  const [view, setView]           = useState('list');
  const [selected, setSelected]   = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const [form, setForm]           = useState(EMPTY_FORM);
  const [payForm, setPayForm]     = useState({ amount: '', type: 'ADVANCE', notes: '' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterBranch) params.set('branchId', filterBranch);
      const [{ data: o }, { data: b }, { data: p }, { data: stock }, { data: cust }] = await Promise.all([
        api.get(`/bulk-orders?${params}`),
        api.get('/branches'),
        api.get('/products'),
        api.get('/reports/stock'),
        api.get('/customers'),
      ]);
      setOrders(o);
      setBranches(b);
      setCustomers(cust);
      const stockMap = Object.fromEntries(stock.map(x => [x.productId, x.inHand]));
      setProducts(p.filter(x => x.isActive).map(x => ({ ...x, inHand: stockMap[x.id] ?? 0 })));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus, filterBranch]);
  useEffect(() => { setPage(1); }, [filterStatus, filterBranch]);

  // ── form helpers ──────────────────────────────────────────────────────────
  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: '', pricePerUnit: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setItem    = (i, field, val) => setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items }; });

  const calcSubtotal = () => form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.pricePerUnit) || 0), 0);
  const calcTotal    = () => calcSubtotal() * (1 - (parseFloat(form.discount) || 0) / 100);

  const openNew = () => {
    setForm({ ...EMPTY_FORM, branchId: branches[0]?.id || '' });
    setError('');
    setSelected(null);
    setView('new');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/bulk-orders', { ...form, items: form.items.filter(i => i.productId && i.quantity && i.pricePerUnit) });
      setView('list');
      load();
    } catch (err) { setError(err.response?.data?.message || 'Error creating order'); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/bulk-orders/${id}`, { status });
    load();
    if (selected?.id === id) {
      const { data } = await api.get(`/bulk-orders/${id}`);
      setSelected(data);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post(`/bulk-orders/${selected.id}/payments`, payForm);
      setShowPayment(false);
      setPayForm({ amount: '', type: 'ADVANCE', notes: '' });
      load();
      const { data } = await api.get(`/bulk-orders/${selected.id}`);
      setSelected(data);
    } catch (err) { setError(err.response?.data?.message || 'Error adding payment'); }
    finally { setSaving(false); }
  };

  const openDetail = async (id) => {
    const { data } = await api.get(`/bulk-orders/${id}`);
    setSelected(data);
    setShowPayment(false);
    setView('list');
  };

  const pagedOrders = orders.slice((page - 1) * pageSize, page * pageSize);

  // ── New Order form ─────────────────────────────────────────────────────────
  if (view === 'new') {
    return (
      <div>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn-secondary btn-sm" onClick={() => setView('list')}>← Back</button>
          <div>
            <h1>New Bulk Order</h1>
            <p>Create a B2B, event or institutional order</p>
          </div>
        </div>

        <div className="card" style={{ maxWidth: 780 }}>
          <form onSubmit={handleCreate}>
            {/* Customer */}
            <div className="section-title" style={{ marginBottom: 14 }}>Customer Details</div>
            <div className="form-group">
              <label>Existing Customer <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — auto-fills below)</span></label>
              <select value={form.customerId} onChange={e => {
                const cid = e.target.value;
                const cust = customers.find(c => String(c.id) === cid);
                setForm(f => ({ ...f, customerId: cid, customerName: cust?.name || f.customerName, customerPhone: cust?.phone || f.customerPhone, customerEmail: cust?.email || f.customerEmail }));
              }}>
                <option value="">— Select customer or fill manually —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
              </select>
            </div>
            <div className="form-row cols-2">
              <div className="form-group">
                <label>Customer Name *</label>
                <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} placeholder="Name or company" required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} placeholder="customer@email.com" />
            </div>

            {/* Order Info */}
            <div className="section-title" style={{ marginBottom: 14, marginTop: 20 }}>Order Info</div>
            <div className="form-row cols-3">
              <div className="form-group">
                <label>Event Date</label>
                <input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Branch *</label>
                <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} required>
                  <option value="">Select branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Discount %</label>
                <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} min="0" max="100" onKeyDown={noNeg} />
              </div>
            </div>

            {/* Items */}
            <div className="section-title" style={{ marginBottom: 14, marginTop: 20 }}>Order Items</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 32px', gap: 8, marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price / Unit</div>
                <div />
              </div>
              {form.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 110px 32px', gap: 8, marginBottom: 8 }}>
                  <select value={item.productId} onChange={e => setItem(i, 'productId', e.target.value)} required>
                    <option value="">Select product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name} ({p.inHand ?? 0} avail)</option>)}
                  </select>
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} required min="1" onKeyDown={noNeg} />
                  <input type="number" placeholder="₹ / unit" value={item.pricePerUnit} onChange={e => setItem(i, 'pricePerUnit', e.target.value)} required min="0" step="0.01" onKeyDown={noNeg} />
                  {form.items.length > 1
                    ? <button type="button" onClick={() => removeItem(i)} style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer' }}>×</button>
                    : <div />
                  }
                </div>
              ))}
              <button type="button" className="btn-ghost btn-sm" onClick={addItem} style={{ marginTop: 4 }}>+ Add Item</button>
            </div>

            {/* Totals summary */}
            <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 10, padding: '14px 18px', margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: 13 }}>Subtotal: <strong>{fmt(calcSubtotal())}</strong></div>
              <div style={{ fontSize: 13 }}>Discount: <strong>{form.discount || 0}%</strong></div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--primary)' }}>Total: {fmt(calcTotal())}</div>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any special notes…" />
            </div>

            {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-secondary" onClick={() => setView('list')} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 2 }}>
                {saving ? 'Creating…' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Bulk Orders</h1>
          <p>B2B, events, and institutional orders</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ New Order</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 180 }}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ width: 200 }}>
          <option value="">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Orders table */}
        <div>
          {loading ? <div className="empty-state">Loading…</div> : orders.length === 0 ? (
            <div className="empty-state">No bulk orders found</div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr><th>Order #</th><th>Customer</th><th>Event Date</th><th>Branch</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {pagedOrders.map(o => {
                    const balance = o.totalAmount - o.paidAmount;
                    const isActive = selected?.id === o.id;
                    return (
                      <tr key={o.id} style={{ background: isActive ? 'var(--primary-light)' : undefined, cursor: 'pointer' }} onClick={() => openDetail(o.id)}>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{o.orderNumber}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{o.customerPhone}</div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{fmtDate(o.eventDate)}</td>
                        <td style={{ fontSize: 12 }}>{o.branch?.name}</td>
                        <td style={{ fontWeight: 700 }}>{fmt(o.totalAmount)}</td>
                        <td style={{ color: 'var(--success)' }}>{fmt(o.paidAmount)}</td>
                        <td style={{ color: balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{fmt(balance)}</td>
                        <td><span className={`badge ${STATUS_BADGE[o.status]}`}>{o.status.replace('_', ' ')}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            <button
                              className="btn-ghost btn-sm"
                              onClick={() => navigate(`/bulk-orders/${o.id}/document?type=quotation`)}
                              style={{ border: '1.5px solid #7C3AED', color: '#7C3AED', fontSize: 11 }}
                            >Quotation</button>
                            <button
                              className="btn-ghost btn-sm"
                              onClick={() => navigate(`/bulk-orders/${o.id}/document?type=invoice`)}
                              style={{ border: '1.5px solid #0EA5E9', color: '#0EA5E9', fontSize: 11 }}
                            >Invoice</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination page={page} pageSize={pageSize} total={orders.length} onPage={setPage} onPageSize={setPageSize} />
            </div>
          )}
        </div>

        {/* Detail + Payment panel */}
        {selected && (
          <div style={{ position: 'sticky', top: 20 }}>
            <div className="card" style={{ marginBottom: 0 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'monospace' }}>{selected.orderNumber}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{selected.customerName}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{selected.customerPhone}{selected.customerEmail ? ` · ${selected.customerEmail}` : ''}</div>
                </div>
                <button className="btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
              </div>

              {/* Status + quick actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <span className={`badge ${STATUS_BADGE[selected.status]}`} style={{ alignSelf: 'center' }}>{selected.status.replace('_', ' ')}</span>
                {selected.status !== 'PAID' && selected.status !== 'CANCELLED' && (
                  <select
                    value={selected.status}
                    onChange={e => updateStatus(selected.id, e.target.value)}
                    style={{ fontSize: 12, padding: '4px 8px', border: '1.5px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {STATUSES.filter(s => s !== 'CANCELLED').map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                )}
                <button className="btn-primary btn-sm" onClick={() => { setShowPayment(p => !p); setError(''); }}>
                  {showPayment ? 'Cancel Payment' : '+ Add Payment'}
                </button>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => navigate(`/bulk-orders/${selected.id}/document?type=quotation`)}
                  style={{ border: '1.5px solid #7C3AED', color: '#7C3AED' }}
                >Quotation</button>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => navigate(`/bulk-orders/${selected.id}/document?type=invoice`)}
                  style={{ border: '1.5px solid #0EA5E9', color: '#0EA5E9' }}
                >Invoice</button>
              </div>

              {/* Payment form inline */}
              {showPayment && (
                <form onSubmit={handleAddPayment} style={{ background: 'var(--surface)', borderRadius: 10, padding: '14px 16px', marginBottom: 16, border: '1px solid var(--primary)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--primary)' }}>Add Payment</div>
                  <div className="form-row cols-2">
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label>Amount (₹)</label>
                      <input type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required min="1" onKeyDown={noNeg} autoFocus />
                    </div>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label>Type</label>
                      <select value={payForm.type} onChange={e => setPayForm({ ...payForm, type: e.target.value })}>
                        <option value="ADVANCE">Advance</option>
                        <option value="BALANCE">Balance</option>
                        <option value="FULL">Full Payment</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label>Notes</label>
                    <input value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Optional notes" />
                  </div>
                  {error && <p className="error-msg" style={{ marginBottom: 8 }}>{error}</p>}
                  <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%' }}>
                    {saving ? 'Saving…' : 'Save Payment'}
                  </button>
                </form>
              )}

              {/* Order details */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, flexWrap: 'wrap' }}>
                  {selected.eventDate && <span>Event: <strong style={{ color: 'var(--text)' }}>{fmtDate(selected.eventDate)}</strong></span>}
                  {selected.branch?.name && <span>Branch: <strong style={{ color: 'var(--text)' }}>{selected.branch.name}</strong></span>}
                </div>

                <div className="section-title" style={{ marginBottom: 8 }}>Items</div>
                <table style={{ fontSize: 13 }}>
                  <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {selected.items?.map(item => (
                      <tr key={item.id}>
                        <td>{item.product?.emoji} {item.product?.name}</td>
                        <td>{item.quantity}</td>
                        <td>{fmt(item.pricePerUnit)}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', marginTop: 8, fontSize: 13 }}>
                  {selected.discount > 0 && <div style={{ color: 'var(--text-muted)' }}>Discount: {selected.discount}%</div>}
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)', marginTop: 4 }}>Total: {fmt(selected.totalAmount)}</div>
                </div>
              </div>

              {/* Payments */}
              <div>
                <div className="section-title" style={{ marginBottom: 8 }}>Payments</div>
                {selected.payments?.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>No payments yet</div>
                ) : (
                  <table style={{ fontSize: 12 }}>
                    <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Notes</th></tr></thead>
                    <tbody>
                      {selected.payments?.map(p => (
                        <tr key={p.id}>
                          <td>{fmtDate(p.paidAt)}</td>
                          <td><span className="badge badge-admin" style={{ fontSize: 10 }}>{p.type}</span></td>
                          <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(p.amount)}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div style={{ marginTop: 10, fontWeight: 700, fontSize: 14, color: (selected.totalAmount - selected.paidAmount) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  Balance: {fmt(selected.totalAmount - selected.paidAmount)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
