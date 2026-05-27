import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { analyticsService } from '../services/analyticsService';
import { AnalyticsChatbot } from '../components/AnalyticsChatbot';
import { ScoreTrendLineChart } from '../components/charts/ScoreTrendLineChart';
import { CourseRadarChart } from '../components/charts/CourseRadarChart';
import { AttendanceDoughnut } from '../components/charts/AttendanceDoughnut';
import { ClassAverageBarChart } from '../components/charts/ClassAverageBarChart';
import { ScoreDistributionBar } from '../components/charts/ScoreDistributionBar';
import type {
  LearningSummary,
  StudentCourseTerm,
  ScoreTrendPoint,
  ClassCourseStats,
  ScoreDistribution,
  AtRiskStudent,
} from '../types/analytics';

const CURRENT_YEAR = 2026;
const CURRENT_SEMESTER = 1;

const EMPTY_MSG = '데이터가 없습니다. ETL 실행 후 확인하세요.';

const numberInputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '13px',
  width: '120px',
  fontFamily: "'Noto Sans KR', sans-serif",
  outline: 'none',
};

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
  const [classGroupId, setClassGroupId] = useState<number>(1);
  const [courseId, setCourseId] = useState<number>(1);
  const [stats, setStats] = useState<ClassCourseStats[]>([]);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [distribution, setDistribution] = useState<ScoreDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [etlMsg, setEtlMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, r, d] = await Promise.all([
        analyticsService.getClassCourses(classGroupId, CURRENT_YEAR, CURRENT_SEMESTER).catch(() => []),
        analyticsService.getClassAtRisk(classGroupId, CURRENT_YEAR, CURRENT_SEMESTER).catch(() => []),
        analyticsService.getCourseDistribution(courseId, CURRENT_YEAR, CURRENT_SEMESTER).catch(() => []),
      ]);
      setStats(Array.isArray(c) ? c : []);
      setAtRisk(Array.isArray(r) ? r : []);
      setDistribution(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  }, [classGroupId, courseId]);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
              반(classGroupId)
            </label>
            <input
              type="number"
              value={classGroupId}
              min={1}
              onChange={(e) => setClassGroupId(Number(e.target.value))}
              style={numberInputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
              과목(courseId)
            </label>
            <input
              type="number"
              value={courseId}
              min={1}
              onChange={(e) => setCourseId(Number(e.target.value))}
              style={numberInputStyle}
            />
          </div>
          <Button variant="secondary" onClick={load}>
            조회
          </Button>
          {isAdmin && (
            <Button variant="primary" onClick={handleEtl}>
              분석 데이터 갱신(ETL 실행)
            </Button>
          )}
          {/* TODO: replace numeric inputs with real class/course selectors once
              the current teacher's classGroupId is exposed via auth. */}
        </div>
        {etlMsg && <p style={{ fontSize: '13px', color: '#1e5a99', marginTop: '12px' }}>{etlMsg}</p>}
      </Card>

      {loading && <p style={{ fontSize: '13px', color: '#94a3b8' }}>불러오는 중...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card title="과목별 반 평균">
          {stats.length > 0 ? <ClassAverageBarChart stats={stats} /> : <EmptyState />}
        </Card>
        <Card title="점수 분포">
          {distribution.length > 0 ? <ScoreDistributionBar distribution={distribution} /> : <EmptyState />}
        </Card>
      </div>

      <Card title="관심 필요 학생">
        {atRisk.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['학생', '평균', '출석률', '상태'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#64748b',
                      fontSize: '12px',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atRisk.map((s) => (
                <tr key={s.studentKey} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '11px 16px', fontWeight: 500, color: '#1e293b' }}>
                    {s.studentName ?? `학생 ${s.studentKey}`}
                  </td>
                  <td style={{ padding: '11px 16px', color: '#374151' }}>
                    {s.overallAvgScore != null ? s.overallAvgScore.toFixed(1) : '-'}
                  </td>
                  <td style={{ padding: '11px 16px', color: '#374151' }}>
                    {s.attendanceRate != null ? `${s.attendanceRate.toFixed(1)}%` : '-'}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#fdecea',
                        color: '#c62828',
                      }}
                    >
                      관심 필요
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState />
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
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500, letterSpacing: '0.02em' }}>
          ANALYTICS
        </p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332', letterSpacing: '-0.02em' }}>학습 분석</h1>
      </div>

      {isStudentView ? (
        <StudentAnalyticsView studentId={user.id} />
      ) : (
        <ClassAnalyticsView isAdmin={user.role === 'ADMIN'} />
      )}
    </div>
  );
}
