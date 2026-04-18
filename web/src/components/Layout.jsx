import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh', padding: '28px 32px', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  );
}
