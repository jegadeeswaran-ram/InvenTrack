import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getExpenses, createExpense, deleteExpense } from '../api/endpoints/expenses';
import { getBranches } from '../api/endpoints/branches';
import useStore from '../store/useStore';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';

const CATEGORIES = ['SALARY','INCENTIVE','ELECTRICITY','RENT','MISCELLANEOUS'];
const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().slice(0,10);

export default function Expenses() {
  const { user, addToast } = useStore();
  const [expenses, setExpenses]   = useState([]);
  const [branches, setBranches]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters]     = useState({ branchId: user.branchId||'', category:'', dateFrom:'', dateTo:'' });
  const [form, setForm] = useState({ branchId: user.branchId||'', category:'', amount:'', description:'', expenseDate: today() });
  const [errors, setErrors]       = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const r = await getExpenses(filters);
      setExpenses(r.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { getBranches().then((r) => setBranches(r.data.data)); }, []);
  useEffect(() => { load(); }, [filters]);

  const validate = () => {
    const e = {};
    if (!form.branchId)     e.branchId   = 'Branch required';
    if (!form.category)     e.category   = 'Category required';
    if (!form.amount || form.amount <= 0) e.amount = 'Enter valid amount';
    if (!form.expenseDate)  e.expenseDate= 'Date required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createExpense({ ...form, branchId: Number(form.branchId), amount: Number(form.amount) });
      addToast({ type:'success', message:'Expense recorded' });
      setModal(false);
      setForm({ branchId: user.branchId||'', category:'', amount:'', description:'', expenseDate: today() });
      load();
    } catch (err) {
      addToast({ type:'error', message: err.response?.data?.message || 'Failed' });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try { await deleteExpense(id); addToast({ type:'success', message:'Deleted' }); load(); }
    catch { addToast({ type:'error', message:'Delete failed' }); }
  };

  const total = expenses.reduce((s,e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div className="flex flex-wrap gap-3">
            {user.role === 'ADMIN' && (
              <Select value={filters.branchId} onChange={(e) => setFilters({...filters, branchId:e.target.value})} className="w-40">
                <option value="">All branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            )}
            <Select value={filters.category} onChange={(e) => setFilters({...filters, category:e.target.value})} className="w-40">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom:e.target.value})} className="w-36" />
            <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo:e.target.value})} className="w-36" />
          </div>
          <Button onClick={() => setModal(true)}><Plus size={15} /> Add Expense</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <Table
          columns={[
            { key:'expenseDate', label:'Date',     render:(v) => new Date(v).toLocaleDateString('en-IN') },
            { key:'branch',      label:'Branch',   render:(_,r) => r.branch?.name },
            { key:'category',    label:'Category', render:(v) => <span className="capitalize">{v.toLowerCase()}</span> },
            { key:'amount',      label:'Amount',   render:(v) => <span className="font-semibold">{fmt(v)}</span> },
            { key:'description', label:'Notes',    render:(v) => v || '—' },
            { key:'user',        label:'Added By', render:(_,r) => r.user?.name },
            { key:'actions',     label:'', render:(_,r) => user.role==='ADMIN' && (
              <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"><Trash2 size={15}/></button>
            )},
          ]}
          data={expenses} loading={loading} emptyMessage="No expenses found"
        />
        {expenses.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-sm font-semibold text-gray-900 text-right">
            Total: {fmt(total)}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Record Expense">
        <div className="space-y-4">
          <Select label="Branch" value={form.branchId} onChange={(e) => setForm({...form,branchId:e.target.value})} error={errors.branchId} disabled={!!user.branchId}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Select label="Category" value={form.category} onChange={(e) => setForm({...form,category:e.target.value})} error={errors.category}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input label="Amount ₹" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({...form,amount:e.target.value})} error={errors.amount} />
          <Input type="date" label="Date" value={form.expenseDate} onChange={(e) => setForm({...form,expenseDate:e.target.value})} error={errors.expenseDate} />
          <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={submitting} onClick={handleSubmit}>Save Expense</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
