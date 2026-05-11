export default function Pagination({ page, pageSize, total, onPage, onPageSize, pageSizeOptions = [10, 20, 50, 100] }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  // Build page number list with ellipsis: always show first, last, current ±1
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const near = new Set([1, totalPages, page - 1, page, page + 1].filter(n => n >= 1 && n <= totalPages));
    let prev = 0;
    [...near].sort((a, b) => a - b).forEach(n => {
      if (prev && n - prev > 1) pages.push('…');
      pages.push(n);
      prev = n;
    });
  }

  const btn = (content, onClick, active = false, disabled = false) => (
    <button
      key={content}
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 34, height: 34, padding: '0 8px',
        borderRadius: 7,
        border: active ? '2px solid var(--primary)' : '1.5px solid var(--border)',
        background: active ? 'var(--primary)' : 'var(--bg)',
        color: active ? '#fff' : disabled ? 'var(--text-muted)' : 'var(--text)',
        fontWeight: active ? 700 : 500, fontSize: 13,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'all 0.12s',
      }}
    >
      {content}
    </button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 16, padding: '10px 0' }}>
      {/* Info */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {total === 0 ? 'No records' : `Showing ${from}–${to} of ${total}`}
      </div>

      {/* Pages */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        {btn('‹ Prev', () => onPage(page - 1), false, page === 1)}
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 13, lineHeight: '34px' }}>…</span>
            : btn(p, () => onPage(p), p === page)
        )}
        {btn('Next ›', () => onPage(page + 1), false, page === totalPages)}
      </div>

      {/* Page size */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)' }}>Per page:</span>
        <select
          value={pageSize}
          onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
        >
          {pageSizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}
