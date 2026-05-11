import { useState, useEffect } from 'react';
import api from '../api/axios';
import Pagination from '../components/Pagination';
const noNeg = e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); };

const CATEGORIES = ['SALARY', 'INCENTIVE', 'ELECTRICITY', 'RENT', 'MAINTENANCE', 'TRANSPORT', 'MISC'];
const CAT_ICONS = { SALARY: '👷', INCENTIVE: '🎁', ELECTRICITY: '⚡', RENT: '🏠', MAINTENANCE: '🔧', TRANSPORT: '🚛', MISC: '📦' };
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function exportCSV({ expenses, summary, branches, filterMonth, filterYear, filterBranch }) {
  const branchLabel = branches.find(b => String(b.id) === String(filterBranch))?.name || 'All Branches';
  const period = `${MONTHS[filterMonth - 1]} ${filterYear}`;
  const exported = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const rows = [];
  rows.push([`Expenses Report - ${period} - ${branchLabel}`]);
  rows.push([`Exported: ${exported}`]);
  rows.push([]);

  if (summary) {
    rows.push(['SUMMARY']);
    rows.push(['Total Revenue', `₹${Number(summary.totalRevenue || 0).toFixed(2)}`]);
    rows.push(['Gross Profit',  `₹${Number(summary.grossProfit  || 0).toFixed(2)}`]);
    rows.push(['Total Expenses',`₹${Number(summary.totalExpenses|| 0).toFixed(2)}`]);
    rows.push(['Net Profit',    `₹${Number(summary.netProfit    || 0).toFixed(2)}`]);
    rows.push([]);
    rows.push(['CATEGORY BREAKDOWN']);
    for (const cat of CATEGORIES) {
      rows.push([cat, `₹${Number(summary.breakdown?.[cat] || 0).toFixed(2)}`]);
    }
    rows.push([]);
  }

  rows.push(['EXPENSE ENTRIES']);
  rows.push(['Branch', 'Category', 'Amount (₹)', 'Month', 'Year', 'Notes']);
  for (const e of expenses) {
    rows.push([
      e.branch?.name || '',
      e.category,
      Number(e.amount).toFixed(2),
      MONTHS[e.month - 1],
      e.year,
      e.notes || '',
    ]);
  }
  rows.push([]);
  rows.push(['TOTAL', '', Number(expenses.reduce((s, e) => s + Number(e.amount), 0)).toFixed(2)]);

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${filterYear}-${String(filterMonth).padStart(2, '0')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const now = new Date();

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ branchId: '', category: 'SALARY', amount: '', month: now.getMonth() + 1, year: now.getFullYear(), notes: '' });
  const [filterBranch, setFilterBranch] = useState('');
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterBranch) params.set('branchId', filterBranch);
      params.set('month', filterMonth);
      params.set('year', filterYear);

      const [{ data: e }, { data: b }, { data: s }] = await Promise.all([
        api.get(`/expenses?${params}`),
        api.get('/branches'),
        api.get(`/expenses/summary?month=${filterMonth}&year=${filterYear}${filterBranch ? `&branchId=${filterBranch}` : ''}`),
      ]);
      setExpenses(e);
      setBranches(b);
      setSummary(s);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [filterBranch, filterMonth, filterYear]);
  useEffect(() => { setPage(1); }, [filterBranch, filterMonth, filterYear]);

  const openNew = () => {
    setEditing(null);
    setForm({ branchId: branches[0]?.id || '', category: 'SALARY', amount: '', month: filterMonth, year: filterYear, notes: '' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({ branchId: e.branchId, category: e.category, amount: e.amount, month: e.month, year: e.year, notes: e.notes || '' });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) await api.put(`/expenses/${editing.id}`, form);
      else await api.post('/expenses', form);
      setShowForm(false);
      loadAll();
    } catch (err) { setError(err.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await api.delete(`/expenses/${id}`);
    loadAll();
  };

  const months = MONTHS;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Expenses</h1>
          <p>Monthly expense tracking per branch</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-secondary"
            disabled={expenses.length === 0}
            onClick={() => exportCSV({ expenses, summary, branches, filterMonth, filterYear, filterBranch })}
          >
            ⬇ Export CSV
          </button>
          <button className="btn-primary" onClick={openNew}>+ Add Expense</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} style={{ width: 200 }}>
          <option value="">All Branches</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))} style={{ width: 120 }}>
          {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))} style={{ width: 100 }}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <div className="kpi-card"><div className="label">Total Revenue</div><div className="value">{fmt(summary.totalRevenue)}</div></div>
          <div className="kpi-card" style={{ borderLeftColor: 'var(--success)' }}><div className="label">Gross Profit</div><div className="value" style={{ color: 'var(--success)' }}>{fmt(summary.grossProfit)}</div></div>
          <div className="kpi-card" style={{ borderLeftColor: 'var(--danger)' }}><div className="label">Total Expenses</div><div className="value" style={{ color: 'var(--danger)' }}>{fmt(summary.totalExpenses)}</div></div>
          <div className="kpi-card" style={{ borderLeftColor: summary.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            <div className="label">Net Profit</div>
            <div className="value" style={{ color: summary.netProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(summary.netProfit)}</div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {summary && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-title">Expense Breakdown — {months[filterMonth - 1]} {filterYear}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {CATEGORIES.map(cat => (
              <div key={cat} style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{CAT_ICONS[cat]}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{cat}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{fmt(summary.breakdown?.[cat] || 0)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 440, padding: 28 }}>
            <h3 style={{ marginBottom: 20, fontSize: 16 }}>{editing ? 'Edit Expense' : 'Add Expense'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label>Branch</label>
                  <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} required>
                    <option value="">Select branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row cols-3">
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="0" onKeyDown={noNeg} />
                </div>
                <div className="form-group">
                  <label>Month</label>
                  <select value={form.month} onChange={e => setForm({ ...form, month: parseInt(e.target.value) })}>
                    {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <select value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}>
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? <div className="empty-state">Loading…</div> : expenses.length === 0 ? (
        <div className="empty-state">No expenses for this period</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead><tr><th>Branch</th><th>Category</th><th>Amount</th><th>Period</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {expenses.slice((page - 1) * pageSize, page * pageSize).map(e => (
                <tr key={e.id}>
                  <td>{e.branch?.name}</td>
                  <td><span className="badge badge-admin">{CAT_ICONS[e.category]} {e.category}</span></td>
                  <td style={{ fontWeight: 700 }}>{fmt(e.amount)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{months[e.month - 1]} {e.year}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{e.notes || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary btn-sm" onClick={() => openEdit(e)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(e.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} total={expenses.length} onPage={setPage} onPageSize={setPageSize} />
        </div>
      )}
    </div>
  );
}
