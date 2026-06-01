import { Bar } from 'react-chartjs-2';
import './registerChart';
import type { ClassCourseStats } from '../../types/analytics';

interface Props {
  stats: ClassCourseStats[];
  courseMap?: Record<number, string>;
}

export function ClassAverageBarChart({ stats, courseMap }: Props) {
  const labels = stats.map((s) => courseMap?.[s.courseKey] ?? s.courseName ?? `과목 ${s.courseKey}`);
  const data = {
    labels,
    datasets: [
      {
        label: '반 평균 점수',
        data: stats.map((s) => s.avgScore ?? 0),
        backgroundColor: '#1e5a99',
        borderRadius: 4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: true, max: 100 } },
  };
  return (
    <div style={{ height: '300px' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
