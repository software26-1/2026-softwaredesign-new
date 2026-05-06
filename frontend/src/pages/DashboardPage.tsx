import { useAuth } from '../hooks/useAuth';
import { TeacherDashboard } from './dashboard/TeacherDashboard';
import { StudentDashboard } from './dashboard/StudentDashboard';
import { ParentDashboard } from './dashboard/ParentDashboard';
import { AdminDashboard } from './dashboard/AdminDashboard';

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'TEACHER': return <TeacherDashboard user={user} />;
    case 'STUDENT': return <StudentDashboard user={user} />;
    case 'PARENT': return <ParentDashboard user={user} />;
    case 'ADMIN': return <AdminDashboard user={user} />;
    default: return <TeacherDashboard user={user} />;
  }
}
