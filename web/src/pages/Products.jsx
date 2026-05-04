import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Trash2, Upload, X, ImageOff } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/endpoints/products';
import useStore from '../store/useStore';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import { StatusBadge } from '../components/ui/Badge';

const CATEGORIES = ['Kulfi', 'Special', 'Premium', 'Box', 'Other'];
const MAX_SIZE   = 2 * 1024 * 1024;

const emptyForm = {
  name: '', category: '', sku: '', price: '', costPrice: '',
  unit: 'PCS', openingStock: 0, minStockAlert: 5, description: '', isActive: true,
};

export default function Products() {
  const { user, addToast } = useStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setPreview]    = useState(null);
  const [imageError, setImageError]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [formErrors, setFormErrors]   = useState({});
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)   params.search   = search;
      if (category) params.category = category;
      const r = await getProducts({ ...params, limit: 100 });
      setProducts(r.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, category]);

  const openAdd = () => {
    setEditing(null); setForm(emptyForm);
    setImageFile(null); setPreview(null); setImageError('');
    setFormErrors({}); setModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, category: p.category, sku: p.sku, price: p.price, costPrice: p.costPrice,
              unit: p.unit, openingStock: p.openingStock, minStockAlert: p.minStockAlert,
              description: p.description || '', isActive: p.isActive });
    setImageFile(null); setPreview(p.imageUrl || null); setImageError('');
    setFormErrors({}); setModal(true);
  };

  const handleFile = (file) => {
    setImageError('');
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      return setImageError('Only JPEG, PNG, WebP allowed');
    }
    if (file.size > MAX_SIZE) return setImageError('Image must be under 2MB');
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.name)     e.name     = 'Name is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.sku)      e.sku      = 'SKU is required';
    if (form.price === '') e.price  = 'Price is required';
    if (form.costPrice === '') e.costPrice = 'Cost price is required';
    setFormErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        await updateProduct(editing.id, fd);
        addToast({ type: 'success', message: 'Product updated successfully' });
      } else {
        await createProduct(fd);
        addToast({ type: 'success', message: 'Product created successfully' });
      }
      setModal(false); load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Failed to save product' });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Soft-delete this product?')) return;
    try {
      await deleteProduct(id);
      addToast({ type: 'success', message: 'Product deactivated' });
      load();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Delete failed' });
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  const columns = [
    { key: 'imageUrl', label: 'Image', render: (v) => v
      ? <img src={v} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-100" />
      : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><ImageOff size={14} className="text-gray-400" /></div> },
    { key: 'name',     label: 'Name',     render: (v, r) => <span className="font-medium text-gray-900">{v}<br/><span className="text-xs text-gray-400">{r.sku}</span></span> },
    { key: 'category', label: 'Category' },
    { key: 'price',    label: 'Price',    render: (v) => fmt(v) },
    { key: 'costPrice',label: 'Cost',     render: (v) => fmt(v) },
    { key: 'unit',     label: 'Unit' },
    { key: 'minStockAlert', label: 'Min Alert' },
    { key: 'isActive', label: 'Status', render: (v) => <StatusBadge status={v ? 'ACTIVE' : 'CLOSED'} /> },
    { key: 'actions',  label: '', render: (_, r) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"><Edit size={15} /></button>
        {user.role === 'ADMIN' && <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><Trash2 size={15} /></button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 w-56" />
            </div>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-36">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </div>
          <Button onClick={openAdd}><Plus size={15} /> Add Product</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <Table columns={columns} data={products} loading={loading} emptyMessage="No products found" />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={formErrors.name} required />
          </div>
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} error={formErrors.category}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input label="SKU Code" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} error={formErrors.sku} />
          <Input label="Selling Price ₹" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} error={formErrors.price} />
          <Input label="Cost Price ₹" type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} error={formErrors.costPrice} />
          <Input label="Opening Stock" type="number" min="0" value={form.openingStock} onChange={(e) => setForm({ ...form, openingStock: Number(e.target.value) })} />
          <Input label="Min Stock Alert" type="number" min="0" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: Number(e.target.value) })} />
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1">Unit</label>
            <div className="flex gap-4">
              {['PCS','BOX'].map((u) => (
                <label key={u} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={u} checked={form.unit === u} onChange={() => setForm({ ...form, unit: u })} className="accent-indigo-600" />
                  <span className="text-sm text-gray-700">{u}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Image upload */}
          <div className="col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-2">Product Image</label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition"
            >
              {imagePreview ? (
                <div className="flex items-center gap-4">
                  <img src={imagePreview} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                  <div className="text-left">
                    <p className="text-sm text-gray-700">Image selected</p>
                    <button onClick={(e) => { e.stopPropagation(); setImageFile(null); setPreview(null); }}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1 mt-1">
                      <X size={12} /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <Upload size={24} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Drag & drop or <span className="text-indigo-600">browse</span></p>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — max 2MB</p>
                </div>
              )}
            </div>
            {imageError && <p className="text-xs text-red-600 mt-1">{imageError}</p>}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-indigo-600 w-4 h-4" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active product</label>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
          <Button className="flex-1" loading={submitting} onClick={handleSubmit}>
            {editing ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
