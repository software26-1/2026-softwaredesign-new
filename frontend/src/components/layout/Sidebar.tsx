import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { UserRole } from '../../types/user';
import { useTheme } from '../../contexts/ThemeContext';

type IconProps = { size?: number; color?: string };

function Svg({ size = 18, color = 'currentColor', children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {children}
    </svg>
  );
}

const ICONS = {
  home:     (p: IconProps) => <Svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>,
  chart:    (p: IconProps) => <Svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Svg>,
  users:    (p: IconProps) => <Svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></Svg>,
  search:   (p: IconProps) => <Svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>,
  clip:     (p: IconProps) => <Svg {...p}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></Svg>,
  cal:      (p: IconProps) => <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>,
  msg:      (p: IconProps) => <Svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></Svg>,
  chat:     (p: IconProps) => <Svg {...p}><path d="M8 12h.01M12 12h.01M16 12h.01"/><path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></Svg>,
  file:     (p: IconProps) => <Svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></Svg>,
  doc:      (p: IconProps) => <Svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></Svg>,
  bell:     (p: IconProps) => <Svg {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></Svg>,
  building: (p: IconProps) => <Svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></Svg>,
  book:     (p: IconProps) => <Svg {...p}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></Svg>,
  check:    (p: IconProps) => <Svg {...p}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>,
  moon:     (p: IconProps) => <Svg {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></Svg>,
  sun:      (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></Svg>,
};

type IconKey = keyof typeof ICONS;
type SubItem = { label: string; tab: string };
type NavItem = { path: string; label: string; icon: IconKey; subItems?: SubItem[] };

const teacherNav: NavItem[] = [
  { path: '/dashboard',       label: '홈',          icon: 'home'     },
  { path: '/analytics',       label: '학급 분석',   icon: 'chart'    },
  { path: '/class-management',label: '학급 관리',   icon: 'users',   subItems: [{ label: '학생 명단', tab: 'students' }, { label: '과목 배정', tab: 'courses' }, { label: '가입 승인', tab: 'approvals' }, { label: '전학 관리', tab: 'transfer' }] },
  { path: '/students/search', label: '학생 검색',   icon: 'search',  subItems: [{ label: '성적', tab: 'grade' }, { label: '피드백', tab: 'feedback' }, { label: '상담', tab: 'counseling' }, { label: '학생부', tab: 'record' }] },
  { path: '/grades',          label: '성적 관리',   icon: 'clip'     },
  { path: '/attendance',      label: '출결 관리',   icon: 'cal',     subItems: [{ label: '출결 입력', tab: 'input' }, { label: '출결 현황', tab: 'history' }] },
  { path: '/feedback',        label: '피드백 작성', icon: 'msg',     subItems: [{ label: '피드백 작성', tab: '' }, { label: '피드백 목록', tab: 'list' }] },
  { path: '/counseling',      label: '상담 내역',   icon: 'chat',    subItems: [{ label: '상담 등록', tab: '' }, { label: '상담 조회', tab: 'list' }] },
  { path: '/student-records', label: '학생부 기록', icon: 'file',    subItems: [{ label: '학생부 작성', tab: '' }, { label: '학생부 조회', tab: 'list' }] },
  { path: '/reports',         label: '보고서 생성', icon: 'doc'      },
  { path: '/notifications',   label: '알림',        icon: 'bell'     },
];

const studentNav: NavItem[] = [
  { path: '/dashboard',    label: '홈',          icon: 'home'  },
  { path: '/my-grades',    label: '내 성적',     icon: 'chart' },
  { path: '/my-attendance',label: '출결 내역',   icon: 'cal'   },
  { path: '/my-feedback',  label: '피드백 확인', icon: 'msg'   },
  { path: '/my-records',   label: '학생부 조회', icon: 'file'  },
  { path: '/notifications',label: '알림',        icon: 'bell'  },
];

const parentNav: NavItem[] = [
  { path: '/dashboard',       label: '홈',          icon: 'home'  },
  { path: '/child-grades',    label: '자녀 성적',   icon: 'chart' },
  { path: '/child-attendance',label: '자녀 출결',   icon: 'cal'   },
  { path: '/child-feedback',  label: '자녀 피드백', icon: 'msg'   },
  { path: '/child-records',   label: '자녀 학생부', icon: 'file'  },
  { path: '/notifications',   label: '알림',        icon: 'bell'  },
];

const adminNav: NavItem[] = [
  { path: '/dashboard',        label: '홈',        icon: 'home'     },
  { path: '/admin/users',      label: '교사 관리', icon: 'users'    },
  { path: '/admin/schools',    label: '학교 관리', icon: 'building' },
  { path: '/admin/courses',    label: '과목 관리', icon: 'book'     },
  { path: '/admin/approvals',  label: '승인 대기', icon: 'check',   subItems: [{ label: '가입 신청', tab: 'join' }, { label: '교원 전학', tab: 'teacher_transfer' }, { label: '학생 전학', tab: 'student_transfer' }] },
  { path: '/notifications',    label: '알림',      icon: 'bell'     },
];

const navByRole: Record<UserRole, NavItem[]> = {
  TEACHER: teacherNav,
  STUDENT: studentNav,
  PARENT:  parentNav,
  ADMIN:   adminNav,
};

interface SidebarProps {
  role: UserRole;
  classGroupId?: number | null;
  onChatbotToggle?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ role, classGroupId, onChatbotToggle, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [hovered, setHovered] = useState<string | null>(null);

  let navItems = navByRole[role] ?? teacherNav;
  if (role === 'TEACHER' && !classGroupId) {
    navItems = navItems.filter(item => item.path !== '/analytics' && item.path !== '/class-management');
  }

  const bg           = isDark ? '#111827' : '#ffffff';
  const border       = isDark ? '#1f2937' : '#e8ecf0';
  const activeBg     = isDark ? '#2563eb' : '#1e5a99';
  const activeColor  = '#ffffff';
  const inactiveColor= isDark ? '#9ca3af' : '#64748b';
  const hoverBg      = isDark ? '#1f2937' : '#f0f5ff';

  return (
    <aside style={{
      width: isCollapsed ? '64px' : '170px',
      background: bg,
      borderRadius: '18px',
      position: 'fixed',
      left: '4px',
      top: '70px',
      bottom: '8px',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.22s ease, background 0.2s, box-shadow 0.2s',
      zIndex: 100,
      boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.06)',
      border: isDark ? 'none' : '1px solid #e8ecf0',
      overflow: 'hidden',
    }}>
      {/* Nav items */}
      {/* 접기/펼치기 토글 */}
      <div style={{ padding: '10px 8px 4px', display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-end' }}>
        <button
          onClick={() => onToggleCollapse?.()}
          title={isCollapsed ? '펼치기' : '접기'}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: inactiveColor, padding: '4px 6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={inactiveColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            {isCollapsed
              ? <><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></>
              : <><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></>
            }
          </svg>
        </button>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: `6px ${isCollapsed ? '6px' : '6px'} 0` }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isHov    = hovered === item.path;
          const iconColor = isActive ? activeColor : inactiveColor;
          return (
            <div key={item.path} style={{ marginBottom: '2px' }}>
              <button
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHovered(item.path)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex',
                  flexDirection: isCollapsed ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: isCollapsed ? '3px' : '8px',
                  width: '100%',
                  textAlign: 'center',
                  padding: isCollapsed ? '10px 4px' : '9px 10px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: isCollapsed ? '14px' : '22px',
                  background: isActive ? activeBg : isHov ? hoverBg : 'transparent',
                  color: isActive ? activeColor : inactiveColor,
                  transition: 'all 0.15s',
                  boxShadow: isActive ? (isDark ? '0 2px 8px rgba(30,90,153,0.25)' : '0 2px 8px rgba(30,90,153,0.10)') : 'none',
                }}
              >
                <span style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {ICONS[item.icon]({ size: 18, color: iconColor })}
                </span>
                {!isCollapsed && <span style={{ lineHeight: 1 }}>{item.label}</span>}
                {isCollapsed && <span style={{ fontSize: '9px', lineHeight: 1, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '52px', textOverflow: 'ellipsis' }}>{item.label}</span>}
              </button>
              {!isCollapsed && item.subItems && (
                <div style={{ paddingLeft: '8px', paddingBottom: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px' }}>
                  {item.subItems.map(sub => (
                    <button
                      key={sub.tab}
                      onClick={() => navigate(sub.tab ? `${item.path}?tab=${sub.tab}` : item.path)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '3px 8px', fontSize: '10px', color: inactiveColor, background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '5px', fontFamily: "'Noto Sans KR', sans-serif", transition: 'background 0.12s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      · {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: chatbot */}
      <div style={{ padding: '10px 8px 16px', borderTop: `1px solid ${border}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isCollapsed ? '0' : '7px' }}>
          <button
            onClick={() => onChatbotToggle?.()}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.07)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(30,90,153,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 14px rgba(30,90,153,0.32)';
            }}
            style={{
              width: isCollapsed ? '44px' : '56px',
              height: isCollapsed ? '44px' : '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e5a99 0%, #2d7dd2 100%)',
              border: '2.5px solid #F4A000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(30,90,153,0.32)',
              transition: 'transform 0.2s, box-shadow 0.2s, width 0.22s, height 0.22s',
            }}
          >
            <img src="/mascot2.png" alt="마스코트" style={{ width: isCollapsed ? '38px' : '44px', height: isCollapsed ? '38px' : '44px', objectFit: 'cover', borderRadius: '50%', transition: 'width 0.22s, height 0.22s' }} />
          </button>
          {!isCollapsed && <span style={{ fontSize: '11px', fontWeight: 600, color: inactiveColor, fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '-0.01em' }}>AI 챗봇</span>}
        </div>
      </div>
    </aside>
  );
}
