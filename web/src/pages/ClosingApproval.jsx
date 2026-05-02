import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { getPending, getClosing, approveClosing } from '../api/endpoints/closing';
import useStore from '../store/useStore';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

export default function ClosingApproval() {
  const { user, addToast } = useStore();
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [detail, setDetail]         = useState(null);
  const [loadingDetail, setLD]      = useState(false);
  const [adjustments, setAdj]       = useState({});
  const [reason, setReason]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await getPending({ branchId: user.branchId });
      setRecords(r.data.data || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openReview = async (rec) => {
    setSelected(rec);
    setLD(true);
    try {
      const r = await getClosing(rec.id);
      setDetail(r.data.data);
      const adj = {};
      r.data.data.stockItems.forEach((i) => { adj[i.productId] = i.enteredReturnQty; });
      setAdj(adj);
    } finally { setLD(false); }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await approveClosing(selected.id, {
        adjustments: detail.stockItems.map((i) => ({
          productId:        i.productId,
          approvedReturnQty: adjustments[i.productId] ?? i.enteredReturnQty,
          reason,
        })),
      });
      addToast({ type: 'success', title: 'Approved', message: 'Day closing approved and stock updated.' });
      setSelected(null); setDetail(null);
      load();
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.response?.data?.message || 'Approval failed' });
    } finally { setSubmitting(false); }
  };

  const hasAdjustment = detail?.stockItems.some((i) => adjustments[i.productId] !== i.enteredReturnQty);

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Pending Day Closings ({records.length})</h2>
        {records.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={36} className="mx-auto text-emerald-400 mb-2" />
            <p className="text-gray-500 text-sm">No pending closings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-indigo-200 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{rec.session?.truckId}</span>
                    <StatusBadge status={rec.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {rec.session?.branch?.name} · {rec.submitter?.name} ·{' '}
                    {new Date(rec.submittedAt).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-amber-600">
                    {rec.stockItems?.filter((i) => i.differenceQty > 0).length} items with differences
                  </p>
                </div>
                <Button size="sm" onClick={() => openReview(rec)}>Review</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title="Review Day Closing" size="xl">
        {loadingDetail ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm grid grid-cols-3 gap-3">
              <div><p className="text-gray-500">Truck</p><p className="font-semibold">{detail.session?.truckId}</p></div>
              <div><p className="text-gray-500">Salesperson</p><p className="font-semibold">{detail.submitter?.name}</p></div>
              <div><p className="text-gray-500">Date</p><p className="font-semibold">{new Date(detail.submittedAt).toLocaleDateString('en-IN')}</p></div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Product', 'Loaded', 'Sold', 'Remaining', 'Entered Return', 'Diff', 'Approved Return'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detail.stockItems.map((item) => {
                    const diff = item.differenceQty;
                    const approved = adjustments[item.productId] ?? item.enteredReturnQty;
                    return (
                      <tr key={item.id} className={diff > 0 ? 'bg-amber-50' : ''}>
                        <td className="px-3 py-2.5 font-medium text-gray-900">{item.product?.name}</td>
                        <td className="px-3 py-2.5 text-gray-700">{item.dispatchQty}</td>
                        <td className="px-3 py-2.5 text-gray-700">{item.soldQty}</td>
                        <td className="px-3 py-2.5 text-gray-700">{item.systemRemaining}</td>
                        <td className="px-3 py-2.5 text-gray-700">{item.enteredReturnQty}</td>
                        <td className="px-3 py-2.5">
                          {diff === 0
                            ? <CheckCircle size={16} className="text-emerald-500" />
                            : <span className="font-semibold text-amber-600">{diff}</span>}
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="number" min="0" max={item.systemRemaining}
                            value={approved}
                            onChange={(e) => setAdj({ ...adjustments, [item.productId]: Number(e.target.value) })}
                            className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasAdjustment && (
              <div>
                <label className="text-sm font-medium text-gray-700">Adjustment Reason <span className="text-red-500">*</span></label>
                <textarea
                  rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why quantities were adjusted..."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setSelected(null); setDetail(null); }}>Cancel</Button>
              <Button className="flex-1" loading={submitting}
                disabled={hasAdjustment && !reason.trim()}
                onClick={handleApprove}>
                <CheckCircle size={15} /> Approve & Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
