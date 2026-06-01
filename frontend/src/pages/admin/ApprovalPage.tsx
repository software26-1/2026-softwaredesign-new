import { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import client from '../../api/client';
import type { ApiResponse } from '../../types/common';

interface ApprovalRow {
  id: number;
  requesterId: number;
  requesterName: string;
  requesterEmail: string;
  requestType: string;
  requestDetail: string;
  status: string;
  createdAt: string;
  fromSchoolName?: string;
  toSchoolName?: string;
  fromSchoolStatus?: string;
  toSchoolStatus?: string;
}

type TabType = 'join' | 'teacher_transfer' | 'student_transfer';

const TYPE_MAP: Record<string, string> = {
  TEACHER_JOIN: '교사 가입',
  TEACHER_TRANSFER: '교사 전근',
  STUDENT_TRANSFER: '학생 전학',
};

const STATUS_MAP: Record<string, string> = {
  PENDING: '대기 중',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#fff3e0', color: '#e65100' },
  APPROVED: { bg: '#e8f5e9', color: '#2e7d32' },
  REJECTED: { bg: '#fdecea', color: '#c62828' },
};

const thStyle: React.CSSProperties = {
  padding: '11px 20px', textAlign: 'left', fontWeight: 600,
  color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc',
};
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function ApprovalPage() {
  const [tab, setTab] = useState<TabType>('join');
  const [items, setItems] = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ApprovalRow | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = async () => {
    setLoading(true); setError(''); setItems([]);
    try {
      if (tab === 'join') {
        const res = await client.get<ApiResponse<ApprovalRow[]>>('/admin/users/pending');
        setItems((res.data.data ?? []).map(u => ({
          id: u.id,
          requesterId: u.id,
          requesterName: (u as any).name,
          requesterEmail: (u as any).email,
          requestType: 'TEACHER_JOIN',
          requestDetail: '',
          status: 'PENDING',
          createdAt: (u as any).updatedAt ?? (u as any).createdAt,
        })));
      } else {
        const type = tab === 'teacher_transfer' ? 'TEACHER_TRANSFER' : 'STUDENT_TRANSFER';
        const res = await client.get<ApprovalRow[]>(`/approval-requests/school?status=PENDING`);
        const data = Array.isArray(res.data) ? res.data : (res.data as any).data ?? [];
        setItems(data.filter((r: ApprovalRow) => r.requestType === type));
      }
    } catch { setError('목록을 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const handleApproveJoin = async (id: number) => {
    setActionLoading(id);
    try { await client.put(`/admin/users/${id}/approve`); await load(); }
    catch { setError('승인 실패'); }
    finally { setActionLoading(null); }
  };

  const handleRejectJoin = async (id: number) => {
    setActionLoading(id);
    try { await client.put(`/admin/users/${id}/reject`); await load(); }
    catch { setError('거절 실패'); }
    finally { setActionLoading(null); }
  };

  const handleTransfer = async (id: number, approve: boolean) => {
    setActionLoading(id);
    try {
      await client.patch(`/approval-requests/${id}/transfer?approve=${approve}`);
      await load();
      setSelected(null);
    } catch { setError('처리 실패'); }
    finally { setActionLoading(null); }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'join', label: '가입 신청' },
    { key: 'teacher_transfer', label: '전근 신청' },
    { key: 'student_transfer', label: '전학 신청' },
  ];

  const tabLabel = tabs.find(t => t.key === tab)?.label ?? '';

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>APPROVAL</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>승인 대기</h1>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
              background: tab === t.key ? '#1e5a99' : '#f1f5f9',
              color: tab === t.key ? '#fff' : '#64748b',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p style={{ color: '#c62828', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a2332' }}>{tabLabel}</span>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>총 {items.length}건</span>
        </div>

        {loading ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
        ) : items.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>대기 중인 신청이 없습니다.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {tab === 'join'
                  ? ['이름', '이메일', '신청일', ''].map(h => <th key={h} style={thStyle}>{h}</th>)
                  : ['신청자', '현재 학교', '이동 학교', '내 학교 승인', '상태', ''].map(h => <th key={h} style={thStyle}>{h}</th>)
                }
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  {tab === 'join' ? (
                    <>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{item.requesterName}</td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{item.requesterEmail}</td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{item.createdAt?.slice(0, 10) ?? '—'}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => { setSelected(item); }}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '12px', color: '#475569', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                            상세
                          </button>
                          <button onClick={() => handleApproveJoin(item.id)} disabled={actionLoading === item.id}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#1e5a99', cursor: 'pointer', fontSize: '12px', color: '#fff', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                            승인
                          </button>
                          <button onClick={() => handleRejectJoin(item.id)} disabled={actionLoading === item.id}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#fdecea', cursor: 'pointer', fontSize: '12px', color: '#c62828', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                            거절
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{item.requesterName}</td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{item.fromSchoolName ?? '—'}</td>
                      <td style={{ ...tdStyle, color: '#1e5a99', fontWeight: 600 }}>{item.toSchoolName ?? '—'}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: 700,
                          ...(STATUS_STYLE[item.fromSchoolStatus ?? 'PENDING']),
                        }}>
                          {STATUS_MAP[item.fromSchoolStatus ?? 'PENDING']}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: 700,
                          ...(STATUS_STYLE[item.status]),
                        }}>
                          {STATUS_MAP[item.status]}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {item.fromSchoolStatus !== 'APPROVED' && item.fromSchoolStatus !== 'REJECTED' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleTransfer(item.id, true)} disabled={actionLoading === item.id}
                              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#1e5a99', cursor: 'pointer', fontSize: '12px', color: '#fff', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                              승인
                            </button>
                            <button onClick={() => handleTransfer(item.id, false)} disabled={actionLoading === item.id}
                              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#fdecea', cursor: 'pointer', fontSize: '12px', color: '#c62828', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                              거절
                            </button>
                          </div>
                        )}
                        {(item.fromSchoolStatus === 'APPROVED' || item.fromSchoolStatus === 'REJECTED') && (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>처리 완료</span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={!!selected} title="가입 신청 상세" onClose={() => setSelected(null)}>
        {selected && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              ['이름', selected.requesterName],
              ['이메일', selected.requesterEmail],
              ['신청일', selected.createdAt?.slice(0, 10) ?? '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>{k}</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>{v}</p>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button onClick={() => { handleApproveJoin(selected.id); setSelected(null); }}>승인</Button>
              <Button variant="danger" onClick={() => { handleRejectJoin(selected.id); setSelected(null); }}>거절</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
