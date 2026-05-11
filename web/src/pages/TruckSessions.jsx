import { useState, useEffect } from 'react';
import api from '../api/axios';
import Pagination from '../components/Pagination';

const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const STATUS_COLORS = { OPEN: 'badge-low', CLOSED: 'badge-healthy' };
const noNeg = e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); };

// ── Tab: Sessions List ─────────────────────────────────────────────────────────
function SessionItem({ s, onClose }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Accordion header — always visible */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: 'pointer', gap: 10 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ fontSize: 20 }}>🚚</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{s.truck?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 1 }}>{fmtDate(s.date)} · {s.user?.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{fmt(s.summary?.totalRevenue)}</span>
          <span className={`badge ${STATUS_COLORS[s.status]}`}>{s.status}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 16, transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </div>
      </div>

      {/* Accordion body */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px' }}>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>{fmt(s.summary?.totalRevenue)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profit</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{fmt(s.summary?.totalProfit)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dispatched</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{s.dispatches?.length}</div>
            </div>
          </div>

          {/* Stock summary chips */}
          {s.dispatches?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Stock Summary</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {s.dispatches.map(d => {
                  const soldMap = s.summary?.soldMap || {};
                  const sold = soldMap[d.productId] ?? soldMap[String(d.productId)] ?? 0;
                  const returned = s.returns?.find(r => r.productId === d.productId)?.quantity || 0;
                  return (
                    <div key={d.id} style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>{d.product?.emoji} {d.product?.name?.split(' - ')[0]}</span>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                        Sent {d.quantity} · Sold <span style={{ color: 'var(--success)', fontWeight: 700 }}>{sold}</span>
                        {s.status === 'CLOSED' && ` · Returned ${returned}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Close button for open sessions */}
          {s.status === 'OPEN' && (
            <div style={{ marginTop: 14 }}>
              <button className="btn-primary btn-sm" onClick={e => { e.stopPropagation(); onClose(s); }}>
                🌇 Close Session
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function exportCSV(sessions) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const rows = [];

  rows.push([`Truck Sessions Report - Exported: ${today}`]);
  rows.push([]);
  rows.push(['SESSION SUMMARY']);
  rows.push(['Date', 'Truck', 'Driver', 'Status', 'Products Dispatched', 'Revenue (₹)', 'Profit (₹)']);
  for (const s of sessions) {
    rows.push([
      fmtDate(s.date),
      s.truck?.name || '',
      s.user?.name || '',
      s.status,
      s.dispatches?.length ?? 0,
      Number(s.summary?.totalRevenue || 0).toFixed(2),
      Number(s.summary?.totalProfit || 0).toFixed(2),
    ]);
  }

  rows.push([]);
  rows.push(['PRODUCT DETAILS']);
  rows.push(['Date', 'Truck', 'Driver', 'Status', 'Product', 'Dispatched', 'Sold', 'Returned']);
  for (const s of sessions) {
    for (const d of (s.dispatches || [])) {
      const returned = s.returns?.find(r => r.productId === d.productId)?.quantity || 0;
      const sold = d.quantity - returned;
      rows.push([
        fmtDate(s.date),
        s.truck?.name || '',
        s.user?.name || '',
        s.status,
        d.product?.name || '',
        d.quantity,
        sold,
        returned,
      ]);
    }
  }

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `truck-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function SessionsList({ sessions, trucks, loading, filterTruck, filterStatus, onFilterTruck, onFilterStatus, onClose }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const filtered = sessions.filter(s => {
    const d = new Date(s.date);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  useEffect(() => setPage(1), [filterTruck, filterStatus, dateFrom, dateTo]);

  const pagedSessions = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalRevenue = filtered.reduce((s, x) => s + Number(x.summary?.totalRevenue || 0), 0);
  const totalProfit  = filtered.reduce((s, x) => s + Number(x.summary?.totalProfit  || 0), 0);

  return (
    <div>
      {/* Filters row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <select value={filterTruck} onChange={e => onFilterTruck(e.target.value)} style={{ width: 190 }}>
          <option value="">All Trucks</option>
          {trucks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => onFilterStatus(e.target.value)} style={{ width: 150 }}>
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 150 }} title="From date" />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 150 }} title="To date" />
        </div>
        {(dateFrom || dateTo) && (
          <button className="btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕ Clear dates</button>
        )}
        <button
          className="btn-secondary btn-sm"
          style={{ marginLeft: 'auto' }}
          disabled={filtered.length === 0}
          onClick={() => exportCSV(filtered)}
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Totals strip */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 24, background: 'var(--primary-light)', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 13 }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Sessions: </span><strong>{filtered.length}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Total Revenue: </span><strong style={{ color: 'var(--primary)' }}>₹{totalRevenue.toFixed(2)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Total Profit: </span><strong style={{ color: 'var(--success)' }}>₹{totalProfit.toFixed(2)}</strong></div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No sessions found</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pagedSessions.map(s => (
              <SessionItem key={s.id} s={s} onClose={onClose} />
            ))}
          </div>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} pageSizeOptions={[5, 10, 20]} />
        </>
      )}
    </div>
  );
}

// ── Tab: Start Session ─────────────────────────────────────────────────────────
function StartSession({ trucks, products, onSuccess }) {
  const [form, setForm] = useState({ truckId: '', items: [{ productId: '', quantity: '' }] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setItem = (i, field, val) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: val };
    return { ...f, items };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post('/truck-sessions/start', {
        truckId: form.truckId,
        dispatches: form.items.filter(x => x.productId && x.quantity),
      });
      setSuccess('Session started! Truck is dispatched. 🚚');
      setForm({ truckId: '', items: [{ productId: '', quantity: '' }] });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error starting session');
    } finally { setSaving(false); }
  };

  const activeTrucks = trucks.filter(t => t.isActive);

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, background: 'var(--primary-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌅</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Morning Dispatch</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Load stock onto a truck to start the day</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Truck selector */}
          <div className="form-group">
            <label>Select Truck</label>
            {activeTrucks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active trucks. Add trucks first.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {activeTrucks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setForm(f => ({ ...f, truckId: String(t.id) }))}
                    style={{
                      border: `2px solid ${form.truckId === String(t.id) ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                      background: form.truckId === String(t.id) ? 'var(--primary-light)' : 'var(--bg)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>🚚</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.branch?.name}</div>
                    {t.plateNumber && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t.plateNumber}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock items */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📦 Stock to Load</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>— products being dispatched today</span>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14 }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 36px', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Product</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Quantity</div>
                <div />
              </div>

              {form.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 36px', gap: 8, marginBottom: 8 }}>
                  <select
                    value={item.productId}
                    onChange={e => setItem(i, 'productId', e.target.value)}
                    required
                  >
                    <option value="">Select product…</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.emoji} {p.name} — {p.inHand > 0 ? `${p.inHand} available` : 'Out of stock'}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="0"
                    value={item.quantity}
                    onChange={e => setItem(i, 'quantity', e.target.value)}
                    onKeyDown={noNeg}
                    min="1"
                    required
                  />
                  {form.items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      style={{ background: 'var(--danger)', color: '#fff', borderRadius: 8, padding: 0, fontSize: 18, lineHeight: 1 }}
                    >×</button>
                  ) : <div />}
                </div>
              ))}

              <button type="button" className="btn-ghost btn-sm" onClick={addItem} style={{ marginTop: 4 }}>
                + Add Product
              </button>
            </div>
          </div>

          {/* Summary */}
          {form.items.some(i => i.productId && i.quantity) && (
            <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: '12px 16px', marginTop: 16, display: 'flex', gap: 24, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Products: </span>
                <strong>{form.items.filter(i => i.productId).length}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total units: </span>
                <strong>{form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0)}</strong>
              </div>
            </div>
          )}

          {error && <p className="error-msg" style={{ marginTop: 12 }}>{error}</p>}
          {success && <p className="success-msg" style={{ marginTop: 12 }}>{success}</p>}

          <div style={{ marginTop: 20 }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || !form.truckId}
              style={{ padding: '11px 28px', fontSize: 14 }}
            >
              {saving ? 'Dispatching…' : '🚚 Dispatch Truck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tab: Close Session ─────────────────────────────────────────────────────────
function CloseSession({ sessions, onSuccess }) {
  const [selected, setSelected] = useState(null);
  const [closeItems, setCloseItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openSessions = sessions.filter(s => s.status === 'OPEN');

  const selectSession = (s) => {
    setSelected(s);
    setCloseItems(s.dispatches.map(d => ({
      productId: d.productId,
      productName: d.product?.name || '',
      emoji: d.product?.emoji || '🍦',
      dispatched: d.quantity,
      quantity: '',
    })));
    setError(''); setSuccess('');
  };

  const soldQty = (item) => {
    const ret = parseFloat(item.quantity) || 0;
    return Math.max(0, item.dispatched - ret);
  };

  const handleClose = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.put(`/truck-sessions/${selected.id}/close`, {
        returns: closeItems
          .filter(x => x.quantity !== '')
          .map(x => ({ productId: x.productId, quantity: parseFloat(x.quantity) })),
      });
      setSuccess(`Session for ${selected.truck?.name} closed successfully! 🌇`);
      setSelected(null);
      setCloseItems([]);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error closing session');
    } finally { setSaving(false); }
  };

  if (openSessions.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>All Sessions Closed</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No open truck sessions to close right now.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700 }}>
      {success && <p className="success-msg" style={{ marginBottom: 16 }}>{success}</p>}

      {/* Open sessions to select */}
      {!selected && (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Open Sessions — Select to Close
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {openSessions.map(s => (
              <div
                key={s.id}
                className="card"
                onClick={() => selectSession(s)}
                style={{ cursor: 'pointer', borderLeft: '4px solid var(--warning)', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--card-shadow)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>🚚 {s.truck?.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                      {fmtDate(s.date)} · {s.user?.name} · {s.dispatches?.length} products loaded
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="badge badge-low">OPEN</span>
                    <span style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>Select →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close form */}
      {selected && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, background: '#FFF3E0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌇</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Close — 🚚 {selected.truck?.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Enter stock being returned to branch</div>
                </div>
              </div>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => setSelected(null)}>← Back</button>
          </div>

          {/* Table of products */}
          <div style={{ background: 'var(--bg)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: 'center' }}>Dispatched</th>
                  <th style={{ textAlign: 'center' }}>Returning</th>
                  <th style={{ textAlign: 'center', color: 'var(--success)' }}>Sold (Auto)</th>
                </tr>
              </thead>
              <tbody>
                {closeItems.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{ marginRight: 6 }}>{item.emoji}</span>
                      <span style={{ fontSize: 12 }}>{item.productName.split(' - ')[0]}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.dispatched}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        max={item.dispatched}
                        value={item.quantity}
                        onChange={e => setCloseItems(prev =>
                          prev.map((x, idx) => idx === i ? { ...x, quantity: e.target.value } : x)
                        )}
                        onKeyDown={noNeg}
                        style={{ width: 80, textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success)' }}>
                      {item.quantity !== '' ? soldQty(item) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary row */}
          {closeItems.some(i => i.quantity !== '') && (
            <div style={{ display: 'flex', gap: 24, padding: '12px 16px', background: 'var(--primary-light)', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Returning: </span>
                <strong>{closeItems.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Sold: </span>
                <strong style={{ color: 'var(--success)' }}>{closeItems.reduce((s, i) => s + soldQty(i), 0)}</strong>
              </div>
            </div>
          )}

          {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

          <button
            className="btn-primary"
            disabled={saving}
            onClick={handleClose}
            style={{ padding: '11px 28px', fontSize: 14 }}
          >
            {saving ? 'Closing…' : '🌇 Close Session & Record Returns'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TruckSessions() {
  const [tab, setTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTruck, setFilterTruck] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTruck) params.set('truckId', filterTruck);
      if (filterStatus) params.set('status', filterStatus);
      const [{ data: s }, { data: t }, { data: p }, { data: stock }] = await Promise.all([
        api.get(`/truck-sessions?${params}`),
        api.get('/trucks'),
        api.get('/products'),
        api.get('/reports/stock'),
      ]);
      setSessions(s);
      setTrucks(t);
      const stockMap = Object.fromEntries(stock.map(x => [x.productId, x.inHand]));
      setProducts(p.filter(x => x.isActive).map(x => ({ ...x, inHand: stockMap[x.id] ?? 0 })));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterTruck, filterStatus]);

  const openCount = sessions.filter(s => s.status === 'OPEN').length;

  const handleCloseFromList = (session) => {
    setTab('close');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Truck Sessions</h1>
        <p>Morning dispatch and evening return management</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')}>
          📋 Sessions
          {sessions.length > 0 && (
            <span style={{ marginLeft: 6, background: 'var(--primary)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
              {sessions.length}
            </span>
          )}
        </button>
        <button className={`tab-btn ${tab === 'start' ? 'active' : ''}`} onClick={() => setTab('start')}>
          🌅 Start Day
        </button>
        <button className={`tab-btn ${tab === 'close' ? 'active' : ''}`} onClick={() => setTab('close')}>
          🌇 Close Session
          {openCount > 0 && (
            <span style={{ marginLeft: 6, background: 'var(--warning)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>
              {openCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'sessions' && (
        <SessionsList
          sessions={sessions}
          trucks={trucks}
          loading={loading}
          filterTruck={filterTruck}
          filterStatus={filterStatus}
          onFilterTruck={setFilterTruck}
          onFilterStatus={setFilterStatus}
          onClose={handleCloseFromList}
        />
      )}

      {tab === 'start' && (
        <StartSession
          trucks={trucks}
          products={products}
          onSuccess={() => { load(); setTab('sessions'); }}
        />
      )}

      {tab === 'close' && (
        <CloseSession
          sessions={sessions}
          onSuccess={() => { load(); }}
        />
      )}
    </div>
  );
}
