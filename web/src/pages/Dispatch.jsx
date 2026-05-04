import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, CheckCircle } from 'lucide-react';
import { getBranches } from '../api/endpoints/branches';
import { getUsers } from '../api/endpoints/settings';
import { getProducts } from '../api/endpoints/products';
import { getBranchStock } from '../api/endpoints/stock';
import { createDispatch, getTodayDispatch } from '../api/endpoints/dispatch';
import useStore from '../store/useStore';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Table from '../components/ui/Table';
import { StatusBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const today = () => new Date().toISOString().slice(0, 10);

export default function Dispatch() {
  const { user, addToast } = useStore();
  const [step, setStep]           = useState(1);
  const [branches, setBranches]   = useState([]);
  const [salespersons, setSP]     = useState([]);
  const [products, setProducts]   = useState([]);
  const [stockMap, setStockMap]   = useState({});
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    branchId: user.branchId || '', truckId: '', userId: '', sessionDate: today(),
  });
  const [items, setItems] = useState([{ productId: '', dispatchQty: '' }]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      const [br, sp, pr] = await Promise.all([
        getBranches(), getUsers({ role: 'SALESPERSON' }), getProducts({ isActive: true, limit: 200 }),
      ]);
      setBranches(br.data.data);
      setSP(sp.data.data);
      setProducts(pr.data.data);
    };
    load();
  }, []);

  useEffect(() => {
    if (!form.branchId) return;
    getBranchStock(form.branchId).then((r) => {
      const map = {};
      r.data.data.forEach((s) => { map[s.productId] = s.quantity; });
      setStockMap(map);
    });
    getTodayDispatch(form.branchId).then((r) => setSessions(r.data.data));
  }, [form.branchId]);

  const setItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
    if (errors[`item_${i}`]) {
      const e = { ...errors }; delete e[`item_${i}`]; setErrors(e);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.branchId)    e.branchId    = 'Branch is required';
    if (!form.truckId)     e.truckId     = 'Truck ID is required';
    if (!form.userId)      e.userId      = 'Salesperson is required';
    if (!form.sessionDate) e.sessionDate = 'Date is required';
    items.forEach((it, i) => {
      if (!it.productId)   e[`item_${i}`] = 'Select a product';
      else if (!it.dispatchQty || it.dispatchQty <= 0) e[`item_${i}`] = 'Enter valid qty';
      else if (it.dispatchQty > (stockMap[it.productId] || 0))
        e[`item_${i}`] = `Only ${stockMap[it.productId] || 0} available`;
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createDispatch({
        branchId: Number(form.branchId), truckId: form.truckId,
        userId: Number(form.userId), sessionDate: form.sessionDate,
        items: items.map((i) => ({ productId: Number(i.productId), dispatchQty: Number(i.dispatchQty) })),
      });
      addToast({ type: 'success', title: 'Dispatch Created', message: 'Truck dispatch session started successfully.' });
      setShowConfirm(false);
      setStep(1);
      setItems([{ productId: '', dispatchQty: '' }]);
      getTodayDispatch(form.branchId).then((r) => setSessions(r.data.data));
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Failed to create dispatch' });
    } finally { setSubmitting(false); }
  };

  const spFiltered = salespersons.filter((s) => !form.branchId || s.branchId === Number(form.branchId));

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">New Truck Dispatch</h2>

        {/* Step 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Select label="Branch" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} error={errors.branchId} disabled={!!user.branchId}>
            <option value="">Select branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Input label="Truck ID" placeholder="TRK-001" value={form.truckId} onChange={(e) => setForm({ ...form, truckId: e.target.value })} error={errors.truckId} />
          <Select label="Salesperson" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} error={errors.userId}>
            <option value="">Select salesperson</option>
            {spFiltered.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input type="date" label="Date" value={form.sessionDate} onChange={(e) => setForm({ ...form, sessionDate: e.target.value })} error={errors.sessionDate} />
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-1">
            <div className="col-span-6">Product</div>
            <div className="col-span-2">Available</div>
            <div className="col-span-3">Dispatch Qty</div>
            <div className="col-span-1"></div>
          </div>
          {items.map((item, i) => {
            const avail = item.productId ? (stockMap[Number(item.productId)] ?? '—') : '—';
            const over  = item.productId && item.dispatchQty > (stockMap[Number(item.productId)] || 0);
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-6">
                  <select
                    value={item.productId}
                    onChange={(e) => setItem(i, 'productId', e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${errors[`item_${i}`] ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                  {errors[`item_${i}`] && <p className="text-xs text-red-600 mt-0.5">{errors[`item_${i}`]}</p>}
                </div>
                <div className="col-span-2">
                  <div className={`px-3 py-2 text-sm font-medium rounded-lg ${over ? 'text-red-600 bg-red-50' : 'text-gray-700 bg-gray-50'}`}>{avail}</div>
                </div>
                <div className="col-span-3">
                  <input
                    type="number" min="1" placeholder="0"
                    value={item.dispatchQty}
                    onChange={(e) => setItem(i, 'dispatchQty', Number(e.target.value))}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${over ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  />
                </div>
                <div className="col-span-1 flex justify-center pt-2">
                  {items.length > 1 && (
                    <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={() => setItems([...items, { productId: '', dispatchQty: '' }])}>
            <Plus size={15} /> Add Product
          </Button>
          <Button onClick={() => { if (validate()) setShowConfirm(true); }}>
            Review & Dispatch <ChevronRight size={15} />
          </Button>
        </div>
      </div>

      {/* Today's sessions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Today's Dispatches</h2>
        <Table
          columns={[
            { key: 'truckId',  label: 'Truck ID' },
            { key: 'user',     label: 'Salesperson', render: (_, r) => r.user?.name },
            { key: 'status',   label: 'Status', render: (v) => <StatusBadge status={v} /> },
            { key: 'dispatches', label: 'Items', render: (v) => v?.length || 0 },
          ]}
          data={sessions}
          loading={false}
          emptyMessage="No dispatches today"
        />
      </div>

      {/* Confirm modal */}
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Dispatch">
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Truck</span><span className="font-medium">{form.truckId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Salesperson</span><span className="font-medium">{spFiltered.find((s) => s.id === Number(form.userId))?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{form.sessionDate}</span></div>
          </div>
          <div className="space-y-1">
            {items.map((item, i) => {
              const product = products.find((p) => p.id === Number(item.productId));
              return (
                <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{product?.name}</span>
                  <span className="font-semibold text-gray-900">{item.dispatchQty} {product?.unit}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button className="flex-1" loading={submitting} onClick={handleSubmit}>
              <CheckCircle size={15} /> Confirm Dispatch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
