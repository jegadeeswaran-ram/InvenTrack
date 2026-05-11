import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import Pagination from '../components/Pagination';

// ── Company / Invoice Settings Tab ────────────────────────────────────────────
function CompanyTab() {
  const fileRef = useRef();
  const [form, setForm] = useState({
    companyName: '', tagline: '', logoUrl: '',
    address: '', city: '', state: '', pincode: '',
    phone: '', email: '', website: '',
    gstin: '', fssai: '',
    bankName: '', bankAccount: '', bankIfsc: '', bankAccountName: '',
    invoicePrefix: 'INV', invoiceTerms: 'Thank you for your business!',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    api.get('/settings').then(r => {
      const d = r.data;
      setForm({
        companyName: d.companyName || '', tagline: d.tagline || '', logoUrl: d.logoUrl || '',
        address: d.address || '', city: d.city || '', state: d.state || '', pincode: d.pincode || '',
        phone: d.phone || '', email: d.email || '', website: d.website || '',
        gstin: d.gstin || '', fssai: d.fssai || '',
        bankName: d.bankName || '', bankAccount: d.bankAccount || '',
        bankIfsc: d.bankIfsc || '', bankAccountName: d.bankAccountName || '',
        invoicePrefix: d.invoicePrefix || 'INV', invoiceTerms: d.invoiceTerms || '',
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleLogoUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', files[0]);
      const r = await api.post('/media/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, logoUrl: r.data.url }));
    } catch {
      setMsg({ type: 'error', text: 'Logo upload failed' });
    } finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg({ type: '', text: '' });
    try {
      await api.put('/settings', { ...form, logoUrl: form.logoUrl || null });
      setMsg({ type: 'success', text: 'Company settings saved!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save' });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="empty-state">Loading…</div>;

  return (
    <form onSubmit={handleSave}>
      {/* ── Identity ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Company Identity</div>

        {/* Logo */}
        <div className="form-group">
          <label>Company Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {form.logoUrl ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={form.logoUrl}
                  alt="logo"
                  style={{ height: 80, maxWidth: 200, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)', padding: 6, background: '#fff' }}
                  onError={e => e.target.style.display = 'none'}
                />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, logoUrl: '' }))}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >×</button>
              </div>
            ) : (
              <div style={{ width: 100, height: 80, border: '2px dashed var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                No logo
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileRef.current.click()}
                disabled={uploading}
                style={{ fontSize: 13 }}
              >
                {uploading ? 'Uploading…' : '⬆ Upload Logo'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleLogoUpload(e.target.files)}
              />
              <input
                placeholder="or paste image URL"
                value={form.logoUrl}
                onChange={f('logoUrl')}
                style={{ fontSize: 12, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
          </div>
          <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 6, display: 'block' }}>Appears on invoice header. Recommended: PNG with transparent background, 200×80 px.</small>
        </div>

        <div className="form-row cols-2">
          <div className="form-group">
            <label>Company Name *</label>
            <input value={form.companyName} onChange={f('companyName')} placeholder="Kulfi ICE Cream Co." required />
          </div>
          <div className="form-group">
            <label>Tagline</label>
            <input value={form.tagline} onChange={f('tagline')} placeholder="Fresh · Frozen · Delicious" />
          </div>
        </div>
      </div>

      {/* ── Contact & Address ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Contact & Address</div>
        <div className="form-group">
          <label>Address</label>
          <input value={form.address} onChange={f('address')} placeholder="123, Main Street" />
        </div>
        <div className="form-row cols-3">
          <div className="form-group">
            <label>City</label>
            <input value={form.city} onChange={f('city')} placeholder="Chennai" />
          </div>
          <div className="form-group">
            <label>State</label>
            <input value={form.state} onChange={f('state')} placeholder="Tamil Nadu" />
          </div>
          <div className="form-group">
            <label>Pincode</label>
            <input value={form.pincode} onChange={f('pincode')} placeholder="600001" maxLength={6} />
          </div>
        </div>
        <div className="form-row cols-3">
          <div className="form-group">
            <label>Phone</label>
            <input value={form.phone} onChange={f('phone')} placeholder="+91 98765 43210" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={f('email')} placeholder="info@kulfiice.com" />
          </div>
          <div className="form-group">
            <label>Website</label>
            <input value={form.website} onChange={f('website')} placeholder="www.kulfiice.com" />
          </div>
        </div>
      </div>

      {/* ── Compliance ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Compliance Numbers</div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label>GSTIN</label>
            <input value={form.gstin} onChange={f('gstin')} placeholder="22AAAAA0000A1Z5" maxLength={15} style={{ fontFamily: 'monospace', letterSpacing: 1 }} />
          </div>
          <div className="form-group">
            <label>FSSAI License No.</label>
            <input value={form.fssai} onChange={f('fssai')} placeholder="12345678901234" maxLength={14} style={{ fontFamily: 'monospace', letterSpacing: 1 }} />
          </div>
        </div>
      </div>

      {/* ── Bank Details ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Bank Details <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)' }}>— shown on invoices for payment</span></div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label>Account Name</label>
            <input value={form.bankAccountName} onChange={f('bankAccountName')} placeholder="Kulfi ICE Cream Co." />
          </div>
          <div className="form-group">
            <label>Bank Name</label>
            <input value={form.bankName} onChange={f('bankName')} placeholder="State Bank of India" />
          </div>
          <div className="form-group">
            <label>Account Number</label>
            <input value={form.bankAccount} onChange={f('bankAccount')} placeholder="1234567890" style={{ fontFamily: 'monospace', letterSpacing: 1 }} />
          </div>
          <div className="form-group">
            <label>IFSC Code</label>
            <input value={form.bankIfsc} onChange={f('bankIfsc')} placeholder="SBIN0001234" maxLength={11} style={{ fontFamily: 'monospace', letterSpacing: 1 }} />
          </div>
        </div>
      </div>

      {/* ── Invoice Config ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Invoice Configuration</div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label>Invoice Number Prefix</label>
            <input value={form.invoicePrefix} onChange={f('invoicePrefix')} placeholder="INV" maxLength={10} />
            <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
              e.g. prefix "<strong>{form.invoicePrefix || 'INV'}</strong>" → <strong>{form.invoicePrefix || 'INV'}-20260503-0001</strong>
            </small>
          </div>
          <div className="form-group">
            <label>Invoice Terms &amp; Conditions</label>
            <textarea
              value={form.invoiceTerms}
              onChange={f('invoiceTerms')}
              rows={3}
              placeholder="Thank you for your business!"
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>Appears at the bottom of every invoice.</small>
          </div>
        </div>
      </div>

      {/* ── Preview banner ── */}
      {form.companyName && (
        <div className="card" style={{ marginBottom: 20, background: 'var(--primary-light)', border: '1px solid var(--primary)', padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Invoice Header Preview</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {form.logoUrl && (
              <img src={form.logoUrl} alt="logo" style={{ height: 48, maxWidth: 120, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{form.companyName}</div>
              {form.tagline && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{form.tagline}</div>}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {[form.address, form.city, form.state, form.pincode].filter(Boolean).join(', ')}
                {form.phone && ` · ${form.phone}`}
                {form.gstin && ` · GSTIN: ${form.gstin}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {msg.text && (
        <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'} style={{ marginBottom: 12 }}>{msg.text}</p>
      )}

      <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '11px 32px', fontSize: 14 }}>
        {saving ? 'Saving…' : '💾 Save Company Settings'}
      </button>
    </form>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
const EMPTY_USER_FORM = { name: '', username: '', password: '', role: 'SALES', saleType: 'SHOP', branchId: '' };

function UserFormFields({ form, setForm, branches, customRoles, isEdit }) {
  return (
    <div className="form-row cols-2">
      <div className="form-group">
        <label>Full Name</label>
        <input placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="form-group">
        <label>Username</label>
        <input placeholder="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
      </div>
      <div className="form-group">
        <label>{isEdit ? 'New Password' : 'Password'}</label>
        <input type="password" placeholder={isEdit ? 'Leave blank to keep current' : 'Password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!isEdit} />
      </div>
      <div className="form-group">
        <label>Role</label>
        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="SALES">Sales</option>
          <option value="BRANCH_MANAGER">Branch Manager</option>
          <option value="ADMIN">Admin</option>
          {customRoles.map(r => <option key={r.name} value={r.name}>{r.label}</option>)}
        </select>
      </div>
      {form.role !== 'ADMIN' && (
        <div className="form-group">
          <label>Branch</label>
          <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>
            <option value="">— Select Branch —</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      {form.role === 'SALES' && (
        <div className="form-group">
          <label>Sale Type</label>
          <select value={form.saleType} onChange={e => setForm({ ...form, saleType: e.target.value })}>
            <option value="SHOP">🏪 Shop</option>
            <option value="TRUCK">🚚 Truck</option>
          </select>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [customRoles, setCustomRoles] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_USER_FORM);
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });
  const [editSaving, setEditSaving] = useState(false);

  const load = () => Promise.all([
    api.get('/users'),
    api.get('/branches'),
    api.get('/custom-roles'),
  ]).then(([ur, br, cr]) => { setUsers(ur.data); setBranches(br.data); setCustomRoles(cr.data); });
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await api.post('/users', form);
      setMsg({ type: 'success', text: 'User created!' });
      setForm(EMPTY_USER_FORM);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error' });
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ name: u.name, username: u.username, password: '', role: u.role, saleType: u.saleType || 'SHOP', branchId: u.branchId ? String(u.branchId) : '' });
    setEditMsg({ type: '', text: '' });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true); setEditMsg({ type: '', text: '' });
    try {
      const payload = {
        name: editForm.name,
        username: editForm.username,
        role: editForm.role,
        branchId: (editForm.role !== 'ADMIN' && editForm.branchId) ? parseInt(editForm.branchId) : null,
      };
      if (editForm.password) payload.password = editForm.password;
      if (editForm.role === 'SALES') payload.saleType = editForm.saleType;
      await api.put(`/users/${editUser.id}`, payload);
      setEditUser(null);
      setMsg({ type: 'success', text: `User "${editForm.name}" updated!` });
      load();
    } catch (err) {
      setEditMsg({ type: 'error', text: err.response?.data?.message || 'Error' });
    } finally { setEditSaving(false); }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Delete user "${u.name}" (@${u.username})? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete user');
    }
  };

  const handleToggle = async (id) => {
    try { await api.patch(`/users/${id}/toggle`); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      {/* Add User form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Add User</div>
        <form onSubmit={handleAdd}>
          <UserFormFields form={form} setForm={setForm} branches={branches} customRoles={customRoles} isEdit={false} />
          {msg.text && <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'} style={{ marginBottom: 10 }}>{msg.text}</p>}
          <button type="submit" className="btn-primary">Create User</button>
        </form>
      </div>

      {/* Users table */}
      <div className="card">
        <div className="section-title">All Users</div>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Username</th><th>Role</th><th>Branch</th><th>Sale Type</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {users.slice((page - 1) * pageSize, page * pageSize).map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td style={{ color: 'var(--text-muted)' }}>{u.username}</td>
                <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                <td style={{ fontSize: 13 }}>{u.branch?.name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                <td>
                  {u.role === 'SALES'
                    ? <span className="badge" style={{ background: u.saleType === 'TRUCK' ? '#FFF3E0' : '#E3F2FD', color: u.saleType === 'TRUCK' ? '#E65100' : '#1565C0' }}>
                        {u.saleType === 'TRUCK' ? '🚚 Truck' : '🏪 Shop'}
                      </span>
                    : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                </td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-healthy' : 'badge-out'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                    <button className={`btn-sm ${u.isActive ? 'btn-danger' : 'btn-ghost'}`} onClick={() => handleToggle(u.id)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    {u.username !== 'admin' && (
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(u)}>Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} pageSize={pageSize} total={users.length} onPage={setPage} onPageSize={setPageSize} />
      </div>

      {/* Edit modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Edit User — {editUser.name}</div>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>
            <form onSubmit={handleEdit}>
              <UserFormFields form={editForm} setForm={setEditForm} branches={branches} customRoles={customRoles} isEdit={true} />
              {editMsg.text && <p className={editMsg.type === 'success' ? 'success-msg' : 'error-msg'} style={{ marginBottom: 10 }}>{editMsg.text}</p>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={editSaving}>{editSaving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Permissions Tab ───────────────────────────────────────────────────────────
const MODULES = [
  { key: 'dashboard',      label: 'Dashboard',       icon: '📊' },
  { key: 'purchase',       label: 'Purchase Entry',   icon: '🛒' },
  { key: 'sales',          label: 'Sales Entry',      icon: '💰' },
  { key: 'stock',          label: 'Current Stock',    icon: '📦' },
  { key: 'reports',        label: 'Reports',          icon: '📈' },
  { key: 'products',       label: 'Products',         icon: '🍦' },
  { key: 'branches',       label: 'Branches',         icon: '🏢' },
  { key: 'trucks',         label: 'Trucks',           icon: '🚛' },
  { key: 'truck-sessions', label: 'Truck Sessions',   icon: '🚚' },
  { key: 'expenses',       label: 'Expenses',         icon: '💸' },
  { key: 'bulk-orders',    label: 'Bulk Orders',      icon: '📋' },
  { key: 'settings',       label: 'Settings',         icon: '⚙️' },
  { key: 'media',          label: 'Media Library',    icon: '🖼️' },
];

const BUILT_IN_ROLES = [
  { key: 'ADMIN',          label: 'Admin',          color: '#7C3AED', builtIn: true },
  { key: 'BRANCH_MANAGER', label: 'Branch Manager', color: '#0EA5E9', builtIn: true },
  { key: 'SALES',          label: 'Sales',          color: '#10B981', builtIn: true },
];

const PERMS = [
  { key: 'canView',   label: 'View',   short: 'V' },
  { key: 'canCreate', label: 'Create', short: 'C' },
  { key: 'canEdit',   label: 'Edit',   short: 'E' },
  { key: 'canDelete', label: 'Delete', short: 'D' },
];

const COLOR_OPTIONS = ['#7C3AED','#0EA5E9','#10B981','#F59E0B','#EF4444','#EC4899','#06B6D4','#84CC16','#F97316','#6B7280'];

function PermissionsTab() {
  const [matrix, setMatrix]           = useState({});
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState({ type: '', text: '' });
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRole, setNewRole]         = useState({ label: '', color: '#0EA5E9' });
  const [creating, setCreating]       = useState(false);
  const [createErr, setCreateErr]     = useState('');

  const loadAll = () => {
    return Promise.all([
      api.get('/permissions'),
      api.get('/custom-roles'),
    ]).then(([pr, cr]) => {
      const m = {};
      pr.data.forEach(p => {
        if (!m[p.role]) m[p.role] = {};
        m[p.role][p.module] = { canView: p.canView, canCreate: p.canCreate, canEdit: p.canEdit, canDelete: p.canDelete };
      });
      setMatrix(m);
      setCustomRoles(cr.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadAll(); }, []);

  const allRoles = [
    ...BUILT_IN_ROLES,
    ...customRoles.map(r => ({ key: r.name, label: r.label, color: r.color, builtIn: false })),
  ];

  const toggle = (role, module, perm) => {
    setMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [module]: { ...(prev[role]?.[module] || {}), [perm]: !(prev[role]?.[module]?.[perm]) } },
    }));
  };

  const setRoleAll = (roleKey, val) => {
    setMatrix(prev => {
      const updated = { ...prev, [roleKey]: {} };
      MODULES.forEach(m => { updated[roleKey][m.key] = { canView: val, canCreate: val, canEdit: val, canDelete: val }; });
      return updated;
    });
  };

  const setModuleAll = (moduleKey, val) => {
    setMatrix(prev => {
      const updated = { ...prev };
      allRoles.forEach(r => {
        updated[r.key] = { ...(updated[r.key] || {}), [moduleKey]: { canView: val, canCreate: val, canEdit: val, canDelete: val } };
      });
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true); setMsg({ type: '', text: '' });
    const rows = [];
    allRoles.forEach(r => {
      MODULES.forEach(m => {
        const p = matrix[r.key]?.[m.key] || {};
        rows.push({ role: r.key, module: m.key, canView: !!p.canView, canCreate: !!p.canCreate, canEdit: !!p.canEdit, canDelete: !!p.canDelete });
      });
    });
    try {
      await api.put('/permissions', rows);
      setMsg({ type: 'success', text: 'Permissions saved!' });
    } catch { setMsg({ type: 'error', text: 'Failed to save' }); }
    finally { setSaving(false); }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRole.label.trim()) return setCreateErr('Label is required');
    setCreating(true); setCreateErr('');
    try {
      await api.post('/custom-roles', { name: newRole.label, label: newRole.label, color: newRole.color });
      setNewRole({ label: '', color: '#0EA5E9' });
      setShowNewRole(false);
      await loadAll();
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Failed to create role');
    } finally { setCreating(false); }
  };

  const handleDeleteRole = async (roleKey) => {
    if (!confirm(`Remove role "${roleKey}" and all its permissions?`)) return;
    await api.delete(`/custom-roles/${roleKey}`);
    await loadAll();
  };

  if (loading) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <strong>V</strong>=View &nbsp;<strong>C</strong>=Create &nbsp;<strong>E</strong>=Edit &nbsp;<strong>D</strong>=Delete
        </div>
        <button
          className="btn-primary"
          onClick={() => { setShowNewRole(v => !v); setCreateErr(''); }}
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          {showNewRole ? '✕ Cancel' : '+ New Role'}
        </button>
      </div>

      {/* New Role form */}
      {showNewRole && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Create New Role</div>
          <form onSubmit={handleCreateRole}>
            <div className="form-row cols-2">
              <div className="form-group">
                <label>Role Label *</label>
                <input
                  placeholder="e.g. Delivery Agent"
                  value={newRole.label}
                  onChange={e => setNewRole(p => ({ ...p, label: e.target.value }))}
                  required
                  autoFocus
                />
                {newRole.label && (
                  <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 3, display: 'block' }}>
                    Key: <strong>{newRole.label.trim().toUpperCase().replace(/\s+/g, '_')}</strong>
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Role Colour</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {COLOR_OPTIONS.map(c => (
                    <div
                      key={c}
                      onClick={() => setNewRole(p => ({ ...p, color: c }))}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                        border: newRole.color === c ? '3px solid var(--text)' : '2px solid transparent',
                        boxSizing: 'border-box', transition: 'border 0.1s',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            {createErr && <p className="error-msg" style={{ marginBottom: 10 }}>{createErr}</p>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="submit" className="btn-primary" disabled={creating} style={{ fontSize: 13 }}>
                {creating ? 'Creating…' : 'Create Role'}
              </button>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: newRole.color, opacity: 0.8 }} />
              {newRole.label && <span style={{ fontWeight: 700, color: newRole.color, fontSize: 13 }}>{newRole.label}</span>}
            </div>
          </form>
        </div>
      )}

      {/* Matrix */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ margin: 0, borderCollapse: 'collapse', width: '100%', minWidth: 700 }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 700, fontSize: 13, borderBottom: '2px solid var(--border)', width: 200 }}>Module</th>
                {allRoles.map(role => (
                  <th key={role.key} style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '2px solid var(--border)', borderLeft: '1px solid var(--border)', minWidth: 170 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: role.color }} />
                        <span style={{ fontWeight: 700, fontSize: 12, color: role.color }}>{role.label}</span>
                        {!role.builtIn && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role.key)}
                            title="Remove role"
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                          >×</button>
                        )}
                      </div>
                      {!role.builtIn && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 4, padding: '1px 5px' }}>custom</span>
                      )}
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button type="button" onClick={() => setRoleAll(role.key, true)}
                          style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: `1px solid ${role.color}`, color: role.color, background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>All</button>
                        <button type="button" onClick={() => setRoleAll(role.key, false)}
                          style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}>None</button>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>
                        {PERMS.map(p => <span key={p.key} style={{ width: 20, textAlign: 'center' }}>{p.short}</span>)}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod, idx) => (
                <tr key={mod.key} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--bg)' }}>
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{mod.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{mod.label}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" onClick={() => setModuleAll(mod.key, true)}
                            style={{ fontSize: 10, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Grant all</button>
                          <span style={{ color: 'var(--border)', fontSize: 10 }}>|</span>
                          <button type="button" onClick={() => setModuleAll(mod.key, false)}
                            style={{ fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Revoke all</button>
                        </div>
                      </div>
                    </div>
                  </td>
                  {allRoles.map(role => {
                    const cell = matrix[role.key]?.[mod.key] || {};
                    const anyOn = PERMS.some(p => cell[p.key]);
                    return (
                      <td key={role.key} style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', background: anyOn ? `${role.color}08` : 'transparent' }}>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                          {PERMS.map(perm => {
                            const on = !!cell[perm.key];
                            return (
                              <div
                                key={perm.key}
                                title={perm.label}
                                onClick={() => toggle(role.key, mod.key, perm.key)}
                                style={{
                                  width: 22, height: 22, borderRadius: 5,
                                  border: `2px solid ${on ? role.color : 'var(--border)'}`,
                                  background: on ? role.color : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', transition: 'all 0.12s', flexShrink: 0,
                                }}
                              >
                                {on && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '11px 32px', fontSize: 14 }}>
          {saving ? 'Saving…' : '💾 Save Permissions'}
        </button>
        {msg.text && <p className={msg.type === 'success' ? 'success-msg' : 'error-msg'} style={{ margin: 0 }}>{msg.text}</p>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState('company');
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Company profile, permissions and user management</p>
      </div>
      <div className="tabs">
        <button className={`tab-btn${tab === 'company'     ? ' active' : ''}`} onClick={() => setTab('company')}>🏢 Company</button>
        <button className={`tab-btn${tab === 'permissions' ? ' active' : ''}`} onClick={() => setTab('permissions')}>🔐 Permissions</button>
        <button className={`tab-btn${tab === 'users'       ? ' active' : ''}`} onClick={() => setTab('users')}>👤 Users</button>
      </div>
      {tab === 'company'     && <CompanyTab />}
      {tab === 'permissions' && <PermissionsTab />}
      {tab === 'users'       && <UsersTab />}
    </div>
  );
}
