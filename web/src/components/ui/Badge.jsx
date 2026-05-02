const variants = {
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red:    'bg-red-50 text-red-700 ring-red-200',
  amber:  'bg-amber-50 text-amber-700 ring-amber-200',
  blue:   'bg-blue-50 text-blue-700 ring-blue-200',
  gray:   'bg-gray-100 text-gray-600 ring-gray-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
};

export default function Badge({ children, variant = 'gray', className = '' }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ring-1 ring-inset ${variants[variant]} ${className}
    `}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    ACTIVE:   { label: 'Active',   variant: 'green'  },
    PENDING:  { label: 'Pending',  variant: 'amber'  },
    CLOSED:   { label: 'Closed',   variant: 'gray'   },
    APPROVED: { label: 'Approved', variant: 'green'  },
    ADJUSTED: { label: 'Adjusted', variant: 'blue'   },
    OK:       { label: 'OK',       variant: 'green'  },
    LOW:      { label: 'Low',      variant: 'amber'  },
    OUT:      { label: 'Out',      variant: 'red'    },
    ADMIN:          { label: 'Admin',          variant: 'purple' },
    BRANCH_MANAGER: { label: 'Branch Manager', variant: 'blue'   },
    SALESPERSON:    { label: 'Salesperson',    variant: 'indigo' },
    TRUCK: { label: 'Truck', variant: 'blue'  },
    SHOP:  { label: 'Shop',  variant: 'green' },
  };
  const cfg = map[status] || { label: status, variant: 'gray' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
