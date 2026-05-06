import { useState } from 'react';
import { Card } from '../../components/common/Card';

const MONTHLY_SUMMARY = [
  { month: '3월', present: 21, late: 1, absent: 0, sick: 0 },
  { month: '4월', present: 18, late: 0, absent: 1, sick: 1 },
  { month: '5월', present: 20, late: 0, absent: 0, sick: 0 },
];

const DETAILS: Record<string, { date: string; status: string; reason: string }[]> = {
  '3월': [
    { date: '2026-03-28', status: '지각', reason: '교통 사정' },
    { date: '2026-03-10', status: '출석', reason: '' },
    { date: '2026-03-05', status: '출석', reason: '' },
  ],
  '4월': [
    { date: '2026-04-20', status: '출석', reason: '' },
    { date: '2026-04-15', status: '결석', reason: '개인 사유' },
    { date: '2026-04-08', status: '병결', reason: '독감' },
    { date: '2026-04-02', status: '출석', reason: '' },
  ],
  '5월': [
    { date: '2026-05-10', status: '출석', reason: '' },
    { date: '2026-05-03', status: '출석', reason: '' },
  ],
};

const statusStyle: Record<string, React.CSSProperties> = {
  출석: { background: '#f1f5f9', color: '#475569' },
  결석: { background: '#fef2f2', color: '#991b1b' },
  지각: { background: '#fff7ed', color: '#9a3412' },
  조퇴: { background: '#f5f3ff', color: '#5b21b6' },
  병결: { background: '#eff6ff', color: '#1d4ed8' },
};

const months = ['3월', '4월', '5월'];

export function MyAttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState('4월');

  const details = DETAILS[selectedMonth] ?? [];
  const totalPresent = MONTHLY_SUMMARY.reduce((s, m) => s + m.present, 0);
  const totalLate = MONTHLY_SUMMARY.reduce((s, m) => s + m.late, 0);
  const totalAbsent = MONTHLY_SUMMARY.reduce((s, m) => s + m.absent, 0);
  const totalSick = MONTHLY_SUMMARY.reduce((s, m) => s + m.sick, 0);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>MY ATTENDANCE</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>출결 내역</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: '출석', value: `${totalPresent}일` },
          { label: '지각', value: `${totalLate}회` },
          { label: '결석', value: `${totalAbsent}회` },
          { label: '병결', value: `${totalSick}회` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#fff', borderRadius: '10px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: '3px solid #1e5a99' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>{label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#1a2332' }}>{value}</p>
          </div>
        ))}
      </div>

      <Card title="월별 출결 요약">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['월', '출석', '지각', '결석', '병결'].map(h => (
                <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTHLY_SUMMARY.map(m => (
              <tr key={m.month} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '12px 20px', fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>{m.month}</td>
                <td style={{ padding: '12px 20px', color: '#374151', fontWeight: 600, fontSize: '13px' }}>{m.present}일</td>
                <td style={{ padding: '12px 20px', color: m.late > 0 ? '#374151' : '#94a3b8', fontSize: '13px' }}>{m.late}회</td>
                <td style={{ padding: '12px 20px', color: m.absent > 0 ? '#374151' : '#94a3b8', fontSize: '13px' }}>{m.absent}회</td>
                <td style={{ padding: '12px 20px', color: m.sick > 0 ? '#374151' : '#94a3b8', fontSize: '13px' }}>{m.sick}회</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* 월별 상세 */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginRight: '8px' }}>월별 상세 내역</h2>
            <div style={{ display: 'flex', gap: '4px' }}>
              {months.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  style={{
                    padding: '5px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    border: '1px solid #d1d5db', fontFamily: "'Noto Sans KR', sans-serif",
                    background: selectedMonth === m ? '#1e5a99' : '#fff',
                    color: selectedMonth === m ? '#fff' : '#64748b',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '8px 0' }}>
            {details.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                해당 월의 상세 내역이 없습니다.
              </div>
            ) : (
              details.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 24px', borderBottom: i < details.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>{d.date}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {d.reason && <span style={{ fontSize: '12px', color: '#94a3b8' }}>{d.reason}</span>}
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '4px',
                      fontSize: '11px', fontWeight: 600,
                      ...(statusStyle[d.status] ?? { background: '#f1f5f9', color: '#475569' }),
                    }}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
