import { useState, useEffect } from 'react';
import api from '../api/axios';

function today() {
  return new Date().toISOString().split('T')[0];
}

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(2) : '0.00';
}

function StockBadge({ inHand }) {
  if (inHand <= 0) return <span className="badge badge-out">Out of Stock</span>;
  if (inHand <= 20) return <span className="badge badge-low">Low</span>;
  return <span className="badge badge-healthy">Healthy</span>;
}

function ProductThumb({ imageUrl }) {
  const [err, setErr] = useState(false);
  if (imageUrl && !err) {
    return (
      <img
        src={imageUrl}
        alt=""
        onError={() => setErr(true)}
        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', background: 'var(--th-bg)', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--th-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [stock, setStock] = useState([]);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [stockRes, dailyRes] = await Promise.all([
          api.get('/reports/stock'),
          api.get(`/reports/daily?date=${today()}`),
        ]);
        setStock(stockRes.data);
        setDaily(dailyRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalInHand = stock.reduce((s, p) => s + p.inHand, 0);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Today: {today()}</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="label">Total Stock in Hand</div>
          <div className="value">{totalInHand.toFixed(0)}</div>
          <div className="sub">units across all products</div>
        </div>
        <div className="kpi-card">
          <div className="label">Today Purchased</div>
          <div className="value">{daily?.summary?.unitsPurchased?.toFixed(0) ?? 0}</div>
          <div className="sub">units · ₹{fmt(daily?.summary?.totalPurchaseCost)}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Today Sales</div>
          <div className="value">{daily?.summary?.unitsSold?.toFixed(0) ?? 0}</div>
          <div className="sub">units · ₹{fmt(daily?.summary?.totalRevenue)}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Today Profit</div>
          <div className="value" style={{ color: 'var(--success)' }}>₹{fmt(daily?.summary?.totalProfit)}</div>
          <div className="sub">net profit today</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Available Stock */}
        <div className="card">
          <div className="section-title">Available Stock</div>
          {stock.length === 0 ? (
            <p className="empty-state">No products found</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stock.map((p) => (
                <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <ProductThumb imageUrl={p.imageUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Avg Buy ₹{p.avgCostPerUnit.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)', lineHeight: 1 }}>{p.inHand.toFixed(0)}</div>
                    <div style={{ marginTop: 4 }}><StockBadge inHand={p.inHand} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today Sales */}
        <div className="card">
          <div className="section-title">Today's Sales</div>
          {!daily?.sales || daily.sales.length === 0 ? (
            <p className="empty-state">No sales recorded today</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {daily.sales.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <ProductThumb imageUrl={s.imageUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {s.quantity} units · ₹{fmt(s.totalRevenue)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: s.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      ₹{fmt(s.profit)}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>profit</div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontWeight: 700, fontSize: 13 }}>
                <span>Total</span>
                <span style={{ color: 'var(--success)' }}>₹{fmt(daily?.summary?.totalProfit)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
