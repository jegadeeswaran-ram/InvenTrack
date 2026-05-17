import { useState, useEffect } from 'react';
import api from '../api/axios';
import Pagination from '../components/Pagination';

const fmt     = (n) => `₹${Number(n || 0).toFixed(2)}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const noNeg   = (e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); };

const STATUS_META = {
  OPEN:   { cls: 'badge-low',     label: 'OPEN'   },
  CLOSED: { cls: 'badge-healthy', label: 'CLOSED' },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const TruckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2"/>
    <path d="M16 8h4l3 5v3h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display:'block' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const BoxIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

// ── Session accordion card ─────────────────────────────────────────────────────
function SessionItem({ s, onClose, idx }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[s.status] || STATUS_META.CLOSED;

  return (
    <div className="ts-session-card" style={{ animationDelay: `${idx * 45}ms` }}>
      {/* Header */}
      <div className="ts-session-hd" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: s.status === 'OPEN' ? 'rgba(251,140,0,0.12)' : 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: s.status === 'OPEN' ? 'var(--warning)' : 'var(--primary)',
            transition: 'background 0.2s',
          }}>
            <TruckIcon />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{s.truck?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              {fmtDate(s.date)} · {s.user?.name}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{fmt(s.summary?.totalRevenue)}</span>
          <span className={`badge ${meta.cls}`}>{meta.label}</span>
          <div style={{ color: 'var(--text-muted)' }}><ChevronIcon open={open} /></div>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="ts-session-body">
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Revenue',    value: fmt(s.summary?.totalRevenue), color: 'var(--primary)' },
              { label: 'Profit',     value: fmt(s.summary?.totalProfit),  color: 'var(--success)' },
              { label: 'Dispatched', value: s.dispatches?.length,          color: 'var(--text)' },
            ].map((st, i) => (
              <div key={i} className="ts-stat-box">
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600, marginBottom: 6 }}>
                  {st.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: st.color, lineHeight: 1 }}>{st.value}</div>
              </div>
            ))}
          </div>

          {/* Stock chips */}
          {s.dispatches?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>
                Stock Summary
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {s.dispatches.map((d, ci) => {
                  const soldMap  = s.summary?.soldMap || {};
                  const sold     = soldMap[d.productId] ?? soldMap[String(d.productId)] ?? 0;
                  const returned = s.returns?.find(r => r.productId === d.productId)?.quantity || 0;
                  return (
                    <div key={d.id} className="ts-chip" style={{ animationDelay: `${ci * 40}ms` }}>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {d.product?.emoji} {d.product?.name?.split(' - ')[0]}
                      </span>
                      <span style={{ color: 'var(--text-muted)', marginTop: 2, fontSize: 11 }}>
                        Sent {d.quantity} · Sold{' '}
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>{sold}</span>
                        {s.status === 'CLOSED' && ` · Returned ${returned}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Close button */}
          {s.status === 'OPEN' && (
            <div style={{ marginTop: 6 }}>
              <button
                className="btn-primary btn-sm"
                onClick={e => { e.stopPropagation(); onClose(s); }}
                style={{ borderRadius: 8 }}
              >
                Close Session
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(sessions) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const rows = [];
  rows.push([`Truck Sessions Report - Exported: ${today}`]);
  rows.push([]);
  rows.push(['SESSION SUMMARY']);
  rows.push(['Date', 'Truck', 'Driver', 'Status', 'Products Dispatched', 'Revenue (₹)', 'Profit (₹)']);
  for (const s of sessions) {
    rows.push([fmtDate(s.date), s.truck?.name || '', s.user?.name || '', s.status,
      s.dispatches?.length ?? 0,
      Number(s.summary?.totalRevenue || 0).toFixed(2),
      Number(s.summary?.totalProfit  || 0).toFixed(2)]);
  }
  rows.push([], ['PRODUCT DETAILS']);
  rows.push(['Date', 'Truck', 'Driver', 'Status', 'Product', 'Dispatched', 'Sold', 'Returned']);
  for (const s of sessions) {
    for (const d of (s.dispatches || [])) {
      const returned = s.returns?.find(r => r.productId === d.productId)?.quantity || 0;
      rows.push([fmtDate(s.date), s.truck?.name || '', s.user?.name || '', s.status,
        d.product?.name || '', d.quantity, d.quantity - returned, returned]);
    }
  }
  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `truck-sessions-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sessions list tab ─────────────────────────────────────────────────────────
function SessionsList({ sessions, trucks, loading, filterTruck, filterStatus, onFilterTruck, onFilterStatus, onClose }) {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  useEffect(() => setPage(1), [filterTruck, filterStatus, dateFrom, dateTo]);

  const filtered = sessions.filter(s => {
    const d = new Date(s.date);
    if (dateFrom && d < new Date(dateFrom))             return false;
    if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const paged        = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalRevenue = filtered.reduce((s, x) => s + Number(x.summary?.totalRevenue || 0), 0);
  const totalProfit  = filtered.reduce((s, x) => s + Number(x.summary?.totalProfit  || 0), 0);

  return (
    <div>
      {/* Filters */}
      <div className="ts-filters">
        <select value={filterTruck}  onChange={e => onFilterTruck(e.target.value)}  style={{ width: 190 }}>
          <option value="">All Trucks</option>
          {trucks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => onFilterStatus(e.target.value)} style={{ width: 150 }}>
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 150 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>→</span>
          <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   style={{ width: 150 }} />
        </div>
        {(dateFrom || dateTo) && (
          <button className="btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕ Clear</button>
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

      {/* Summary strip */}
      {!loading && filtered.length > 0 && (
        <div className="ts-summary-strip">
          <div><span style={{ color: 'var(--text-muted)' }}>Sessions </span><strong>{filtered.length}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Revenue </span><strong style={{ color: 'var(--primary)' }}>₹{totalRevenue.toFixed(2)}</strong></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Profit </span><strong style={{ color: 'var(--success)' }}>₹{totalProfit.toFixed(2)}</strong></div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <SessionsSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🚚" title="No sessions found" sub="Adjust filters or start a new session" />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {paged.map((s, i) => <SessionItem key={s.id} s={s} onClose={onClose} idx={i} />)}
          </div>
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} pageSizeOptions={[5, 10, 20]} />
        </>
      )}
    </div>
  );
}

// ── Start session tab ─────────────────────────────────────────────────────────
function StartSession({ trucks, products, onSuccess }) {
  const [form,    setForm]    = useState({ truckId: '', items: [{ productId: '', quantity: '' }] });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const addItem    = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: '' }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setItem    = (i, field, val) => setForm(f => {
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
      setSuccess('Truck dispatched successfully! Session is now OPEN.');
      setForm({ truckId: '', items: [{ productId: '', quantity: '' }] });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error starting session');
    } finally { setSaving(false); }
  };

  const activeTrucks = trucks.filter(t => t.isActive);
  const totalUnits   = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0);
  const filledItems  = form.items.filter(i => i.productId);

  return (
    <div style={{ maxWidth: 660, animation: 'db-fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div className="card" style={{ borderRadius: 18 }}>
        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 46, height: 46, background: 'var(--primary-light)', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <TruckIcon />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Morning Dispatch</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Load stock onto a truck to start the day</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Truck picker */}
          <div className="form-group">
            <label>Select Truck</label>
            {activeTrucks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active trucks. Add trucks first.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))', gap: 12 }}>
                {activeTrucks.map((t, i) => (
                  <div
                    key={t.id}
                    className={`ts-truck-card${form.truckId === String(t.id) ? ' ts-truck-selected' : ''}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                    onClick={() => setForm(f => ({ ...f, truckId: String(t.id) }))}
                  >
                    <div style={{ color: 'var(--primary)', marginBottom: 8 }}><TruckIcon /></div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{t.name}</div>
                    {t.branch?.name   && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.branch.name}</div>}
                    {t.plateNumber    && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{t.plateNumber}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock to load */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BoxIcon />
              <span>Stock to Load</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>— products dispatched today</span>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 36px', gap: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</div>
                <div />
              </div>

              {form.items.map((item, i) => (
                <div key={i} className="ts-product-row" style={{ gridTemplateColumns: '1fr 120px 36px', animationDelay: `${i * 40}ms` }}>
                  <select value={item.productId} onChange={e => setItem(i, 'productId', e.target.value)} required>
                    <option value="">Select product…</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.emoji} {p.name} — {p.inHand > 0 ? `${p.inHand} avail` : 'Out'}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number" placeholder="0" min="1"
                    value={item.quantity}
                    onChange={e => setItem(i, 'quantity', e.target.value)}
                    onKeyDown={noNeg}
                    required
                  />
                  {form.items.length > 1 ? (
                    <button type="button" onClick={() => removeItem(i)}
                      style={{ background: 'rgba(229,57,53,0.1)', color: 'var(--danger)', borderRadius: 8, padding: 0, fontSize: 18, lineHeight: 1, border: '1px solid rgba(229,57,53,0.2)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--danger)' || (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(229,57,53,0.1)'; e.currentTarget.style.color = 'var(--danger)'; }}
                    >×</button>
                  ) : <div />}
                </div>
              ))}

              <button type="button" className="btn-ghost btn-sm" onClick={addItem} style={{ marginTop: 6 }}>
                + Add Product
              </button>
            </div>
          </div>

          {/* Summary */}
          {filledItems.length > 0 && (
            <div className="ts-summary-strip" style={{ marginTop: 16, marginBottom: 0 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Products </span><strong>{filledItems.length}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Total units </span><strong style={{ color: 'var(--primary)' }}>{totalUnits}</strong></div>
            </div>
          )}

          {error   && <p className="error-msg"   style={{ marginTop: 12 }}>{error}</p>}
          {success && <p className="success-msg" style={{ marginTop: 12 }}>{success}</p>}

          <div style={{ marginTop: 22 }}>
            <button type="submit" className="ts-dispatch-btn" disabled={saving || !form.truckId}>
              <TruckIcon />
              {saving ? 'Dispatching…' : 'Dispatch Truck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Close session tab ─────────────────────────────────────────────────────────
function CloseSession({ sessions, onSuccess }) {
  const [selected,   setSelected]   = useState(null);
  const [closeItems, setCloseItems] = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

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

  const soldQty = (item) => Math.max(0, item.dispatched - (parseFloat(item.quantity) || 0));

  const handleClose = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.put(`/truck-sessions/${selected.id}/close`, {
        returns: closeItems
          .filter(x => x.quantity !== '')
          .map(x => ({ productId: x.productId, quantity: parseFloat(x.quantity) })),
      });
      setSuccess(`Session for ${selected.truck?.name} closed successfully!`);
      setSelected(null); setCloseItems([]);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error closing session');
    } finally { setSaving(false); }
  };

  if (openSessions.length === 0) {
    return <EmptyState icon="✅" title="All Sessions Closed" sub="No open truck sessions right now." />;
  }

  return (
    <div style={{ maxWidth: 720, animation: 'db-fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
      {success && <p className="success-msg" style={{ marginBottom: 16 }}>{success}</p>}

      {!selected ? (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
            Open Sessions — Select to Close
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {openSessions.map((s, i) => (
              <div key={s.id} className="ts-open-card" style={{ animationDelay: `${i * 50}ms` }} onClick={() => selectSession(s)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(251,140,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', flexShrink: 0 }}>
                    <TruckIcon />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{s.truck?.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                      {fmtDate(s.date)} · {s.user?.name} · {s.dispatches?.length} products loaded
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span className="badge badge-low">OPEN</span>
                  <span style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>Select →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ borderRadius: 18, animation: 'db-fade-up 0.35s cubic-bezier(0.22,1,0.36,1) both' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: 'rgba(251,140,0,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                <TruckIcon />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Close — {selected.truck?.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>Enter stock returned to branch</div>
              </div>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => setSelected(null)}>← Back</button>
          </div>

          {/* Returns table */}
          <div style={{ background: 'var(--bg)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
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
                  <tr key={i} style={{ transition: 'background 0.15s' }}>
                    <td>
                      <span style={{ marginRight: 6 }}>{item.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{item.productName.split(' - ')[0]}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.dispatched}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number" placeholder="0" min="0" max={item.dispatched}
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

          {/* Summary */}
          {closeItems.some(i => i.quantity !== '') && (
            <div className="ts-summary-strip">
              <div><span style={{ color: 'var(--text-muted)' }}>Returning </span><strong>{closeItems.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0)}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Sold </span><strong style={{ color: 'var(--success)' }}>{closeItems.reduce((s, i) => s + soldQty(i), 0)}</strong></div>
            </div>
          )}

          {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

          <button
            className="ts-dispatch-btn"
            disabled={saving}
            onClick={handleClose}
            style={{ background: 'linear-gradient(135deg, var(--warning), #F57C00)' }}
          >
            <TruckIcon />
            {saving ? 'Closing…' : 'Close Session & Record Returns'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function EmptyState({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text-muted)', animation: 'db-fade-up 0.4s ease both' }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{sub}</div>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ background: 'var(--bg-white)', borderRadius: 16, padding: '15px 18px', boxShadow: 'var(--card-shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="db-skeleton" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
            <div>
              <div className="db-skeleton" style={{ width: 130, height: 14, marginBottom: 8 }} />
              <div className="db-skeleton" style={{ width: 170, height: 11 }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="db-skeleton" style={{ width: 70, height: 14 }} />
            <div className="db-skeleton" style={{ width: 56, height: 22, borderRadius: 20 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TruckSessions() {
  const [tab,          setTab]          = useState('sessions');
  const [sessions,     setSessions]     = useState([]);
  const [trucks,       setTrucks]       = useState([]);
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterTruck,  setFilterTruck]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTruck)  params.set('truckId', filterTruck);
      if (filterStatus) params.set('status',  filterStatus);
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

  return (
    <div>
      {/* Header */}
      <div className="db-header">
        <h1>Truck Sessions</h1>
        <p>Morning dispatch &amp; evening return management</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24, borderBottom: '2px solid var(--border)' }}>
        <button className={`ts-tab${tab === 'sessions' ? ' active' : ''}`} onClick={() => setTab('sessions')}>
          Sessions
          {sessions.length > 0 && (
            <span className="ts-badge" style={{ background: 'var(--primary)', color: '#fff' }}>{sessions.length}</span>
          )}
        </button>
        <button className={`ts-tab${tab === 'start' ? ' active' : ''}`} onClick={() => setTab('start')}>
          Start Day
        </button>
        <button className={`ts-tab${tab === 'close' ? ' active' : ''}`} onClick={() => setTab('close')}>
          Close Session
          {openCount > 0 && (
            <span className="ts-badge" style={{ background: 'var(--warning)', color: '#fff' }}>{openCount}</span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {tab === 'sessions' && (
        <SessionsList
          sessions={sessions} trucks={trucks} loading={loading}
          filterTruck={filterTruck} filterStatus={filterStatus}
          onFilterTruck={setFilterTruck} onFilterStatus={setFilterStatus}
          onClose={() => setTab('close')}
        />
      )}
      {tab === 'start' && (
        <StartSession trucks={trucks} products={products} onSuccess={() => { load(); setTab('sessions'); }} />
      )}
      {tab === 'close' && (
        <CloseSession sessions={sessions} onSuccess={() => load()} />
      )}
    </div>
  );
}
