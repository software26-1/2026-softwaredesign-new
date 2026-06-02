import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { analyticsService } from '../services/analyticsService';
import client from '../api/client';
import { AnalyticsChatbot } from '../components/AnalyticsChatbot';
import { ScoreTrendLineChart } from '../components/charts/ScoreTrendLineChart';
import { CourseRadarChart } from '../components/charts/CourseRadarChart';
import { AttendanceDoughnut } from '../components/charts/AttendanceDoughnut';
import { ClassAverageBarChart } from '../components/charts/ClassAverageBarChart';
import { ScoreDistributionBar } from '../components/charts/ScoreDistributionBar';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import type {
  LearningSummary,
  StudentCourseTerm,
  ScoreTrendPoint,
  ClassCourseStats,
  ScoreDistribution,
} from '../types/analytics';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_SEMESTER = new Date().getMonth() < 7 ? 1 : 2;

const EMPTY_MSG = '데이터가 없습니다. ETL 실행 후 확인하세요.';


function EmptyState() {
  return <p style={{ fontSize: '13px', color: '#94a3b8', padding: '12px 0' }}>{EMPTY_MSG}</p>;
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '10px',
        padding: '18px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        borderTop: `3px solid ${color}`,
      }}
    >
      <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.02em' }}>
        {label}
      </p>
      <p style={{ fontSize: '24px', fontWeight: 700, color: '#1a2332', marginBottom: sub ? '4px' : 0 }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: '#94a3b8' }}>{sub}</p>}
    </div>
  );
}

function StudentAnalyticsView({ studentId }: { studentId: number }) {
  const [summary, setSummary] = useState<LearningSummary | null>(null);
  const [courses, setCourses] = useState<StudentCourseTerm[]>([]);
  const [trend, setTrend] = useState<ScoreTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s, c, t] = await Promise.all([
        analyticsService.getStudentSummary(studentId, CURRENT_YEAR, CURRENT_SEMESTER).catch(() => null),
        analyticsService.getStudentCourses(studentId, CURRENT_YEAR, CURRENT_SEMESTER).catch(() => []),
        analyticsService.getStudentTrend(studentId).catch(() => []),
      ]);
      setSummary(s);
      setCourses(Array.isArray(c) ? c : []);
      setTrend(Array.isArray(t) ? t : []);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p style={{ fontSize: '13px', color: '#94a3b8' }}>불러오는 중...</p>;
  if (error) return <p style={{ fontSize: '13px', color: '#e74c3c' }}>{error}</p>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard
          label="전체 평균"
          value={summary?.overallAvgScore != null ? `${summary.overallAvgScore.toFixed(1)}점` : '-'}
          color="#1e5a99"
        />
        <KpiCard
          label="반 석차"
          value={summary?.overallClassRank != null ? `${summary.overallClassRank}위` : '-'}
          color="#2471b8"
        />
        <KpiCard
          label="출석률"
          value={summary?.attendanceRate != null ? `${(summary.attendanceRate).toFixed(1)}%` : '-'}
          sub={
            summary
              ? `결석 ${summary.absentCount ?? 0} · 지각 ${summary.lateCount ?? 0} · 조퇴 ${summary.earlyLeaveCount ?? 0}`
              : undefined
          }
          color="#2ecc71"
        />
        <KpiCard
          label="위험 여부"
          value={summary?.riskFlag ? '관심 필요' : '양호'}
          color={summary?.riskFlag ? '#e74c3c' : '#2ecc71'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card title="학기별 성적 추이">
          {trend.length > 0 ? <ScoreTrendLineChart points={trend} /> : <EmptyState />}
        </Card>
        <Card title="전 과목 성적 레이더">
          {courses.length > 0 ? <CourseRadarChart courses={courses} /> : <EmptyState />}
        </Card>
        <Card title="출결 현황">
          {summary ? (
            <AttendanceDoughnut
              absentCount={summary.absentCount}
              lateCount={summary.lateCount}
              earlyLeaveCount={summary.earlyLeaveCount}
            />
          ) : (
            <EmptyState />
          )}
        </Card>
        <Card title="AI 학습 상담">
          <AnalyticsChatbot studentId={studentId} />
        </Card>
      </div>
    </div>
  );
}

function ClassAnalyticsView({ isAdmin }: { isAdmin: boolean }) {
  const [classGroupId, setClassGroupId] = useState<number>(0);
  const [classGroupName, setClassGroupName] = useState<string>('');
  const [courseId, setCourseId] = useState<number>(0);
  const [courses, setCourses] = useState<{ id: number; name: string }[]>([]);
  const [stats, setStats] = useState<ClassCourseStats[]>([]);
  const [distribution, setDistribution] = useState<ScoreDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [etlMsg, setEtlMsg] = useState('');
  const [students, setStudents] = useState<{ id: number; name: string; studentNumber: number }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [studentYear, setStudentYear] = useState<number>(CURRENT_YEAR);
  const [studentSemester, setStudentSemester] = useState<number>(CURRENT_SEMESTER);
  const [studentCourses, setStudentCourses] = useState<StudentCourseTerm[]>([]);
  const [allStudentCourses, setAllStudentCourses] = useState<StudentCourseTerm[]>([]);
  const [studentSummary, setStudentSummary] = useState<LearningSummary | null>(null);

  useEffect(() => {
    const init = async () => {
      const [profileRes, courseRes] = await Promise.all([
        client.get<any>('/users/me').catch(() => null),
        client.get<any>(`/courses/for-class?academic_year=${CURRENT_YEAR}&semester=${CURRENT_SEMESTER}`).catch(() => null),
      ]);
      const profile = profileRes?.data?.data ?? profileRes?.data ?? null;
      if (profile?.classGroupId) {
        setClassGroupId(profile.classGroupId);
        setClassGroupName(profile.classGroupName ?? '');
        client.get<any[]>(`/students?class_group_id=${profile.classGroupId}`)
          .then(r => {
            const list: any[] = Array.isArray(r.data) ? r.data : [];
            setStudents(list.sort((a, b) => a.studentNumber - b.studentNumber).map((s: any) => ({ id: s.id, name: s.name, studentNumber: s.studentNumber })));
          }).catch(() => {});
      }
      const courseList: any[] = Array.isArray(courseRes?.data) ? courseRes.data : (courseRes?.data?.data ?? []);
      const mapped = courseList.map((c: any) => ({
        id: c.id,
        name: c.courseName,
      }));
      setCourses(mapped);
      if (mapped.length > 0) setCourseId(mapped[0].id);
    };
    init();
  }, []);

  const load = useCallback(async () => {
    if (!classGroupId) return;
    setLoading(true);
    try {
      const [c, d] = await Promise.all([
        analyticsService.getClassCourses(classGroupId, CURRENT_YEAR, CURRENT_SEMESTER).catch(() => []),
        courseId ? analyticsService.getCourseDistribution(courseId, CURRENT_YEAR, CURRENT_SEMESTER).catch(() => []) : Promise.resolve([]),
      ]);
      setStats(Array.isArray(c) ? c : []);
      setDistribution(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  }, [classGroupId, courseId]);

  useEffect(() => {
    if (classGroupId) load();
  }, [load, classGroupId]);

  useEffect(() => {
    if (!selectedStudentId) { setStudentCourses([]); setAllStudentCourses([]); setStudentSummary(null); return; }
    Promise.all([
      analyticsService.getStudentCourses(selectedStudentId, studentYear, studentSemester).catch(() => []),
      analyticsService.getStudentSummary(selectedStudentId, studentYear, studentSemester).catch(() => null),
      analyticsService.getAllStudentCourses(selectedStudentId).catch(() => []),
    ]).then(([c, s, all]) => { setStudentCourses(c); setStudentSummary(s); setAllStudentCourses(all); });
  }, [selectedStudentId, studentYear, studentSemester]);

  const handleEtl = async () => {
    setEtlMsg('실행 중...');
    try {
      await analyticsService.runEtl();
      setEtlMsg('분석 데이터 갱신을 완료했습니다.');
      await load();
    } catch {
      setEtlMsg('ETL 실행에 실패했습니다.');
    }
  };

  // 우리 반이 실제로 수강하는(수강 인원 있는) 과목만 사용 → 빈 막대/분반 중복 제거
  const validStats = useMemo(() => {
    const filtered = stats.filter(s => (s.studentCount ?? 0) > 0);
    return filtered.length > 0 ? filtered : stats;
  }, [stats]);

  // 과목 드롭다운: 우리 반 수강 과목만, 같은 이름 분반은 한 번만
  const courseOptions = useMemo(() => {
    if (validStats.length === 0) return courses;
    const keys = new Set(validStats.map(s => s.courseKey));
    const seen = new Set<string>();
    return courses.filter(c => {
      if (!keys.has(c.id) || seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
  }, [validStats, courses]);

  // 현재 선택된 과목이 옵션에 없으면 첫 과목으로 보정
  useEffect(() => {
    if (courseOptions.length > 0 && !courseOptions.some(c => c.id === courseId)) {
      setCourseId(courseOptions[0].id);
    }
  }, [courseOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: "'Noto Sans KR', sans-serif",
    outline: 'none',
    background: '#fff',
    cursor: 'pointer',
  };

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
              담당 반
            </label>
            <div style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', background: '#f8fafc', color: '#1a2332', fontWeight: 600, minWidth: '120px' }}>
              {classGroupName || (classGroupId ? `반 ID: ${classGroupId}` : '불러오는 중...')}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
              과목
            </label>
            {courseOptions.length > 0 ? (
              <select
                value={courseId}
                onChange={(e) => setCourseId(Number(e.target.value))}
                style={selectStyle}
              >
                {courseOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <div style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#94a3b8' }}>
                개설 과목 없음
              </div>
            )}
          </div>
          <Button variant="secondary" onClick={load}>
            조회
          </Button>
          {isAdmin && (
            <Button variant="primary" onClick={handleEtl}>
              분석 데이터 갱신(ETL 실행)
            </Button>
          )}
        </div>
        {etlMsg && <p style={{ fontSize: '13px', color: '#1e5a99', marginTop: '12px' }}>{etlMsg}</p>}
      </Card>

      {loading && <p style={{ fontSize: '13px', color: '#94a3b8' }}>불러오는 중...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card title="과목별 반 평균">
          {validStats.length > 0 ? (
            <ClassAverageBarChart
              stats={validStats}
              courseMap={Object.fromEntries(courses.map((c) => [c.id, c.name]))}
            />
          ) : <EmptyState />}
        </Card>
        <Card title="점수 분포">
          {distribution.length > 0 ? <ScoreDistributionBar distribution={distribution} /> : <EmptyState />}
        </Card>
      </div>

      <Card title="학생 개인 분석">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <select value={selectedStudentId} onChange={e => setSelectedStudentId(Number(e.target.value))}
            style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', cursor: 'pointer', minWidth: '140px' }}>
            <option value={0}>학생 선택</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.studentNumber}. {s.name}</option>)}
          </select>
          {(() => {
            const currentGrade = parseInt(classGroupName) || 1;
            return (
              <>
                <select value={studentYear} onChange={e => setStudentYear(Number(e.target.value))}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  {[1, 2, 3].filter(g => g <= currentGrade).map(g => {
                    const yr = CURRENT_YEAR - (currentGrade - g);
                    return <option key={g} value={yr}>{g}학년 ({yr})</option>;
                  })}
                </select>
                <select value={studentSemester} onChange={e => setStudentSemester(Number(e.target.value))}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', cursor: 'pointer' }}>
                  <option value={1}>1학기</option>
                  <option value={2}>2학기</option>
                </select>
              </>
            );
          })()}
        </div>
        {selectedStudentId > 0 && studentCourses.length > 0 ? (() => {
          const stu = students.find(s => s.id === selectedStudentId);
          const sorted = [...studentCourses].sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));
          const best = sorted[0];
          const worst = sorted[sorted.length - 1];
          const avg = studentSummary?.overallAvgScore ?? (studentCourses.reduce((s, c) => s + (c.avgScore ?? 0), 0) / studentCourses.length);
          const classAvg = stats.reduce((s, c) => s + Number(c.avgScore ?? 0), 0) / (stats.length || 1);
          const diff = avg - classAvg;
          const getName = (key: number) => courses.find(c => c.id === key)?.name ?? `과목 ${key}`;
          const allRelGrades = allStudentCourses.filter(c => c.gradeLevel && /^[1-9]$/.test(c.gradeLevel));
          const avgGrade = allRelGrades.length > 0 ? allRelGrades.reduce((s, c) => s + Number(c.gradeLevel), 0) / allRelGrades.length : null;
          const relGrades = studentCourses.filter(c => c.gradeLevel && /^[1-9]$/.test(c.gradeLevel));
          const radarData = {
            labels: studentCourses.map(c => getName(c.courseKey)),
            datasets: [{
              label: stu?.name ?? '',
              data: studentCourses.map(c => c.avgScore ?? 0),
              backgroundColor: 'rgba(30,90,153,0.15)',
              borderColor: '#1e5a99',
              borderWidth: 2,
              pointBackgroundColor: '#1e5a99',
            }],
          };
          return (
            <div>
              {/* 학생 기본 정보 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e5a99', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                  {stu?.name?.[0]}
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a2332' }}>{stu?.name}</p>
                  {(() => {
                    const currentGrade = parseInt(classGroupName) || 1;
                    const g = currentGrade - (CURRENT_YEAR - studentYear);
                    return <p style={{ fontSize: '12px', color: '#94a3b8' }}>{classGroupName} · {stu?.studentNumber}번 · {g}학년 {studentSemester}학기</p>;
                  })()}
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right', display: 'flex', gap: '20px', alignItems: 'center' }}>
                  {avgGrade != null && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>평균 등급</p>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: '#1e5a99' }}>{avgGrade.toFixed(1)}등급</p>
                    </div>
                  )}
                  {studentSummary?.overallYearRank != null && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>학년 석차</p>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: '#1e5a99' }}>{studentSummary.overallYearRank}위</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'stretch' }}>
                {/* 레이더 차트 */}
                <div>
                  <Radar data={radarData} options={{ scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } }, plugins: { legend: { display: false } } }} />
                </div>

                {/* 분석 패널 */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {[
                    { label: '원점수 평균', value: `${avg.toFixed(1)}점`, color: '#1a2332', sub: '전 과목 평균' },
                    { label: '반 평균 대비', value: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}점`, color: '#1a2332', sub: `반 평균 ${classAvg.toFixed(1)}점` },
                    ...(studentSummary?.overallClassRank != null ? [{ label: '반 석차', value: `${studentSummary.overallClassRank}위`, color: '#1a2332', sub: '현재 학기 기준' }] : []),
                    ...(studentSummary?.overallYearRank != null ? [{ label: '학년 석차', value: `${studentSummary.overallYearRank}위`, color: '#1a2332', sub: '동 학년 전체 기준' }] : []),
                    ...(avgGrade != null ? [{ label: '평균 등급', value: `${avgGrade.toFixed(1)}등급`, color: '#1a2332', sub: `상대평가 ${relGrades.length}과목 기준` }] : []),
                    { label: '우수 과목', value: `${getName(best.courseKey)}`, color: '#1a2332', sub: `${best.avgScore?.toFixed(1)}점 · 반 평균 ${best.classAvgScore?.toFixed(1) ?? '-'}점` },
                    { label: '보완 권장 과목', value: `${getName(worst.courseKey)}`, color: '#1a2332', sub: `${worst.avgScore?.toFixed(1)}점 · 반 평균 ${worst.classAvgScore?.toFixed(1) ?? '-'}점` },
                    ...(studentSummary?.attendanceRate != null ? [{ label: '출석률', value: `${studentSummary.attendanceRate.toFixed(1)}%`, color: '#1a2332', sub: `결석 ${studentSummary.absentCount ?? 0}회 · 지각 ${studentSummary.lateCount ?? 0}회` }] : []),
                  ].map((item, i) => (
                    <div key={item.label} style={{ padding: '10px 14px', background: i % 2 === 0 ? '#ffffff' : '#f1f5f9', borderRadius: '8px' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '2px' }}>{item.label}</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: item.color }}>{item.value}</p>
                      {item.sub && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{item.sub}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* 과목별 상세 테이블 */}
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a2332', marginBottom: '10px' }}>과목별 성적 현황</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['과목', '원점수', '중간고사', '기말고사', '수행평가', '반 평균', '차이', '석차', '등급'].map(h => (
                        <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '11px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...studentCourses].sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0)).map(c => {
                      const d = (c.avgScore ?? 0) - (c.classAvgScore ?? 0);
                      const isLetter = c.gradeLevel && isNaN(Number(c.gradeLevel));
                      return (
                        <tr key={c.courseKey} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{getName(c.courseKey)}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1e5a99' }}>{c.avgScore?.toFixed(1) ?? '-'}</td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>{c.midtermScore?.toFixed(1) ?? '-'}</td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>{c.finalScore?.toFixed(1) ?? '-'}</td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>{c.taskScore?.toFixed(1) ?? '-'}</td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{c.classAvgScore?.toFixed(1) ?? '-'}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 600, color: d >= 0 ? '#2e7d32' : '#c62828' }}>{d !== 0 ? `${d >= 0 ? '+' : ''}${d.toFixed(1)}` : '—'}</td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{c.classRank != null ? `${c.classRank}위` : '—'}</td>
                          <td style={{ padding: '8px 10px' }}>
                            {c.gradeLevel ? (
                              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: isLetter ? '#e8f5e9' : '#ebf4ff', color: isLetter ? '#2e7d32' : '#1e5a99' }}>
                                {isLetter ? c.gradeLevel : `${c.gradeLevel}등급`}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })() : (
          <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>
            {selectedStudentId === 0 ? '학생을 선택하면 개인 분석이 표시됩니다.' : '분석 데이터가 없습니다.'}
          </p>
        )}
      </Card>
    </div>
  );
}

export function AnalyticsDashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  // STUDENT/PARENT: use the user's own id as the studentId fallback.
  // TODO: for PARENT, select among children once auth exposes that mapping.
  const isStudentView = user.role === 'STUDENT' || user.role === 'PARENT';

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332', letterSpacing: '-0.02em' }}>학급 분석</h1>
      </div>

      {isStudentView ? (
        <StudentAnalyticsView studentId={user.id} />
      ) : (
        <ClassAnalyticsView isAdmin={user.role === 'ADMIN'} />
      )}
    </div>
  );
}
