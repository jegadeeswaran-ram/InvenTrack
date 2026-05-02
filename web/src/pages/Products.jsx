import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const EMOJIS = ['🍦', '🍡', '🪔', '🍨', '🫙', '👑', '🥤', '🧁', '🍧', '🍰'];

function ProductImage({ imageUrl, size = 80 }) {
  const [err, setErr] = useState(false);
  if (imageUrl && !err) {
    return (
      <img
        src={imageUrl}
        alt=""
        onError={() => setErr(true)}
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 8 }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: 'var(--th-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
      </svg>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '🍦', sellingPrice: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [recentMedia, setRecentMedia] = useState([]);
  const fileInputRef = useRef();
  const inlineFileRef = useRef();

  const fetchProducts = () => {
    api.get('/products').then(r => { setProducts(r.data); setLoading(false); });
  };

  useEffect(() => { fetchProducts(); }, []);

  const loadRecentMedia = () => {
    api.get('/media').then(r => setRecentMedia(r.data.slice(0, 12)));
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm({ name: '', emoji: '🍦', sellingPrice: '', imageUrl: '' });
    setError('');
    loadRecentMedia();
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, emoji: p.emoji, sellingPrice: String(p.sellingPrice), imageUrl: p.imageUrl || '' });
    loadRecentMedia();
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Product name is required');
    if (!form.sellingPrice || isNaN(form.sellingPrice) || Number(form.sellingPrice) <= 0)
      return setError('Enter a valid selling price');

    setSaving(true);
    setError('');
    try {
      const payload = { ...form, sellingPrice: parseFloat(form.sellingPrice), imageUrl: form.imageUrl || null };
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const openMediaPicker = () => {
    api.get('/media').then(r => setMediaList(r.data));
    setShowMediaPicker(true);
  };

  const handleMediaUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);
        await api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      api.get('/media').then(r => setMediaList(r.data));
    } finally {
      setUploading(false);
    }
  };

  const handleInlineUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', files[0]);
      const r = await api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, imageUrl: r.data.url }));
      loadRecentMedia();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Products</h1>
          <p>Manage your kulfi product catalogue and selling prices</p>
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ marginTop: 4 }}>+ Add Product</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ width: 460, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: 20, fontSize: 18 }}>{editProduct ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Amul Punjabi Kulfi"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Product Image <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder="https://example.com/kulfi.png or select from media"
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn-secondary" onClick={openMediaPicker} style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    🖼️ Select Media
                  </button>
                </div>
                {form.imageUrl && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ProductImage imageUrl={form.imageUrl} size={64} />
                    <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: '' }))}
                      style={{ fontSize: 12, color: '#e53935', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Remove</button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ margin: 0 }}>Recent Images</label>
                  <button type="button" onClick={() => inlineFileRef.current.click()}
                    style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {uploading ? 'Uploading…' : '+ Upload New'}
                  </button>
                  <input ref={inlineFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleInlineUpload(e.target.files)} />
                </div>
                {recentMedia.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0' }}>No images uploaded yet. Click "+ Upload New" to add one.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
                    {recentMedia.map(m => (
                      <div
                        key={m.filename}
                        onClick={() => setForm(f => ({ ...f, imageUrl: m.url }))}
                        style={{
                          borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                          border: form.imageUrl === m.url ? '3px solid var(--primary)' : '3px solid transparent',
                          background: 'var(--th-bg)', aspectRatio: '1',
                        }}
                      >
                        <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => e.target.style.display = 'none'} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Selling Price (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 25"
                  value={form.sellingPrice}
                  onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
                />
              </div>

              {error && <div style={{ color: '#e53935', fontSize: 13, marginBottom: 12 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editProduct ? 'Update' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {products.map(p => (
          <div key={p.id} className="card" style={{ borderTop: '3px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <ProductImage imageUrl={p.imageUrl} size={90} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{p.name}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginTop: 8 }}>
              ₹{p.sellingPrice}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Selling Price</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={() => openEdit(p)}>Edit</button>
              <button
                style={{ flex: 1, fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #e53935', color: '#e53935', background: 'transparent', cursor: 'pointer' }}
                onClick={() => handleDelete(p.id)}
              >Remove</button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          No products yet. Click "+ Add Product" to get started.
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: 640, maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>🖼️ Select from Media</h2>
              <button onClick={() => setShowMediaPicker(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Upload in picker */}
            <div
              onClick={() => fileInputRef.current.click()}
              style={{ border: '2px dashed #B2DFDB', borderRadius: 8, padding: '14px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 16, background: 'var(--bg)' }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleMediaUpload(e.target.files)} />
              {uploading ? <span style={{ color: 'var(--primary)' }}>Uploading…</span> : <span style={{ color: 'var(--primary)', fontWeight: 600 }}>+ Upload New Image</span>}
            </div>

            {/* Grid */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {mediaList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No images uploaded yet</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {mediaList.map(m => (
                    <div
                      key={m.filename}
                      onClick={() => { setForm(f => ({ ...f, imageUrl: m.url })); setShowMediaPicker(false); }}
                      style={{
                        borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: form.imageUrl === m.url ? '3px solid var(--primary)' : '3px solid transparent',
                        background: 'var(--th-bg)', transition: 'border 0.15s',
                      }}
                    >
                      <img src={m.url} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                      <div style={{ padding: '4px 6px', fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.filename.split('_').slice(2).join('_') || m.filename}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowMediaPicker(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
