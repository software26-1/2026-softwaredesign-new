import { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { notificationService, type Notification } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

type NotiType = 'GRADE_UPDATE' | 'FEEDBACK' | 'COUNSELING' | 'APPROVAL';
const TYPE_LABELS: Record<string, string> = { GRADE_UPDATE: '성적', FEEDBACK: '피드백', COUNSELING: '상담', APPROVAL: '승인 요청' };
const typeBg: Record<string, string> = { GRADE_UPDATE: '#ebf4ff', FEEDBACK: '#e8f5e9', COUNSELING: '#fff3e0', APPROVAL: '#f3e5f5' };
const typeColor: Record<string, string> = { GRADE_UPDATE: '#1e5a99', FEEDBACK: '#2e7d32', COUNSELING: '#e65100', APPROVAL: '#6a1b9a' };

const FILTERS_BY_ROLE: Record<string, ('ALL' | NotiType)[]> = {
  ADMIN:   ['ALL', 'APPROVAL'],
  TEACHER: ['ALL', 'FEEDBACK', 'COUNSELING'],
  STUDENT: ['ALL', 'GRADE_UPDATE', 'FEEDBACK'],
  PARENT:  ['ALL', 'GRADE_UPDATE', 'FEEDBACK'],
};

export function NotificationPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'ALL' | NotiType>('ALL');
  const [loading, setLoading] = useState(true);
  const filters = FILTERS_BY_ROLE[user?.role ?? ''] ?? ['ALL', 'GRADE_UPDATE', 'FEEDBACK', 'COUNSELING', 'APPROVAL'];

  useEffect(() => {
    notificationService.list()
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const unread = notifications.filter(n => !n.isRead).length;

  const filtered = filter === 'ALL'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const markAllRead = async () => {
    const unreadItems = notifications.filter(n => !n.isRead);
    await Promise.allSettled(unreadItems.map(n => notificationService.markRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = async (id: number) => {
    await notificationService.markRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>NOTIFICATIONS</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>
            알림
            {unread > 0 && (
              <span style={{ marginLeft: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', background: '#e74c3c', color: '#fff', borderRadius: '50%', fontSize: '11px', fontWeight: 700 }}>
                {unread}
              </span>
            )}
          </h1>
        </div>
        {unread > 0 && <Button size="sm" variant="secondary" onClick={markAllRead}>전체 읽음 처리</Button>}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
              border: filter === f ? 'none' : '1px solid #e2e8f0',
              background: filter === f ? 'var(--primary-blue)' : '#fff',
              color: filter === f ? '#fff' : '#64748b',
            }}>
            {f === 'ALL' ? '전체' : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>불러오는 중...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>알림이 없습니다.</p>
            </div>
          ) : filtered.map(n => (
            <div key={n.id} onClick={() => markRead(n.id)}
              style={{
                background: n.isRead ? '#fff' : '#fafcff',
                borderRadius: '10px', padding: '18px 24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                borderLeft: n.isRead ? '4px solid transparent' : '4px solid var(--primary-blue)',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  {n.type && (
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: typeBg[n.type] ?? '#f5f5f5', color: typeColor[n.type] ?? '#666' }}>
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                  )}
                  <span style={{ fontSize: '14px', fontWeight: n.isRead ? 500 : 700, color: '#1a2332' }}>
                    {(n as { title?: string }).title ?? n.message ?? '알림'}
                  </span>
                  {!n.isRead && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1e5a99', display: 'inline-block' }} />}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>{n.message}</p>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '20px' }}>
                {n.createdAt?.slice(0, 16).replace('T', ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
