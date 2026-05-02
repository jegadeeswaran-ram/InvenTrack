export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        {...props}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm text-gray-900
          placeholder-gray-400 outline-none transition
          focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-gray-300'}
          ${className}
        `}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        {...props}
        className={`
          w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white
          outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100
          ${error ? 'border-red-400' : 'border-gray-300'} ${className}
        `}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
