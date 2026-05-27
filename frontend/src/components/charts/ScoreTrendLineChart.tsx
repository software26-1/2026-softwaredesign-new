import { Line } from 'react-chartjs-2';
import './registerChart';
import type { ScoreTrendPoint } from '../../types/analytics';

interface Props {
  points: ScoreTrendPoint[];
}

export function ScoreTrendLineChart({ points }: Props) {
  const labels = points.map((p) => `${p.year}-${p.semester}학기`);
  const data = {
    labels,
    datasets: [
      {
        label: '학기별 평균 점수',
        data: points.map((p) => p.avgScore ?? null),
        borderColor: '#1e5a99',
        backgroundColor: 'rgba(30,90,153,0.15)',
        fill: true,
        tension: 0.3,
        spanGaps: true,
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
    <div style={{ height: '280px' }}>
      <Line data={data} options={options} />
    </div>
  );
}
