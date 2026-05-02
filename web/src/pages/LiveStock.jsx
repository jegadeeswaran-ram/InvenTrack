import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getTodayDispatch } from '../api/endpoints/dispatch';
import { getLiveStock } from '../api/endpoints/sales';
import { getBranches } from '../api/endpoints/branches';
import useStore from '../store/useStore';
import { Select } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function LiveStock() {
  const { user } = useStore();
  const [branches, setBranches]   = useState([]);
  const [sessions, setSessions]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [stock, setStock]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [branchId, setBranchId]   = useState(user.branchId || '');
  const [lastUpdated, setLast]    = useState(null);

  useEffect(() => { getBranches().then((r) => setBranches(r.data.data)); }, []);

  useEffect(() => {
    if (!branchId) return;
    getTodayDispatch(branchId).then((r) => setSessions(r.data.data || []));
  }, [branchId]);

  const loadStock = async (sessionId) => {
    setLoading(true);
    try {
      const r = await getLiveStock(sessionId);
      setStock(r.data.data || []);
      setLast(new Date());
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!selected) return;
    loadStock(selected);
    const interval = setInterval(() => loadStock(selected), 30000);
    return () => clearInterval(interval);
  }, [selected]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Live Truck Stock</h2>
          {lastUpdated && (
            <span className="text-xs text-gray-400">Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
        <div className="flex gap-4 mb-5">
          <div className="w-48">
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={!!user.branchId}>
              <option value="">Select branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          {sessions.length > 0 && (
            <div className="w-56">
              <Select value={selected || ''} onChange={(e) => setSelected(e.target.value)}>
                <option value="">Select session</option>
                {sessions.map((s) => <option key={s.id} value={s.id}>{s.truckId} — {s.user?.name}</option>)}
              </Select>
            </div>
          )}
          {selected && (
            <button onClick={() => loadStock(selected)} className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 transition">
              <RefreshCw size={16} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={28} /></div>
        ) : stock.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Product', 'Price', 'Loaded', 'Sold', 'Available', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stock.map((s) => {
                  const status = s.availableQty === 0 ? 'OUT' : s.availableQty < 5 ? 'LOW' : 'OK';
                  return (
                    <tr key={s.productId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 text-gray-600">{fmt(s.price)}</td>
                      <td className="px-4 py-3 text-gray-700">{s.dispatchQty}</td>
                      <td className="px-4 py-3 text-gray-700">{s.soldQty}</td>
                      <td className={`px-4 py-3 font-semibold ${s.availableQty === 0 ? 'text-red-600' : s.availableQty < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {s.availableQty}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : selected ? (
          <p className="text-center text-gray-400 py-12 text-sm">No stock data for this session</p>
        ) : (
          <p className="text-center text-gray-400 py-12 text-sm">Select a branch and session to view live stock</p>
        )}
      </div>
    </div>
  );
}
