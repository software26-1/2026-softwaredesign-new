import { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { StudentFilterSelect } from '../components/common/StudentFilterSelect';
import { studentService } from '../services/studentService';
import { analyticsService } from '../services/analyticsService';
import { studentRecordService } from '../services/studentRecordService';
import type { Student } from '../types/student';
import type { StudentCourseTerm, LearningSummary } from '../types/analytics';

const YEAR = new Date().getFullYear();

const selectStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%' };

interface ReportData {
  student: Student;
  year: number;
  courses1: StudentCourseTerm[];
  courses2: StudentCourseTerm[];
  record: any;
  summary1: LearningSummary | null;
  summary2: LearningSummary | null;
}

/** 생기부 양식 HTML 문자열 생성 (미리보기 + 인쇄에 공통 사용) */
function buildReportHtml(d: ReportData): string {
  const s = d.student;
  const esc = (v: any) => (v == null ? '' : String(v).replace(/</g, '&lt;').replace(/>/g, '&gt;'));

  // 과목명 기준으로 1·2학기 병합
  const names = [...new Set([...d.courses1, ...d.courses2].map(c => c.courseName ?? `과목${c.courseKey}`))];
  const byName = (list: StudentCourseTerm[], name: string) =>
    list.find(c => (c.courseName ?? `과목${c.courseKey}`) === name);

  const rows = names.length === 0
    ? `<tr><td colspan="6" style="text-align:center;color:#888;padding:14px">성적 데이터가 없습니다 (ETL 실행 후 표시)</td></tr>`
    : names.map(name => {
        const a = byName(d.courses1, name);
        const b = byName(d.courses2, name);
        const cell = (c?: StudentCourseTerm) => c
          ? `<td>${esc(c.gradeLevel ?? '-')}</td><td>${c.classRank != null ? esc(c.classRank) : '-'}</td>`
          : `<td>-</td><td>-</td>`;
        return `<tr><td>${esc(name)}</td>${cell(a)}${cell(b)}<td></td></tr>`;
      }).join('');

  const att = (sm: LearningSummary | null) => sm
    ? `출석률 ${sm.attendanceRate != null ? Math.round(sm.attendanceRate * 100) / 100 + '%' : '-'} · 결석 ${sm.absentCount ?? 0} · 지각 ${sm.lateCount ?? 0} · 조퇴 ${sm.earlyLeaveCount ?? 0}`
    : '기록 없음';

  const rec = d.record ?? {};
  const detailText = [
    rec.achievements && `[특기사항] ${rec.achievements}`,
    rec.extracurricular && `[비교과 활동] ${rec.extracurricular}`,
    rec.careerAspirations && `[진로 희망] ${rec.careerAspirations}`,
    rec.volunteerHours != null && `[봉사시간] ${rec.volunteerHours}시간`,
  ].filter(Boolean).join('\n') || '기록된 세부능력 및 특기사항이 없습니다.';

  return `
  <div class="paper">
    <h1 class="title">${esc(d.year)}학년도 학교생활기록부</h1>
    <p class="school">${esc(s.schoolName ?? '')}</p>
    <table class="info">
      <tr>
        <th>성명</th><td>${esc(s.name)}</td>
        <th>학년 / 반 / 번호</th><td>${esc(s.grade)} - ${esc(s.classNumber)} - ${String(s.studentNumber ?? '').padStart(2, '0')}</td>
      </tr>
    </table>

    <h2 class="sec">교과 학습 발달 상황</h2>
    <table class="grade">
      <thead>
        <tr>
          <th rowspan="2">과목</th>
          <th colspan="2">1학기</th>
          <th colspan="2">2학기</th>
          <th rowspan="2">비고</th>
        </tr>
        <tr><th>성취도</th><th>석차</th><th>성취도</th><th>석차</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <h2 class="sec">출결 상황</h2>
    <table class="att">
      <tr><th>1학기</th><td>${esc(att(d.summary1))}</td></tr>
      <tr><th>2학기</th><td>${esc(att(d.summary2))}</td></tr>
    </table>

    <h2 class="sec">세부능력 및 특기사항</h2>
    <div class="detail">${esc(detailText).replace(/\n/g, '<br/>')}</div>

    <table class="seal">
      <tr>
        <td>담임<div class="box">(인)</div></td>
        <td>교감<div class="box">(인)</div></td>
        <td>교장<div class="box">(인)</div></td>
      </tr>
    </table>
    <p class="foot">발급일: ${new Date().toLocaleDateString('ko-KR')}</p>
  </div>`;
}

const PAPER_CSS = `
  .paper { width: 720px; margin: 0 auto; background: #fff; color: #1a1a1a; padding: 40px 48px; font-family: 'Noto Sans KR', sans-serif; box-sizing: border-box; }
  .paper .title { text-align: center; font-size: 22px; font-weight: 800; letter-spacing: 4px; margin: 0 0 4px; }
  .paper .school { text-align: center; font-size: 13px; color: #555; margin: 0 0 20px; }
  .paper table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  .paper th, .paper td { border: 1px solid #333; padding: 7px 8px; font-size: 12px; text-align: center; }
  .paper .info th { background: #f0f0f0; width: 90px; }
  .paper .info td { text-align: left; padding-left: 12px; }
  .paper .sec { font-size: 14px; font-weight: 700; border-left: 4px solid #1e3a5f; padding-left: 8px; margin: 18px 0 8px; }
  .paper .grade th { background: #f0f0f0; }
  .paper .att th { background: #f0f0f0; width: 70px; }
  .paper .att td { text-align: left; padding-left: 12px; }
  .paper .detail { border: 1px solid #333; min-height: 120px; padding: 12px 14px; font-size: 12px; line-height: 1.9; text-align: left; white-space: pre-wrap; }
  .paper .seal { width: auto; margin: 28px 0 0 auto; }
  .paper .seal td { border: none; padding: 0 6px; font-size: 12px; font-weight: 600; }
  .paper .seal .box { width: 74px; height: 74px; border: 1px solid #333; margin-top: 6px; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 12px; }
  .paper .foot { text-align: right; font-size: 12px; color: #555; margin-top: 14px; }
`;

export function ReportPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pick, setPick] = useState({ grade: '', classNumber: '', studentId: '' });
  const [year, setYear] = useState(YEAR);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    studentService.search({}).then(res => setStudents(res as Student[])).catch(() => setStudents([]));
  }, []);

  const handleGenerate = async () => {
    if (!pick.studentId) { setMsg('학생을 선택해주세요.'); return; }
    const student = students.find(s => String(s.id) === pick.studentId);
    if (!student) return;
    setLoading(true); setMsg('');
    try {
      const id = Number(pick.studentId);
      const [courses1, courses2, record, summary1, summary2] = await Promise.all([
        analyticsService.getStudentCourses(id, year, 1).catch(() => []),
        analyticsService.getStudentCourses(id, year, 2).catch(() => []),
        studentRecordService.get(id).then(r => (Array.isArray(r) ? r[0] ?? null : r)).catch(() => null),
        analyticsService.getStudentSummary(id, year, 1).catch(() => null),
        analyticsService.getStudentSummary(id, year, 2).catch(() => null),
      ]);
      setData({ student, year, courses1, courses2, record, summary1, summary2 });
    } catch {
      setMsg('보고서 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!data) return;
    const w = window.open('', '_blank', 'width=860,height=1000');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>학교생활기록부</title><style>${PAPER_CSS} @page { size: A4; margin: 12mm; } body{margin:0}</style></head><body>${buildReportHtml(data)}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>생활기록부 보고서</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>학생을 선택해 학교생활기록부 양식의 보고서를 생성하고 인쇄(PDF 저장)할 수 있습니다.</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '20px' }}>보고서 대상</h2>
        <div style={{ marginBottom: '16px' }}>
          <StudentFilterSelect students={students} value={pick} onChange={setPick} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학년도</label>
            <select style={selectStyle} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[YEAR, YEAR - 1, YEAR - 2].map(y => <option key={y} value={y}>{y}학년도</option>)}
            </select>
          </div>
        </div>
        {msg && <div style={{ padding: '10px 14px', background: '#fdecea', color: '#c62828', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', borderLeft: '3px solid #e57373' }}>{msg}</div>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" onClick={handleGenerate} disabled={loading || !pick.studentId}>{loading ? '생성 중...' : '보고서 생성'}</Button>
          {data && <Button size="sm" variant="secondary" onClick={handlePrint}>인쇄 / PDF 저장</Button>}
        </div>
      </div>

      {data && (
        <div style={{ background: '#e8eaed', borderRadius: '10px', padding: '28px', overflow: 'auto' }}>
          <style>{PAPER_CSS}</style>
          <div style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
            dangerouslySetInnerHTML={{ __html: buildReportHtml(data) }} />
        </div>
      )}
    </div>
  );
}
