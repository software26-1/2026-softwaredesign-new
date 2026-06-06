import { useState, useEffect } from 'react';
import { exportGradeAnalysisExcel, exportSchoolRecordExcel, exportCounselingExcel, exportFeedbackExcel, exportClassReportExcel } from '../utils/excelReport';
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

type ReportType = 'school-record' | 'grade-analysis' | 'counseling' | 'feedback' | 'class-report';

const REPORT_TABS: { key: ReportType; label: string }[] = [
  { key: 'school-record', label: '종합 학생 보고서' },
  { key: 'grade-analysis', label: '성적 분석' },
  { key: 'counseling', label: '상담 내역' },
  { key: 'feedback', label: '피드백 요약' },
  { key: 'class-report', label: '반 단위 보고서' },
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
  .info-table th { font-size: 12px; font-weight: 700; padding: 7px 10px; border: 1px solid #000; text-align: center; background: #fff; white-space: nowrap; }
  .info-table td { font-size: 12px; padding: 7px 12px; border: 1px solid #000; }

  /* 섹션 헤더 */
  .sec { font-size: 13px; font-weight: 700; color: #000; margin: 18px 0 6px; }

  /* 일반 테이블 */
  table.data { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  table.data th { font-size: 11px; font-weight: 700; padding: 6px 5px; border: 1px solid #000; text-align: center; background: #fff; }
  table.data td { font-size: 11px; padding: 5px 6px; border: 1px solid #000; text-align: center; vertical-align: top; }
  table.data td.left { text-align: left; padding-left: 10px; word-break: break-word; white-space: pre-wrap; }
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

  /* 페이지 번호 */
  .page-num { text-align: center; font-size: 11px; color: #888; margin-top: 20px; padding-top: 8px; border-top: 1px solid #ddd; }
  /* 페이지 구분선 (화면용) */
  .page-sep { margin: 32px -50px; height: 24px; background: #e8eaed; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; letter-spacing: 2px; border-top: 1px dashed #bbb; border-bottom: 1px dashed #bbb; }

  @media print {
    @page { size: A4; margin: 0; }
    body { margin: 10mm 12mm; }
    .sec, thead { page-break-after: avoid; }
    tr { page-break-inside: avoid; }
    table { page-break-inside: auto; }
    .text-box { page-break-inside: avoid; }
    .page-num { display: none; }
    .page-sep { height: 0; margin: 0; padding: 0; border: none; background: transparent; overflow: hidden; font-size: 0; line-height: 0; page-break-after: always; break-after: page; }
  }
`;

function computeRawAvg(courses: StudentCourseTerm[]): string {
  const eligible = courses.filter(c =>
    c.avgScore != null && (c.gradeLevel == null || /^\d/.test(String(c.gradeLevel)))
  );
  if (!eligible.length) return '-';
  const avg = eligible.reduce((s, c) => s + Number(c.avgScore!), 0) / eligible.length;
  return String(Math.round(avg * 10) / 10);
}

// 내신 등급 평균: 숫자 등급(1~9)만 포함, 절대평가(A/B/C) 제외
function computeGradeAvg(courses: StudentCourseTerm[]): string {
  const eligible = courses.filter(c => {
    const gl = c.gradeLevel;
    return gl != null && /^\d+$/.test(String(gl));
  });
  if (!eligible.length) return '-';
  const avg = eligible.reduce((s, c) => s + Number(c.gradeLevel!), 0) / eligible.length;
  return String(Math.round(avg * 10) / 10);
}


function paginateTable(rows: string[], perPage: number, header: string, startPage = 1): string {
  if (rows.length === 0) return `<table class="data">${header}<tbody><tr><td colspan="10" class="no-data">데이터 없음</td></tr></tbody></table>`;
  const chunks: string[][] = [];
  for (let i = 0; i < rows.length; i += perPage) chunks.push(rows.slice(i, i + perPage));
  return chunks.map((chunk, idx) => {
    const pg = startPage + idx;
    const isLast = idx === chunks.length - 1;
    return `<table class="data">${header}<tbody>${chunk.join('')}</tbody></table>${
      !isLast ? `<div class="page-num">- ${pg} -</div><div class="page-sep">- - - - - ${pg + 1} 페이지 - - - - -</div>` : ''}`;
  }).join('');
}

function buildSchoolRecord(
  student: Student, year: number,
  courses1: StudentCourseTerm[], courses2: StudentCourseTerm[],
  record: any,
  summary1: LearningSummary | null, summary2: LearningSummary | null,
  counselings: Counseling[], feedbacks: Feedback[],
  isMiddle = false
): string {
  // 학기별 교과 테이블 생성 (상대평가→절대평가 순 정렬)
  const semGradeTable = (courses: StudentCourseTerm[], label: string, smry: LearningSummary | null) => {
    const isAbsolute = (c: StudentCourseTerm) => c.gradeLevel != null && /^[A-Za-z]/.test(String(c.gradeLevel));
    const relative = courses.filter(c => !isAbsolute(c));
    const absolute = courses.filter(c => isAbsolute(c));
    const cols = isMiddle ? 7 : 8;
    const toRow = (c: StudentCourseTerm) => `<tr>
          <td class="left">${esc(c.courseName ?? `과목${c.courseKey}`)}</td>
          <td>${c.midtermScore != null ? n1(c.midtermScore) : '-'}</td>
          <td>${c.finalScore != null ? n1(c.finalScore) : '-'}</td>
          <td>${c.taskScore != null ? n1(c.taskScore) : '-'}</td>
          <td>${c.avgScore != null ? n1(c.avgScore) : '-'}</td>
          <td>${c.classAvgScore != null ? n1(c.classAvgScore) : '-'}</td>
          <td>${c.gradeLevel ?? '-'}</td>
          ${!isMiddle ? `<td>${c.classRank ?? '-'}</td>` : ''}
        </tr>`;
    const sep = absolute.length > 0 && relative.length > 0
      ? `<tr><td colspan="${cols}" style="background:#f5f5f5;font-size:10px;color:#777;padding:3px 8px;border-top:2px solid #ccc;text-align:left">절대평가 과목</td></tr>`
      : '';
    const rows = courses.length === 0
      ? `<tr><td colspan="${cols}" class="no-data">성적 데이터 없음</td></tr>`
      : relative.map(toRow).join('') + sep + absolute.map(toRow).join('');
    return `
      <div class="sec">▶ ${label} 교과 학습 발달 상황</div>
      <table class="data">
        <thead><tr>
          <th style="width:90px">과목</th>
          <th>중간</th><th>기말</th><th>수행</th>
          <th>원점수평균</th><th>반평균</th><th>등급</th>${!isMiddle ? '<th>석차</th>' : ''}
        </tr></thead>
        <tbody>
          ${rows}
          <tr class="summary-row">
            <td class="left">평균</td>
            <td>-</td><td>-</td><td>-</td>
            <td>${computeRawAvg(courses)}</td>
            <td>-</td>
            <td>${computeGradeAvg(courses)}</td>
            ${!isMiddle ? `<td>${smry?.overallClassRank ?? '-'}</td>` : ''}
          </tr>
        </tbody>
      </table>`;
  };

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
        <td style="width:76px">${fmt(c.counseledAt)}</td>
        <td style="width:66px">${esc(c.teacherName ?? '-')}</td>
        <td class="left" style="width:46%">${esc(c.content)}</td>
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

    ${semGradeTable(courses1, '1학기', summary1)}
    ${semGradeTable(courses2, '2학기', summary2)}

    <div class="sec">▶ 출결 상황</div>
    <table class="data">
      <tbody>${attRow(summary1, '1학기')}${attRow(summary2, '2학기')}</tbody>
    </table>

    <div class="page-num">- 1 -</div>
    <div class="page-sep">- - - - - 2 페이지 - - - - -</div>
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
      ${new Date().getFullYear()}년&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;월&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;일<br><br>
      담임교사 : ________________ (인)
    </div>
    <div class="page-num">- 2 -</div>
  </div>`;
}

function buildScoreChartSvg(courses: StudentCourseTerm[], label: string): string {
  if (courses.length === 0) return `<p style="font-size:12px;color:#aaa;padding:8px 0">${label} 데이터 없음</p>`;
  const W = 300, LABEL = 90, BAR_W = 190, ROW_H = 28;
  const H = 20 + courses.length * ROW_H + 26;
  const sc = (v: number) => Math.min((v / 100) * BAR_W, BAR_W);
  const grid = [50, 100].map(v => {
    const x = LABEL + sc(v);
    return `<line x1="${x}" y1="8" x2="${x}" y2="${H - 20}" stroke="#e5e7eb" stroke-width="0.8"/>
      <text x="${x}" y="${H - 9}" font-size="8" text-anchor="middle" fill="#bbb">${v}</text>`;
  }).join('');
  const baseLine = `<line x1="${LABEL}" y1="8" x2="${LABEL}" y2="${H - 20}" stroke="#999" stroke-width="1"/>`;
  const rows = courses.map((c, i) => {
    const y = 16 + i * ROW_H;
    const short = (c.courseName ?? `과목${c.courseKey}`).slice(0, 5);
    const myBar = c.avgScore != null
      ? `<rect x="${LABEL}" y="${y}" width="${sc(Number(c.avgScore))}" height="11" fill="#1e5a99" opacity="0.85"/>
         <text x="${LABEL + sc(Number(c.avgScore)) + 3}" y="${y + 9}" font-size="8" fill="#333">${Number(c.avgScore).toFixed(1)}</text>` : '';
    const avgBar = c.classAvgScore != null
      ? `<rect x="${LABEL}" y="${y + 13}" width="${sc(Number(c.classAvgScore))}" height="9" fill="#b0c4de" opacity="0.8"/>
         <text x="${LABEL + sc(Number(c.classAvgScore)) + 3}" y="${y + 21}" font-size="8" fill="#888">${Number(c.classAvgScore).toFixed(1)}</text>` : '';
    const lbl = `<text x="${LABEL - 4}" y="${y + 14}" font-size="9" text-anchor="end" fill="#333">${short}</text>`;
    return lbl + myBar + avgBar;
  }).join('');
  const lY = H - 3;
  const legend = `<rect x="${LABEL}" y="${lY - 9}" width="9" height="9" fill="#1e5a99" opacity="0.85"/>
    <text x="${LABEL + 12}" y="${lY}" font-size="8" fill="#333">내 점수</text>
    <rect x="${LABEL + 50}" y="${lY - 9}" width="9" height="9" fill="#b0c4de" opacity="0.8"/>
    <text x="${LABEL + 62}" y="${lY}" font-size="8" fill="#333">반 평균</text>`;
  const title = `<text x="${W / 2}" y="10" font-size="10" font-weight="700" text-anchor="middle" fill="#1a2332">${label}</text>`;
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="font-family:'Noto Sans KR',sans-serif">${title}${grid}${baseLine}${rows}${legend}</svg>`;
}

function buildGradeAnalysis(student: Student, year: number, courses1: StudentCourseTerm[], courses2: StudentCourseTerm[], summary1: LearningSummary | null, summary2: LearningSummary | null, isMiddle = false): string {
  const isAbs = (c: StudentCourseTerm) => c.gradeLevel != null && /^[A-Za-z]/.test(String(c.gradeLevel));
  const semTable = (courses: StudentCourseTerm[], label: string, smry: LearningSummary | null) => {
    const rel = courses.filter(c => !isAbs(c));
    const abs = courses.filter(c => isAbs(c));
    const cols = isMiddle ? 7 : 8;
    const sep = abs.length > 0 && rel.length > 0
      ? `<tr><td colspan="${cols}" style="background:#f5f5f5;font-size:10px;color:#777;padding:3px 8px;border-top:2px solid #ccc;text-align:left">절대평가 과목</td></tr>` : '';
    const toRow = (c: StudentCourseTerm) => `<tr>
      <td class="left">${esc(c.courseName ?? `과목${c.courseKey}`)}</td>
      <td>${c.midtermScore != null ? n1(c.midtermScore) : '-'}</td>
      <td>${c.finalScore != null ? n1(c.finalScore) : '-'}</td>
      <td>${c.taskScore != null ? n1(c.taskScore) : '-'}</td>
      <td>${c.avgScore != null ? n1(c.avgScore) : '-'}</td>
      <td>${c.classAvgScore != null ? n1(c.classAvgScore) : '-'}</td>
      <td>${c.gradeLevel ?? '-'}</td>
      ${!isMiddle ? `<td>${c.classRank ?? '-'}</td>` : ''}
    </tr>`;
    const rows = courses.length === 0
      ? `<tr><td colspan="${cols}" class="no-data">성적 데이터 없음</td></tr>`
      : rel.map(toRow).join('') + sep + abs.map(toRow).join('');
    return `
      <div class="sec">▶ ${label} 교과 성적</div>
      <table class="data">
        <thead><tr>
          <th style="width:88px">과목</th>
          <th>중간</th><th>기말</th><th>수행</th>
          <th>원점수평균</th><th>반평균</th><th>등급</th>${!isMiddle ? '<th>석차</th>' : ''}
        </tr></thead>
        <tbody>
          ${rows}
          <tr class="summary-row">
            <td class="left">평균</td><td>-</td><td>-</td><td>-</td>
            <td>${computeRawAvg(courses)}</td><td>-</td>
            <td>${computeGradeAvg(courses)}</td>
            ${!isMiddle ? `<td>${smry?.overallClassRank ?? '-'}</td>` : ''}
          </tr>
        </tbody>
      </table>`;
  };

  const chart1 = buildScoreChartSvg(courses1, '1학기');
  const chart2 = buildScoreChartSvg(courses2, '2학기');
  const stampTable = `<table class="stamp-table"><tr><th>담 임</th><th>교 감</th><th>교 장</th></tr><tr><td></td><td></td><td></td></tr></table>`;
  const infoTable = `<table class="info-table"><tr><th style="width:70px">성 명</th><td>${esc(student.name)}</td><th>학년 / 반 / 번호</th><td>${esc(student.grade)}-${esc(student.classNumber)}-${String(student.studentNumber ?? '').padStart(2, '0')}</td></tr></table>`;

  return `<div class="paper">
    <div class="rpt-top">
      <div class="rpt-title-block"><div class="rpt-title">${esc(year)}학년도<br>성적 분석 보고서</div><div class="rpt-subtitle">${esc(student.schoolName ?? '')}</div></div>
      ${stampTable}
    </div>
    ${infoTable}
    ${semTable(courses1, '1학기', summary1)}
    ${semTable(courses2, '2학기', summary2)}
    <div class="page-num">- 1 -</div>
    <div class="page-sep">- - - - - 2 페이지 - - - - -</div>

    <div class="sec">▶ 과목별 성적 분포 (내 점수 vs 반 평균)</div>
    <div style="display:flex;gap:24px;margin:8px 0 16px;flex-wrap:wrap">${chart1}${chart2}</div>

    <div class="sec">▶ 학기별 종합</div>
    <table class="data">
      <thead><tr><th>학기</th><th>등급 평균</th>${!isMiddle ? '<th>반 석차</th>' : ''}<th>출석률</th><th>결석</th><th>지각</th></tr></thead>
      <tbody>
        ${summary1
          ? `<tr class="summary-row"><td>1학기</td><td>${computeGradeAvg(courses1)}</td>${!isMiddle ? `<td>${summary1.overallClassRank ?? '-'}</td>` : ''}<td>${n1(summary1.attendanceRate)}%</td><td>${summary1.absentCount ?? '-'}일</td><td>${summary1.lateCount ?? '-'}회</td></tr>`
          : `<tr><td>1학기</td><td colspan="${isMiddle ? 4 : 5}" class="no-data">데이터 없음</td></tr>`}
        ${summary2
          ? `<tr class="summary-row"><td>2학기</td><td>${computeGradeAvg(courses2)}</td>${!isMiddle ? `<td>${summary2.overallClassRank ?? '-'}</td>` : ''}<td>${n1(summary2.attendanceRate)}%</td><td>${summary2.absentCount ?? '-'}일</td><td>${summary2.lateCount ?? '-'}회</td></tr>`
          : `<tr><td>2학기</td><td colspan="${isMiddle ? 4 : 5}" class="no-data">데이터 없음</td></tr>`}
      </tbody>
    </table>

    <div class="sec" style="margin-top:16px">▶ 특이사항</div>
    <div class="text-box" style="min-height:100px"></div>

    <div class="foot">
      위와 같이 보고서를 제출합니다.<br><br>
      ${new Date().getFullYear()}년&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;월&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;일<br><br>
      담임교사 : ________________ (인)
    </div>
    <div class="page-num">- 2 -</div>
  </div>`;
}

function buildCounselingReport(student: Student, year: number, counselings: Counseling[]): string {
  const rowArr = counselings.length === 0
    ? [`<tr><td colspan="4" class="no-data">상담 기록 없음</td></tr>`]
    : counselings.map(c => `<tr><td style="width:76px">${fmt(c.counseledAt)}</td><td style="width:66px">${esc(c.teacherName ?? '-')}</td><td class="left" style="width:48%">${esc(c.content)}</td><td class="left">${esc(c.nextPlan)}</td></tr>`);
  const tHead = `<thead><tr><th>날짜</th><th>상담교사</th><th>주요 내용</th><th>다음 상담 계획</th></tr></thead>`;
  const totalPages = Math.max(1, Math.ceil(rowArr.length / 12));
  return `<div class="paper">
    <div class="rpt-top"><div class="rpt-title-block"><div class="rpt-title">${esc(year)}학년도<br>상담 내역 보고서</div><div class="rpt-subtitle">${esc(student.schoolName ?? '')}</div></div><table class="stamp-table"><tr><th>담 임</th><th>교 감</th><th>교 장</th></tr><tr><td></td><td></td><td></td></tr></table></div>
    <table class="info-table"><tr><th style="width:70px">성 명</th><td>${esc(student.name)}</td><th>학년 / 반 / 번호</th><td>${esc(student.grade)}-${esc(student.classNumber)}-${String(student.studentNumber ?? '').padStart(2, '0')}</td></tr></table>
    <div class="sec">▶ 상담 이력 (총 ${counselings.length}건)</div>
    ${paginateTable(rowArr, 12, tHead, 1)}
    <div class="page-num">- ${totalPages} -</div>
    <div class="foot">
      위와 같이 보고서를 제출합니다.<br><br>
      ${new Date().getFullYear()}년&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;월&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;일<br><br>
      담임교사 : ________________ (인)
    </div>
  </div>`;
}

function buildFeedbackReport(student: Student, year: number, feedbacks: Feedback[]): string {
  const cats = ['GRADE', 'BEHAVIOR', 'ATTENDANCE', 'ATTITUDE'] as const;
  const summary = cats.map(cat => {
    const count = feedbacks.filter(f => f.category === cat).length;
    return `<tr><td>${FeedbackCategoryLabel[cat]}</td><td>${count}건</td></tr>`;
  }).join('');
  const rowArr = feedbacks.length === 0
    ? [`<tr><td colspan="4" class="no-data">피드백 없음</td></tr>`]
    : feedbacks.map(f => `<tr><td style="width:80px">${fmt(f.createdAt)}</td><td style="width:60px">${FeedbackCategoryLabel[f.category]}</td><td style="width:70px">${esc(f.teacherName ?? '-')}</td><td class="left">${esc(f.content)}</td></tr>`);
  const tHead = `<thead><tr><th>날짜</th><th>유형</th><th>교사</th><th>내용</th></tr></thead>`;
  const totalPages = Math.max(1, Math.ceil(rowArr.length / 15));
  return `<div class="paper">
    <div class="rpt-top"><div class="rpt-title-block"><div class="rpt-title">${esc(year)}학년도<br>피드백 요약 보고서</div><div class="rpt-subtitle">${esc(student.schoolName ?? '')}</div></div><table class="stamp-table"><tr><th>담 임</th><th>교 감</th><th>교 장</th></tr><tr><td></td><td></td><td></td></tr></table></div>
    <table class="info-table"><tr><th style="width:70px">성 명</th><td>${esc(student.name)}</td><th>학년 / 반 / 번호</th><td>${esc(student.grade)}-${esc(student.classNumber)}-${String(student.studentNumber ?? '').padStart(2, '0')}</td></tr></table>
    <div class="sec">▶ 유형별 통계 (총 ${feedbacks.length}건)</div>
    <table class="data" style="width:200px"><thead><tr><th>유형</th><th>건수</th></tr></thead><tbody>${summary}</tbody></table>
    <div class="sec" style="margin-top:16px">▶ 피드백 상세 목록</div>
    ${paginateTable(rowArr, 15, tHead, 1)}
    <div class="page-num">- ${totalPages} -</div>
    <div class="foot">
      위와 같이 보고서를 제출합니다.<br><br>
      ${new Date().getFullYear()}년&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;월&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;일<br><br>
      담임교사 : ________________ (인)
    </div>
  </div>`;
}

// ─── 반 단위 보고서 ───
function buildClassReport(year: number, semester: number, students: Student[], classStats: any[], coursesPerStudent: StudentCourseTerm[][], schoolName: string, isMiddle = false): string {
  const grade = students[0]?.grade ?? '';
  const classNum = students[0]?.classNumber ?? '';
  const sorted = [...students].sort((a, b) => (a.studentNumber ?? 0) - (b.studentNumber ?? 0));

  const statOf = (s: Student) => classStats.find((cs: any) => cs.studentId === s.id || cs.studentKey === s.id);
  const courseOf = (s: Student) => {
    const idx = students.indexOf(s);
    return coursesPerStudent[idx] ?? [];
  };

  const validStats = classStats.filter(cs => cs.overallAvgScore != null);
  const attStats = classStats.filter(cs => cs.attendanceRate != null);
  const classAvgRaw = validStats.length > 0 ? Math.round(validStats.reduce((s, cs) => s + Number(cs.overallAvgScore), 0) / validStats.length * 10) / 10 : null;
  const classAvgAtt = attStats.length > 0 ? Math.round(attStats.reduce((s, cs) => s + Number(cs.attendanceRate), 0) / attStats.length * 10) / 10 : null;
  const totalAbsent = classStats.reduce((s, cs) => s + (cs.absentCount ?? 0), 0);
  const totalLate = classStats.reduce((s, cs) => s + (cs.lateCount ?? 0), 0);
  const totalEarly = classStats.reduce((s, cs) => s + (cs.earlyLeaveCount ?? 0), 0);

  // 고등학교: 번호·성명·원점수평균·등급평균·석차·출석률
  // 중학교:   번호·성명·원점수평균·성취도분포·출석률
  const gradeColLabel = isMiddle ? '성취도 분포' : '등급 평균';
  const classGradeAvg = isMiddle ? '-' : computeGradeAvg(coursesPerStudent.flat());

  const studentRowArr = sorted.length === 0
    ? [`<tr><td colspan="${isMiddle ? 5 : 6}" class="no-data">학생 데이터 없음</td></tr>`]
    : sorted.map((s) => {
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
        return `<tr>
          <td>${String(s.studentNumber ?? '').padStart(2, '0')}</td>
          <td class="left" style="font-weight:600">${esc(s.name)}</td>
          <td>${cs ? n1(cs.overallAvgScore) : '-'}</td>
          <td style="font-size:11px">${gradeAvg}</td>
          ${!isMiddle ? `<td>${cs ? (cs.overallClassRank ?? '-') : '-'}</td>` : ''}
          <td>${cs?.attendanceRate != null ? `${n1(cs.attendanceRate)}%` : '-'}</td>
        </tr>`;
      });

  const summaryRow = `<tr class="summary-row">
    <td colspan="2" class="left">반 평균</td>
    <td>${classAvgRaw != null ? classAvgRaw : '-'}</td>
    <td>${classGradeAvg}</td>
    ${!isMiddle ? '<td>-</td>' : ''}
    <td>${classAvgAtt != null ? `${classAvgAtt}%` : '-'}</td>
  </tr>`;

  const tHead = `<thead><tr>
    <th style="width:36px">번호</th>
    <th style="width:72px">성명</th>
    <th>원점수 평균</th>
    <th>${gradeColLabel}</th>
    ${!isMiddle ? '<th>석차</th>' : ''}
    <th>출석률</th>
  </tr></thead>`;
  const totalPages = Math.max(1, Math.ceil((studentRowArr.length + 1) / 20));

  return `<div class="paper">
    <div class="rpt-top">
      <div class="rpt-title-block">
        <div class="rpt-title">${esc(year)}학년도 ${semester}학기<br>${grade}학년 ${classNum}반 성적 현황</div>
        <div class="rpt-subtitle">${esc(schoolName)}</div>
      </div>
      <table class="stamp-table"><tr><th>담 임</th><th>교 감</th><th>교 장</th></tr><tr><td></td><td></td><td></td></tr></table>
    </div>
    <table class="info-table">
      <tr>
        <th style="width:60px">학 년</th><td>${grade}학년 ${classNum}반</td>
        <th style="width:60px">학생 수</th><td>${sorted.length}명</td>
      </tr>
    </table>

    <div class="sec">▶ 학생별 성적 현황</div>
    ${paginateTable([...studentRowArr, summaryRow], 20, tHead, 1)}

    <div class="sec" style="margin-top:16px">▶ 학급 출결 현황</div>
    <table class="data">
      <thead><tr><th>구분</th><th>평균 출석률</th><th>총 결석</th><th>총 지각</th><th>총 조퇴</th></tr></thead>
      <tbody>
        <tr>
          <td>${grade}학년 ${classNum}반</td>
          <td>${classAvgAtt != null ? `${classAvgAtt}%` : '-'}</td>
          <td>${totalAbsent}일</td>
          <td>${totalLate}회</td>
          <td>${totalEarly}회</td>
        </tr>
      </tbody>
    </table>

    <div class="foot">
      위와 같이 보고서를 제출합니다.<br><br>
      ${new Date().getFullYear()}년&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;월&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;일<br><br>
      담임교사 : ________________ (인)
    </div>
    <div class="page-num">- ${totalPages} -</div>
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
  const [schoolType, setSchoolType] = useState<string | null>(null);
  const [reportData, setReportData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    studentService.search({}).then(res => setStudents(res as Student[])).catch(() => setStudents([]));
    client.get<any>('/users/me').then(r => {
      const p = r.data?.data ?? r.data;
      if (p?.classGroupId) setClassGroupId(p.classGroupId);
      setSchoolType(p?.schoolType ?? null);
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
        generated = buildSchoolRecord(student, year, c1, c2, rec, s1 as any, s2 as any, counselings, feedbacks, schoolType === 'MIDDLE');
        setReportData({ type: 'school-record', student, year, courses1: c1, courses2: c2, summary1: s1, summary2: s2, counselings, feedbacks });

      } else if (reportType === 'grade-analysis') {
        const [c1, c2, s1, s2] = await Promise.all([
          analyticsService.getStudentCourses(id, year, 1).catch(() => []),
          analyticsService.getStudentCourses(id, year, 2).catch(() => []),
          analyticsService.getStudentSummary(id, year, 1).catch(() => null),
          analyticsService.getStudentSummary(id, year, 2).catch(() => null),
        ]);
        generated = buildGradeAnalysis(student, year, c1, c2, s1 as any, s2 as any, schoolType === 'MIDDLE');
        setReportData({ type: 'grade-analysis', student, year, courses1: c1, courses2: c2, summary1: s1, summary2: s2 });

      } else if (reportType === 'counseling') {
        const counselings = await counselingService.getByStudent(id).catch(() => []);
        generated = buildCounselingReport(student, year, counselings);
        setReportData({ type: 'counseling', student, year, counselings });

      } else if (reportType === 'feedback') {
        const feedbacks = await feedbackService.getByStudent(id).catch(() => []);
        generated = buildFeedbackReport(student, year, feedbacks);
        setReportData({ type: 'feedback', student, year, feedbacks });
      }

      setHtml(generated);
    } catch {
      setMsg('보고서 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClass = async () => {
    if (!classGroupId) { setMsg('담임 반이 지정되지 않았습니다. (담임 교사만 사용 가능합니다.)'); return; }
    setLoading(true); setMsg('');
    try {
      const classStudents = await client.get<any>(`/students?class_group_id=${classGroupId}`)
        .then(r => Array.isArray(r.data) ? r.data : (r.data?.data ?? [])).catch(() => []);
      const [summaries, coursesPerStudent] = await Promise.all([
        Promise.all(classStudents.map((s: any) => analyticsService.getStudentSummary(s.id, year, semester).catch(() => null))),
        Promise.all(classStudents.map((s: any) => analyticsService.getStudentCourses(s.id, year, semester).catch(() => []))),
      ]);
      const statsWithId = classStudents.map((s: any, i: number) => ({ studentId: s.id, ...(summaries[i] ?? {}) }));
      const sName = classStudents[0]?.schoolName ?? '';
      setHtml(buildClassReport(year, semester, classStudents, statsWithId, coursesPerStudent, sName, schoolType === 'MIDDLE'));
      setReportData({ type: 'class-report', year, semester, students: classStudents, classStats: statsWithId, coursesPerStudent });
    } catch {
      setMsg('반 단위 보고서 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcel = async () => {
    if (!reportData) return;
    const student = students.find(s => String(s.id) === pick.studentId);
    const isMiddle = schoolType === 'MIDDLE';
    if (reportData.type === 'grade-analysis') {
      await exportGradeAnalysisExcel(student!, reportData.year, reportData.courses1, reportData.courses2, reportData.summary1, reportData.summary2, isMiddle);
    } else if (reportData.type === 'school-record') {
      await exportSchoolRecordExcel(student!, reportData.year, reportData.courses1, reportData.courses2, reportData.summary1, reportData.summary2, reportData.counselings, reportData.feedbacks, isMiddle);
    } else if (reportData.type === 'counseling') {
      await exportCounselingExcel(student!, reportData.year, reportData.counselings);
    } else if (reportData.type === 'feedback') {
      await exportFeedbackExcel(student!, reportData.year, reportData.feedbacks);
    } else if (reportData.type === 'class-report') {
      await exportClassReportExcel(reportData.year, reportData.semester, reportData.students, reportData.classStats, reportData.coursesPerStudent, reportData.students[0]?.schoolName ?? '', isMiddle);
    }
  };

  const handlePrint = () => {
    if (!html) return;
    const student = students.find(s => String(s.id) === pick.studentId);
    const typeLabel: Record<ReportType, string> = {
      'school-record': '종합보고서',
      'grade-analysis': '성적분석',
      'counseling': '상담내역',
      'feedback': '피드백요약',
      'class-report': '학급성적현황',
    };
    const title = reportType === 'class-report'
      ? `${year}학년도_${semester}학기_${typeLabel['class-report']}`
      : student
        ? `${year}_${student.name}_${typeLabel[reportType]}`
        : '보고서';
    const w = window.open('', '_blank', 'width=860,height=1100');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet"><style>${SHARED_CSS}</style></head><body>${html}</body></html>`);
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
        {reportType !== 'class-report' && (
          <div style={{ marginBottom: '14px' }}>
            <StudentFilterSelect students={students} value={pick} onChange={v => { setPick(v); setHtml(''); }} />
          </div>
        )}
        {reportType === 'class-report' && (
          <div style={{ marginBottom: '14px', padding: '12px 14px', background: '#f0f5ff', borderRadius: '8px', fontSize: '13px', color: '#1e5a99', borderLeft: '3px solid #1e5a99' }}>
            담임 담당 반 전체 성적 현황 보고서입니다. 담임 교사만 생성 가능합니다.
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학년도</label>
            <select style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff' }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[YEAR, YEAR - 1, YEAR - 2].map(y => <option key={y} value={y}>{y}학년도</option>)}
            </select>
          </div>
          {(reportType === 'grade-analysis' || reportType === 'class-report') && (
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
          {reportType === 'class-report'
            ? <Button size="sm" onClick={handleGenerateClass} disabled={loading || !classGroupId}>{loading ? '생성 중...' : '반 단위 보고서 생성'}</Button>
            : <Button size="sm" onClick={handleGenerate} disabled={loading || !pick.studentId}>{loading ? '생성 중...' : '학생 보고서 생성'}</Button>
          }
          {html && <Button size="sm" variant="secondary" onClick={handlePrint}>인쇄 / PDF 저장</Button>}
          {html && reportData && <Button size="sm" variant="secondary" onClick={handleExcel}>Excel 다운로드</Button>}
        </div>
      </div>

      {/* 미리보기 */}
      {html && (
        <div className="report-preview-wrap" style={{ background: '#e8eaed', borderRadius: '10px', padding: '24px', overflow: 'auto' }}>
          <iframe
            srcDoc={`<!doctype html><html><head><meta charset="utf-8"><title>보고서</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet"><style>${SHARED_CSS}</style><style>body{background:#e8eaed;padding:20px 0;margin:0;}.paper{min-height:1050px;margin:0 auto 20px !important;box-shadow:0 2px 16px rgba(0,0,0,.18);break-after:page;page-break-after:always;}</style></head><body>${html}</body></html>`}
            style={{ width: '100%', border: 'none', display: 'block' }}
            onLoad={e => {
              const f = e.currentTarget;
              const h = f.contentDocument?.body?.scrollHeight ?? 800;
              f.style.height = `${h + 40}px`;
            }}
          />
        </div>
      )}
    </div>
  );
}
