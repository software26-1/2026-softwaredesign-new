import { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import client from '../../api/client';
import type { ApiResponse } from '../../types/common';

interface UserRow {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  schoolName: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  residentNumber?: string;
}

const ROLE_MAP: Record<string, string> = { TEACHER: '교사', STUDENT: '학생', PARENT: '학부모', ADMIN: '관리자' };
const STATUS_MAP: Record<string, string> = { ACTIVE: '활성', INACTIVE: '비활성', WAITING_APPROVAL: '승인대기', PENDING: '미완료' };
const roleBg: Record<string, string> = { TEACHER: '#ebf4ff', STUDENT: '#e8f5e9', PARENT: '#fff3e0', ADMIN: '#f3e5f5' };
const roleColor: Record<string, string> = { TEACHER: '#1e5a99', STUDENT: '#2e7d32', PARENT: '#e65100', ADMIN: '#6a1b9a' };

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'pending'>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<UserRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const url = tab === 'pending' ? '/admin/users/pending' : '/admin/users';
      const res = await client.get<ApiResponse<UserRow[]>>(url);
      setUsers(res.data.data ?? []);
    } catch {
      setError('사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await client.put(`/admin/users/${id}/approve`);
      await load();
    } catch { setError('승인 처리 실패'); }
    finally { setActionLoading(null); }
  };

  const handleToggleActive = async (user: UserRow) => {
    setActionLoading(user.id);
    try {
      if (user.status === 'ACTIVE') {
        await client.put(`/admin/users/${user.id}/reject`);
      } else {
        await client.put(`/admin/users/${user.id}/approve`);
      }
      await load();
    } catch { setError('상태 변경 실패'); }
    finally { setActionLoading(null); }
  };

  const filtered = users.filter(u =>
    u.name?.includes(search) || u.email?.includes(search)
  );

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>USER MANAGEMENT</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>사용자 관리</h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['all', 'pending'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
            background: tab === t ? '#1e5a99' : '#f1f5f9',
            color: tab === t ? '#fff' : '#64748b',
          }}>
            {t === 'all' ? '전체' : '승인 대기'}
          </button>
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text" placeholder="이름 또는 이메일 검색"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', flex: 1 }}
          />
        </div>

        {error && <p style={{ color: '#c62828', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

        {loading ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>사용자가 없습니다.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['이름', '이메일', '역할', '학교', '상태', '', '관리'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{u.name || '—'}</td>
                  <td style={{ ...tdStyle, color: '#64748b', fontSize: '12px' }}>{u.email}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: roleBg[u.role] ?? '#f1f5f9', color: roleColor[u.role] ?? '#64748b' }}>
                      {ROLE_MAP[u.role] ?? u.role}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: '#475569' }}>{u.schoolName || '—'}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: u.status === 'ACTIVE' ? '#e8f5e9' : u.status === 'WAITING_APPROVAL' ? '#fff3e0' : '#f5f5f5', color: u.status === 'ACTIVE' ? '#2e7d32' : u.status === 'WAITING_APPROVAL' ? '#e65100' : '#9e9e9e' }}>
                      {STATUS_MAP[u.status] ?? u.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <Button size="sm" variant="secondary" onClick={() => setSelected(u)}>상세</Button>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {u.status === 'WAITING_APPROVAL' && (
                        <Button size="sm" onClick={() => handleApprove(u.id)} disabled={actionLoading === u.id}>
                          승인
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={u.status === 'ACTIVE' ? 'danger' : 'success'}
                        onClick={() => handleToggleActive(u)}
                        disabled={actionLoading === u.id}
                      >
                        {u.status === 'ACTIVE' ? '비활성화' : '활성화'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal isOpen={!!selected} title="사용자 상세 정보" onClose={() => setSelected(null)}>
        {selected && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              ['이름', selected.name || '—'],
              ['이메일', selected.email],
              ['전화번호', selected.phone || '—'],
              ['주민등록번호', selected.residentNumber || '—'],
              ['역할', ROLE_MAP[selected.role] ?? selected.role],
              ['학교', selected.schoolName || '—'],
              ['상태', STATUS_MAP[selected.status] ?? selected.status],
              ['신청일', selected.updatedAt ? selected.updatedAt.slice(0, 10) : (selected.createdAt ? selected.createdAt.slice(0, 10) : '—')],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>{k}</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', wordBreak: 'break-all' }}>{v}</p>
              </div>
            ))}
            {selected.status === 'WAITING_APPROVAL' && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Button onClick={() => { handleApprove(selected.id); setSelected(null); }}>승인</Button>
                <Button variant="danger" onClick={() => { handleToggleActive(selected); setSelected(null); }}>거절</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
