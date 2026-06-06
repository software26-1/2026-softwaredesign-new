// 학년/학기 ↔ 학년도(연도)/날짜범위 변환 유틸.
// 학생의 현재 학년 = 올해(재학 학년도) 기준으로 과거 학년을 역산한다.
// 예) 현재 3학년·2026년이면 1학년=2024, 2학년=2025, 3학년=2026.

const CUR_YEAR = new Date().getFullYear();

/** 선택 학년 → 실제 학년도(연도) */
export function gradeToYear(curGrade: number, selGrade: number, curYear: number = CUR_YEAR): number {
  return curYear - (curGrade - selGrade);
}

/** 학기 시작/종료 날짜 (1학기 3/1~9/1, 2학기 9/1~익년 3/1) */
export function termDateRange(year: number, semester: 1 | 2): [string, string] {
  return semester === 1
    ? [`${year}-03-01`, `${year}-09-01`]
    : [`${year}-09-01`, `${year + 1}-03-01`];
}

/** dateStr(YYYY-MM-DD...)이 해당 학년도·학기 범위에 속하는지 */
export function inTerm(dateStr: string | undefined, year: number, semester: 1 | 2): boolean {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  const [start, end] = termDateRange(year, semester);
  return d >= start && d < end;
}
