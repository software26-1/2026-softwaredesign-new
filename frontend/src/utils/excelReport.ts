import ExcelJS from 'exceljs';
import type { Student } from '../types/student';
import type { StudentCourseTerm, LearningSummary } from '../types/analytics';
import type { Counseling } from '../types/counseling';
import type { Feedback } from '../types/feedback';
import { FeedbackCategoryLabel } from '../types/feedback';

const n1 = (v: any) => (v != null && !isNaN(Number(v))) ? Math.round(Number(v) * 10) / 10 : '-';
const fmt = (d?: string) => d ? d.slice(0, 10) : '-';

function computeRawAvg(courses: StudentCourseTerm[]): string | number {
  const el = courses.filter(c => c.avgScore != null && (c.gradeLevel == null || /^\d/.test(String(c.gradeLevel))));
  if (!el.length) return '-';
  return Math.round(el.reduce((s, c) => s + Number(c.avgScore!), 0) / el.length * 10) / 10;
}

function computeGradeAvg(courses: StudentCourseTerm[]): string | number {
  const el = courses.filter(c => c.gradeLevel != null && /^\d+$/.test(String(c.gradeLevel)));
  if (!el.length) return '-';
  return Math.round(el.reduce((s, c) => s + Number(c.gradeLevel!), 0) / el.length * 10) / 10;
}

const FONT = 'Malgun Gothic';
const thin = { style: 'thin' as const };
const medium = { style: 'medium' as const };
const allThin: Partial<ExcelJS.Borders> = { top: thin, left: thin, bottom: thin, right: thin };

type Align = ExcelJS.Alignment['horizontal'];

function cell(ws: ExcelJS.Worksheet, row: number, col: number, value: any, opts: {
  bold?: boolean; size?: number; align?: Align; wrap?: boolean;
  bg?: string; color?: string; border?: boolean; thickTop?: boolean;
} = {}) {
  const c = ws.getCell(row, col);
  c.value = value ?? '';
  c.font = { name: FONT, size: opts.size ?? 10, bold: opts.bold ?? false, color: opts.color ? { argb: opts.color } : undefined };
  c.alignment = { horizontal: opts.align ?? 'center', vertical: 'middle', wrapText: opts.wrap ?? false };
  if (opts.border !== false) {
    c.border = opts.thickTop ? { top: medium, left: thin, bottom: thin, right: thin } : allThin;
  }
  if (opts.bg) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.bg } };
}

function m(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  ws.mergeCells(r1, c1, r2, c2);
}

function downloadBuffer(buf: ArrayBuffer | Buffer, filename: string) {
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// 제목 + 도장표 그리기. 반환값: 다음 시작 행
function drawHeader(ws: ExcelJS.Worksheet, r: number, title: string, school: string, stamps: string[], totalCols: number): number {
  const stampStart = totalCols - stamps.length + 1;
  const titleEnd = stampStart - 1;

  // 제목 (2행)
  m(ws, r, 1, r + 1, titleEnd);
  const tc = ws.getCell(r, 1);
  tc.value = title;
  tc.font = { name: FONT, size: 16, bold: true };
  tc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  ws.getRow(r).height = 28;
  ws.getRow(r + 1).height = 24;

  // 학교명 (3번째 행)
  m(ws, r + 2, 1, r + 2, titleEnd);
  const sc2 = ws.getCell(r + 2, 1);
  sc2.value = school;
  sc2.font = { name: FONT, size: 10, color: { argb: 'FF555555' } };
  sc2.alignment = { horizontal: 'left', vertical: 'middle' };
  ws.getRow(r + 2).height = 18;

  // 도장 라벨 (1행)
  stamps.forEach((label, i) => {
    cell(ws, r, stampStart + i, label, { bold: true, size: 9, border: true });
  });
  // 도장 박스 (2~3행 병합)
  stamps.forEach((_, i) => {
    m(ws, r + 1, stampStart + i, r + 2, stampStart + i);
    cell(ws, r + 1, stampStart + i, '', { border: true });
    ws.getColumn(stampStart + i).width = 9;
  });

  return r + 3;
}

// 학생 기본 정보 행
function drawStudentInfo(ws: ExcelJS.Worksheet, r: number, student: Student, totalCols: number): number {
  const half = Math.floor(totalCols / 2);
  m(ws, r, 1, r, 2);
  cell(ws, r, 1, '성  명', { bold: true, size: 10 });
  m(ws, r, 3, r, half);
  cell(ws, r, 3, student.name, { size: 10, align: 'left' });
  m(ws, r, half + 1, r, half + 2);
  cell(ws, r, half + 1, '학년/반/번호', { bold: true, size: 10 });
  m(ws, r, half + 3, r, totalCols);
  cell(ws, r, half + 3, `${student.grade}학년 ${student.classNumber}반 ${String(student.studentNumber ?? '').padStart(2, '0')}번`, { size: 10, align: 'left' });
  ws.getRow(r).height = 22;
  return r + 1;
}

// 섹션 헤더 (배경색 있는 전체 너비 병합)
function drawSection(ws: ExcelJS.Worksheet, r: number, label: string, totalCols: number): number {
  m(ws, r, 1, r, totalCols);
  const c = ws.getCell(r, 1);
  c.value = label;
  c.font = { name: FONT, size: 11, bold: true };
  c.alignment = { horizontal: 'left', vertical: 'middle' };
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECF2F9' } };
  ws.getRow(r).height = 20;
  return r + 1;
}

// 성적 테이블
function drawGradeTable(ws: ExcelJS.Worksheet, r: number, courses: StudentCourseTerm[], summary: any, isMiddle: boolean): number {
  const cols = isMiddle ? 7 : 8;
  const headers = ['과목', '중간', '기말', '수행', '원점수평균', '반평균', '등급', ...(isMiddle ? [] : ['석차'])];
  headers.forEach((h, i) => cell(ws, r, i + 1, h, { bold: true, size: 10, bg: 'FFF5F7FA' }));
  ws.getRow(r).height = 18;
  r++;

  if (courses.length === 0) {
    m(ws, r, 1, r, cols);
    cell(ws, r, 1, '성적 데이터 없음', { size: 10, color: 'FF888888' });
    return r + 1;
  }

  const isAbs = (c: StudentCourseTerm) => c.gradeLevel != null && /^[A-Za-z]/.test(String(c.gradeLevel));
  const relative = courses.filter(c => !isAbs(c));
  const absolute = courses.filter(c => isAbs(c));

  const writeRow = (c: StudentCourseTerm) => {
    cell(ws, r, 1, c.courseName ?? `과목${c.courseKey}`, { size: 10, align: 'left' });
    cell(ws, r, 2, c.midtermScore != null ? n1(c.midtermScore) : '-', { size: 10 });
    cell(ws, r, 3, c.finalScore != null ? n1(c.finalScore) : '-', { size: 10 });
    cell(ws, r, 4, c.taskScore != null ? n1(c.taskScore) : '-', { size: 10 });
    cell(ws, r, 5, c.avgScore != null ? n1(c.avgScore) : '-', { size: 10 });
    cell(ws, r, 6, c.classAvgScore != null ? n1(c.classAvgScore) : '-', { size: 10 });
    cell(ws, r, 7, c.gradeLevel ?? '-', { size: 10 });
    if (!isMiddle) cell(ws, r, 8, c.classRank ?? '-', { size: 10 });
    ws.getRow(r).height = 17;
    r++;
  };

  relative.forEach(writeRow);

  if (absolute.length > 0 && relative.length > 0) {
    m(ws, r, 1, r, cols);
    cell(ws, r, 1, '절대평가 과목', { size: 9, color: 'FF777777', align: 'left', bg: 'FFF5F5F5' });
    ws.getRow(r).height = 15;
    r++;
  }
  absolute.forEach(writeRow);

  // 평균 행 (상단 두꺼운 선)
  cell(ws, r, 1, '평균', { bold: true, align: 'left', size: 10, thickTop: true });
  [2, 3, 4].forEach(i => cell(ws, r, i, '-', { bold: true, size: 10 }));
  cell(ws, r, 5, computeRawAvg(courses), { bold: true, size: 10 });
  cell(ws, r, 6, '-', { bold: true, size: 10 });
  cell(ws, r, 7, computeGradeAvg(courses), { bold: true, size: 10 });
  if (!isMiddle) cell(ws, r, 8, summary?.overallClassRank ?? '-', { bold: true, size: 10 });
  ws.getRow(r).height = 18;
  r++;

  return r;
}

// 서명란
function drawFooter(ws: ExcelJS.Worksheet, r: number, totalCols: number): number {
  const yr = new Date().getFullYear();
  m(ws, r, 1, r + 4, totalCols);
  const c = ws.getCell(r, 1);
  c.value = `위와 같이 보고서를 제출합니다.\n\n${yr}년          월          일\n\n담임교사 :                    (인)`;
  c.font = { name: FONT, size: 11 };
  c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  [r, r + 1, r + 2, r + 3, r + 4].forEach(rr => { ws.getRow(rr).height = 22; });
  return r + 5;
}

// ─── 성적 분석 보고서 ───
export async function exportGradeAnalysisExcel(
  student: Student, year: number,
  courses1: StudentCourseTerm[], courses2: StudentCourseTerm[],
  summary1: LearningSummary | null, summary2: LearningSummary | null,
  isMiddle: boolean
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('성적 분석');
  const stampCount = 3;
  const dataCols = isMiddle ? 7 : 8;
  const totalCols = dataCols + stampCount;

  ws.getColumn(1).width = 14;
  [2, 3, 4].forEach(i => { ws.getColumn(i).width = 7; });
  ws.getColumn(5).width = 11;
  ws.getColumn(6).width = 9;
  ws.getColumn(7).width = 7;
  if (!isMiddle) ws.getColumn(8).width = 7;

  let r = 1;
  r = drawHeader(ws, r, `${year}학년도\n성적 분석 보고서`, student.schoolName ?? '', ['담  임', '교  감', '교  장'], totalCols);
  r = drawStudentInfo(ws, r, student, totalCols);
  r++;

  r = drawSection(ws, r, '▶ 1학기 교과 성적', totalCols);
  r = drawGradeTable(ws, r, courses1, summary1, isMiddle);
  r++;

  r = drawSection(ws, r, '▶ 2학기 교과 성적', totalCols);
  r = drawGradeTable(ws, r, courses2, summary2, isMiddle);
  r++;

  // 학기별 종합
  r = drawSection(ws, r, '▶ 학기별 종합', totalCols);
  const smH = ['학기', '등급 평균', ...(isMiddle ? [] : ['반 석차']), '출석률', '결석', '지각'];
  smH.forEach((h, i) => cell(ws, r, i + 1, h, { bold: true, size: 10, bg: 'FFF5F7FA' }));
  r++;
  [{ sm: summary1, cs: courses1, label: '1학기' }, { sm: summary2, cs: courses2, label: '2학기' }].forEach(({ sm, cs, label }) => {
    if (sm) {
      cell(ws, r, 1, label, { size: 10 });
      cell(ws, r, 2, computeGradeAvg(cs), { size: 10 });
      let col = 3;
      if (!isMiddle) cell(ws, r, col++, sm.overallClassRank ?? '-', { size: 10 });
      cell(ws, r, col++, sm.attendanceRate != null ? `${n1(sm.attendanceRate)}%` : '-', { size: 10 });
      cell(ws, r, col++, sm.absentCount != null ? `${sm.absentCount}일` : '-', { size: 10 });
      cell(ws, r, col++, sm.lateCount != null ? `${sm.lateCount}회` : '-', { size: 10 });
    } else {
      cell(ws, r, 1, label, { size: 10 });
      m(ws, r, 2, r, smH.length);
      cell(ws, r, 2, '데이터 없음', { size: 10, color: 'FF888888' });
    }
    r++;
  });
  r++;

  // 특이사항
  r = drawSection(ws, r, '▶ 특이사항', totalCols);
  m(ws, r, 1, r + 3, totalCols);
  const tc = ws.getCell(r, 1);
  tc.value = '';
  tc.border = allThin;
  [r, r + 1, r + 2, r + 3].forEach(rr => { ws.getRow(rr).height = 20; });
  r += 4;
  r++;

  drawFooter(ws, r, totalCols);

  downloadBuffer(await wb.xlsx.writeBuffer(), `${year}_${student.name}_성적분석.xlsx`);
}

// ─── 종합 학생 보고서 ───
export async function exportSchoolRecordExcel(
  student: Student, year: number,
  courses1: StudentCourseTerm[], courses2: StudentCourseTerm[],
  summary1: LearningSummary | null, summary2: LearningSummary | null,
  counselings: Counseling[], feedbacks: Feedback[],
  isMiddle: boolean
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('종합 보고서');
  const dataCols = isMiddle ? 7 : 8;
  const totalCols = dataCols + 4;

  ws.getColumn(1).width = 14;
  [2, 3, 4].forEach(i => { ws.getColumn(i).width = 7; });
  ws.getColumn(5).width = 11;
  ws.getColumn(6).width = 9;
  ws.getColumn(7).width = 7;
  if (!isMiddle) ws.getColumn(8).width = 7;

  let r = 1;
  r = drawHeader(ws, r, `${year}학년도\n학생 종합 보고서`, student.schoolName ?? '', ['담  임', '부  장', '교  감', '교  장'], totalCols);
  r = drawStudentInfo(ws, r, student, totalCols);
  r++;

  r = drawSection(ws, r, '▶ 1학기 교과 학습 발달 상황', totalCols);
  r = drawGradeTable(ws, r, courses1, summary1, isMiddle);
  r++;

  r = drawSection(ws, r, '▶ 2학기 교과 학습 발달 상황', totalCols);
  r = drawGradeTable(ws, r, courses2, summary2, isMiddle);
  r++;

  // 출결
  r = drawSection(ws, r, '▶ 출결 상황', totalCols);
  ['학기', '출석률', '결석', '지각', '조퇴'].forEach((h, i) => cell(ws, r, i + 1, h, { bold: true, size: 10, bg: 'FFF5F7FA' }));
  r++;
  [{ sm: summary1, label: '1학기' }, { sm: summary2, label: '2학기' }].forEach(({ sm, label }) => {
    cell(ws, r, 1, label, { size: 10 });
    if (sm) {
      cell(ws, r, 2, sm.attendanceRate != null ? `${n1(sm.attendanceRate)}%` : '-', { size: 10 });
      cell(ws, r, 3, sm.absentCount != null ? `${sm.absentCount}일` : '-', { size: 10 });
      cell(ws, r, 4, sm.lateCount != null ? `${sm.lateCount}회` : '-', { size: 10 });
      cell(ws, r, 5, (sm as any).earlyLeaveCount != null ? `${(sm as any).earlyLeaveCount}회` : '-', { size: 10 });
    } else {
      m(ws, r, 2, r, 5);
      cell(ws, r, 2, '기록 없음', { size: 10, color: 'FF888888' });
    }
    r++;
  });
  r++;

  drawFooter(ws, r, totalCols);

  // 상담 시트
  const wsC = wb.addWorksheet('상담 내역');
  [12, 12, 45, 35].forEach((w, i) => { wsC.getColumn(i + 1).width = w; });
  ['날짜', '상담교사', '상담 내용', '다음 상담 계획'].forEach((h, i) => cell(wsC, 1, i + 1, h, { bold: true, size: 10, bg: 'FFF5F7FA' }));
  wsC.getRow(1).height = 18;
  counselings.forEach((c, i) => {
    const rr = i + 2;
    [fmt(c.counseledAt), c.teacherName ?? '-', c.content ?? '', c.nextPlan ?? ''].forEach((v, j) => {
      cell(wsC, rr, j + 1, v, { size: 10, align: j < 2 ? 'center' : 'left', wrap: j >= 2 });
    });
    wsC.getRow(rr).height = 40;
  });

  // 피드백 시트
  const wsF = wb.addWorksheet('피드백');
  [12, 10, 12, 50].forEach((w, i) => { wsF.getColumn(i + 1).width = w; });
  ['날짜', '유형', '교사', '내용'].forEach((h, i) => cell(wsF, 1, i + 1, h, { bold: true, size: 10, bg: 'FFF5F7FA' }));
  wsF.getRow(1).height = 18;
  feedbacks.forEach((f, i) => {
    const rr = i + 2;
    [fmt(f.createdAt), FeedbackCategoryLabel[f.category] ?? f.category, f.teacherName ?? '-', f.content ?? ''].forEach((v, j) => {
      cell(wsF, rr, j + 1, v, { size: 10, align: j < 3 ? 'center' : 'left', wrap: j === 3 });
    });
    wsF.getRow(rr).height = 30;
  });

  downloadBuffer(await wb.xlsx.writeBuffer(), `${year}_${student.name}_종합보고서.xlsx`);
}

// ─── 상담 내역 보고서 ───
export async function exportCounselingExcel(student: Student, year: number, counselings: Counseling[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('상담 내역');
  const totalCols = 7;
  [12, 12, 45, 35].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.getColumn(5).width = 9; ws.getColumn(6).width = 9; ws.getColumn(7).width = 9;

  let r = 1;
  r = drawHeader(ws, r, `${year}학년도\n상담 내역 보고서`, student.schoolName ?? '', ['담  임', '교  감', '교  장'], totalCols);
  r = drawStudentInfo(ws, r, student, totalCols);
  r++;

  r = drawSection(ws, r, `▶ 상담 이력 (총 ${counselings.length}건)`, totalCols);
  ['날짜', '상담교사', '상담 내용', '다음 상담 계획'].forEach((h, i) => cell(ws, r, i + 1, h, { bold: true, size: 10, bg: 'FFF5F7FA' }));
  r++;

  if (counselings.length === 0) {
    m(ws, r, 1, r, 4);
    cell(ws, r, 1, '상담 기록 없음', { size: 10, color: 'FF888888' });
    r++;
  } else {
    counselings.forEach(c => {
      [fmt(c.counseledAt), c.teacherName ?? '-', c.content ?? '', c.nextPlan ?? ''].forEach((v, j) => {
        cell(ws, r, j + 1, v, { size: 10, align: j < 2 ? 'center' : 'left', wrap: j >= 2 });
      });
      ws.getRow(r).height = 40;
      r++;
    });
  }
  r++;

  drawFooter(ws, r, totalCols);
  downloadBuffer(await wb.xlsx.writeBuffer(), `${year}_${student.name}_상담내역.xlsx`);
}

// ─── 피드백 요약 보고서 ───
export async function exportFeedbackExcel(student: Student, year: number, feedbacks: Feedback[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('피드백 요약');
  const totalCols = 7;
  [12, 10, 12, 50].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.getColumn(5).width = 9; ws.getColumn(6).width = 9; ws.getColumn(7).width = 9;

  let r = 1;
  r = drawHeader(ws, r, `${year}학년도\n피드백 요약 보고서`, student.schoolName ?? '', ['담  임', '교  감', '교  장'], totalCols);
  r = drawStudentInfo(ws, r, student, totalCols);
  r++;

  r = drawSection(ws, r, `▶ 유형별 통계 (총 ${feedbacks.length}건)`, totalCols);
  cell(ws, r, 1, '유형', { bold: true, size: 10, bg: 'FFF5F7FA' });
  cell(ws, r, 2, '건수', { bold: true, size: 10, bg: 'FFF5F7FA' });
  r++;
  (['GRADE', 'BEHAVIOR', 'ATTENDANCE', 'ATTITUDE'] as const).forEach(cat => {
    cell(ws, r, 1, FeedbackCategoryLabel[cat], { size: 10 });
    cell(ws, r, 2, feedbacks.filter(f => f.category === cat).length, { size: 10 });
    r++;
  });
  r++;

  r = drawSection(ws, r, '▶ 피드백 상세 목록', totalCols);
  ['날짜', '유형', '교사', '내용'].forEach((h, i) => cell(ws, r, i + 1, h, { bold: true, size: 10, bg: 'FFF5F7FA' }));
  r++;

  if (feedbacks.length === 0) {
    m(ws, r, 1, r, 4);
    cell(ws, r, 1, '피드백 없음', { size: 10, color: 'FF888888' });
    r++;
  } else {
    feedbacks.forEach(f => {
      [fmt(f.createdAt), FeedbackCategoryLabel[f.category] ?? f.category, f.teacherName ?? '-', f.content ?? ''].forEach((v, j) => {
        cell(ws, r, j + 1, v, { size: 10, align: j < 3 ? 'center' : 'left', wrap: j === 3 });
      });
      ws.getRow(r).height = 30;
      r++;
    });
  }
  r++;

  drawFooter(ws, r, totalCols);
  downloadBuffer(await wb.xlsx.writeBuffer(), `${year}_${student.name}_피드백요약.xlsx`);
}

// ─── 반 단위 보고서 ───
export async function exportClassReportExcel(
  year: number, semester: number,
  students: Student[], classStats: any[], coursesPerStudent: StudentCourseTerm[][],
  schoolName: string, isMiddle: boolean
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('학생별 성적');
  const dataCols = isMiddle ? 5 : 6;
  const totalCols = dataCols + 3;

  [7, 10, 12, 14].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  if (!isMiddle) ws.getColumn(5).width = 8;
  ws.getColumn(isMiddle ? 5 : 6).width = 9;

  const grade = students[0]?.grade ?? '';
  const classNum = students[0]?.classNumber ?? '';

  let r = 1;
  r = drawHeader(ws, r, `${year}학년도 ${semester}학기\n${grade}학년 ${classNum}반 성적 현황`, schoolName, ['담  임', '교  감', '교  장'], totalCols);

  // 학급 기본 정보
  cell(ws, r, 1, '학  년', { bold: true, size: 10 });
  m(ws, r, 2, r, 4);
  cell(ws, r, 2, `${grade}학년 ${classNum}반`, { size: 10, align: 'left' });
  cell(ws, r, 5, '학생 수', { bold: true, size: 10 });
  m(ws, r, 6, r, totalCols);
  cell(ws, r, 6, `${students.length}명`, { size: 10, align: 'left' });
  ws.getRow(r).height = 22;
  r++;
  r++;

  r = drawSection(ws, r, '▶ 학생별 성적 현황', totalCols);
  const headers = ['번호', '성명', '원점수평균', isMiddle ? '성취도 분포' : '등급 평균', ...(isMiddle ? [] : ['석차']), '출석률'];
  headers.forEach((h, i) => cell(ws, r, i + 1, h, { bold: true, size: 10, bg: 'FFF5F7FA' }));
  r++;

  const sorted = [...students].sort((a, b) => (a.studentNumber ?? 0) - (b.studentNumber ?? 0));
  const statOf = (s: Student) => classStats.find((cs: any) => cs.studentId === s.id || cs.studentKey === s.id);
  const courseOf = (s: Student) => coursesPerStudent[students.indexOf(s)] ?? [];

  sorted.forEach(s => {
    const cs = statOf(s);
    const courses = courseOf(s);
    const gradeAvg = isMiddle
      ? (() => {
          const abs = courses.filter(c => c.gradeLevel != null && /^[A-Za-z]/.test(String(c.gradeLevel)));
          if (!abs.length) return '-';
          const cnt: Record<string, number> = {};
          abs.forEach(c => { const g = String(c.gradeLevel!); cnt[g] = (cnt[g] ?? 0) + 1; });
          return Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g}:${n}`).join(' ');
        })()
      : computeGradeAvg(courses);
    const row = [
      String(s.studentNumber ?? '').padStart(2, '0'), s.name,
      cs ? n1(cs.overallAvgScore) : '-', gradeAvg,
      ...(isMiddle ? [] : [cs ? (cs.overallClassRank ?? '-') : '-']),
      cs?.attendanceRate != null ? `${n1(cs.attendanceRate)}%` : '-',
    ];
    row.forEach((v, i) => cell(ws, r, i + 1, v, { size: 10, align: i === 1 ? 'left' : 'center', bold: i === 1 }));
    ws.getRow(r).height = 17;
    r++;
  });

  // 반 평균 행
  const validStats = classStats.filter(cs => cs.overallAvgScore != null);
  const attStats = classStats.filter(cs => cs.attendanceRate != null);
  const classAvgRaw = validStats.length > 0 ? Math.round(validStats.reduce((s, cs) => s + Number(cs.overallAvgScore), 0) / validStats.length * 10) / 10 : '-';
  const classAvgAtt = attStats.length > 0 ? Math.round(attStats.reduce((s, cs) => s + Number(cs.attendanceRate), 0) / attStats.length * 10) / 10 : '-';

  m(ws, r, 1, r, 2);
  cell(ws, r, 1, '반 평균', { bold: true, size: 10, thickTop: true });
  cell(ws, r, 3, classAvgRaw, { bold: true, size: 10, thickTop: true });
  cell(ws, r, 4, '-', { bold: true, size: 10, thickTop: true });
  if (!isMiddle) cell(ws, r, 5, '-', { bold: true, size: 10, thickTop: true });
  cell(ws, r, isMiddle ? 5 : 6, classAvgAtt !== '-' ? `${classAvgAtt}%` : '-', { bold: true, size: 10, thickTop: true });
  ws.getRow(r).height = 18;
  r++;
  r++;

  // 출결 현황
  r = drawSection(ws, r, '▶ 학급 출결 현황', totalCols);
  ['구분', '평균 출석률', '총 결석', '총 지각', '총 조퇴'].forEach((h, i) => cell(ws, r, i + 1, h, { bold: true, size: 10, bg: 'FFF5F7FA' }));
  r++;
  const totalAbsent = classStats.reduce((s, cs) => s + (cs.absentCount ?? 0), 0);
  const totalLate = classStats.reduce((s, cs) => s + (cs.lateCount ?? 0), 0);
  const totalEarly = classStats.reduce((s, cs) => s + (cs.earlyLeaveCount ?? 0), 0);
  [`${grade}학년 ${classNum}반`, classAvgAtt !== '-' ? `${classAvgAtt}%` : '-', `${totalAbsent}일`, `${totalLate}회`, `${totalEarly}회`]
    .forEach((v, i) => cell(ws, r, i + 1, v, { size: 10 }));
  r++;
  r++;

  drawFooter(ws, r, totalCols);
  downloadBuffer(await wb.xlsx.writeBuffer(), `${year}학년도_${semester}학기_학급성적.xlsx`);
}
