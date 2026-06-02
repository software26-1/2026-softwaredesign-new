import { useState, useEffect } from 'react';
import { notificationService, type Notification } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

type NotiType = 'GRADE_UPDATE' | 'FEEDBACK' | 'COUNSELING' | 'APPROVAL' | 'ATTENDANCE' | 'RECORD';
const TYPE_LABELS: Record<string, string> = { GRADE_UPDATE: '성적', FEEDBACK: '피드백', COUNSELING: '상담', APPROVAL: '승인 요청', ATTENDANCE: '출결', RECORD: '학생부' };
const typeBg: Record<string, string> = { GRADE_UPDATE: '#ebf4ff', FEEDBACK: '#e8f5e9', COUNSELING: '#fff3e0', APPROVAL: '#f3e5f5', ATTENDANCE: '#fff8e1', RECORD: '#ede7f6' };
const typeColor: Record<string, string> = { GRADE_UPDATE: '#1e5a99', FEEDBACK: '#2e7d32', COUNSELING: '#e65100', APPROVAL: '#6a1b9a', ATTENDANCE: '#b26a00', RECORD: '#4527a0' };

const TYPE_FILTERS_BY_ROLE: Record<string, ('ALL' | NotiType)[]> = {
  ADMIN:   ['ALL', 'APPROVAL'],
  TEACHER: ['ALL', 'APPROVAL'],
  STUDENT: ['ALL', 'GRADE_UPDATE', 'FEEDBACK', 'ATTENDANCE', 'RECORD'],
  PARENT:  ['ALL', 'GRADE_UPDATE', 'FEEDBACK', 'ATTENDANCE', 'RECORD'],
};

// 마이페이지 알림 설정(localStorage)에서 꺼진 유형은 숨긴다.
const SETTING_KEY_BY_TYPE: Record<string, string> = {
  GRADE_UPDATE: 'grade', FEEDBACK: 'feedback', COUNSELING: 'counseling', APPROVAL: 'system',
  ATTENDANCE: 'attendance', RECORD: 'record',
};
function readMutedTypes(): Set<string> {
  const muted = new Set<string>();
  try {
    const saved = JSON.parse(localStorage.getItem('noti-settings') || '{}');
    Object.entries(SETTING_KEY_BY_TYPE).forEach(([type, key]) => {
      if (saved[key] === false) muted.add(type);
    });
  } catch { /* ignore */ }
  return muted;
}

export function NotificationPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readTab, setReadTab] = useState<'unread' | 'read'>('unread');
  const [typeFilter, setTypeFilter] = useState<'ALL' | NotiType>('ALL');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState<Set<string>>(() => readMutedTypes());
  const typeFilters = TYPE_FILTERS_BY_ROLE[user?.role ?? ''] ?? ['ALL'];

  // 마이페이지에서 알림 설정을 바꾸면 즉시 반영
  useEffect(() => {
    const handler = () => setMuted(readMutedTypes());
    window.addEventListener('noti-settings-updated', handler);
    return () => window.removeEventListener('noti-settings-updated', handler);
  }, []);

  const load = () => {
    notificationService.list()
      .then(list => {
        setNotifications(list);
        // 헤더 배지 업데이트
        window.dispatchEvent(new CustomEvent('notification-updated'));
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const visible = notifications.filter(n => !n.type || !muted.has(n.type));
  const unreadList = visible.filter(n => !n.isRead);
  const readList = visible.filter(n => n.isRead);
  const base = readTab === 'unread' ? unreadList : readList;
  const filtered = typeFilter === 'ALL' ? base : base.filter(n => n.type === typeFilter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const changeTab = (tab: 'unread' | 'read') => { setReadTab(tab); setPage(0); };
  const changeFilter = (f: 'ALL' | NotiType) => { setTypeFilter(f); setPage(0); };

  const markRead = async (id: number) => {
    await notificationService.markRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    window.dispatchEvent(new CustomEvent('notification-updated'));
  };

  const markAllRead = async () => {
    await Promise.allSettled(unreadList.map(n => notificationService.markRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    window.dispatchEvent(new CustomEvent('notification-updated'));
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>알림</h1>
        </div>
        {unreadList.length > 0 && (
          <button onClick={markAllRead}
            style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
            전체 읽음 처리
          </button>
        )}
      </div>

      {/* 읽음/안읽음 탭 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {([['unread', `안읽음 ${unreadList.length}`], ['read', `읽음 ${readList.length}`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => changeTab(key)}
            style={{
              padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
              background: readTab === key ? '#1e5a99' : '#f1f5f9',
              color: readTab === key ? '#fff' : '#64748b',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* 타입 필터 (두 가지 이상일 때만) */}
      {typeFilters.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {typeFilters.map(f => (
            <button key={f} onClick={() => changeFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                border: typeFilter === f ? '2px solid #1e5a99' : '1px solid #e2e8f0',
                background: typeFilter === f ? '#ebf4ff' : '#fff',
                color: typeFilter === f ? '#1e5a99' : '#64748b',
              }}>
              {f === 'ALL' ? '전체' : TYPE_LABELS[f]}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>불러오는 중...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>알림이 없습니다.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {paginated.map((n, idx) => (
            <div key={n.id}
              style={{
                padding: '16px 24px',
                borderBottom: idx < paginated.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: n.isRead ? '#fff' : '#fafcff',
                borderLeft: n.isRead ? '3px solid transparent' : '3px solid #1e5a99',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px',
              }}>
              {/* 왼쪽: 타입 배지 + 제목 + 내용 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {n.type && (
                    <span style={{ flexShrink: 0, display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: typeBg[n.type] ?? '#f5f5f5', color: typeColor[n.type] ?? '#666' }}>
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                  )}
                  <span style={{ fontSize: '14px', fontWeight: n.isRead ? 500 : 700, color: '#1a2332' }}>
                    {(n as any).title ?? n.message}
                  </span>
                  {!n.isRead && <span style={{ flexShrink: 0, width: '6px', height: '6px', borderRadius: '50%', background: '#1e5a99', display: 'inline-block' }} />}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{n.message}</p>
              </div>
              {/* 오른쪽: 날짜 + 읽음 버튼 */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {n.createdAt?.slice(0, 16).replace('T', ' ')}
                </span>
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)}
                    style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '11px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: 'nowrap' }}>
                    읽음
                  </button>
                )}
              </div>
            </div>
          ))}
          {totalPages > 1 && (
            <div style={{ padding: '14px', display: 'flex', justifyContent: 'center', gap: '6px', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: page === 0 ? 'default' : 'pointer', fontSize: '12px', color: page === 0 ? '#cbd5e1' : '#475569', fontFamily: "'Noto Sans KR', sans-serif" }}>
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: page === i ? 700 : 400, background: page === i ? '#1e5a99' : '#f1f5f9', color: page === i ? '#fff' : '#64748b', fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: page === totalPages - 1 ? 'default' : 'pointer', fontSize: '12px', color: page === totalPages - 1 ? '#cbd5e1' : '#475569', fontFamily: "'Noto Sans KR', sans-serif" }}>
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
