import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import useStore from '../../store/useStore';

const icons = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  error:   <XCircle    size={18} className="text-red-500"     />,
  warning: <AlertCircle size={18} className="text-amber-500"  />,
  info:    <Info        size={18} className="text-blue-500"   />,
};

export default function ToastContainer() {
  const { toasts, removeToast } = useStore();
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg"
        >
          <span className="mt-0.5 shrink-0">{icons[t.type] || icons.info}</span>
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-semibold text-gray-900">{t.title}</p>}
            <p className="text-sm text-gray-600">{t.message}</p>
          </div>
          <button onClick={() => removeToast(t.id)} className="shrink-0 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
