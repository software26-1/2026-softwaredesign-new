import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'SICK';
const STATUS_LABELS: Record<AttendanceStatus, string> = { PRESENT: '출석', ABSENT: '결석', LATE: '지각', EARLY_LEAVE: '조퇴', SICK: '병결' };
const statusStyle: Record<AttendanceStatus, { bg: string; color: string }> = {
  PRESENT:     { bg: '#e8f5e9', color: '#2e7d32' },
  ABSENT:      { bg: '#fdecea', color: '#c62828' },
  LATE:        { bg: '#fff3e0', color: '#e65100' },
  EARLY_LEAVE: { bg: '#f3e5f5', color: '#6a1b9a' },
  SICK:        { bg: '#ebf4ff', color: '#1e5a99' },
};

interface Student { id: number; name: string; studentNumber: number; }
interface AttendanceRecord { id?: number; studentId: number; status: AttendanceStatus; reason?: string; }

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '12px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

type PageTab = 'input' | 'history';

export function AttendancePage() {
  const [searchParams] = useSearchParams();
  const [pageTab, setPageTab] = useState<PageTab>((searchParams.get('tab') as PageTab) ?? 'input');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [classGroupId, setClassGroupId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, AttendanceRecord>>({});
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [historyFrom, setHistoryFrom] = useState(`${new Date().getFullYear()}-03-01`);
  const [historyTo, setHistoryTo] = useState(new Date().toISOString().slice(0, 10));
  const [historySummary, setHistorySummary] = useState<Record<number, Record<string, number>>>({});
  const [historyReasons, setHistoryReasons] = useState<Record<number, string[]>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    client.get<any>('/users/me').then(r => {
      const profile = r.data?.data ?? r.data;
      const cg = profile?.classGroupId;
      if (cg) setClassGroupId(cg);
    });
  }, []);

  useEffect(() => {
    if (!classGroupId) return;
    client.get(`/students?class_group_id=${classGroupId}`)
      .then((r: any) => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setStudents(list.sort((a: any, b: any) => (a.studentNumber ?? 0) - (b.studentNumber ?? 0)));
        const initial: Record<number, AttendanceRecord> = {};
        list.forEach((s: any) => { initial[s.id] = { studentId: s.id, status: 'PRESENT' }; });
        setAttendance(initial);
      });
  }, [classGroupId]);

  useEffect(() => {
    if (!classGroupId || !date || students.length === 0) return;
    // 날짜 변경 시 항상 PRESENT로 리셋 후 해당 날짜 데이터 로드
    const initial: Record<number, AttendanceRecord> = {};
    students.forEach(s => { initial[s.id] = { studentId: s.id, status: 'PRESENT' }; });
    setAttendance(initial);
    client.get(`/attendances?class_group_id=${classGroupId}&date=${date}`)
      .then((r: any) => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        if (list.length > 0) {
          const loaded: Record<number, AttendanceRecord> = {};
          list.forEach((a: any) => {
            loaded[a.studentId] = { id: a.id, studentId: a.studentId, status: a.status, reason: a.reason };
          });
          setAttendance(prev => ({ ...prev, ...loaded }));
        }
      });
  }, [classGroupId, date, students]);

  const summary = Object.values(attendance).reduce((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {} as Record<AttendanceStatus, number>);

  const loadHistory = async () => {
    if (!classGroupId) return;
    const r = await client.get<any[]>(`/attendances?class_group_id=${classGroupId}&from=${historyFrom}&to=${historyTo}`).catch(() => ({ data: [] }));
    const list: any[] = Array.isArray(r.data) ? r.data : [];
    const summary: Record<number, Record<string, number>> = {};
    const reasons: Record<number, string[]> = {};
    list.forEach((a: any) => {
      if (!summary[a.studentId]) summary[a.studentId] = {};
      summary[a.studentId][a.status] = (summary[a.studentId][a.status] ?? 0) + 1;
      if (a.reason && a.status !== 'PRESENT') {
        if (!reasons[a.studentId]) reasons[a.studentId] = [];
        reasons[a.studentId].push(`${a.date?.slice(5)} ${a.reason}`);
      }
    });
    setHistorySummary(summary);
    setHistoryReasons(reasons);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const record of Object.values(attendance)) {
        if (record.id) {
          await client.patch(`/attendances/${record.id}`, { status: record.status, reason: record.reason });
        } else {
          await client.post('/attendances', { studentId: record.studentId, classGroupId, date, status: record.status, reason: record.reason });
        }
      }
      setMsg('출결이 저장되었습니다.');
      setTimeout(() => setMsg(''), 3000);
      // reload to get IDs
      const r = await client.get<any[]>(`/attendances?class_group_id=${classGroupId}&date=${date}`);
      const list = Array.isArray(r.data) ? r.data : [];
      if (list.length > 0) {
        const loaded: Record<number, AttendanceRecord> = {};
        list.forEach((a: any) => { loaded[a.studentId] = { id: a.id, studentId: a.studentId, status: a.status, reason: a.reason }; });
        setAttendance(prev => ({ ...prev, ...loaded }));
      }
    } catch {
      setMsg('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!classGroupId) return (
    <div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332', marginBottom: '20px' }}>출결 관리</h1>
      <p style={{ color: '#94a3b8', fontSize: '14px' }}>담당 학급이 지정된 담임 교사만 출결을 관리할 수 있습니다.</p>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>출결 관리</h1>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '24px' }}>
        {([['input', '출결 입력'], ['history', '출결 현황']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => { setPageTab(tab); if (tab === 'history') loadHistory(); }}
            style={{ padding: '10px 24px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: pageTab === tab ? 700 : 400, color: pageTab === tab ? '#1e5a99' : '#94a3b8', borderBottom: pageTab === tab ? '2px solid #1e5a99' : '2px solid transparent', marginBottom: '-2px', fontFamily: "'Noto Sans KR', sans-serif" }}>
            {label}
          </button>
        ))}
      </div>

      {pageTab === 'history' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px', background: '#fff', padding: '16px 20px', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '5px' }}>시작일</label>
              <input type="date" value={historyFrom} onChange={e => setHistoryFrom(e.target.value)} style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '5px' }}>종료일</label>
              <input type="date" value={historyTo} onChange={e => setHistoryTo(e.target.value)} style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
            </div>
            <button onClick={loadHistory} style={{ padding: '8px 16px', background: '#1e5a99', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>조회</button>
          </div>
          <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['번호', '이름', '출석', '결석', '지각', '조퇴', '병결', '특이사항'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {students.map(s => {
                  const sm = historySummary[s.id] ?? {};
                  const reasons = (historyReasons[s.id] ?? []).filter(Boolean);
                  const open = expandedId === s.id;
                  return [
                    <tr key={`m${s.id}`} style={{ cursor: reasons.length ? 'pointer' : 'default' }}
                      onClick={() => reasons.length && setExpandedId(open ? null : s.id)}>
                      <td style={{ ...tdStyle, color: '#94a3b8' }}>{String(s.studentNumber).padStart(2, '0')}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                      <td style={{ ...tdStyle, color: '#2e7d32', fontWeight: 600 }}>{sm.PRESENT ?? 0}일</td>
                      <td style={{ ...tdStyle, color: sm.ABSENT ? '#c62828' : '#94a3b8', fontWeight: sm.ABSENT ? 700 : 400 }}>{sm.ABSENT ?? 0}회</td>
                      <td style={{ ...tdStyle, color: sm.LATE ? '#e65100' : '#94a3b8' }}>{sm.LATE ?? 0}회</td>
                      <td style={{ ...tdStyle, color: sm.EARLY_LEAVE ? '#6a1b9a' : '#94a3b8' }}>{sm.EARLY_LEAVE ?? 0}회</td>
                      <td style={{ ...tdStyle, color: sm.SICK ? '#1e5a99' : '#94a3b8' }}>{sm.SICK ?? 0}회</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: reasons.length ? '#1e5a99' : '#94a3b8', fontWeight: reasons.length ? 600 : 400 }}>
                        {reasons.length ? `${reasons.length}건 ${open ? '▲' : '▼'}` : '—'}
                      </td>
                    </tr>,
                    open && (
                      <tr key={`d${s.id}`}>
                        <td colSpan={8} style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {reasons.map((r, i) => (
                              <div key={i} style={{ fontSize: '12px', color: '#475569' }}>· {r}</div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pageTab === 'input' && <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {(Object.entries(STATUS_LABELS) as [AttendanceStatus, string][]).map(([status, label]) => (
          <div key={status} style={{ background: '#fff', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',  }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>{label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: statusStyle[status].color }}>{summary[status] ?? 0}명</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>출결 입력</h2>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: saving ? '#94a3b8' : '#1e5a99', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
            {saving ? '저장 중...' : '전체 저장'}
          </button>
        </div>

        {msg && <div style={{ padding: '10px 24px', background: msg.includes('실패') ? '#fdecea' : '#e8f5e9', color: msg.includes('실패') ? '#c62828' : '#2e7d32', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }}>{msg}</div>}

        {students.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>학생이 없습니다.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['번호', '이름', '출결 상태', '사유'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {students.map(s => {
                const rec = attendance[s.id] ?? { studentId: s.id, status: 'PRESENT' as AttendanceStatus };
                return (
                  <tr key={s.id}>
                    <td style={{ ...tdStyle, color: '#94a3b8' }}>{String(s.studentNumber).padStart(2, '0')}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(Object.entries(STATUS_LABELS) as [AttendanceStatus, string][]).map(([status, label]) => (
                          <button key={status}
                            onClick={() => setAttendance(prev => ({ ...prev, [s.id]: { ...rec, status } }))}
                            style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: rec.status === status ? `2px solid ${statusStyle[status].color}` : '2px solid #e2e8f0', background: rec.status === status ? statusStyle[status].bg : '#fff', color: rec.status === status ? statusStyle[status].color : '#94a3b8', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <input type="text" placeholder={rec.status === 'PRESENT' ? '출석은 사유 불필요' : '사유 입력 (선택)'}
                        disabled={rec.status === 'PRESENT'}
                        value={rec.status === 'PRESENT' ? '' : (rec.reason ?? '')}
                        onChange={e => setAttendance(prev => ({ ...prev, [s.id]: { ...rec, reason: e.target.value } }))}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', outline: 'none', width: '180px', background: rec.status === 'PRESENT' ? '#f8fafc' : '#fff', color: rec.status === 'PRESENT' ? '#cbd5e1' : '#1e293b' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      </>}
    </div>
  );
}
