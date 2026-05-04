import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart } from 'lucide-react';
import { getProducts } from '../api/endpoints/products';
import { getBranchStock } from '../api/endpoints/stock';
import { shopSale, getSalesHistory } from '../api/endpoints/sales';
import { getBranches } from '../api/endpoints/branches';
import useStore from '../store/useStore';
import Button from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import Table from '../components/ui/Table';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function ShopSales() {
  const { user, addToast } = useStore();
  const [branches, setBranches]   = useState([]);
  const [products, setProducts]   = useState([]);
  const [stockMap, setStockMap]   = useState({});
  const [branchId, setBranchId]   = useState(user.branchId || '');
  const [cart, setCart]           = useState([]);
  const [sales, setSales]         = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBranches().then((r) => setBranches(r.data.data));
    getProducts({ isActive: true, limit: 200 }).then((r) => setProducts(r.data.data));
  }, []);

  useEffect(() => {
    if (!branchId) return;
    getBranchStock(branchId).then((r) => {
      const map = {};
      r.data.data.forEach((s) => { map[s.productId] = s.quantity; });
      setStockMap(map);
    });
    getSalesHistory({ branchId, saleType: 'SHOP', limit: 20 }).then((r) => setSales(r.data.data || []));
  }, [branchId]);

  const addToCart = () => setCart([...cart, { productId: '', quantity: 1, unitPrice: '' }]);

  const setCartItem = (i, field, val) => {
    const updated = [...cart];
    if (field === 'productId') {
      const product = products.find((p) => p.id === Number(val));
      updated[i] = { ...updated[i], productId: val, unitPrice: product ? Number(product.price) : '' };
    } else {
      updated[i] = { ...updated[i], [field]: val };
    }
    setCart(updated);
  };

  const total = cart.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice || 0)), 0);

  const handleSubmit = async () => {
    if (!branchId) return addToast({ type: 'error', message: 'Select a branch' });
    if (!cart.length) return addToast({ type: 'error', message: 'Cart is empty' });
    setSubmitting(true);
    try {
      await shopSale({
        branchId: Number(branchId),
        items: cart.map((i) => ({ productId: Number(i.productId), quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
      });
      addToast({ type: 'success', title: 'Sale Recorded', message: `Shop sale of ${fmt(total)} completed.` });
      setCart([]);
      getSalesHistory({ branchId, saleType: 'SHOP', limit: 20 }).then((r) => setSales(r.data.data || []));
      getBranchStock(branchId).then((r) => {
        const map = {}; r.data.data.forEach((s) => { map[s.productId] = s.quantity; }); setStockMap(map);
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Sale failed' });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">New Shop Sale</h2>
        <div className="flex items-end gap-4 mb-5">
          <div className="w-56">
            <Select label="Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={!!user.branchId}>
              <option value="">Select branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <Button variant="secondary" onClick={addToCart}><Plus size={15} /> Add Item</Button>
        </div>

        {cart.length > 0 && (
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase px-1">
              <div className="col-span-5">Product</div><div className="col-span-2">Available</div>
              <div className="col-span-2">Qty</div><div className="col-span-2">Price ₹</div><div className="col-span-1"></div>
            </div>
            {cart.map((item, i) => {
              const avail = item.productId ? (stockMap[Number(item.productId)] ?? 0) : '—';
              const over  = item.productId && Number(item.quantity) > (stockMap[Number(item.productId)] || 0);
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select value={item.productId} onChange={(e) => setCartItem(i, 'productId', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                      <option value="">Select product</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 text-sm text-center font-medium text-gray-600">{avail}</div>
                  <div className="col-span-2">
                    <input type="number" min="1" value={item.quantity} onChange={(e) => setCartItem(i, 'quantity', e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${over ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => setCartItem(i, 'unitPrice', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-base font-bold text-gray-900">Total: {fmt(total)}</span>
              <Button loading={submitting} onClick={handleSubmit}><ShoppingCart size={15} /> Record Sale</Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Today's Shop Sales</h2>
        <Table
          columns={[
            { key: 'saleDate', label: 'Time', render: (v) => new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) },
            { key: 'saleItems', label: 'Items', render: (v) => v?.length || 0 },
            { key: 'totalAmount', label: 'Amount', render: (v) => fmt(v) },
            { key: 'user', label: 'Cashier', render: (_, r) => r.user?.name || '—' },
          ]}
          data={sales} loading={false} emptyMessage="No shop sales today"
        />
      </div>
    </div>
  );
}
