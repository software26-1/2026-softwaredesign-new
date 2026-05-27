// Registers Chart.js controllers/elements once for the whole app.
// Import this module from any chart wrapper before rendering.
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

let registered = false;

export function ensureChartRegistered(): void {
  if (registered) return;
  ChartJS.register(
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
  );
  registered = true;
}

ensureChartRegistered();
