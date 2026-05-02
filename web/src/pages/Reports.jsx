import { useState, useEffect } from 'react';
import api from '../api/axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function today() { return new Date().toISOString().split('T')[0]; }
function thisMonth() { return new Date().toISOString().slice(0, 7); }
function thisYear() { return new Date().getFullYear().toString(); }
function fmt(n) { return (n || 0).toFixed(2); }

function ExportButtons({ onExcel, onPdf }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn-ghost btn-sm" onClick={onExcel} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        📊 Excel
      </button>
      <button className="btn-ghost btn-sm" onClick={onPdf} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        📄 PDF
      </button>
    </div>
  );
}

function DailyReport() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (f = from, t = to) => {
    setLoading(true);
    try { const r = await api.get(`/reports/daily?from=${f}&to=${t}`); setData(r.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    const label = from === to ? from : `${from} to ${to}`;

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['Kulfi ICE — Daily Report', label],
      [],
      ['Metric', 'Value'],
      ['Units Purchased', data.summary.unitsPurchased],
      ['Units Sold', data.summary.unitsSold],
      ['Purchase Cost', `₹${fmt(data.summary.totalPurchaseCost)}`],
      ['Revenue', `₹${fmt(data.summary.totalRevenue)}`],
      ['Profit', `₹${fmt(data.summary.totalProfit)}`],
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    if (data.purchases.length) {
      const purchaseSheet = XLSX.utils.json_to_sheet(data.purchases.map(p => ({
        Product: p.productName, Quantity: p.quantity, 'Total Cost': p.totalCost,
      })));
      XLSX.utils.book_append_sheet(wb, purchaseSheet, 'Purchases');
    }

    if (data.sales.length) {
      const salesSheet = XLSX.utils.json_to_sheet(data.sales.map(s => ({
        Product: s.productName, Quantity: s.quantity, Revenue: s.totalRevenue, Profit: s.profit,
      })));
      XLSX.utils.book_append_sheet(wb, salesSheet, 'Sales');
    }

    XLSX.writeFile(wb, `KulfiICE_Daily_${label.replace(/ to /g, '_to_')}.xlsx`);
  };

  const exportPdf = () => {
    if (!data) return;
    const label = from === to ? from : `${from} to ${to}`;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Kulfi ICE — Daily Report: ${label}`, 14, 18);

    doc.setFontSize(11);
    doc.text('Summary', 14, 30);
    autoTable(doc, {
      startY: 34,
      head: [['Metric', 'Value']],
      body: [
        ['Units Purchased', data.summary.unitsPurchased],
        ['Units Sold', data.summary.unitsSold],
        ['Purchase Cost', `₹${fmt(data.summary.totalPurchaseCost)}`],
        ['Revenue', `₹${fmt(data.summary.totalRevenue)}`],
        ['Profit', `₹${fmt(data.summary.totalProfit)}`],
      ],
      theme: 'striped',
    });

    if (data.purchases.length) {
      doc.text('Purchases', 14, doc.lastAutoTable.finalY + 12);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [['Product', 'Qty', 'Total Cost']],
        body: data.purchases.map(p => [p.productName, p.quantity, `₹${fmt(p.totalCost)}`]),
        theme: 'striped',
      });
    }

    if (data.sales.length) {
      doc.text('Sales', 14, doc.lastAutoTable.finalY + 12);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [['Product', 'Qty', 'Revenue', 'Profit']],
        body: data.sales.map(s => [s.productName, s.quantity, `₹${fmt(s.totalRevenue)}`, `₹${fmt(s.profit)}`]),
        theme: 'striped',
      });
    }

    doc.save(`KulfiICE_Daily_${label.replace(/ to /g, '_to_')}.pdf`);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>From</label>
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); load(e.target.value, to); }} style={{ width: 160 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>To</label>
          <input type="date" value={to} onChange={e => { setTo(e.target.value); load(from, e.target.value); }} style={{ width: 160 }} />
        </div>
        {data && <ExportButtons onExcel={exportExcel} onPdf={exportPdf} />}
      </div>
      {data && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <div className="kpi-card"><div className="label">Units Purchased</div><div className="value">{fmt(data.summary.unitsPurchased)}</div></div>
            <div className="kpi-card"><div className="label">Units Sold</div><div className="value">{fmt(data.summary.unitsSold)}</div></div>
            <div className="kpi-card"><div className="label">Purchase Cost</div><div className="value">₹{fmt(data.summary.totalPurchaseCost)}</div></div>
            <div className="kpi-card"><div className="label">Revenue</div><div className="value">₹{fmt(data.summary.totalRevenue)}</div></div>
            <div className="kpi-card"><div className="label">Profit</div><div className="value" style={{ color: 'var(--success)' }}>₹{fmt(data.summary.totalProfit)}</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="section-title">Purchases</div>
              {data.purchases.length === 0 ? <p className="empty-state">None</p> : (
                <table><thead><tr><th>Product</th><th>Qty</th><th>Cost</th></tr></thead>
                  <tbody>{data.purchases.map((p, i) => (
                    <tr key={i}><td>{p.productName}</td><td>{p.quantity}</td><td>₹{fmt(p.totalCost)}</td></tr>
                  ))}</tbody>
                </table>
              )}
            </div>
            <div className="card">
              <div className="section-title">Sales</div>
              {data.sales.length === 0 ? <p className="empty-state">None</p> : (
                <table><thead><tr><th>Product</th><th>Qty</th><th>Revenue</th><th>Profit</th></tr></thead>
                  <tbody>{data.sales.map((s, i) => (
                    <tr key={i}><td>{s.productName}</td><td>{s.quantity}</td><td>₹{fmt(s.totalRevenue)}</td>
                      <td style={{ color: s.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{fmt(s.profit)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MonthlyReport() {
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async (m = month) => {
    setLoading(true);
    try { const r = await api.get(`/reports/monthly?month=${m}`); setData(r.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['Kulfi ICE — Monthly Report', month],
      [],
      ['Purchase Cost', `₹${fmt(data.summary.totalPurchaseCost)}`],
      ['Revenue', `₹${fmt(data.summary.totalRevenue)}`],
      ['Profit', `₹${fmt(data.summary.totalProfit)}`],
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    const daySheet = XLSX.utils.json_to_sheet(data.dayWise.map(d => ({
      Date: d.date, 'Purchase Cost': d.purchaseCost, Revenue: d.revenue, Profit: d.profit,
    })));
    XLSX.utils.book_append_sheet(wb, daySheet, 'Day-wise');

    const productSheet = XLSX.utils.json_to_sheet(data.productWise.map(p => ({
      Product: p.productName, 'Units Sold': p.unitsSold, Revenue: p.totalRevenue, Profit: p.totalProfit,
    })));
    XLSX.utils.book_append_sheet(wb, productSheet, 'Product-wise');

    XLSX.writeFile(wb, `KulfiICE_Monthly_${month}.xlsx`);
  };

  const exportPdf = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Kulfi ICE — Monthly Report: ${month}`, 14, 18);

    autoTable(doc, {
      startY: 26,
      head: [['Purchase Cost', 'Revenue', 'Profit']],
      body: [[`₹${fmt(data.summary.totalPurchaseCost)}`, `₹${fmt(data.summary.totalRevenue)}`, `₹${fmt(data.summary.totalProfit)}`]],
      theme: 'striped',
    });

    doc.text('Day-wise Breakdown', 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Date', 'Purchase Cost', 'Revenue', 'Profit']],
      body: data.dayWise.map(d => [d.date, `₹${fmt(d.purchaseCost)}`, `₹${fmt(d.revenue)}`, `₹${fmt(d.profit)}`]),
      theme: 'striped',
    });

    doc.text('Product-wise Summary', 14, doc.lastAutoTable.finalY + 12);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Product', 'Units Sold', 'Revenue', 'Profit']],
      body: data.productWise.map(p => [p.productName, p.unitsSold, `₹${fmt(p.totalRevenue)}`, `₹${fmt(p.totalProfit)}`]),
      theme: 'striped',
    });

    doc.save(`KulfiICE_Monthly_${month}.pdf`);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <input type="month" value={month} onChange={e => { setMonth(e.target.value); load(e.target.value); }} style={{ width: 180 }} />
        {loading && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</span>}
        {data && <ExportButtons onExcel={exportExcel} onPdf={exportPdf} />}
      </div>
      {data && (
        <>
          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <div className="kpi-card"><div className="label">Purchase Cost</div><div className="value">₹{fmt(data.summary.totalPurchaseCost)}</div></div>
            <div className="kpi-card"><div className="label">Revenue</div><div className="value">₹{fmt(data.summary.totalRevenue)}</div></div>
            <div className="kpi-card"><div className="label">Profit</div><div className="value" style={{ color: 'var(--success)' }}>₹{fmt(data.summary.totalProfit)}</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="section-title">Day-wise Breakdown</div>
              <table><thead><tr><th>Date</th><th>Purchase Cost</th><th>Revenue</th><th>Profit</th></tr></thead>
                <tbody>{data.dayWise.map((d, i) => (
                  <tr key={i}><td>{d.date}</td><td>₹{fmt(d.purchaseCost)}</td><td>₹{fmt(d.revenue)}</td>
                    <td style={{ color: d.profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{fmt(d.profit)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="card">
              <div className="section-title">Product-wise Summary</div>
              <table><thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Profit</th></tr></thead>
                <tbody>{data.productWise.map((p, i) => (
                  <tr key={i}><td>{p.productName}</td><td>{p.unitsSold}</td><td>₹{fmt(p.totalRevenue)}</td>
                    <td style={{ color: p.totalProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>₹{fmt(p.totalProfit)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function YearlyReport() {
  const [year, setYear] = useState(thisYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get(`/reports/yearly?year=${year}`); setData(r.data); }
    finally { setLoading(false); }
  };

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data.months.map(m => ({
      Month: m.label, 'Purchase Cost': m.purchaseCost, Revenue: m.revenue, Profit: m.profit,
    })));
    XLSX.utils.book_append_sheet(wb, sheet, `Year ${data.year}`);
    XLSX.writeFile(wb, `KulfiICE_Yearly_${year}.xlsx`);
  };

  const exportPdf = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Kulfi ICE — Yearly Report: ${data.year}`, 14, 18);
    autoTable(doc, {
      startY: 26,
      head: [['Month', 'Purchase Cost', 'Revenue', 'Profit']],
      body: data.months.map(m => [m.label, `₹${fmt(m.purchaseCost)}`, `₹${fmt(m.revenue)}`, `₹${fmt(m.profit)}`]),
      theme: 'striped',
    });
    doc.save(`KulfiICE_Yearly_${year}.pdf`);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <select value={year} onChange={e => setYear(e.target.value)} style={{ width: 120 }}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn-primary" onClick={load} disabled={loading}>{loading ? '…' : 'Load'}</button>
        {data && <ExportButtons onExcel={exportExcel} onPdf={exportPdf} />}
      </div>
      {data && (
        <div className="card">
          <div className="section-title">Month-wise Breakdown — {data.year}</div>
          <table>
            <thead><tr><th>Month</th><th>Purchase Cost</th><th>Revenue</th><th>Profit</th></tr></thead>
            <tbody>
              {data.months.map((m) => (
                <tr key={m.month}>
                  <td><strong>{m.label}</strong></td>
                  <td>₹{fmt(m.purchaseCost)}</td>
                  <td>₹{fmt(m.revenue)}</td>
                  <td style={{ color: m.profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>₹{fmt(m.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('monthly');
  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
        <p>Daily, monthly and yearly business reports — export to Excel or PDF</p>
      </div>
      <div className="tabs">
        {['daily', 'monthly', 'yearly'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'daily' && <DailyReport />}
      {tab === 'monthly' && <MonthlyReport />}
      {tab === 'yearly' && <YearlyReport />}
    </div>
  );
}
