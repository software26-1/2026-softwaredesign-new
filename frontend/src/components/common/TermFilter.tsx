interface Props {
  curGrade: number;            // 학생의 현재 학년 (선택 가능한 최대 학년)
  selGrade: number;
  semester: 1 | 2;
  onGrade: (g: number) => void;
  onSemester: (s: 1 | 2) => void;
}

const btn = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  border: active ? '1px solid #1e5a99' : '1px solid #d1d5db', fontFamily: "'Noto Sans KR', sans-serif",
  background: active ? '#1e5a99' : '#fff', color: active ? '#fff' : '#64748b',
});

/** 학년(1..현재학년) + 학기 선택 필터. 학생/학부모 조회 화면 공용. */
export function TermFilter({ curGrade, selGrade, semester, onGrade, onSemester }: Props) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {Array.from({ length: Math.max(curGrade, 1) }, (_, i) => i + 1).map(g => (
        <button key={g} onClick={() => onGrade(g)} style={btn(selGrade === g)}>{g}학년</button>
      ))}
      <span style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 4px' }} />
      {([1, 2] as const).map(s => (
        <button key={s} onClick={() => onSemester(s)} style={btn(semester === s)}>{s}학기</button>
      ))}
    </div>
  );
}
