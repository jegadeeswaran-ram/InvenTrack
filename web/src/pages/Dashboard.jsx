import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const todayStr = () => new Date().toISOString().split('T')[0];

const fmtNum = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtRupee = (n) => `₹${fmtNum(n)}`;

function useCountUp(target, duration = 1000, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const abs = Math.abs(target || 0);
    if (!abs) { setVal(0); return; }
    let raf;
    const tid = setTimeout(() => {
      let start = null;
      const step = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(eased * abs));
        if (p < 1) raf = requestAnimationFrame(step);
        else setVal(abs);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(tid); if (raf) cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return target < 0 ? -val : val;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconStock = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const IconRevenue = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconProfit = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconShop = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

// ── Sub-components ────────────────────────────────────────────────────────────
function StockBadge({ inHand }) {
  if (inHand <= 0) return <span className="badge badge-out">Out</span>;
  if (inHand <= 20) return <span className="badge badge-low">Low</span>;
  return <span className="badge badge-healthy">OK</span>;
}

const STOCK_FILTERS = [
  { key: 'all', label: 'All',         color: 'var(--primary)', bg: 'rgba(0,151,167,0.1)',   border: 'rgba(0,151,167,0.3)'  },
  { key: 'ok',  label: 'In Stock',    color: 'var(--success)', bg: 'rgba(46,158,79,0.1)',   border: 'rgba(46,158,79,0.3)'  },
  { key: 'low', label: 'Low Stock',   color: 'var(--warning)', bg: 'rgba(251,140,0,0.1)',   border: 'rgba(251,140,0,0.3)'  },
  { key: 'out', label: 'Out of Stock',color: 'var(--danger)',  bg: 'rgba(229,57,53,0.1)',   border: 'rgba(229,57,53,0.3)'  },
];

function StockCard({ stock, maxStock }) {
  const [filter, setFilter] = useState('all');
  const [prevFilter, setPrevFilter] = useState('all');

  const groups = {
    all: stock,
    ok:  stock.filter(p => p.inHand > 20),
    low: stock.filter(p => p.inHand > 0 && p.inHand <= 20),
    out: stock.filter(p => p.inHand <= 0),
  };
  const counts = { all: stock.length, ok: groups.ok.length, low: groups.low.length, out: groups.out.length };
  const visible = groups[filter];
  const active  = STOCK_FILTERS.find(f => f.key === filter);

  const switchFilter = (key) => { setPrevFilter(filter); setFilter(key); };

  return (
    <div className="db-card" style={{ animationDelay: '140ms' }}>
      {/* ─ Header row ─ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div className="db-section-title" style={{ margin: 0 }}>Stock Status</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {STOCK_FILTERS.map(f => {
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                className="stock-filter-btn"
                onClick={() => switchFilter(f.key)}
                style={{
                  background: isActive ? f.color : 'var(--bg)',
                  color:      isActive ? '#fff'  : 'var(--text-muted)',
                  borderColor: isActive ? f.color : 'var(--border)',
                  boxShadow:  isActive ? `0 3px 10px ${f.border}` : 'none',
                  transform:  isActive ? 'translateY(-1px)' : 'none',
                }}
              >
                {f.label}
                <span
                  className="sfb-count"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.22)' : f.bg,
                    color:      isActive ? '#fff' : f.color,
                  }}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─ Mini summary tiles ─ */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {STOCK_FILTERS.slice(1).map((f, i) => {
          const isActive = filter === f.key;
          return (
            <div
              key={f.key}
              className={`stock-mini-card${isActive ? ' active' : ''}`}
              style={{
                background:  f.bg,
                border:      `1.5px solid ${isActive ? f.color : 'transparent'}`,
                animationDelay: `${160 + i * 50}ms`,
              }}
              onClick={() => switchFilter(f.key)}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: f.color, lineHeight: 1 }}>{counts[f.key]}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: f.color, marginTop: 3, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {f.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─ List ─ */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          No {active.label.toLowerCase()} products
        </div>
      ) : (
        <div className="db-scroll">
          {visible.map((p) => {
            const barColor = p.inHand <= 0
              ? 'var(--danger)'
              : p.inHand <= 20
              ? 'var(--warning)'
              : 'linear-gradient(to right, var(--primary), var(--accent))';
            const valColor = p.inHand <= 0 ? 'var(--danger)' : p.inHand <= 20 ? 'var(--warning)' : 'var(--primary)';
            return (
              <div key={p.productId} className="db-row">
                <ProductThumb imageUrl={p.imageUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                    {p.productName}
                  </div>
                  <div className="db-progress-bar">
                    <div className="db-progress-fill" style={{ width: `${(Math.max(0, p.inHand) / maxStock) * 100}%`, background: barColor }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 52 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: valColor, lineHeight: 1 }}>
                    {Math.max(0, p.inHand).toFixed(0)}
                  </div>
                  <div style={{ marginTop: 3 }}><StockBadge inHand={p.inHand} /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProductThumb({ imageUrl }) {
  const [err, setErr] = useState(false);
  if (imageUrl && !err)
    return (
      <img
        src={imageUrl}
        alt=""
        onError={() => setErr(true)}
        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
      />
    );
  return (
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--th-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
      🍦
    </div>
  );
}

function KpiCard({ label, value, sub, color, Icon, delay, rupee = false }) {
  const animated = useCountUp(value, 950, delay);
  return (
    <div className="db-kpi" style={{ borderLeftColor: color, animationDelay: `${delay}ms` }}>
      <div className="db-kpi-bg-icon" style={{ color }}><Icon /></div>
      <div className="db-kpi-label">
        <span className="db-kpi-dot" style={{ background: color }} />
        {label}
      </div>
      <div className="db-kpi-value" style={{ color }}>
        {rupee ? '₹' : ''}{fmtNum(animated)}
      </div>
      <div className="db-kpi-sub">{sub}</div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div>
      <div className="db-header">
        <div className="db-skeleton" style={{ width: 220, height: 34, marginBottom: 10 }} />
        <div className="db-skeleton" style={{ width: 180, height: 14 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: 'var(--bg-white)', borderRadius: 18, padding: 22, boxShadow: 'var(--card-shadow)' }}>
            <div className="db-skeleton" style={{ width: 90, height: 11, marginBottom: 12 }} />
            <div className="db-skeleton" style={{ width: 130, height: 36, marginBottom: 10 }} />
            <div className="db-skeleton" style={{ width: 100, height: 11 }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {[0,1].map(i => (
          <div key={i} className="db-card">
            <div className="db-skeleton" style={{ width: 110, height: 14, marginBottom: 20 }} />
            {[0,1,2,3,4].map(j => (
              <div key={j} style={{ display:'flex', gap:10, marginBottom: 12, alignItems:'center' }}>
                <div className="db-skeleton" style={{ width:36, height:36, borderRadius:'50%', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div className="db-skeleton" style={{ width:'70%', height:12, marginBottom:6 }} />
                  <div className="db-skeleton" style={{ width:'40%', height:10 }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [stock, setStock]     = useState([]);
  const [daily, setDaily]     = useState(null);
  const [branchComparison, setBranchComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    const load = async () => {
      try {
        const calls = [
          api.get('/reports/stock'),
          api.get(`/reports/daily?date=${todayStr()}`),
        ];
        if (isAdmin) {
          const d = todayStr();
          calls.push(api.get('/branches'), api.get(`/reports/branch-comparison?from=${d}&to=${d}`));
        }
        const results = await Promise.all(calls);
        setStock(results[0].data);
        setDaily(results[1].data);
        if (isAdmin) setBranchComparison(results[3].data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const totalInHand  = stock.reduce((s, p) => s + Math.max(0, p.inHand), 0);
  const lowItems     = stock.filter(p => p.inHand > 0 && p.inHand <= 20).length;
  const outItems     = stock.filter(p => p.inHand <= 0).length;
  const maxStock     = Math.max(...stock.map(p => Math.max(0, p.inHand)), 1);
  const maxRevenue   = Math.max(...branchComparison.map(b => b.totalRevenue || 0), 1);

  if (loading) return <SkeletonLoader />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* ── Header ── */}
      <div className="db-header">
        <h1>{greeting}, {user?.name?.split(' ')[0] || 'there'}</h1>
        <p>{dateLabel}{user?.branch ? ` · ${user.branch}` : ''}</p>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        <KpiCard
          label="Stock in Hand"
          value={Math.round(totalInHand)}
          sub={`${lowItems} low · ${outItems} out of stock`}
          color="var(--primary)"
          Icon={IconStock}
          delay={0}
        />
        <KpiCard
          label="Today Revenue"
          value={Math.round(daily?.summary?.totalRevenue || 0)}
          sub={`${Math.round(daily?.summary?.unitsSold || 0)} units sold`}
          color="#5C6BC0"
          Icon={IconRevenue}
          delay={90}
          rupee
        />
        <KpiCard
          label="Today Profit"
          value={Math.round(daily?.summary?.totalProfit || 0)}
          sub="gross profit today"
          color="var(--success)"
          Icon={IconProfit}
          delay={180}
          rupee
        />
        <KpiCard
          label="Shop Sales"
          value={Math.round(daily?.summary?.shopSales || 0)}
          sub={`Truck: ${fmtRupee(daily?.summary?.truckSales)}`}
          color="#FB8C00"
          Icon={IconShop}
          delay={270}
          rupee
        />
      </div>

      {/* ── Two-column section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Stock Status */}
        <StockCard stock={stock} maxStock={maxStock} />

        {/* Today's Sales */}
        <div className="db-card" style={{ animationDelay: '220ms' }}>
          <div className="db-section-title">Today's Sales</div>
          {!daily?.sales?.length
            ? <p className="empty-state">No sales today</p>
            : (
              <div className="db-scroll">
                {daily.sales.map((s, i) => (
                  <div key={i} className="db-row">
                    <ProductThumb imageUrl={s.imageUrl} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                        {s.product?.name || s.productName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {s.quantity} units · {fmtRupee(s.totalRevenue)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 56 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: s.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {fmtRupee(s.profit)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>profit</div>
                    </div>
                  </div>
                ))}

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 10px 4px', marginTop: 6,
                  borderTop: '2px solid var(--border)',
                  fontWeight: 700, fontSize: 13,
                }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Profit</span>
                  <span style={{ color: 'var(--success)', fontSize: 15 }}>
                    {fmtRupee(daily?.summary?.totalProfit)}
                  </span>
                </div>
              </div>
            )
          }
        </div>
      </div>

      {/* ── Branch Comparison — Admin only ── */}
      {isAdmin && branchComparison.length > 0 && (
        <div className="db-card" style={{ animationDelay: '300ms' }}>
          <div className="db-section-title">Branch Performance — Today</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 14, marginTop: 4 }}>
            {branchComparison.map((b, i) => (
              <div
                key={b.branchId}
                className="db-branch-card"
                style={{ animationDelay: `${320 + i * 60}ms` }}
              >
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text)' }}>
                  {b.branchName}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Revenue</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmtRupee(b.totalRevenue)}</span>
                </div>
                <div
                  className="db-branch-bar"
                  style={{ width: `${Math.round((b.totalRevenue / maxRevenue) * 100)}%` }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 12, marginBottom: 5, color: 'var(--text-muted)' }}>
                  <span>Shop</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fmtRupee(b.shopRevenue)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>Truck</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{fmtRupee(b.truckRevenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
