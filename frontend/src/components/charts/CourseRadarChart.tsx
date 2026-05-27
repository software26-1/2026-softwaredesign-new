import { Radar } from 'react-chartjs-2';
import './registerChart';
import type { StudentCourseTerm } from '../../types/analytics';

interface Props {
  courses: StudentCourseTerm[];
}

// 전 과목 성적 레이더 차트 — per-course avgScore vs classAvgScore.
export function CourseRadarChart({ courses }: Props) {
  const labels = courses.map((c) => c.courseName ?? `과목 ${c.courseKey}`);
  const data = {
    labels,
    datasets: [
      {
        label: '내 평균',
        data: courses.map((c) => c.avgScore ?? 0),
        borderColor: '#1e5a99',
        backgroundColor: 'rgba(30,90,153,0.25)',
        pointBackgroundColor: '#1e5a99',
      },
      {
        label: '반 평균',
        data: courses.map((c) => c.classAvgScore ?? 0),
        borderColor: '#f39c12',
        backgroundColor: 'rgba(243,156,18,0.18)',
        pointBackgroundColor: '#f39c12',
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { r: { beginAtZero: true, suggestedMax: 100 } },
  };
  return (
    <div style={{ height: '320px' }}>
      <Radar data={data} options={options} />
    </div>
  );
}
