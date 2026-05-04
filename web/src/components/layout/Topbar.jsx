import { Bell } from 'lucide-react';
import useStore from '../../store/useStore';

export default function Topbar({ title }) {
  const { user } = useStore();
  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition">
          <Bell size={18} />
        </button>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
          {user?.name?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
