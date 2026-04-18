import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Media() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const load = () => {
    api.get('/media').then(r => { setMedia(r.data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);
        await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Delete "${filename}"?`)) return;
    await api.delete(`/media/${filename}`);
    if (selected?.filename === filename) setSelected(null);
    load();
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Media</h1>
        <p>Upload and manage product images</p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--primary)' : '#B2DFDB'}`,
          borderRadius: 12,
          padding: '36px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'var(--primary-light)' : 'var(--bg)',
          marginBottom: 24,
          transition: 'all 0.2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files)}
        />
        {uploading ? (
          <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Uploading…</div>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🖼️</div>
            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Click to upload or drag & drop</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG, GIF, WebP — max 5MB each</div>
          </>
        )}
      </div>

      {media.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No images uploaded yet. Click above to upload.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {media.map(m => (
            <div
              key={m.filename}
              onClick={() => setSelected(selected?.filename === m.filename ? null : m)}
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                border: selected?.filename === m.filename ? '3px solid var(--primary)' : '3px solid transparent',
                cursor: 'pointer',
                background: 'var(--bg-white)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'border 0.15s',
              }}
            >
              <div style={{ height: 140, background: 'var(--th-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img
                  src={m.url}
                  alt={m.filename}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.filename.split('_').slice(2).join('_') || m.filename}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{formatSize(m.size)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Right Drawer */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 340,
            background: 'var(--bg-white)', zIndex: 1001, boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.22s ease',
          }}>
            <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Image Details</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {/* Preview */}
              <div style={{ background: 'var(--th-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, marginBottom: 18 }}>
                <img src={selected.url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
              </div>

              {/* Filename */}
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, wordBreak: 'break-all' }}>
                {selected.filename.split('_').slice(2).join('_') || selected.filename}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Size: {formatSize(selected.size)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
                Uploaded: {new Date(selected.createdAt).toLocaleDateString('en-IN')}
              </div>

              {/* URL */}
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Image URL</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input
                  readOnly
                  value={selected.url}
                  style={{ flex: 1, fontSize: 11, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--input-bg)', minWidth: 0, color: 'var(--text)' }}
                />
                <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 12, whiteSpace: 'nowrap' }} onClick={() => copyUrl(selected.url)}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => handleDelete(selected.filename)}
                style={{ width: '100%', padding: '10px', fontSize: 14, borderRadius: 8, border: '1.5px solid #e53935', color: '#e53935', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
              >
                Delete Image
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
