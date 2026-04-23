import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const { user, token, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  });
  const [photo, setPhoto] = useState(user?.photo || null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (form.password && form.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name, username: form.username, email: form.email, photo };
      if (form.password) payload.password = form.password;
      const { data } = await api.put('/auth/profile', payload, { headers: { Authorization: `Bearer ${token}` } });
      updateUser(data);
      setSuccess('Profile updated successfully');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || 'A')[0].toUpperCase();

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>My Profile</h2>

      <form onSubmit={handleSubmit}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileRef.current.click()}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: photo ? 'transparent' : 'linear-gradient(135deg, #0095DA, #00A550)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,149,218,0.35)',
            }}>
              {photo
                ? <img src={`data:image/jpeg;base64,${photo}`} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{initials}</span>
              }
            </div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0, width: 24, height: 24,
              background: '#0095DA', borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', border: '2px solid var(--card-bg)',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4zm6.4-10.4H16l-1.6-2H9.6L8 4.8H5.6A2.4 2.4 0 0 0 3.2 7.2v12A2.4 2.4 0 0 0 5.6 21.6h12.8a2.4 2.4 0 0 0 2.4-2.4v-12a2.4 2.4 0 0 0-2.4-2.4z"/></svg>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user?.role}</div>
            <button type="button" onClick={() => fileRef.current.click()}
              style={{ marginTop: 8, fontSize: 12, color: '#0095DA', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Change photo
            </button>
          </div>
        </div>

        {/* Personal Info */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0095DA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Personal Info</div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Enter full name" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Enter email address" />
            </div>
          </div>
        </div>

        {/* Account */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0095DA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Account</div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Username</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="Enter username" />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0095DA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Change Password</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Leave blank to keep current password</div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>New Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter new password" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Confirm new password" />
            </div>
          </div>
        </div>

        {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}
        {success && <p style={{ color: '#00A550', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{success}</p>}

        <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', padding: '11px', fontSize: 15 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
