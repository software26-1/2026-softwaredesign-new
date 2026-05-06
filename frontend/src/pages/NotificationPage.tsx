import { useState } from 'react';
import { Button } from '../components/common/Button';

type NotiType = 'GRADE' | 'FEEDBACK' | 'COUNSELING' | 'SYSTEM';
const TYPE_LABELS: Record<NotiType, string> = { GRADE: '성적', FEEDBACK: '피드백', COUNSELING: '상담', SYSTEM: '시스템' };
const typeBg: Record<NotiType, string> = { GRADE: '#ebf4ff', FEEDBACK: '#e8f5e9', COUNSELING: '#fff3e0', SYSTEM: '#f3e5f5' };
const typeColor: Record<NotiType, string> = { GRADE: '#1e5a99', FEEDBACK: '#2e7d32', COUNSELING: '#e65100', SYSTEM: '#6a1b9a' };

interface Notification { id: number; type: NotiType; title: string; body: string; isRead: boolean; createdAt: string; }

const DUMMY: Notification[] = [
  { id: 1, type: 'GRADE', title: '성적 입력 완료', body: '수학I 중간고사 성적이 입력되었습니다.', isRead: false, createdAt: '2026-04-20 14:32' },
  { id: 2, type: 'FEEDBACK', title: '새 피드백 작성', body: '이영희 학생에게 피드백이 작성되었습니다.', isRead: false, createdAt: '2026-04-19 10:15' },
  { id: 3, type: 'COUNSELING', title: '상담 내역 등록', body: '박민수 학생 상담 내역이 등록되었습니다.', isRead: true, createdAt: '2026-04-18 16:00' },
  { id: 4, type: 'SYSTEM', title: '시스템 업데이트', body: '학생부 관리시스템이 v2.1.0으로 업데이트되었습니다.', isRead: true, createdAt: '2026-04-17 09:00' },
  { id: 5, type: 'GRADE', title: '미입력 성적 알림', body: '문학 기말고사 성적 입력 기한이 3일 남았습니다.', isRead: false, createdAt: '2026-04-16 08:00' },
];

export function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY);
  const [filter, setFilter] = useState<'ALL' | NotiType>('ALL');

  const unread = notifications.filter(n => !n.isRead).length;
  const filtered = filter === 'ALL' ? notifications : notifications.filter(n => n.type === filter);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

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
        {(['ALL', ...Object.keys(TYPE_LABELS)] as (typeof filter)[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
              border: filter === f ? 'none' : '1px solid #e2e8f0',
              background: filter === f ? 'var(--primary-blue)' : '#fff',
              color: filter === f ? '#fff' : '#64748b',
            }}>
            {f === 'ALL' ? '전체' : TYPE_LABELS[f as NotiType]}
          </button>
        ))}
      </div>

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
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: typeBg[n.type], color: typeColor[n.type] }}>
                  {TYPE_LABELS[n.type]}
                </span>
                <span style={{ fontSize: '14px', fontWeight: n.isRead ? 500 : 700, color: '#1a2332' }}>{n.title}</span>
                {!n.isRead && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1e5a99', display: 'inline-block' }} />}
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>{n.body}</p>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '20px' }}>{n.createdAt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
