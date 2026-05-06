import { useState } from 'react';
import { Button } from '../components/common/Button';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'SICK';
const STATUS_LABELS: Record<AttendanceStatus, string> = { PRESENT: '출석', ABSENT: '결석', LATE: '지각', EARLY_LEAVE: '조퇴', SICK: '병결' };
const statusStyle: Record<AttendanceStatus, { bg: string; color: string }> = {
  PRESENT: { bg: '#e8f5e9', color: '#2e7d32' },
  ABSENT: { bg: '#fdecea', color: '#c62828' },
  LATE: { bg: '#fff3e0', color: '#e65100' },
  EARLY_LEAVE: { bg: '#f3e5f5', color: '#6a1b9a' },
  SICK: { bg: '#ebf4ff', color: '#1e5a99' },
};

const STUDENTS = [
  { id: 1, name: '김철수', number: 1 },
  { id: 2, name: '이영희', number: 2 },
  { id: 3, name: '박민수', number: 3 },
  { id: 4, name: '최지은', number: 4 },
  { id: 5, name: '정승호', number: 5 },
];

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '12px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>(
    Object.fromEntries(STUDENTS.map(s => [s.id, 'PRESENT' as AttendanceStatus]))
  );
  const [msg, setMsg] = useState('');

  const summary = Object.values(attendance).reduce((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1;
    return acc;
  }, {} as Record<AttendanceStatus, number>);

  const handleSave = () => {
    setMsg('출결이 저장되었습니다.');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>ATTENDANCE</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>출결 관리</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {(Object.entries(STATUS_LABELS) as [AttendanceStatus, string][]).map(([status, label]) => (
          <div key={status} style={{ background: '#fff', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${statusStyle[status].color}` }}>
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
          <Button size="sm" onClick={handleSave}>저장</Button>
        </div>

        {msg && <div style={{ padding: '10px 24px', background: '#e8f5e9', color: '#2e7d32', fontSize: '13px', borderBottom: '1px solid #c8e6c9' }}>{msg}</div>}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['번호','이름','출결 상태','비고'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {STUDENTS.map(s => (
              <tr key={s.id}>
                <td style={{ ...tdStyle, color: '#94a3b8' }}>{String(s.number).padStart(2, '0')}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(Object.entries(STATUS_LABELS) as [AttendanceStatus, string][]).map(([status, label]) => (
                      <button key={status} onClick={() => setAttendance(prev => ({ ...prev, [s.id]: status }))}
                        style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          border: attendance[s.id] === status ? `2px solid ${statusStyle[status].color}` : '2px solid #e2e8f0',
                          background: attendance[s.id] === status ? statusStyle[status].bg : '#fff',
                          color: attendance[s.id] === status ? statusStyle[status].color : '#94a3b8',
                          cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                        }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </td>
                <td style={tdStyle}>
                  <input type="text" placeholder="사유 입력 (선택)"
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', outline: 'none', width: '180px' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
