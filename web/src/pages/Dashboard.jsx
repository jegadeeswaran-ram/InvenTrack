import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ShoppingBag, ClipboardCheck, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getBranchSalesReport } from '../api/endpoints/reports';
import { getPending } from '../api/endpoints/closing';
import { getLowStock } from '../api/endpoints/products';
import useStore from '../store/useStore';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const last7Days = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
};

export default function Dashboard() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [chartData, setChartData]   = useState([]);
  const [metrics, setMetrics]       = useState({ truckToday: 0, shopToday: 0, pending: 0, lowStock: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const dates = last7Days();
        const dateFrom = dates[0];
        const dateTo   = dates[6];
        const params   = { dateFrom, dateTo };
        if (user.branchId) params.branchId = user.branchId;

        const [salesRes, pendingRes, lowRes] = await Promise.all([
          getBranchSalesReport(params),
          getPending({ branchId: user.branchId }),
          getLowStock({ branchId: user.branchId }),
        ]);

        const salesByDate = {};
        for (const row of salesRes.data?.data || []) {
          if (!salesByDate[row.date]) salesByDate[row.date] = { truck: 0, shop: 0 };
          salesByDate[row.date].truck += row.truckTotal;
          salesByDate[row.date].shop  += row.shopTotal;
        }

        const today = new Date().toISOString().slice(0, 10);
        setChartData(dates.map((d) => ({
          date:  d.slice(5),
          Truck: salesByDate[d]?.truck || 0,
          Shop:  salesByDate[d]?.shop  || 0,
        })));

        setMetrics({
          truckToday: salesByDate[today]?.truck || 0,
          shopToday:  salesByDate[today]?.shop  || 0,
          pending:    pendingRes.data?.data?.length || 0,
          lowStock:   lowRes.data?.data?.length || 0,
        });
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: "Today's Truck Sales", value: fmt(metrics.truckToday), icon: Truck,          color: 'text-indigo-600 bg-indigo-50' },
    { label: "Today's Shop Sales",  value: fmt(metrics.shopToday),  icon: ShoppingBag,    color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pending Closings',    value: metrics.pending,          icon: ClipboardCheck, color: 'text-amber-600 bg-amber-50',  badge: metrics.pending > 0 },
    { label: 'Low Stock Alerts',    value: metrics.lowStock,         icon: AlertTriangle,  color: 'text-red-600 bg-red-50',      badge: metrics.lowStock > 0 },
  ];

  const quickActions = [
    { label: 'New Dispatch',      path: '/dispatch',  icon: Truck },
    { label: 'Shop Sale',         path: '/shop-sales',icon: ShoppingBag },
    { label: 'Pending Closings',  path: '/closing',   icon: ClipboardCheck },
    { label: 'Reports',           path: '/reports',   icon: TrendingUp },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{c.label}</p>
                <p className={`text-2xl font-bold mt-1 ${c.badge && Number(c.value) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {c.value}
                </p>
              </div>
              <span className={`p-2 rounded-lg ${c.color}`}>
                <c.icon size={18} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">7-Day Sales Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, '']} />
              <Legend />
              <Line type="monotone" dataKey="Truck" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Shop"  stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition group"
              >
                <span className="flex items-center gap-2.5">
                  <a.icon size={16} className="text-gray-400 group-hover:text-indigo-500" />
                  {a.label}
                </span>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
