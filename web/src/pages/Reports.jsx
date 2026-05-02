import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Search } from 'lucide-react';
import { getTruckSalesReport, getBranchSalesReport, getInventoryReport, getPurchaseSalesList } from '../api/endpoints/reports';
import { getBranches } from '../api/endpoints/branches';
import useStore from '../store/useStore';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import Table from '../components/ui/Table';
import { StatusBadge } from '../components/ui/Badge';
import { exportExcel, exportPDF } from '../utils/exportHelpers';

const fmt  = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`;
const TABS = ['Truck Sales', 'Branch Sales', 'Inventory', 'Purchase & Sales'];

export default function Reports() {
  const { user } = useStore();
  const [tab, setTab]         = useState(0);
  const [branches, setBranches] = useState([]);
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    branchId: user.branchId || '', dateFrom: '', dateTo: '', saleType: '',
  });

  useEffect(() => { getBranches().then((r) => setBranches(r.data.data)); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const p = { ...filters };
      if (!p.branchId) delete p.branchId;
      const apis = [getTruckSalesReport, getBranchSalesReport, getInventoryReport, getPurchaseSalesList];
      const r = await apis[tab](p);
      setData(Array.isArray(r.data.data) ? r.data.data : []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab, filters]);

  const tabCols = [
    // Truck Sales
    [
      { key:'branch',      label:'Branch' },
      { key:'truckId',     label:'Truck' },
      { key:'salesperson', label:'Salesperson' },
      { key:'date',        label:'Date', render:(v) => new Date(v).toLocaleDateString('en-IN') },
      { key:'status',      label:'Status', render:(v) => <StatusBadge status={v} /> },
      { key:'loadedQty',   label:'Loaded' },
      { key:'soldQty',     label:'Sold' },
      { key:'returnQty',   label:'Return' },
      { key:'differenceQty', label:'Diff', render:(v) => <span className={v>0?'text-amber-600 font-semibold':'text-gray-700'}>{v}</span> },
      { key:'totalAmount', label:'Amount', render:(v) => fmt(v) },
    ],
    // Branch Sales
    [
      { key:'branch',       label:'Branch' },
      { key:'date',         label:'Date' },
      { key:'shopTotal',    label:'Shop Sales',  render:(v) => fmt(v) },
      { key:'truckTotal',   label:'Truck Sales', render:(v) => fmt(v) },
      { key:'combinedTotal',label:'Total',       render:(v) => <span className="font-semibold">{fmt(v)}</span> },
    ],
    // Inventory
    [
      { key:'product',     label:'Product' },
      { key:'category',    label:'Category' },
      { key:'branch',      label:'Branch' },
      { key:'branchStock', label:'Branch Stock' },
      { key:'truckStock',  label:'Truck In-Transit' },
      { key:'minAlert',    label:'Min Alert' },
      { key:'status',      label:'Status', render:(v) => <StatusBadge status={v} /> },
    ],
    // Purchase & Sales
    [
      { key:'date',      label:'Date',     render:(v) => new Date(v).toLocaleDateString('en-IN') },
      { key:'branch',    label:'Branch' },
      { key:'user',      label:'User' },
      { key:'saleType',  label:'Type',     render:(v) => <StatusBadge status={v} /> },
      { key:'product',   label:'Product' },
      { key:'quantity',  label:'Qty' },
      { key:'unitPrice', label:'Unit Price', render:(v) => fmt(v) },
      { key:'total',     label:'Total',    render:(v) => fmt(v) },
    ],
  ];

  const titles = ['Truck Sales Report', 'Branch Sales Report', 'Inventory Report', 'Purchase & Sales List'];
  const filenames = ['truck-sales', 'branch-sales', 'inventory', 'purchase-sales'];

  const flatData = data.map((r) => {
    const flat = {};
    tabCols[tab].forEach((c) => { flat[c.label] = r[c.key] ?? ''; });
    return flat;
  });

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex border-b border-gray-200">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === i ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{t}</button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 flex flex-wrap gap-3 items-end justify-between border-b border-gray-100">
          <div className="flex flex-wrap gap-3">
            {user.role === 'ADMIN' && (
              <Select value={filters.branchId} onChange={(e) => setFilters({...filters,branchId:e.target.value})} className="w-40">
                <option value="">All branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            )}
            {tab === 3 && (
              <Select value={filters.saleType} onChange={(e) => setFilters({...filters,saleType:e.target.value})} className="w-32">
                <option value="">All types</option>
                <option value="TRUCK">Truck</option>
                <option value="SHOP">Shop</option>
              </Select>
            )}
            {tab !== 2 && <>
              <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters,dateFrom:e.target.value})} className="w-36" />
              <Input type="date" value={filters.dateTo}   onChange={(e) => setFilters({...filters,dateTo:e.target.value})}   className="w-36" />
            </>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => exportExcel(flatData, filenames[tab], TABS[tab])}>
              <FileSpreadsheet size={15} /> Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportPDF(titles[tab], tabCols[tab], data, filenames[tab])}>
              <FileText size={15} /> PDF
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Table columns={tabCols[tab]} data={data} loading={loading} emptyMessage="No data for selected filters" />
        </div>
      </div>
    </div>
  );
}
