import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Template 1: Classic Blue ─────────────────────────────────────────────────
function TemplateClassic({ order, company, docType }) {
  const subtotal = order.items?.reduce((s, i) => s + i.totalPrice, 0) || 0;
  const discAmt = subtotal * (order.discount / 100);
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#1a1a2e', background: '#fff', padding: 0, minHeight: 1000 }}>
      {/* Header */}
      <div style={{ background: '#1a3a6b', color: '#fff', padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {company.logoUrl && <img src={company.logoUrl} alt="logo" style={{ height: 50, marginBottom: 10, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} onError={e => e.target.style.display='none'} />}
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>{company.companyName || 'Your Company'}</div>
          {company.tagline && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>{company.tagline}</div>}
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 8, lineHeight: 1.7 }}>
            {company.address && <div>{company.address}{company.city ? `, ${company.city}` : ''}</div>}
            {company.phone && <div>📞 {company.phone}</div>}
            {company.email && <div>✉ {company.email}</div>}
            {company.gstin && <div>GSTIN: {company.gstin}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.9 }}>{docType}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8, background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 6, display: 'inline-block' }}>{order.orderNumber}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Date: {fmtDate(order.createdAt)}</div>
          {order.eventDate && <div style={{ fontSize: 12, opacity: 0.8 }}>Event: {fmtDate(order.eventDate)}</div>}
        </div>
      </div>

      <div style={{ padding: '28px 40px' }}>
        {/* Bill To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#1a3a6b', marginBottom: 10, borderBottom: '2px solid #1a3a6b', paddingBottom: 6 }}>Bill To</div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{order.customerName}</div>
            {order.customerPhone && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>📞 {order.customerPhone}</div>}
            {(order.customerEmail || order.customer?.email) && <div style={{ fontSize: 12, color: '#555' }}>✉ {order.customerEmail || order.customer?.email}</div>}
            {order.customer?.address && <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{order.customer.address}{order.customer.city ? `, ${order.customer.city}` : ''}</div>}
            {order.customer?.gstin && <div style={{ fontSize: 11, color: '#777', marginTop: 4, fontFamily: 'monospace' }}>GSTIN: {order.customer.gstin}</div>}
          </div>
          <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#1a3a6b', marginBottom: 10, borderBottom: '2px solid #1a3a6b', paddingBottom: 6 }}>Order Details</div>
            {[
              [docType + ' No.', order.orderNumber],
              ['Date', fmtDate(order.createdAt)],
              ['Event Date', fmtDate(order.eventDate)],
              ['Branch', order.branch?.name],
              ['Status', order.status?.replace('_', ' ')],
            ].map(([k, v]) => v && v !== '—' ? (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: '#777' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ) : null)}
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
          <thead>
            <tr style={{ background: '#1a3a6b', color: '#fff' }}>
              {['#', 'Product', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: i > 1 ? 'right' : 'left', fontSize: 12, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#fff' }}>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#777' }}>{idx + 1}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{item.product?.name}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13 }}>{item.quantity}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13 }}>{fmt(item.pricePerUnit)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{fmt(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
          <div style={{ width: 280 }}>
            {[
              ['Subtotal', fmt(subtotal), false],
              order.discount > 0 ? [`Discount (${order.discount}%)`, `- ${fmt(discAmt)}`, false] : null,
              ['Total Amount', fmt(order.totalAmount), true],
              docType === 'INVOICE' && order.paidAmount > 0 ? ['Amount Paid', fmt(order.paidAmount), false] : null,
              docType === 'INVOICE' && order.paidAmount > 0 ? ['Balance Due', fmt(order.totalAmount - order.paidAmount), false] : null,
            ].filter(Boolean).map(([k, v, bold]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: bold ? '10px 14px' : '6px 14px', background: bold ? '#1a3a6b' : '#f8fafc', color: bold ? '#fff' : '#333', borderRadius: bold ? 6 : 0, fontWeight: bold ? 800 : 500, fontSize: bold ? 15 : 13, marginBottom: 2 }}>
                <span>{k}</span><span>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bank & Terms */}
        <div style={{ display: 'grid', gridTemplateColumns: company.bankName ? '1fr 1fr' : '1fr', gap: 20, borderTop: '1.5px solid #e2e8f0', paddingTop: 20 }}>
          {company.bankName && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#1a3a6b', marginBottom: 8 }}>Bank Details</div>
              {[['Account Name', company.bankAccountName], ['Bank', company.bankName], ['Account No.', company.bankAccount], ['IFSC', company.bankIfsc]].map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#777', minWidth: 90 }}>{k}:</span><span style={{ fontWeight: 600, fontFamily: k.includes('Acc') || k === 'IFSC' ? 'monospace' : undefined }}>{v}</span>
                </div>
              ) : null)}
            </div>
          )}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#1a3a6b', marginBottom: 8 }}>Terms & Conditions</div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>{company.invoiceTerms || 'Thank you for your business!'}</div>
            {order.notes && <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}><strong>Notes:</strong> {order.notes}</div>}
          </div>
        </div>
      </div>

      <div style={{ background: '#1a3a6b', color: '#fff', padding: '12px 40px', textAlign: 'center', fontSize: 11, opacity: 0.85 }}>
        {company.website && `${company.website} · `}{company.phone} · {company.email || company.companyName}
      </div>
    </div>
  );
}

// ─── Template 2: Modern Dark ──────────────────────────────────────────────────
function TemplateModern({ order, company, docType }) {
  const subtotal = order.items?.reduce((s, i) => s + i.totalPrice, 0) || 0;
  const discAmt = subtotal * (order.discount / 100);
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", color: '#1f2937', background: '#fff', minHeight: 1000 }}>
      <div style={{ background: '#111827', padding: '36px 44px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {company.logoUrl && <img src={company.logoUrl} alt="logo" style={{ height: 44, marginBottom: 10, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} onError={e => e.target.style.display='none'} />}
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>{company.companyName || 'Your Company'}</div>
          {company.tagline && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{company.tagline}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3 }}>{docType}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: 1, marginTop: 4 }}>{order.orderNumber}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{fmtDate(order.createdAt)}</div>
        </div>
      </div>

      <div style={{ background: '#f59e0b', height: 4 }} />

      <div style={{ padding: '32px 44px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Billed To</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#111827' }}>{order.customerName}</div>
            {order.customerPhone && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 5 }}>{order.customerPhone}</div>}
            {(order.customerEmail || order.customer?.email) && <div style={{ fontSize: 13, color: '#6b7280' }}>{order.customerEmail || order.customer?.email}</div>}
            {order.customer?.address && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 5 }}>{order.customer.address}{order.customer.city ? `, ${order.customer.city}` : ''}</div>}
            {order.customer?.gstin && <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 3 }}>GSTIN: {order.customer.gstin}</div>}
          </div>
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Details</div>
            {[
              ['Branch', order.branch?.name],
              ['Event Date', fmtDate(order.eventDate)],
              ['Status', order.status?.replace('_', ' ')],
            ].map(([k, v]) => v && v !== '—' ? (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
                <span style={{ color: '#9ca3af' }}>{k}</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{v}</span>
              </div>
            ) : null)}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr>
              {['#', 'Item', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: i > 1 ? 'right' : 'left', fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '2px solid #f59e0b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af' }}>{idx + 1}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{item.product?.name}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>{item.quantity}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>{fmt(item.pricePerUnit)}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#111827' }}>{fmt(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 300 }}>
            {company.bankName && <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Payment Info</div>
              {[['Account Name', company.bankAccountName], ['Bank', company.bankName], ['Account No.', company.bankAccount], ['IFSC', company.bankIfsc]].map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#9ca3af', minWidth: 90 }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ) : null)}
            </div>}
          </div>
          <div style={{ width: 260, background: '#111827', borderRadius: 12, padding: '20px 24px' }}>
            {subtotal !== order.totalAmount && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', fontSize: 13, marginBottom: 6 }}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>}
            {order.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontSize: 13, marginBottom: 6 }}>
              <span>Discount ({order.discount}%)</span><span>- {fmt(discAmt)}</span>
            </div>}
            <div style={{ borderTop: '1px solid #374151', margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 800, fontSize: 18 }}>
              <span>Total</span><span>{fmt(order.totalAmount)}</span>
            </div>
            {docType === 'INVOICE' && order.paidAmount > 0 && <>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontSize: 13, marginTop: 8 }}>
                <span>Paid</span><span>{fmt(order.paidAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171', fontWeight: 700, fontSize: 14, marginTop: 4 }}>
                <span>Balance</span><span>{fmt(order.totalAmount - order.paidAmount)}</span>
              </div>
            </>}
          </div>
        </div>

        <div style={{ marginTop: 28, borderTop: '1px solid #f3f4f6', paddingTop: 16, color: '#9ca3af', fontSize: 12, lineHeight: 1.7 }}>
          {company.invoiceTerms || 'Thank you for your business!'}{order.notes && ` · Note: ${order.notes}`}
        </div>
      </div>
    </div>
  );
}

// ─── Template 3: Elegant Gold ─────────────────────────────────────────────────
function TemplateElegant({ order, company, docType }) {
  const subtotal = order.items?.reduce((s, i) => s + i.totalPrice, 0) || 0;
  const discAmt = subtotal * (order.discount / 100);
  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#2d1b00', background: '#fffdf7', minHeight: 1000, border: '2px solid #c9972d' }}>
      {/* Ornamental header */}
      <div style={{ borderBottom: '4px double #c9972d', padding: '32px 44px', textAlign: 'center', background: 'linear-gradient(to bottom, #fffdf7, #fdf6e3)' }}>
        {company.logoUrl && <img src={company.logoUrl} alt="logo" style={{ height: 52, marginBottom: 12, objectFit: 'contain' }} onError={e => e.target.style.display='none'} />}
        <div style={{ fontSize: 26, fontWeight: 700, color: '#2d1b00', letterSpacing: 2 }}>{company.companyName || 'Your Company'}</div>
        {company.tagline && <div style={{ fontSize: 12, color: '#8b6914', marginTop: 4, fontStyle: 'italic' }}>{company.tagline}</div>}
        <div style={{ fontSize: 11, color: '#8b6914', marginTop: 8, lineHeight: 1.8 }}>
          {[company.address && company.city ? `${company.address}, ${company.city}` : company.address, company.phone, company.email].filter(Boolean).join('  ·  ')}
        </div>
        <div style={{ width: 60, height: 2, background: 'linear-gradient(to right, transparent, #c9972d, transparent)', margin: '16px auto 0' }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: '#8b6914', letterSpacing: 6, textTransform: 'uppercase', marginTop: 12 }}>{docType}</div>
        <div style={{ fontSize: 13, color: '#2d1b00', marginTop: 6 }}>{order.orderNumber} &nbsp;·&nbsp; {fmtDate(order.createdAt)}</div>
      </div>

      <div style={{ padding: '28px 44px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28, borderBottom: '1px solid #c9972d', paddingBottom: 24 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8b6914', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Prepared For</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{order.customerName}</div>
            {order.customerPhone && <div style={{ fontSize: 12, color: '#6b5427', marginTop: 5 }}>{order.customerPhone}</div>}
            {(order.customerEmail || order.customer?.email) && <div style={{ fontSize: 12, color: '#6b5427' }}>{order.customerEmail || order.customer?.email}</div>}
            {order.customer?.address && <div style={{ fontSize: 12, color: '#8b6914', marginTop: 5 }}>{order.customer.address}{order.customer.city ? `, ${order.customer.city}` : ''}</div>}
            {order.customer?.gstin && <div style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 3, color: '#8b6914' }}>GSTIN: {order.customer.gstin}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            {order.eventDate && <div style={{ fontSize: 12, color: '#6b5427' }}>Event Date: <strong>{fmtDate(order.eventDate)}</strong></div>}
            {order.branch?.name && <div style={{ fontSize: 12, color: '#6b5427' }}>Branch: <strong>{order.branch.name}</strong></div>}
            <div style={{ marginTop: 10, padding: '10px 16px', background: '#c9972d', borderRadius: 6, display: 'inline-block' }}>
              <div style={{ fontSize: 11, color: '#fff8e7', letterSpacing: 1 }}>TOTAL AMOUNT</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{fmt(order.totalAmount)}</div>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #c9972d', borderTop: '1px solid #c9972d' }}>
              {['No.', 'Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: i > 1 ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#8b6914', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #ecdbb0' }}>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#8b6914', fontStyle: 'italic' }}>{idx + 1}</td>
                <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>{item.product?.name}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>{item.quantity}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13 }}>{fmt(item.pricePerUnit)}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>{fmt(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ width: 280, border: '1px solid #c9972d', borderRadius: 6 }}>
            {order.discount > 0 && <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: 13, borderBottom: '1px solid #ecdbb0' }}>
                <span style={{ color: '#8b6914' }}>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: 13, borderBottom: '1px solid #ecdbb0' }}>
                <span style={{ color: '#8b6914' }}>Discount ({order.discount}%)</span><span>- {fmt(discAmt)}</span>
              </div>
            </>}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', fontWeight: 700, fontSize: 16, background: '#fdf6e3', borderRadius: '0 0 6px 6px' }}>
              <span>Grand Total</span><span style={{ color: '#c9972d' }}>{fmt(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #ecdbb0', paddingTop: 20, display: 'grid', gridTemplateColumns: company.bankName ? '1fr 1fr' : '1fr', gap: 20 }}>
          {company.bankName && <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8b6914', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Bank Details</div>
            {[['Account Name', company.bankAccountName], ['Bank', company.bankName], ['Account No.', company.bankAccount], ['IFSC', company.bankIfsc]].map(([k, v]) => v ? (
              <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#8b6914', minWidth: 90 }}>{k}:</span><span>{v}</span>
              </div>
            ) : null)}
          </div>}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8b6914', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Terms</div>
            <div style={{ fontSize: 12, color: '#6b5427', lineHeight: 1.7, fontStyle: 'italic' }}>"{company.invoiceTerms || 'Thank you for your business!'}"</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template 4: Vibrant Gradient ─────────────────────────────────────────────
function TemplateVibrant({ order, company, docType }) {
  const subtotal = order.items?.reduce((s, i) => s + i.totalPrice, 0) || 0;
  const discAmt = subtotal * (order.discount / 100);
  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#fff', minHeight: 1000, color: '#1e1b4b' }}>
      <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)', padding: '36px 44px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 100, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {company.logoUrl && <img src={company.logoUrl} alt="logo" style={{ height: 46, marginBottom: 10, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} onError={e => e.target.style.display='none'} />}
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{company.companyName || 'Your Company'}</div>
            {company.tagline && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>{company.tagline}</div>}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: '18px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.25)' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>{docType}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 4 }}>{order.orderNumber}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{fmtDate(order.createdAt)}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 44px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '18px 22px', borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Customer</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#1e1b4b' }}>{order.customerName}</div>
            {order.customerPhone && <div style={{ fontSize: 13, color: '#6366f1', marginTop: 5 }}>📞 {order.customerPhone}</div>}
            {(order.customerEmail || order.customer?.email) && <div style={{ fontSize: 12, color: '#6366f1' }}>✉ {order.customerEmail || order.customer?.email}</div>}
            {order.customer?.address && <div style={{ fontSize: 12, color: '#8b5cf6', marginTop: 5 }}>{order.customer.address}{order.customer.city ? `, ${order.customer.city}` : ''}</div>}
            {order.customer?.gstin && <div style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 3, color: '#7c3aed' }}>GSTIN: {order.customer.gstin}</div>}
          </div>
          <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '18px 22px', borderLeft: '4px solid #0ea5e9' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Event Info</div>
            {[['Branch', order.branch?.name], ['Event Date', fmtDate(order.eventDate)], ['Status', order.status?.replace('_', ' ')]].map(([k, v]) => v && v !== '—' ? (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 7 }}>
                <span style={{ color: '#6b7280' }}>{k}</span><span style={{ fontWeight: 700, color: '#1e1b4b' }}>{v}</span>
              </div>
            ) : null)}
          </div>
        </div>

        <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 16px rgba(124,58,237,0.08)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }}>
                {['#', 'Product', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: i > 1 ? 'right' : 'left', fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{String(idx + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: '#1e1b4b' }}>{item.product?.name}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>{item.quantity}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#6b7280' }}>{fmt(item.pricePerUnit)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, fontSize: 14, color: '#7c3aed' }}>{fmt(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 14, padding: '20px 28px', minWidth: 260, color: '#fff' }}>
            {order.discount > 0 && <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, opacity: 0.8 }}>
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10, opacity: 0.8 }}>
                <span>Discount ({order.discount}%)</span><span>- {fmt(discAmt)}</span>
              </div>
            </>}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 22 }}>
              <span>Total</span><span>{fmt(order.totalAmount)}</span>
            </div>
            {docType === 'INVOICE' && order.paidAmount > 0 && <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.85 }}>
              <span>Balance</span><span>{fmt(order.totalAmount - order.paidAmount)}</span>
            </div>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: company.bankName ? '1fr 1fr' : '1fr', gap: 16, background: '#f5f3ff', borderRadius: 12, padding: '18px 22px' }}>
          {company.bankName && <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Payment Details</div>
            {[['Account Name', company.bankAccountName], ['Bank', company.bankName], ['Account No.', company.bankAccount], ['IFSC', company.bankIfsc]].map(([k, v]) => v ? (
              <div key={k} style={{ fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#8b5cf6' }}>{k}: </span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ) : null)}
          </div>}
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Terms</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>{company.invoiceTerms || 'Thank you for your business!'}</div>
            {order.notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}><strong>Note:</strong> {order.notes}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template 5: Minimal Clean ────────────────────────────────────────────────
function TemplateMinimal({ order, company, docType }) {
  const subtotal = order.items?.reduce((s, i) => s + i.totalPrice, 0) || 0;
  const discAmt = subtotal * (order.discount / 100);
  return (
    <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif", background: '#fff', minHeight: 1000, color: '#111', padding: '52px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
        <div>
          {company.logoUrl && <img src={company.logoUrl} alt="logo" style={{ height: 40, objectFit: 'contain', marginBottom: 10 }} onError={e => e.target.style.display='none'} />}
          <div style={{ fontSize: 20, fontWeight: 700 }}>{company.companyName || 'Your Company'}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 6, lineHeight: 1.8 }}>
            {[company.address && company.city ? `${company.address}, ${company.city}` : company.address, company.phone, company.email].filter(Boolean).map((v, i) => <div key={i}>{v}</div>)}
            {company.gstin && <div style={{ fontFamily: 'monospace', fontSize: 11 }}>GSTIN: {company.gstin}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, color: '#111' }}>{docType}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 6, fontFamily: 'monospace' }}>{order.orderNumber}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{fmtDate(order.createdAt)}</div>
        </div>
      </div>

      <div style={{ height: 2, background: '#111', marginBottom: 40 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 44 }}>
        <div>
          <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>Bill To</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{order.customerName}</div>
          {[order.customerPhone, order.customerEmail || order.customer?.email, order.customer?.address && (order.customer.address + (order.customer.city ? `, ${order.customer.city}` : '')), order.customer?.gstin && `GSTIN: ${order.customer.gstin}`].filter(Boolean).map((v, i) => (
            <div key={i} style={{ fontSize: 13, color: '#555', marginTop: 4, fontFamily: v?.includes('GSTIN') ? 'monospace' : undefined }}>{v}</div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>Details</div>
          {[['Branch', order.branch?.name], ['Event Date', fmtDate(order.eventDate)], ['Status', order.status?.replace('_', ' ')]].map(([k, v]) => v && v !== '—' ? (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f3f4f6', padding: '6px 0' }}>
              <span style={{ color: '#888' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ) : null)}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #111', borderTop: '2px solid #111' }}>
            {['#', 'Item', 'Qty', 'Rate', 'Amount'].map((h, i) => (
              <th key={h} style={{ padding: '10px 0', textAlign: i > 1 ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px 0', fontSize: 12, color: '#aaa' }}>{idx + 1}</td>
              <td style={{ padding: '12px 0', fontWeight: 600, fontSize: 14 }}>{item.product?.name}</td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontSize: 13, color: '#555' }}>{item.quantity}</td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontSize: 13, color: '#555' }}>{fmt(item.pricePerUnit)}</td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>{fmt(item.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 40 }}>
        <div style={{ width: 260 }}>
          {order.discount > 0 && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', color: '#888' }}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', color: '#888' }}>
              <span>Discount ({order.discount}%)</span><span>- {fmt(discAmt)}</span>
            </div>
          </>}
          <div style={{ height: 2, background: '#111', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 20, padding: '4px 0' }}>
            <span>Total</span><span>{fmt(order.totalAmount)}</span>
          </div>
          {docType === 'INVOICE' && order.paidAmount > 0 && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#555' }}>
              <span>Paid</span><span>{fmt(order.paidAmount)}</span>
            </div>
            <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, padding: '4px 0' }}>
              <span>Balance Due</span><span>{fmt(order.totalAmount - order.paidAmount)}</span>
            </div>
          </>}
        </div>
      </div>

      <div style={{ height: 1, background: '#e5e7eb', marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: company.bankName ? '1fr 1fr' : '1fr', gap: 32, fontSize: 12, color: '#555' }}>
        {company.bankName && <div>
          <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>Bank Details</div>
          {[['Account Name', company.bankAccountName], ['Bank', company.bankName], ['Account No.', company.bankAccount], ['IFSC', company.bankIfsc]].map(([k, v]) => v ? (
            <div key={k} style={{ marginBottom: 4 }}><span style={{ color: '#aaa' }}>{k}: </span>{v}</div>
          ) : null)}
        </div>}
        <div>
          <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>Terms</div>
          <div style={{ lineHeight: 1.8 }}>{company.invoiceTerms || 'Thank you for your business!'}</div>
          {order.notes && <div style={{ marginTop: 8 }}>Note: {order.notes}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Template Map ─────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'classic',  label: 'Classic Blue',      Component: TemplateClassic  },
  { id: 'modern',   label: 'Modern Dark',        Component: TemplateModern  },
  { id: 'elegant',  label: 'Elegant Gold',       Component: TemplateElegant },
  { id: 'vibrant',  label: 'Vibrant Gradient',   Component: TemplateVibrant },
  { id: 'minimal',  label: 'Minimal Clean',      Component: TemplateMinimal },
];

// ─── Main DocumentView ────────────────────────────────────────────────────────
export default function DocumentView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const docType = (searchParams.get('type') || 'quotation').toUpperCase();
  const templateId = searchParams.get('template') || 'classic';

  const [order, setOrder] = useState(null);
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const docRef = useRef();

  const tpl = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];

  useEffect(() => {
    Promise.all([
      api.get(`/bulk-orders/${id}`),
      api.get('/settings'),
    ]).then(([or, sr]) => {
      setOrder(or.data);
      setCompany(sr.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const switchTemplate = (tid) => {
    navigate(`/bulk-orders/${id}/document?type=${searchParams.get('type') || 'quotation'}&template=${tid}`, { replace: true });
  };

  const handleExportPDF = async () => {
    if (!docRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(docRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      let yPos = 0;
      const pageH = pdf.internal.pageSize.getHeight();
      while (yPos < pdfH) {
        if (yPos > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yPos, pdfW, pdfH);
        yPos += pageH;
      }
      const filename = `${order.orderNumber}-${docType.toLowerCase()}.pdf`;
      pdf.save(filename);
    } finally { setExporting(false); }
  };

  const handlePrint = () => {
    const printContent = docRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html><html><head><title>${order.orderNumber} - ${docType}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; }
      @media print { @page { margin: 0; size: A4; } }
    </style></head><body>${printContent}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  const handleWhatsApp = () => {
    if (!order) return;
    const phone = order.customerPhone || order.customer?.phone || '';
    const itemLines = order.items?.map(i => `• ${i.product?.name} × ${i.quantity} = ${fmt(i.totalPrice)}`).join('\n') || '';
    const msg = `*${docType} - ${order.orderNumber}*\n\nDear ${order.customerName},\n\nItems:\n${itemLines}\n\n*Total: ${fmt(order.totalAmount)}*${order.paidAmount > 0 ? `\nPaid: ${fmt(order.paidAmount)}\nBalance: ${fmt(order.totalAmount - order.paidAmount)}` : ''}\n\n${company.companyName || ''}\n${company.phone || ''}`;
    const waPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${waPhone || ''}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleEmail = () => {
    if (!order) return;
    const to = order.customerEmail || order.customer?.email || '';
    const subject = `${docType} ${order.orderNumber} from ${company.companyName || 'Us'}`;
    const itemLines = order.items?.map(i => `  • ${i.product?.name} × ${i.quantity} = ${fmt(i.totalPrice)}`).join('\n') || '';
    const body = `Dear ${order.customerName},\n\nPlease find below the details for ${docType} ${order.orderNumber}:\n\nItems:\n${itemLines}\n\nTotal Amount: ${fmt(order.totalAmount)}${order.paidAmount > 0 ? `\nAmount Paid: ${fmt(order.paidAmount)}\nBalance Due: ${fmt(order.totalAmount - order.paidAmount)}` : ''}\n${order.eventDate ? `\nEvent Date: ${fmtDate(order.eventDate)}` : ''}\n\nThank you for choosing ${company.companyName || 'us'}.\n${company.phone ? `Contact us: ${company.phone}` : ''}`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 16, color: 'var(--text-muted)' }}>Loading…</div>;
  if (!order) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 16, color: 'var(--text-muted)' }}>Order not found</div>;

  const { Component } = tpl;

  return (
    <div>
      {/* Toolbar */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-secondary btn-sm" onClick={() => navigate('/bulk-orders')}>← Back</button>
          <div>
            <h1 style={{ marginBottom: 2 }}>{docType === 'INVOICE' ? 'Invoice' : 'Quotation'} — {order.orderNumber}</h1>
            <p style={{ margin: 0 }}>{order.customerName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={handleExportPDF} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {exporting ? 'Exporting…' : '⬇ Export PDF'}
          </button>
          <button className="btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            🖨 Print
          </button>
          <button
            onClick={handleWhatsApp}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            💬 WhatsApp
          </button>
          <button
            onClick={handleEmail}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#EA4335', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            ✉ Email
          </button>
        </div>
      </div>

      {/* Template switcher */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>Choose Template</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => switchTemplate(t.id)}
              style={{
                padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                border: `2px solid ${t.id === tpl.id ? 'var(--primary)' : 'var(--border)'}`,
                background: t.id === tpl.id ? 'var(--primary)' : 'var(--bg)',
                color: t.id === tpl.id ? '#fff' : 'var(--text)',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document preview */}
      <div style={{ boxShadow: '0 4px 40px rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden', maxWidth: 900, margin: '0 auto' }}>
        <div ref={docRef}>
          <Component order={order} company={company} docType={docType} />
        </div>
      </div>

      <div style={{ height: 40 }} />
    </div>
  );
}
