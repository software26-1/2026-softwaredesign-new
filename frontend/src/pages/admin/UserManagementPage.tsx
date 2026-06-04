import { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
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
  position?: string;
  teacherId?: number;
}

const STATUS_MAP: Record<string, string> = {
  ACTIVE: '활성', INACTIVE: '비활성', WAITING_APPROVAL: '승인대기', PENDING: '미완료',
};
const POSITION_MAP: Record<string, string> = {
  HOMEROOM_SUBJECT:     '담임 · 교과',
  HOMEROOM_NON_SUBJECT: '담임 · 비교과',
  SUBJECT:              '교과담당',
  NON_SUBJECT:          '비교과',
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE:           { bg: '#e8f5e9', color: '#2e7d32' },
  INACTIVE:         { bg: '#f5f5f5', color: '#9e9e9e' },
  WAITING_APPROVAL: { bg: '#fff3e0', color: '#e65100' },
  PENDING:          { bg: '#f5f5f5', color: '#9e9e9e' },
};
const POS_STYLE: Record<string, { bg: string; color: string }> = {
  HOMEROOM_SUBJECT:     { bg: '#ebf4ff', color: '#1e5a99' },
  HOMEROOM_NON_SUBJECT: { bg: '#dbeafe', color: '#1e40af' },
  SUBJECT:              { bg: '#e8f5e9', color: '#2e7d32' },
  NON_SUBJECT:          { bg: '#f3e5f5', color: '#6a1b9a' },
};

type MainTab = 'all' | 'inactive';
type PosFilter = 'ALL' | 'HOMEROOM' | 'SUBJECT' | 'NON_SUBJECT';

const POS_FILTERS: { key: PosFilter; label: string }[] = [
  { key: 'ALL',         label: '전체' },
  { key: 'HOMEROOM',    label: '담임' },
  { key: 'SUBJECT',     label: '교과담당' },
  { key: 'NON_SUBJECT', label: '비교과' },
];

export function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mainTab, setMainTab] = useState<MainTab>('all');
  const [posFilter, setPosFilter] = useState<PosFilter>('ALL');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [editPosition, setEditPosition] = useState<string>('');
  const [positionSaving, setPositionSaving] = useState(false);

  const load = async () => {
    setLoading(true); setError(''); setUsers([]);
    try {
      let url = '/admin/users';
      if (mainTab === 'inactive') url = '/admin/users?status=INACTIVE';
      else url = '/admin/users?status=ACTIVE';
      const res = await client.get<ApiResponse<UserRow[]>>(url);
      setUsers(res.data.data ?? []);
    } catch {
      setError('사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [mainTab]);

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try { await client.put(`/admin/users/${id}/approve`); await load(); }
    catch { setError('승인 처리 실패'); }
    finally { setActionLoading(null); }
  };

  const handleToggleActive = async (user: UserRow) => {
    setActionLoading(user.id);
    try {
      user.status === 'ACTIVE'
        ? await client.put(`/admin/users/${user.id}/reject`)
        : await client.put(`/admin/users/${user.id}/approve`);
      await load();
    } catch { setError('상태 변경 실패'); }
    finally { setActionLoading(null); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.includes(search) || u.email?.includes(search);
    const matchPos = posFilter === 'ALL' ||
      (posFilter === 'HOMEROOM' ? u.position?.startsWith('HOMEROOM') : u.position === posFilter);
    return matchSearch && matchPos;
  });

  const posCount = (pos: PosFilter) =>
    pos === 'ALL' ? users.length : users.filter(u => u.position === pos).length;

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .um-pos-filter { flex-wrap: wrap !important; }
          .um-table-wrap { overflow-x: auto; }
          .um-modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>TEACHER MANAGEMENT</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>교사 관리</h1>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {([['all', '전체'], ['inactive', '비활성화']] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setMainTab(key); setSearch(''); setPosFilter('ALL'); }}
            style={{
              padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
              background: mainTab === key ? '#1e5a99' : '#f1f5f9',
              color: mainTab === key ? '#fff' : '#64748b',
              transition: 'all 0.15s',
            }}>
            {label}
          </button>
        ))}
      </div>

      {mainTab === 'all' && (
        <div className="um-pos-filter" style={{ display: 'flex', gap: '6px', marginBottom: '16px', paddingLeft: '4px' }}>
          {POS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setPosFilter(f.key)}
              style={{
                padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
                border: posFilter === f.key ? '2px solid #1e5a99' : '1px solid #e2e8f0',
                background: posFilter === f.key ? '#ebf4ff' : '#fff',
                color: posFilter === f.key ? '#1e5a99' : '#64748b',
                transition: 'all 0.12s',
              }}>
              {f.label}
              <span style={{ marginLeft: '5px', fontSize: '11px', opacity: 0.75 }}>{posCount(f.key)}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 18px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2} style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text" placeholder="이름 또는 이메일 검색"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', outline: 'none', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", flex: 1, color: '#1e293b' }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', fontFamily: "'Noto Sans KR', sans-serif" }}>
            X 초기화
          </button>
        )}
      </div>

      {error && <p style={{ color: '#c62828', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a2332' }}>
            {mainTab === 'inactive' ? '비활성화 교사' : posFilter === 'ALL' ? '전체 교사' : `${POSITION_MAP[posFilter]} 교사`}
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>총 {filtered.length}명</span>
        </div>

        {loading ? (
          <p style={{ padding: '50px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '50px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            {search ? `"${search}" 검색 결과가 없습니다.` : '교사가 없습니다.'}
          </p>
        ) : (
          <div className="um-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['이름', '이메일', '직책', '상태', ''].map(h => (
                    <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafcff')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>{u.name || '—'}</td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '13px' }}>{u.email}</td>
                    <td style={{ padding: '14px 20px' }}>
                      {u.position ? (
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: POS_STYLE[u.position]?.bg ?? '#f1f5f9', color: POS_STYLE[u.position]?.color ?? '#64748b' }}>
                          {POSITION_MAP[u.position] ?? u.position}
                        </span>
                      ) : <span style={{ color: '#cbd5e1', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: STATUS_STYLE[u.status]?.bg ?? '#f1f5f9', color: STATUS_STYLE[u.status]?.color ?? '#64748b' }}>
                        {STATUS_MAP[u.status] ?? u.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button onClick={() => { setSelected(u); setEditPosition(u.position ?? ''); }}
                          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '12px', color: '#475569', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                          상세
                        </button>
                        {u.status === 'WAITING_APPROVAL' && (
                          <button onClick={() => handleApprove(u.id)} disabled={actionLoading === u.id}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#1e5a99', cursor: 'pointer', fontSize: '12px', color: '#fff', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                            승인
                          </button>
                        )}
                        {u.status === 'ACTIVE' && (
                          <button onClick={() => handleToggleActive(u)} disabled={actionLoading === u.id}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#fdecea', cursor: 'pointer', fontSize: '12px', color: '#c62828', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                            비활성화
                          </button>
                        )}
                        {u.status === 'INACTIVE' && (
                          <button onClick={() => handleToggleActive(u)} disabled={actionLoading === u.id}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#e8f5e9', cursor: 'pointer', fontSize: '12px', color: '#2e7d32', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                            활성화
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={!!selected} title="교사 상세 정보" onClose={() => setSelected(null)}>
        {selected && (
          <div className="um-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              ['이름', selected.name || '—'],
              ['이메일', selected.email],
              ['전화번호', selected.phone || '—'],
              ['주민등록번호', selected.residentNumber || '—'],
              ['학교', selected.schoolName || '—'],
              ['상태', STATUS_MAP[selected.status] ?? selected.status],
              ['신청일', selected.updatedAt ? selected.updatedAt.slice(0, 10) : (selected.createdAt?.slice(0, 10) ?? '—')],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>{k}</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', wordBreak: 'break-all' }}>{v}</p>
              </div>
            ))}

            <div style={{ gridColumn: '1 / -1', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>직책</p>
              {selected.teacherId ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={editPosition} onChange={e => setEditPosition(e.target.value)}
                    style={{ flex: 1, minWidth: '160px', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: "'Noto Sans KR', sans-serif" }}>
                    <option value="HOMEROOM_SUBJECT">담임 · 교과</option>
                    <option value="HOMEROOM_NON_SUBJECT">담임 · 비교과</option>
                    <option value="SUBJECT">교과담당 (비담임)</option>
                    <option value="NON_SUBJECT">비교과 (비담임)</option>
                  </select>
                  <button
                    disabled={positionSaving}
                    onClick={async () => {
                      setPositionSaving(true);
                      try {
                        await client.patch(`/teachers/${selected.teacherId}`, { position: editPosition || null });
                        await load();
                        setSelected(prev => prev ? { ...prev, position: editPosition || undefined } : null);
                        setError('');
                      } catch {
                        setError('직책 변경 실패');
                      } finally {
                        setPositionSaving(false);
                      }
                    }}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#1e5a99', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
                    {positionSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>—</p>
              )}
            </div>

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
