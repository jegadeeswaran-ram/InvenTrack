import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const today = () => new Date().toISOString().split('T')[0];
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function StockBadge({ inHand }) {
  if (inHand <= 0) return <span className="badge badge-out">Out</span>;
  if (inHand <= 20) return <span className="badge badge-low">Low</span>;
  return <span className="badge badge-healthy">OK</span>;
}

function ProductThumb({ imageUrl }) {
  const [err, setErr] = useState(false);
  if (imageUrl && !err) return <img src={imageUrl} alt="" onError={() => setErr(true)} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--th-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>🍦</div>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stock, setStock] = useState([]);
  const [daily, setDaily] = useState(null);
  const [branches, setBranches] = useState([]);
  const [branchComparison, setBranchComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const load = async () => {
      try {
        const calls = [
          api.get('/reports/stock'),
          api.get(`/reports/daily?date=${today()}`),
        ];
        if (isAdmin) {
          const from = today(); const to = today();
          calls.push(api.get('/branches'), api.get(`/reports/branch-comparison?from=${from}&to=${to}`));
        }
        const results = await Promise.all(calls);
        setStock(results[0].data);
        setDaily(results[1].data);
        if (isAdmin) { setBranches(results[2].data); setBranchComparison(results[3].data); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const totalInHand = stock.reduce((s, p) => s + Math.max(0, p.inHand), 0);
  const lowStockItems = stock.filter(p => p.inHand > 0 && p.inHand <= 20).length;
  const outOfStock = stock.filter(p => p.inHand <= 0).length;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Today: {today()}{user?.branch ? ` · ${user.branch}` : ''}</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="label">Stock in Hand</div>
          <div className="value">{totalInHand.toFixed(0)}</div>
          <div className="sub">{lowStockItems} low · {outOfStock} out</div>
        </div>
        <div className="kpi-card">
          <div className="label">Today Revenue</div>
          <div className="value">{fmt(daily?.summary?.totalRevenue)}</div>
          <div className="sub">{daily?.summary?.unitsSold?.toFixed(0) ?? 0} units sold</div>
        </div>
        <div className="kpi-card" style={{ borderLeftColor: 'var(--success)' }}>
          <div className="label">Today Profit</div>
          <div className="value" style={{ color: 'var(--success)' }}>{fmt(daily?.summary?.totalProfit)}</div>
          <div className="sub">gross profit</div>
        </div>
        <div className="kpi-card" style={{ borderLeftColor: '#FF9800' }}>
          <div className="label">Shop Sales</div>
          <div className="value" style={{ color: '#FB8C00' }}>{fmt(daily?.summary?.shopSales)}</div>
          <div className="sub">Truck: {fmt(daily?.summary?.truckSales)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr 1fr', gap: 24 }}>
        {/* Stock */}
        <div className="card">
          <div className="section-title">Stock Status</div>
          {stock.length === 0 ? <p className="empty-state">No products</p> : (
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stock.slice(0, 20).map((p) => (
                <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <ProductThumb imageUrl={p.imageUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cost ₹{p.avgCostPerUnit.toFixed(1)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{Math.max(0, p.inHand).toFixed(0)}</div>
                    <StockBadge inHand={p.inHand} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Sales */}
        <div className="card">
          <div className="section-title">Today's Sales</div>
          {!daily?.sales?.length ? <p className="empty-state">No sales today</p> : (
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {daily.sales.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <ProductThumb imageUrl={s.imageUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.product?.name || s.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.quantity} units · {fmt(s.totalRevenue)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: (s.profit >= 0) ? 'var(--success)' : 'var(--danger)' }}>{fmt(s.profit)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>profit</div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontWeight: 700, fontSize: 13, borderTop: '2px solid var(--border)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--success)' }}>{fmt(daily?.summary?.totalProfit)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Branch Comparison — Admin only */}
      {isAdmin && branchComparison.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="section-title">Branch Performance — Today</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginTop: 12 }}>
            {branchComparison.map(b => (
              <div key={b.branchId} style={{ background: 'var(--bg)', borderRadius: 12, padding: '14px 16px', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{b.branchName}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Revenue</span>
                  <span style={{ fontWeight: 700 }}>{fmt(b.totalRevenue)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Shop</span>
                  <span>{fmt(b.shopRevenue)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Truck</span>
                  <span>{fmt(b.truckRevenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
