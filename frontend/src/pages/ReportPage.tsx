import { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { StudentFilterSelect } from '../components/common/StudentFilterSelect';
import { studentService } from '../services/studentService';
import { analyticsService } from '../services/analyticsService';
import { studentRecordService } from '../services/studentRecordService';
import { counselingService } from '../services/counselingService';
import { feedbackService } from '../services/feedbackService';
import client from '../api/client';
import type { Student } from '../types/student';
import type { StudentCourseTerm, LearningSummary } from '../types/analytics';
import type { Counseling } from '../types/counseling';
import type { Feedback } from '../types/feedback';
import { FeedbackCategoryLabel } from '../types/feedback';

const YEAR = new Date().getFullYear();

type ReportType = 'school-record' | 'grade-analysis' | 'counseling' | 'feedback';

const REPORT_TABS: { key: ReportType; label: string }[] = [
  { key: 'school-record', label: '종합 학생 보고서' },
  { key: 'grade-analysis', label: '성적 분석' },
  { key: 'counseling', label: '상담 내역' },
  { key: 'feedback', label: '피드백 요약' },
];

const esc = (v: any) => (v == null ? '' : String(v).replace(/</g, '&lt;').replace(/>/g, '&gt;'));
const fmt = (d?: string) => d ? d.slice(0, 10) : '-';
const n1 = (v: any) => (v != null && !isNaN(Number(v))) ? Math.round(Number(v) * 10) / 10 : '-';

const SHARED_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; background: #fff; }
  .paper { width: 740px; margin: 0 auto; background: #fff; color: #000; padding: 40px 50px; }

  /* 보고서 최상단: 제목 왼쪽 + 도장 표 오른쪽 */
  .rpt-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .rpt-title-block {}
  .rpt-title { font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #000; margin: 0 0 4px; line-height: 1.3; }
  .rpt-subtitle { font-size: 12px; color: #444; margin: 6px 0 0; }

  /* 도장 표 (우측 상단) */
  .stamp-table { border-collapse: collapse; }
  .stamp-table th { font-size: 11px; font-weight: 700; padding: 4px 10px; border: 1px solid #000; text-align: center; background: #fff; }
  .stamp-table td { width: 52px; height: 44px; border: 1px solid #000; }

  /* 기본 정보 테이블 */
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .info-table th { font-size: 12px; font-weight: 700; padding: 7px 10px; border: 1px solid #000; text-align: center; background: #fff; }
  .info-table td { font-size: 12px; padding: 7px 12px; border: 1px solid #000; }

  /* 섹션 헤더 */
  .sec { font-size: 13px; font-weight: 700; color: #000; margin: 18px 0 6px; }

  /* 일반 테이블 */
  table.data { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  table.data th { font-size: 11px; font-weight: 700; padding: 6px 5px; border: 1px solid #000; text-align: center; background: #fff; }
  table.data td { font-size: 11px; padding: 5px 6px; border: 1px solid #000; text-align: center; vertical-align: top; }
  table.data td.left { text-align: left; padding-left: 10px; }
  table.data .summary-row td { font-weight: 700; border-top: 2px solid #000; }

  /* 텍스트 박스 */
  .text-box { border: 1px solid #000; min-height: 80px; padding: 10px 12px; font-size: 11.5px; line-height: 1.9; text-align: left; white-space: pre-wrap; }

  /* 서명란 */
  .seal-row { display: flex; justify-content: flex-start; gap: 0; margin-top: 28px; border-collapse: collapse; }
  .seal-item { text-align: center; font-size: 11px; font-weight: 700; }
  .seal-label { padding: 4px 14px; border: 1px solid #000; }
  .seal-box { width: 64px; height: 52px; border: 1px solid #000; border-top: none; }

  .foot { text-align: center; font-size: 12px; color: #000; margin-top: 24px; line-height: 2; }
  .no-data { text-align: center; color: #888; padding: 14px; font-size: 12px; }

  @page { size: A4; margin: 10mm 12mm; }
`;

function gradeCell(c?: StudentCourseTerm) {
  if (!c) return `<td>-</td><td>-</td><td>-</td>`;
  const avg = c.avgScore != null ? Math.round(Number(c.avgScore) * 10) / 10 : '-';
  const grade = c.gradeLevel ?? '-';
  const rank = c.classRank ?? '-';
  return `<td>${avg}</td><td>${grade}</td><td>${rank}</td>`;
}

function buildSchoolRecord(
  student: Student, year: number,
  courses1: StudentCourseTerm[], courses2: StudentCourseTerm[],
  record: any,
  summary1: LearningSummary | null, summary2: LearningSummary | null,
  counselings: Counseling[], feedbacks: Feedback[]
): string {
  // 교과 테이블
  const names = [...new Set([...courses1, ...courses2].map(c => c.courseName ?? `과목${c.courseKey}`))];
  const byName = (list: StudentCourseTerm[], name: string) => list.find(c => (c.courseName ?? `과목${c.courseKey}`) === name);

  const gradeRows = names.length === 0
    ? `<tr><td colspan="8" class="no-data">성적 데이터 없음 (ETL 실행 후 표시)</td></tr>`
    : names.map(name => {
        const a = byName(courses1, name);
        const b = byName(courses2, name);
        return `<tr><td class="left">${esc(name)}</td>${gradeCell(a)}${gradeCell(b)}<td></td></tr>`;
      }).join('');

  // 출결
  const attRow = (sm: LearningSummary | null, label: string) => `
    <tr><td class="left" style="font-weight:700;width:50px">${label}</td>
    <td class="left">${sm ? `출석률 ${n1(sm.attendanceRate)}% &nbsp;·&nbsp; 결석 ${sm.absentCount ?? 0}일 &nbsp;·&nbsp; 지각 ${sm.lateCount ?? 0}회 &nbsp;·&nbsp; 조퇴 ${sm.earlyLeaveCount ?? 0}회` : '기록 없음'}</td></tr>`;

  // 학생부 세부
  const rec = record ?? {};
  const details = [
    rec.achievements && `【특기사항】\n${rec.achievements}`,
    rec.extracurricular && `【비교과 활동】\n${rec.extracurricular}`,
    rec.careerAspirations && `【진로 희망】\n${rec.careerAspirations}`,
    rec.volunteerHours != null && `【봉사활동】 ${rec.volunteerHours}시간`,
  ].filter(Boolean).join('\n\n') || '기록된 내용이 없습니다.';

  // 상담
  const cRows = counselings.length === 0
    ? `<tr><td colspan="4" class="no-data">상담 기록 없음</td></tr>`
    : counselings.map(c => `<tr>
        <td style="width:80px">${fmt(c.counseledAt)}</td>
        <td style="width:70px">${esc(c.teacherName ?? '-')}</td>
        <td class="left">${esc(c.content)}</td>
        <td class="left">${esc(c.nextPlan)}</td>
      </tr>`).join('');

  // 피드백
  const catCount = (cat: string) => feedbacks.filter(f => f.category === cat).length;
  const fbRows = feedbacks.length === 0
    ? `<tr><td colspan="4" class="no-data">피드백 없음</td></tr>`
    : feedbacks.slice(0, 10).map(f => `<tr>
        <td style="width:80px">${fmt(f.createdAt)}</td>
        <td style="width:60px">${FeedbackCategoryLabel[f.category] ?? f.category}</td>
        <td style="width:70px">${esc(f.teacherName ?? '-')}</td>
        <td class="left">${esc(f.content)}</td>
      </tr>`).join('');

  const fbSummary = `성적 ${catCount('GRADE')} · 행동 ${catCount('BEHAVIOR')} · 출결 ${catCount('ATTENDANCE')} · 태도 ${catCount('ATTITUDE')} (총 ${feedbacks.length}건)`;

  const stampTable = `<table class="stamp-table"><tr><th>담 임</th><th>부 장</th><th>교 감</th><th>교 장</th></tr><tr><td></td><td></td><td></td><td></td></tr></table>`;
  return `<div class="paper">
    <div class="rpt-top">
      <div class="rpt-title-block">
        <div class="rpt-title">${esc(year)}학년도<br>학생 종합 보고서</div>
        <div class="rpt-subtitle">${esc(student.schoolName ?? '')}</div>
      </div>
      ${stampTable}
    </div>

    <table class="info-table">
      <tr>
        <th style="width:70px">성 명</th><td>${esc(student.name)}</td>
        <th style="width:90px">학년 / 반 / 번호</th><td>${esc(student.grade)}학년 ${esc(student.classNumber)}반 ${String(student.studentNumber ?? '').padStart(2, '0')}번</td>
      </tr>
    </table>

    <div class="sec">▶ 교과 학습 발달 상황</div>
    <table class="data">
      <thead>
        <tr>
          <th rowspan="2" style="width:100px">과목</th>
          <th colspan="3">1학기</th>
          <th colspan="3">2학기</th>
          <th rowspan="2" style="width:50px">비고</th>
        </tr>
        <tr>
          <th>원점수(평균)</th><th>등급</th><th>석차</th>
          <th>원점수(평균)</th><th>등급</th><th>석차</th>
        </tr>
      </thead>
      <tbody>
        ${gradeRows}
        <tr class="summary-row">
          <td class="left">전체 평균</td>
          <td>${n1(summary1?.overallAvgScore)}</td><td>-</td><td>${summary1?.overallClassRank ?? '-'}</td>
          <td>${n1(summary2?.overallAvgScore)}</td><td>-</td><td>${summary2?.overallClassRank ?? '-'}</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="sec">▶ 출결 상황</div>
    <table class="data">
      <tbody>${attRow(summary1, '1학기')}${attRow(summary2, '2학기')}</tbody>
    </table>

    <div class="sec">▶ 세부능력 및 특기사항</div>
    <div class="text-box">${esc(details).replace(/\n/g, '<br/>')}</div>

    <div class="sec">▶ 상담 이력 (총 ${counselings.length}건)</div>
    <table class="data">
      <thead><tr><th>날짜</th><th>상담교사</th><th>상담 내용</th><th>다음 계획</th></tr></thead>
      <tbody>${cRows}</tbody>
    </table>

    <div class="sec">▶ 피드백 현황 &nbsp;<span style="font-weight:400;font-size:11px">${fbSummary}</span></div>
    <table class="data">
      <thead><tr><th>날짜</th><th>유형</th><th>교사</th><th>내용</th></tr></thead>
      <tbody>${fbRows}</tbody>
    </table>
    ${feedbacks.length > 10 ? `<div style="font-size:11px;color:#888;text-align:right;padding:4px">외 ${feedbacks.length - 10}건 생략</div>` : ''}

    <div class="foot">
      위와 같이 보고서를 제출합니다.<br><br>
      ${new Date().getFullYear()}년&nbsp;&nbsp;&nbsp;${new Date().getMonth()+1}월&nbsp;&nbsp;&nbsp;${new Date().getDate()}일<br><br>
      담임교사 : ________________ (인)
    </div>
  </div>`;
}

function buildGradeAnalysis(student: Student, year: number, courses1: StudentCourseTerm[], courses2: StudentCourseTerm[], summary1: LearningSummary | null, summary2: LearningSummary | null): string {
  const names = [...new Set([...courses1, ...courses2].map(c => c.courseName ?? `과목${c.courseKey}`))];
  const byName = (list: StudentCourseTerm[], name: string) => list.find(c => (c.courseName ?? `과목${c.courseKey}`) === name);
  const rows = names.length === 0
    ? `<tr><td colspan="8" class="no-data">성적 데이터 없음 (ETL 실행 후 표시)</td></tr>`
    : names.map(name => {
        const a = byName(courses1, name); const b = byName(courses2, name);
        return `<tr>
          <td class="left">${esc(name)}</td>
          <td>${n1(a?.avgScore)}</td><td>${n1(a?.classAvgScore)}</td><td>${esc(a?.gradeLevel ?? '-')}</td><td>${a?.classRank ?? '-'}</td>
          <td>${n1(b?.avgScore)}</td><td>${n1(b?.classAvgScore)}</td><td>${esc(b?.gradeLevel ?? '-')}</td><td>${b?.classRank ?? '-'}</td>
        </tr>`;
      }).join('');
  const sm = (s: LearningSummary | null, label: string) => s
    ? `<tr class="summary-row"><td>${label}</td><td>${n1(s.overallAvgScore)}</td><td>${s.overallClassRank ?? '-'}</td><td>${n1(s.attendanceRate)}%</td></tr>`
    : `<tr><td>${label}</td><td colspan="3" class="no-data">데이터 없음</td></tr>`;
  return `<div class="paper">
    <div class="rpt-top"><div class="rpt-title-block"><div class="rpt-title">${esc(year)}학년도<br>성적 분석 보고서</div><div class="rpt-subtitle">${esc(student.schoolName ?? '')}</div></div><table class="stamp-table"><tr><th>담 임</th><th>교 감</th><th>교 장</th></tr><tr><td></td><td></td><td></td></tr></table></div>
    <table class="info-table"><tr><th style="width:70px">성 명</th><td>${esc(student.name)}</td><th style="width:90px">학년 / 반 / 번호</th><td>${esc(student.grade)}-${esc(student.classNumber)}-${String(student.studentNumber ?? '').padStart(2, '0')}</td></tr></table>
    <div class="sec">▶ 과목별 성적</div>
    <table class="data">
      <thead><tr><th rowspan="2" style="width:90px">과목</th><th colspan="4">1학기</th><th colspan="4">2학기</th></tr>
      <tr><th>내 점수</th><th>반 평균</th><th>등급</th><th>석차</th><th>내 점수</th><th>반 평균</th><th>등급</th><th>석차</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="sec">▶ 학기별 종합</div>
    <table class="data"><thead><tr><th>학기</th><th>전체 평균</th><th>반 석차</th><th>출석률</th></tr></thead><tbody>${sm(summary1, '1학기')}${sm(summary2, '2학기')}</tbody></table>
    <div class="foot">발급일: ${new Date().toLocaleDateString('ko-KR')}</div>
  </div>`;
}

function buildCounselingReport(student: Student, year: number, counselings: Counseling[]): string {
  const rows = counselings.length === 0
    ? `<tr><td colspan="4" class="no-data">상담 기록 없음</td></tr>`
    : counselings.map(c => `<tr><td style="width:80px">${fmt(c.counseledAt)}</td><td style="width:80px">${esc(c.teacherName ?? '-')}</td><td class="left">${esc(c.content)}</td><td class="left">${esc(c.nextPlan)}</td></tr>`).join('');
  return `<div class="paper">
    <div class="rpt-top"><div class="rpt-title-block"><div class="rpt-title">${esc(year)}학년도<br>상담 내역 보고서</div><div class="rpt-subtitle">${esc(student.schoolName ?? '')}</div></div><table class="stamp-table"><tr><th>담 임</th><th>교 감</th><th>교 장</th></tr><tr><td></td><td></td><td></td></tr></table></div>
    <table class="info-table"><tr><th style="width:70px">성 명</th><td>${esc(student.name)}</td><th style="width:90px">학년 / 반 / 번호</th><td>${esc(student.grade)}-${esc(student.classNumber)}-${String(student.studentNumber ?? '').padStart(2, '0')}</td></tr></table>
    <div class="sec">▶ 상담 이력 (총 ${counselings.length}건)</div>
    <table class="data"><thead><tr><th>날짜</th><th>상담교사</th><th>주요 내용</th><th>다음 상담 계획</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="foot">발급일: ${new Date().toLocaleDateString('ko-KR')}</div>
  </div>`;
}

function buildFeedbackReport(student: Student, year: number, feedbacks: Feedback[]): string {
  const cats = ['GRADE', 'BEHAVIOR', 'ATTENDANCE', 'ATTITUDE'] as const;
  const summary = cats.map(cat => {
    const count = feedbacks.filter(f => f.category === cat).length;
    return `<tr><td>${FeedbackCategoryLabel[cat]}</td><td>${count}건</td></tr>`;
  }).join('');
  const rows = feedbacks.length === 0
    ? `<tr><td colspan="4" class="no-data">피드백 없음</td></tr>`
    : feedbacks.map(f => `<tr><td style="width:80px">${fmt(f.createdAt)}</td><td style="width:60px">${FeedbackCategoryLabel[f.category]}</td><td style="width:70px">${esc(f.teacherName ?? '-')}</td><td class="left">${esc(f.content)}</td></tr>`).join('');
  return `<div class="paper">
    <div class="rpt-top"><div class="rpt-title-block"><div class="rpt-title">${esc(year)}학년도<br>피드백 요약 보고서</div><div class="rpt-subtitle">${esc(student.schoolName ?? '')}</div></div><table class="stamp-table"><tr><th>담 임</th><th>교 감</th><th>교 장</th></tr><tr><td></td><td></td><td></td></tr></table></div>
    <table class="info-table"><tr><th style="width:70px">성 명</th><td>${esc(student.name)}</td><th style="width:90px">학년 / 반 / 번호</th><td>${esc(student.grade)}-${esc(student.classNumber)}-${String(student.studentNumber ?? '').padStart(2, '0')}</td></tr></table>
    <div class="sec">▶ 유형별 통계 (총 ${feedbacks.length}건)</div>
    <table class="data" style="width:200px"><thead><tr><th>유형</th><th>건수</th></tr></thead><tbody>${summary}</tbody></table>
    <div class="sec" style="margin-top:16px">▶ 피드백 상세 목록</div>
    <table class="data"><thead><tr><th>날짜</th><th>유형</th><th>교사</th><th>내용</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="foot">발급일: ${new Date().toLocaleDateString('ko-KR')}</div>
  </div>`;
}

// ─── 반 단위 보고서 ───
function buildClassReport(year: number, semester: number, classGroupId: number, students: Student[], classStats: any[]): string {
  const rows = students.length === 0
    ? `<tr><td colspan="5" class="no-data">학생 데이터 없음</td></tr>`
    : students.map((s, i) => {
        const stat = classStats.find((cs: any) => cs.studentId === s.id || cs.studentKey === s.id);
        return `<tr>
          <td>${i + 1}</td>
          <td class="left">${esc(s.name)}</td>
          <td>${esc(s.grade)}-${esc(s.classNumber)}-${String(s.studentNumber ?? '').padStart(2, '0')}</td>
          <td>${stat ? n1(stat.overallAvgScore) : '-'}</td>
          <td>${stat ? (stat.overallClassRank ?? '-') : '-'}</td>
        </tr>`;
      }).join('');
  return `<div class="paper">
    <div class="rpt-header"><div class="rpt-title">${esc(year)}학년도 ${semester}학기 반 성적 현황</div><div class="rpt-subtitle">학급 ID: ${classGroupId}</div></div>
    <div class="sec">▶ 학생별 성적 현황</div>
    <table class="data"><thead><tr><th>번호</th><th>성명</th><th>학년/반/번호</th><th>전체 평균</th><th>석차</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="foot">발급일: ${new Date().toLocaleDateString('ko-KR')}</div>
  </div>`;
}

// ─── Component ───
export function ReportPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pick, setPick] = useState({ grade: '', classNumber: '', studentId: '' });
  const [year, setYear] = useState(YEAR);
  const [semester, setSemester] = useState(1);
  const [reportType, setReportType] = useState<ReportType>('school-record');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [classGroupId, setClassGroupId] = useState<number | null>(null);

  useEffect(() => {
    studentService.search({}).then(res => setStudents(res as Student[])).catch(() => setStudents([]));
    client.get<any>('/users/me').then(r => {
      const p = r.data?.data ?? r.data;
      if (p?.classGroupId) setClassGroupId(p.classGroupId);
    }).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!pick.studentId) { setMsg('학생을 선택해주세요.'); return; }
    const student = students.find(s => String(s.id) === pick.studentId);
    if (!student) return;
    setLoading(true); setMsg('');
    try {
      const id = Number(pick.studentId);
      let generated = '';

      if (reportType === 'school-record') {
        const [c1, c2, rec, s1, s2, counselings, feedbacks] = await Promise.all([
          analyticsService.getStudentCourses(id, year, 1).catch(() => []),
          analyticsService.getStudentCourses(id, year, 2).catch(() => []),
          studentRecordService.get(id).then(r => (Array.isArray(r) ? r[0] ?? null : r)).catch(() => null),
          analyticsService.getStudentSummary(id, year, 1).catch(() => null),
          analyticsService.getStudentSummary(id, year, 2).catch(() => null),
          counselingService.getByStudent(id).catch(() => []),
          feedbackService.getByStudent(id).catch(() => []),
        ]);
        generated = buildSchoolRecord(student, year, c1, c2, rec, s1 as any, s2 as any, counselings, feedbacks);

      } else if (reportType === 'grade-analysis') {
        const [c1, c2, s1, s2] = await Promise.all([
          analyticsService.getStudentCourses(id, year, 1).catch(() => []),
          analyticsService.getStudentCourses(id, year, 2).catch(() => []),
          analyticsService.getStudentSummary(id, year, 1).catch(() => null),
          analyticsService.getStudentSummary(id, year, 2).catch(() => null),
        ]);
        generated = buildGradeAnalysis(student, year, c1, c2, s1 as any, s2 as any);

      } else if (reportType === 'counseling') {
        const counselings = await counselingService.getByStudent(id).catch(() => []);
        generated = buildCounselingReport(student, year, counselings);

      } else if (reportType === 'feedback') {
        const feedbacks = await feedbackService.getByStudent(id).catch(() => []);
        generated = buildFeedbackReport(student, year, feedbacks);
      }

      setHtml(generated);
    } catch {
      setMsg('보고서 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClass = async () => {
    if (!classGroupId) { setMsg('담임 반이 지정되지 않았습니다.'); return; }
    setLoading(true); setMsg('');
    try {
      const classStudents = await client.get<any>(`/students?class_group_id=${classGroupId}`)
        .then(r => Array.isArray(r.data) ? r.data : (r.data?.data ?? [])).catch(() => []);
      const summaries = await Promise.all(
        classStudents.map((s: any) => analyticsService.getStudentSummary(s.id, year, semester).catch(() => null))
      );
      const statsWithId = classStudents.map((s: any, i: number) => ({ studentId: s.id, ...(summaries[i] ?? {}) }));
      setHtml(buildClassReport(year, semester, classGroupId, classStudents, statsWithId));
    } catch {
      setMsg('반 단위 보고서 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!html) return;
    const w = window.open('', '_blank', 'width=860,height=1100');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>보고서</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet"><style>${SHARED_CSS}</style></head><body>${html}</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div>
      <style>{`
        @media (max-width: 768px) { .report-form-pad { padding: 14px !important; } .report-preview-wrap { padding: 10px !important; } }
      `}</style>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>보고서</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>학생/반 선택 후 보고서를 생성하고 인쇄(PDF 저장)하세요.</p>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {REPORT_TABS.map(tab => (
          <button key={tab.key} onClick={() => { setReportType(tab.key); setHtml(''); }}
            style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: reportType === tab.key ? 700 : 500, fontFamily: "'Noto Sans KR', sans-serif", background: reportType === tab.key ? '#1e3a5f' : '#f1f5f9', color: reportType === tab.key ? '#fff' : '#64748b', transition: 'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 폼 */}
      <div className="report-form-pad" style={{ background: '#fff', borderRadius: '10px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: '14px' }}>
          <StudentFilterSelect students={students} value={pick} onChange={v => { setPick(v); setHtml(''); }} />
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학년도</label>
            <select style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff' }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[YEAR, YEAR - 1, YEAR - 2].map(y => <option key={y} value={y}>{y}학년도</option>)}
            </select>
          </div>
          {reportType === 'grade-analysis' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학기</label>
              <select style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff' }} value={semester} onChange={e => setSemester(Number(e.target.value))}>
                <option value={1}>1학기</option>
                <option value={2}>2학기</option>
              </select>
            </div>
          )}
        </div>
        {msg && <div style={{ padding: '10px 14px', background: '#fdecea', color: '#c62828', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', borderLeft: '3px solid #e57373' }}>{msg}</div>}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size="sm" onClick={handleGenerate} disabled={loading || !pick.studentId}>{loading ? '생성 중...' : '학생 보고서 생성'}</Button>
          {classGroupId && <Button size="sm" variant="secondary" onClick={handleGenerateClass} disabled={loading}>반 단위 보고서 생성</Button>}
          {html && <Button size="sm" variant="secondary" onClick={handlePrint}>인쇄 / PDF 저장</Button>}
        </div>
      </div>

      {/* 미리보기 */}
      {html && (
        <div className="report-preview-wrap" style={{ background: '#e8eaed', borderRadius: '10px', padding: '24px', overflow: 'auto' }}>
          <style>{SHARED_CSS.replace(/@page[^}]+}/g, '')}</style>
          <div style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.18)' }} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}
    </div>
  );
}
