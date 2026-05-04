import { useState, useEffect } from 'react';
import api from '../api/axios';

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function TruckReports() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionReport, setSessionReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branchReport, setBranchReport] = useState(null);
  const [activeTab, setActiveTab] = useState('sessions');

  useEffect(() => {
    api.get('/truck/branches').then(r => setBranches(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadSessions();
  }, [date]);

  const loadSessions = async () => {
    setLoading(true);
    setSelectedSession(null);
    setSessionReport(null);
    try {
      const { data } = await api.get(`/truck/reports/sessions?date=${date}`);
      setSessions(data);
    } catch (_) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionReport = async (session) => {
    setSelectedSession(session);
    setReportLoading(true);
    try {
      const { data } = await api.get(`/truck/reports/session/${session.id}`);
      setSessionReport(data);
    } catch (_) {
      setSessionReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const loadBranchReport = async () => {
    if (!selectedBranch) return;
    setReportLoading(true);
    try {
      const { data } = await api.get(`/truck/reports/branch/${selectedBranch}?date=${date}`);
      setBranchReport(data);
    } catch (_) {
      setBranchReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const totalAmount = sessions.reduce((s, sess) => s + (sess.totalAmount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Truck Reports</h1>
        <p>Monitor daily truck sales sessions and stock reconciliation</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn${activeTab === 'sessions' ? ' active' : ''}`} onClick={() => setActiveTab('sessions')}>Sessions</button>
        <button className={`tab-btn${activeTab === 'branch' ? ' active' : ''}`} onClick={() => setActiveTab('branch')}>Branch Report</button>
      </div>

      {/* Date filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ width: 160 }} />
        </div>
        {activeTab === 'branch' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Branch</label>
              <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={{ width: 200 }}>
                <option value="">Select branch…</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <button className="btn-primary" style={{ padding: '8px 18px' }} onClick={loadBranchReport}>
              Load Report
            </button>
          </>
        )}
      </div>

      {/* ── Sessions Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedSession ? '1fr 1fr' : '1fr', gap: 20 }}>
          {/* Session list */}
          <div>
            {/* KPI */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 16 }}>
              <div className="kpi-card">
                <div className="label">Sessions</div>
                <div className="value">{sessions.length}</div>
              </div>
              <div className="kpi-card" style={{ borderLeftColor: 'var(--success)' }}>
                <div className="label">Open</div>
                <div className="value" style={{ color: 'var(--success)' }}>{sessions.filter(s => s.status === 'OPEN').length}</div>
              </div>
              <div className="kpi-card" style={{ borderLeftColor: 'var(--accent)' }}>
                <div className="label">Total Sales</div>
                <div className="value" style={{ fontSize: 18 }}>{fmt(totalAmount)}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
              ) : sessions.length === 0 ? (
                <div className="empty-state">No sessions on this date</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Driver / Truck</th>
                      <th>Branch</th>
                      <th>Start</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(sess => (
                      <tr key={sess.id}
                        onClick={() => loadSessionReport(sess)}
                        style={{ cursor: 'pointer', background: selectedSession?.id === sess.id ? 'var(--primary-light)' : undefined }}
                      >
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{sess.user?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sess.truck?.name}</div>
                        </td>
                        <td style={{ fontSize: 12 }}>{sess.branch?.name || '—'}</td>
                        <td style={{ fontSize: 12 }}>{fmtDate(sess.startTime)}</td>
                        <td>
                          <span className={`badge ${sess.status === 'OPEN' ? 'badge-low' : 'badge-healthy'}`}>
                            {sess.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                          {fmt(sess.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Session detail */}
          {selectedSession && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedSession.user?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedSession.truck?.name} · {selectedSession.branch?.name}</div>
                </div>
                <button onClick={() => { setSelectedSession(null); setSessionReport(null); }}
                  className="btn-secondary btn-sm">✕ Close</button>
              </div>

              {reportLoading ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Loading…</div>
              ) : sessionReport ? (
                <>
                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL SALES</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
                        {fmt(sessionReport.summary?.totalSalesAmount)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--th-bg)', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>TRANSACTIONS</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                        {sessionReport.summary?.totalTransactions}
                      </div>
                    </div>
                  </div>

                  {/* Product breakdown */}
                  {sessionReport.summary?.productSummary?.length > 0 && (
                    <>
                      <div className="section-title">Product Sales</div>
                      <table style={{ marginBottom: 16 }}>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th style={{ textAlign: 'right' }}>Qty Sold</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionReport.summary.productSummary.map(p => (
                            <tr key={p.product.id}>
                              <td style={{ fontSize: 12 }}>{p.product.emoji} {p.product.name}</td>
                              <td style={{ textAlign: 'right', fontSize: 12 }}>{p.soldQty}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 12, color: 'var(--primary)' }}>
                                {fmt(p.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {/* Stock summary */}
                  {sessionReport.stockSummary?.length > 0 && (
                    <>
                      <div className="section-title">Stock Reconciliation</div>
                      <table>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th style={{ textAlign: 'right' }}>Opening</th>
                            <th style={{ textAlign: 'right' }}>Sold</th>
                            <th style={{ textAlign: 'right' }}>Closing</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionReport.stockSummary.map(s => (
                            <tr key={s.product.id}>
                              <td style={{ fontSize: 12 }}>{s.product.emoji} {s.product.name}</td>
                              <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--warning)' }}>{s.openingQty}</td>
                              <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--danger)' }}>{s.soldQty}</td>
                              <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>{s.closingQty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {sessionReport.session.status === 'OPEN' && (
                    <p style={{ marginTop: 12, fontSize: 12, color: 'var(--warning)' }}>
                      ⚠ Session is still open — stock reconciliation will appear after day close.
                    </p>
                  )}
                </>
              ) : (
                <div className="empty-state">Failed to load report</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Branch Report Tab ────────────────────────────────────────────── */}
      {activeTab === 'branch' && (
        <div>
          {branchReport ? (
            <>
              <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                <div className="kpi-card">
                  <div className="label">Shop Sales</div>
                  <div className="value" style={{ fontSize: 18 }}>{fmt(branchReport.shopSales)}</div>
                </div>
                <div className="kpi-card" style={{ borderLeftColor: 'var(--accent)' }}>
                  <div className="label">Truck Sales</div>
                  <div className="value" style={{ fontSize: 18 }}>{fmt(branchReport.truckSales)}</div>
                </div>
                <div className="kpi-card" style={{ borderLeftColor: 'var(--success)' }}>
                  <div className="label">Combined Sales</div>
                  <div className="value" style={{ fontSize: 18, color: 'var(--success)' }}>{fmt(branchReport.combinedSales)}</div>
                </div>
                <div className="kpi-card" style={{ borderLeftColor: 'var(--text-muted)' }}>
                  <div className="label">Truck Sessions</div>
                  <div className="value">{branchReport.truckSessionsCount}</div>
                </div>
              </div>

              {branchReport.sessions?.length > 0 && (
                <div className="card" style={{ padding: 0, marginTop: 8 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Driver</th>
                        <th>Truck</th>
                        <th>Start</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchReport.sessions.map(s => (
                        <tr key={s.id}>
                          <td style={{ fontSize: 13 }}>{s.user?.name}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.truck?.name}</td>
                          <td style={{ fontSize: 12 }}>{fmtDate(s.startTime)}</td>
                          <td>
                            <span className={`badge ${s.status === 'OPEN' ? 'badge-low' : 'badge-healthy'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>
                            {fmt(s.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="card empty-state">
              Select a branch and click "Load Report" to view the combined report
            </div>
          )}
        </div>
      )}
    </div>
  );
}
