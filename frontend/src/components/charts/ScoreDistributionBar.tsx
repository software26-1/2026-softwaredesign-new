import { Bar } from 'react-chartjs-2';
import './registerChart';
import type { ScoreDistribution } from '../../types/analytics';

interface Props {
  distribution: ScoreDistribution[];
}

export function ScoreDistributionBar({ distribution }: Props) {
  const data = {
    labels: distribution.map((d) => d.bucket),
    datasets: [
      {
        label: '학생 수',
        data: distribution.map((d) => d.count),
        backgroundColor: '#2471b8',
        borderRadius: 4,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };
  return (
    <div style={{ height: '300px' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
