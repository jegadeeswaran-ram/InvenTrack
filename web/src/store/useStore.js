import { create } from 'zustand';

const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user:         JSON.parse(localStorage.getItem('user') || 'null'),
  accessToken:  localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,

  setAuth: ({ user, accessToken, refreshToken }) => {
    localStorage.setItem('user',         JSON.stringify(user));
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken });
  },

  clearAuth: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  isAuthenticated: () => Boolean(get().accessToken && get().user),

  // ── Toast ─────────────────────────────────────────────────────────────────
  toasts: [],
  addToast: (toast) => {
    const id = Date.now();
    set((s) => ({ toasts: [...s.toasts, { id, ...toast }] }));
    setTimeout(() => get().removeToast(id), toast.duration || 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ── Branches ──────────────────────────────────────────────────────────────
  branches: [],
  setBranches: (branches) => set({ branches }),
}));

export default useStore;
