import { useLocation, useNavigate } from 'react-router-dom';
import type { UserRole } from '../../types/user';

const teacherNav = [
  { path: '/dashboard', label: '대시보드' },
  { path: '/students/search', label: '학생 검색' },
  { path: '/grades', label: '성적 관리' },
  { path: '/attendance', label: '출결 관리' },
  { path: '/feedback', label: '피드백 작성' },
  { path: '/counseling', label: '상담 내역' },
  { path: '/student-records', label: '학생부 기록' },
  { path: '/reports', label: '보고서 생성' },
  { path: '/notifications', label: '알림' },
];

const studentNav = [
  { path: '/dashboard', label: '대시보드' },
  { path: '/my-grades', label: '내 성적' },
  { path: '/my-attendance', label: '출결 내역' },
  { path: '/my-feedback', label: '피드백 확인' },
  { path: '/my-records', label: '학생부 조회' },
  { path: '/notifications', label: '알림' },
];

const parentNav = [
  { path: '/dashboard', label: '대시보드' },
  { path: '/child-grades', label: '자녀 성적' },
  { path: '/child-feedback', label: '자녀 피드백' },
  { path: '/notifications', label: '알림' },
];

const adminNav = [
  { path: '/dashboard', label: '대시보드' },
  { path: '/admin/users', label: '사용자 관리' },
  { path: '/admin/schools', label: '학교 관리' },
  { path: '/notifications', label: '알림' },
];

const navByRole: Record<UserRole, typeof teacherNav> = {
  TEACHER: teacherNav,
  STUDENT: studentNav,
  PARENT: parentNav,
  ADMIN: adminNav,
};

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = navByRole[role] ?? teacherNav;

  return (
    <aside
      style={{
        width: '220px',
        background: '#fff',
        borderRight: '1px solid #e8ecf0',
        paddingTop: '70px',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        overflowY: 'auto',
      }}
    >
      <nav style={{ padding: '16px 0' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '11px 24px',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                fontFamily: "'Noto Sans KR', sans-serif",
                cursor: 'pointer',
                border: 'none',
                borderLeft: isActive ? '3px solid var(--primary-blue)' : '3px solid transparent',
                background: isActive ? '#f0f5fb' : 'transparent',
                color: isActive ? 'var(--primary-blue)' : '#4a5568',
                transition: 'all 0.15s',
                letterSpacing: '-0.01em',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
