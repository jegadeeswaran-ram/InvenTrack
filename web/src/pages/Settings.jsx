import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, Info } from 'lucide-react';
import { getPermissions, updatePermissions, getAuditLog, getUsers, createUser, updateUser, deleteUser } from '../api/endpoints/settings';
import { getBranches } from '../api/endpoints/branches';
import useStore from '../store/useStore';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import { StatusBadge } from '../components/ui/Badge';

const MODULES = ['Sales','Stock','Dispatch','Closing','ShopSales','Products','Reports','Users','Expenses','Settings'];
const PERMS   = ['canView','canCreate','canEdit','canDelete'];
const TABS    = ['Users', 'Permission Matrix', 'Audit Log'];

const emptyUser = { name:'', email:'', mobile:'', password:'', role:'SALESPERSON', branchId:'', isActive:true };

export default function Settings() {
  const { addToast } = useStore();
  const [tab, setTab]               = useState(0);
  const [branches, setBranches]     = useState([]);
  const [users, setUsers]           = useState([]);
  const [permissions, setPerms]     = useState([]);
  const [auditLogs, setAuditLogs]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [userModal, setUserModal]   = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm]     = useState(emptyUser);
  const [userSubmitting, setUS]     = useState(false);

  useEffect(() => { getBranches().then((r) => setBranches(r.data.data)); }, []);

  useEffect(() => {
    if (tab === 0) getUsers().then((r) => setUsers(r.data.data || []));
    if (tab === 1) getPermissions().then((r) => setPerms(r.data.data || []));
    if (tab === 2) { setLoading(true); getAuditLog({ limit: 50 }).then((r) => { setAuditLogs(r.data.data || []); setLoading(false); }); }
  }, [tab]);

  const getPerm = (role, module, field) => {
    const p = permissions.find((x) => x.role === role && x.module === module);
    return p?.[field] ?? false;
  };

  const togglePerm = (role, module, field) => {
    setPerms((prev) => {
      const idx = prev.findIndex((x) => x.role === role && x.module === module);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: !updated[idx][field] };
        return updated;
      }
      return [...prev, { role, module, canView:false, canCreate:false, canEdit:false, canDelete:false, [field]: true }];
    });
  };

  const savePerms = async () => {
    setSaving(true);
    try {
      await updatePermissions({ permissions: permissions.filter((p) => p.role !== 'ADMIN') });
      addToast({ type:'success', message:'Permissions saved' });
    } catch { addToast({ type:'error', message:'Failed to save' }); }
    finally { setSaving(false); }
  };

  const openAddUser = () => { setEditingUser(null); setUserForm(emptyUser); setUserModal(true); };
  const openEditUser = (u) => { setEditingUser(u); setUserForm({ name:u.name, email:u.email||'', mobile:u.mobile||'', password:'', role:u.role, branchId:u.branchId||'', isActive:u.isActive }); setUserModal(true); };

  const handleUserSubmit = async () => {
    setUS(true);
    try {
      const payload = { ...userForm, branchId: userForm.branchId ? Number(userForm.branchId) : undefined };
      if (!payload.password) delete payload.password;
      if (editingUser) { await updateUser(editingUser.id, payload); addToast({ type:'success', message:'User updated' }); }
      else { await createUser(payload); addToast({ type:'success', message:'User created' }); }
      setUserModal(false);
      getUsers().then((r) => setUsers(r.data.data || []));
    } catch (err) { addToast({ type:'error', message: err.response?.data?.message || 'Failed' }); }
    finally { setUS(false); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try { await deleteUser(id); addToast({ type:'success', message:'User deactivated' }); getUsers().then((r) => setUsers(r.data.data||[])); }
    catch { addToast({ type:'error', message:'Failed' }); }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${tab===i?'border-indigo-600 text-indigo-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
          ))}
        </div>

        <div className="p-6">
          {/* Users tab */}
          {tab === 0 && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={openAddUser}><Plus size={15} /> Add User</Button>
              </div>
              <Table
                columns={[
                  { key:'name',  label:'Name' },
                  { key:'role',  label:'Role', render:(v) => <StatusBadge status={v} /> },
                  { key:'branch',label:'Branch', render:(_,r) => r.branch?.name || '—' },
                  { key:'email', label:'Email', render:(v) => v || '—' },
                  { key:'mobile',label:'Mobile', render:(v) => v || '—' },
                  { key:'isActive', label:'Status', render:(v) => <StatusBadge status={v?'ACTIVE':'CLOSED'} /> },
                  { key:'actions', label:'', render:(_,r) => (
                    <div className="flex gap-1">
                      <button onClick={() => openEditUser(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"><Edit size={15}/></button>
                      <button onClick={() => handleDeleteUser(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={15}/></button>
                    </div>
                  )},
                ]}
                data={users} loading={false} emptyMessage="No users found"
              />
            </div>
          )}

          {/* Permission Matrix tab */}
          {tab === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <Info size={15} />
                  Admin permissions are fixed and cannot be modified
                </div>
                <Button onClick={savePerms} loading={saving}><Save size={15} /> Save Permissions</Button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Module</th>
                      {['BRANCH_MANAGER','SALESPERSON'].map((role) => (
                        PERMS.map((p) => (
                          <th key={`${role}-${p}`} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">
                            {role === 'BRANCH_MANAGER' ? 'Mgr' : 'Sales'} {p.replace('can','')}
                          </th>
                        ))
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {MODULES.map((mod) => (
                      <tr key={mod} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{mod}</td>
                        {['BRANCH_MANAGER','SALESPERSON'].map((role) => (
                          PERMS.map((field) => (
                            <td key={`${role}-${field}`} className="px-3 py-3 text-center">
                              <input type="checkbox" checked={getPerm(role,mod,field)} onChange={() => togglePerm(role,mod,field)}
                                className="w-4 h-4 accent-indigo-600 rounded" />
                            </td>
                          ))
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit Log tab */}
          {tab === 2 && (
            <Table
              columns={[
                { key:'timestamp', label:'Time', render:(v) => new Date(v).toLocaleString('en-IN') },
                { key:'user',   label:'By',     render:(_,r) => r.user?.name },
                { key:'action', label:'Action' },
                { key:'entity', label:'Entity' },
                { key:'entityId', label:'ID' },
              ]}
              data={auditLogs} loading={loading} emptyMessage="No audit logs"
            />
          )}
        </div>
      </div>

      {/* User modal */}
      <Modal open={userModal} onClose={() => setUserModal(false)} title={editingUser ? 'Edit User' : 'Add User'}>
        <div className="space-y-4">
          <Input label="Full Name" value={userForm.name} onChange={(e) => setUserForm({...userForm,name:e.target.value})} required />
          <Input label="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({...userForm,email:e.target.value})} />
          <Input label="Mobile" value={userForm.mobile} onChange={(e) => setUserForm({...userForm,mobile:e.target.value})} />
          <Input label={editingUser ? 'Password (leave blank to keep)' : 'Password'} type="password" value={userForm.password} onChange={(e) => setUserForm({...userForm,password:e.target.value})} />
          <Select label="Role" value={userForm.role} onChange={(e) => setUserForm({...userForm,role:e.target.value})}>
            <option value="ADMIN">Admin</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="SALESPERSON">Salesperson</option>
          </Select>
          <Select label="Branch" value={userForm.branchId} onChange={(e) => setUserForm({...userForm,branchId:e.target.value})}>
            <option value="">No branch (Admin)</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="ua" checked={userForm.isActive} onChange={(e) => setUserForm({...userForm,isActive:e.target.checked})} className="w-4 h-4 accent-indigo-600" />
            <label htmlFor="ua" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setUserModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={userSubmitting} onClick={handleUserSubmit}>{editingUser ? 'Update' : 'Create'} User</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
