import { useState, useEffect } from 'react';
import api from '../api/axios';

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

export default function CurrentStock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/reports/stock').then(r => { setStock(r.data); setLoading(false); });

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Current Stock</h1>
        <p>Live inventory — total purchased minus total sold</p>
      </div>

      {/* Product cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        {stock.map(p => (
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
                <th>Avg Buy Price</th><th>Avg Sell Price</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stock.map(p => (
                <tr key={p.productId}>
                  <td>{p.emoji} <strong>{p.productName}</strong></td>
                  <td>{p.totalPurchased.toFixed(0)}</td>
                  <td>{p.totalSold.toFixed(0)}</td>
                  <td><strong>{p.inHand.toFixed(0)}</strong></td>
                  <td>₹{p.avgCostPerUnit.toFixed(2)}</td>
                  <td>₹{p.avgSellPerUnit.toFixed(2)}</td>
                  <td><StockBadge inHand={p.inHand} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
