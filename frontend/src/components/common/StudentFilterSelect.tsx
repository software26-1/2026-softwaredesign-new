import { useMemo } from 'react';
import type { Student } from '../../types/student';

const selectStyle: React.CSSProperties = {
  padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px',
  fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%',
};
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' };

interface FilterState {
  grade: string;
  classNumber: string;
  studentId: string;
}

interface Props {
  students: Student[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  /** 학생 단일 선택까지 노출할지 (false면 학년/반 필터만) */
  showStudent?: boolean;
}

/**
 * 학년 → 반 → 학생 캐스케이딩 필터. 상담내역·학생부·피드백 등에서 공통 사용.
 * 학년 변경 시 반/학생 초기화, 반 변경 시 학생 초기화.
 */
export function StudentFilterSelect({ students, value, onChange, showStudent = true }: Props) {
  // 학생이 없는 학년도 선택 가능해야 하므로 학년은 고정(1~3)
  const grades = [1, 2, 3];

  const classNumbers = useMemo(() => {
    if (!value.grade) return [];
    return [...new Set(students.filter(s => s.grade === Number(value.grade)).map(s => s.classNumber))]
      .filter(Boolean)
      .sort((a, b) => a - b);
  }, [students, value.grade]);

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => !value.grade || s.grade === Number(value.grade))
      .filter(s => !value.classNumber || s.classNumber === Number(value.classNumber))
      .sort((a, b) => (a.studentNumber ?? 0) - (b.studentNumber ?? 0));
  }, [students, value.grade, value.classNumber]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showStudent ? '1fr 1fr 1.4fr' : '1fr 1fr', gap: '16px' }}>
      <div>
        <label style={labelStyle}>학년</label>
        <select style={selectStyle} value={value.grade}
          onChange={e => onChange({ grade: e.target.value, classNumber: '', studentId: '' })}>
          <option value="">전체</option>
          {grades.map(g => <option key={g} value={g}>{g}학년</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>반</label>
        <select style={selectStyle} value={value.classNumber} disabled={!value.grade}
          onChange={e => onChange({ ...value, classNumber: e.target.value, studentId: '' })}>
          <option value="">전체</option>
          {classNumbers.map(c => <option key={c} value={c}>{c}반</option>)}
        </select>
      </div>
      {showStudent && (
        <div>
          <label style={labelStyle}>학생</label>
          <select style={selectStyle} value={value.studentId}
            onChange={e => onChange({ ...value, studentId: e.target.value })}>
            <option value="">선택</option>
            {filteredStudents.map(s => (
              <option key={s.id} value={s.id}>{String(s.studentNumber).padStart(2, '0')} {s.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
