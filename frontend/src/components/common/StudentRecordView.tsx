import { useState } from 'react';
import { TermFilter } from './TermFilter';
import { gradeToYear } from '../../utils/term';

const MAX_LEN = 80;

export interface StudentRecordData {
  id: number;
  academicYear?: number;
  semester?: number;
  achievements?: string;
  extracurricular?: string;
  volunteerHours?: number;
  careerAspirations?: string;
  updatedAt?: string;
}

interface Props {
  record: StudentRecordData | null;
  curGrade: number;
  loading: boolean;
}

/** 학생부 조회 뷰 (학생/학부모 공용). 학년/학기 필터 포함. */
export function StudentRecordView({ record, curGrade, loading }: Props) {
  const [selGrade, setSelGrade] = useState(curGrade);
  const [semester, setSemester] = useState<1 | 2>((record?.semester as 1 | 2) ?? 1);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const year = gradeToYear(curGrade, selGrade);
  const match = record && record.academicYear === year && record.semester === semester ? record : null;

  const fields = [
    { label: '특기사항 / 수상', value: match?.achievements },
    { label: '비교과 활동', value: match?.extracurricular },
    { label: '봉사 시간', value: match?.volunteerHours != null ? `${match.volunteerHours}시간` : null },
    { label: '진로 희망', value: match?.careerAspirations },
  ];

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <TermFilter curGrade={curGrade} selGrade={selGrade} semester={semester} onGrade={setSelGrade} onSemester={setSemester} />
      </div>
      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
      ) : !match ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>{selGrade}학년 {semester}학기 학생부 기록이 없습니다.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '24px' }}>
          <style>{`.srv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; } @media (max-width: 768px) { .srv-grid { grid-template-columns: 1fr; } }`}</style>
          <div className="srv-grid">
            {fields.map(f => {
              const val = f.value ?? '';
              const isLong = val.length > MAX_LEN;
              const isExp = expandedField === f.label;
              return (
                <div key={f.label} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>{f.label}</p>
                  <p style={{ fontSize: '13px', color: '#1a2332', lineHeight: '1.6' }}>
                    {val ? (isLong ? (isExp ? val : val.slice(0, MAX_LEN) + '...') : val) : '—'}
                    {isLong && (
                      <button onClick={() => setExpandedField(isExp ? null : f.label)}
                        style={{ marginLeft: '6px', fontSize: '11px', color: '#1e5a99', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>
                        {isExp ? '접기' : '더보기'}
                      </button>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
          {match.updatedAt && (
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px', textAlign: 'right' }}>
              최종 수정: {match.updatedAt.slice(0, 10)}
            </p>
          )}
        </div>
      )}
    </>
  );
}
