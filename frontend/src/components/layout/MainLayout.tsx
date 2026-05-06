import { Outlet, Navigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

export function MainLayout() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ color: 'var(--primary-blue)', fontSize: '14px' }}>불러오는 중...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa' }}>
      <Header user={user} onLogout={logout} />
      <Sidebar role={user.role} />
      <main
        style={{
          marginLeft: '220px',
          marginTop: '60px',
          padding: '32px',
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
