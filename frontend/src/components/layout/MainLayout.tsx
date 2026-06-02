import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import { ChatbotPopup } from '../common/ChatbotPopup';

function LayoutInner() {
  const { user, isLoading, logout } = useAuth();
  const { isDark } = useTheme();
  const [showChatbot, setShowChatbot] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const mainMargin = sidebarCollapsed ? 76 : 186;

  const toggleSidebar = () => {
    setSidebarCollapsed(p => !p);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 240);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: isDark ? '#0f172a' : '#f5f7fa' }}>
        <span style={{ color: 'var(--primary-blue)', fontSize: '14px' }}>불러오는 중...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .main-sidebar { display: none !important; }
          .main-content { margin-left: 0 !important; padding: 16px !important; }
          .header-school { display: none !important; }
          .header-right-full { display: none !important; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: isDark ? '#0f172a' : '#f5f7fa', transition: 'background 0.2s' }}>
        <Header user={user} onLogout={logout} />
        <div className="main-sidebar">
          <Sidebar
            role={user.role}
            classGroupId={(user as any).classGroupId}
            onChatbotToggle={() => setShowChatbot(p => !p)}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        </div>
        <main className="main-content" style={{ marginLeft: `${mainMargin}px`, marginTop: '60px', padding: '28px 120px', minHeight: 'calc(100vh - 60px)', transition: 'margin-left 0.22s ease', minWidth: 0, overflowX: 'hidden' }}>
          <Outlet />
        </main>
        {showChatbot && <ChatbotPopup onClose={() => setShowChatbot(false)} />}
      </div>
    </>
  );
}

export function MainLayout() {
  return (
    <ThemeProvider>
      <LayoutInner />
    </ThemeProvider>
  );
}
