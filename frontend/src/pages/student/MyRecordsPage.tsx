import { Card } from '../../components/common/Card';

const records = [
  {
    academicYear: 2026, semester: 1,
    specialNote: '수학 경시대회 교내 2위. 과학 동아리 회장으로서 실험 계획 및 발표를 주도함.',
    extracurricular: '수학 경시대회 참가, 과학 탐구 동아리 활동, 학급 부반장',
  },
  {
    academicYear: 2025, semester: 2,
    specialNote: '학기 내내 성실한 태도로 수업에 참여함. 영어 독서 기록장 꾸준히 작성.',
    extracurricular: '영어 독서 토론반, 봉사 활동 32시간',
  },
];

export function MyRecordsPage() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>MY RECORDS</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>학생부 조회</h1>
      </div>

      {records.map((r) => (
        <Card key={`${r.academicYear}-${r.semester}`} title={`${r.academicYear}학년도 ${r.semester}학기`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.04em' }}>특기사항</p>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.8', padding: '14px 16px', background: '#f8fafc', borderRadius: '6px' }}>{r.specialNote}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.04em' }}>비교과 활동</p>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.8', padding: '14px 16px', background: '#f8fafc', borderRadius: '6px' }}>{r.extracurricular}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
