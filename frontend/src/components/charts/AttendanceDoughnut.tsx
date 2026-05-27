import { Doughnut } from 'react-chartjs-2';
import './registerChart';

interface Props {
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  earlyLeaveCount?: number;
}

export function AttendanceDoughnut({
  presentCount,
  absentCount = 0,
  lateCount = 0,
  earlyLeaveCount = 0,
}: Props) {
  // If presentCount is not provided, derive a baseline so the chart still renders.
  const present = presentCount ?? Math.max(0, 100 - absentCount - lateCount - earlyLeaveCount);
  const data = {
    labels: ['출석', '결석', '지각', '조퇴'],
    datasets: [
      {
        data: [present, absentCount, lateCount, earlyLeaveCount],
        backgroundColor: ['#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'],
        borderWidth: 0,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
  };
  return (
    <div style={{ height: '280px' }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
