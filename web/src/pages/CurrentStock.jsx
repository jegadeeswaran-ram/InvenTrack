import { useState, useEffect } from 'react';
import api from '../api/axios';
import Pagination from '../components/Pagination';

const noNeg = e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); };

function ProductImage({ imageUrl }) {
  const [err, setErr] = useState(false);
  if (imageUrl && !err) {
    return <img src={imageUrl} alt="" onError={() => setErr(true)} style={{ width: 110, height: 110, objectFit: 'contain', borderRadius: 10 }} />;
  }
  return (
    <div style={{ width: 110, height: 110, borderRadius: 10, background: 'var(--th-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
      </svg>
    </div>
  );
}

function StockBadge({ inHand }) {
  if (inHand <= 0) return <span className="badge badge-out">Out of Stock</span>;
  if (inHand <= 20) return <span className="badge badge-low">Low</span>;
  return <span className="badge badge-healthy">Healthy</span>;
}

function AddStockModal({ product, onClose, onSuccess }) {
  const getPpc = () => {
    if (product.piecesPerPacket > 1) return product.piecesPerPacket;
    const n = product.productName || '';
    if (n.includes('Stick')) return 6;
    if (n.includes('Plate')) return 16;
    if (n.includes('Pot'))   return 12;
    return product.piecesPerPacket || 1;
  };
  const ppc = getPpc();

  const [packets, setPackets] = useState('');
  const [cost, setCost] = useState(product.avgCostPerUnit > 0 ? product.avgCostPerUnit.toFixed(2) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const pieces = (parseFloat(packets) || 0) * ppc;
  const total = pieces * (parseFloat(cost) || 0);

  const formatLabel = () => {
    const n = product.productName || '';
    if (n.includes('Stick')) return `Packets (1 pkt = 6 pcs)`;
    if (n.includes('Plate')) return `Packets (1 pkt = 16 pcs)`;
    if (n.includes('Pot'))   return `Boxes (1 box = 12 pcs)`;
    return `Packets (1 pkt = ${ppc} pcs)`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pkts = parseFloat(packets);
    const c = parseFloat(cost);
    if (!pkts || pkts <= 0) { setError('Quantity must be greater than 0'); return; }
    if (isNaN(c) || c < 0)  { setError('Cost cannot be negative'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/purchases', {
        date: new Date().toISOString().slice(0, 10),
        productId: product.productId,
        packets: pkts,
        costPerUnit: c,
        notes: 'Stock added from Current Stock page',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add stock');
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {product.emoji} Add Stock
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{product.productName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{formatLabel()}</label>
            <input
              type="number"
              placeholder="0"
              min="1"
              value={packets}
              onChange={e => { setPackets(e.target.value); setError(''); }}
              onKeyDown={noNeg}
              autoFocus
            />
            {pieces > 0 && (
              <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 4 }}>
                = {pieces.toFixed(0)} pieces
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Cost / Piece (₹)</label>
            <input
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={cost}
              onChange={e => { setCost(e.target.value); setError(''); }}
              onKeyDown={noNeg}
            />
          </div>

          {pieces > 0 && parseFloat(cost) >= 0 && (
            <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Cost</span>
              <strong style={{ color: 'var(--primary)' }}>₹{total.toFixed(2)}</strong>
            </div>
          )}

          {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 2 }}>
              {saving ? 'Adding…' : '+ Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CurrentStock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [addTarget, setAddTarget] = useState(null);

  const load = () => api.get('/reports/stock').then(r => { setStock(r.data); setLoading(false); });

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const pagedStock = stock.slice((page - 1) * pageSize, page * pageSize);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Current Stock</h1>
        <p>Live inventory — total purchased minus total sold</p>
      </div>

      {/* Product cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        {pagedStock.map(p => (
          <div key={p.productId} className="card" style={{ borderTop: `3px solid var(--primary)` }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <ProductImage imageUrl={p.imageUrl} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, textAlign: 'center' }}>{p.productName}</div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>{p.inHand.toFixed(0)}</div>
              <StockBadge inHand={p.inHand} />
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <div>Purchased: <strong>{p.totalPurchased.toFixed(0)}</strong></div>
              <div>Sold: <strong>{p.totalSold.toFixed(0)}</strong></div>
              <div>Avg Buy: <strong>₹{p.avgCostPerUnit.toFixed(2)}</strong></div>
              <div>Avg Sell: <strong>₹{p.avgSellPerUnit.toFixed(2)}</strong></div>
            </div>
            <button
              className="btn-primary btn-sm"
              onClick={() => setAddTarget(p)}
              style={{ width: '100%', marginTop: 14 }}
            >
              + Add Stock
            </button>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div className="card">
        <div className="section-title">Stock Movement Table</div>
        {stock.length === 0 ? (
          <p className="empty-state">No products found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th><th>Total Purchased</th><th>Total Sold</th><th>In Hand</th>
                <th>Avg Buy Price</th><th>Avg Sell Price</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {pagedStock.map(p => (
                <tr key={p.productId}>
                  <td>{p.emoji} <strong>{p.productName}</strong></td>
                  <td>{p.totalPurchased.toFixed(0)}</td>
                  <td>{p.totalSold.toFixed(0)}</td>
                  <td><strong>{p.inHand.toFixed(0)}</strong></td>
                  <td>₹{p.avgCostPerUnit.toFixed(2)}</td>
                  <td>₹{p.avgSellPerUnit.toFixed(2)}</td>
                  <td><StockBadge inHand={p.inHand} /></td>
                  <td>
                    <button className="btn-ghost btn-sm" onClick={() => setAddTarget(p)}>+ Add</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={pageSize} total={stock.length} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {addTarget && (
        <AddStockModal
          product={addTarget}
          onClose={() => setAddTarget(null)}
          onSuccess={() => { setAddTarget(null); load(); }}
        />
      )}
    </div>
  );
}
