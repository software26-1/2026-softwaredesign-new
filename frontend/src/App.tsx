import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import type { UserRole } from './types/user';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentSearchPage } from './pages/StudentSearchPage';
import { GradeManagementPage } from './pages/GradeManagementPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { CounselingPage } from './pages/CounselingPage';
import { StudentRecordPage } from './pages/StudentRecordPage';
import { ReportPage } from './pages/ReportPage';
import { AttendancePage } from './pages/AttendancePage';
import { NotificationPage } from './pages/NotificationPage';
import { AnalyticsDashboardPage } from './pages/AnalyticsDashboardPage';
import { MyGradesPage } from './pages/student/MyGradesPage';
import { MyFeedbackPage } from './pages/student/MyFeedbackPage';
import { MyRecordsPage } from './pages/student/MyRecordsPage';
import { MyAttendancePage } from './pages/student/MyAttendancePage';
import { ChildGradesPage } from './pages/parent/ChildGradesPage';
import { ChildFeedbackPage } from './pages/parent/ChildFeedbackPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { SchoolManagementPage } from './pages/admin/SchoolManagementPage';
import { ApprovalPage } from './pages/admin/ApprovalPage';
import { CourseManagementPage } from './pages/admin/CourseManagementPage';
import { MyPage } from './pages/MyPage';
import { ClassManagementPage } from './pages/ClassManagementPage';
import { WaitingApprovalPage } from './pages/WaitingApprovalPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

function RoleGuard({ roles, children, requireHomeroom }: { roles: UserRole[]; children: React.ReactNode; requireHomeroom?: boolean }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || !roles.includes(user.role as UserRole)) return <Navigate to="/dashboard" replace />;
  if (requireHomeroom && user.role === 'TEACHER' && (!(user as any).classGroupId || !(user as any).position?.startsWith('HOMEROOM'))) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/waiting-approval" element={<WaitingApprovalPage />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analytics" element={<RoleGuard roles={['TEACHER', 'ADMIN']} requireHomeroom><AnalyticsDashboardPage /></RoleGuard>} />
          <Route path="/notifications" element={<NotificationPage />} />
          {/* 교사 전용 */}
          <Route path="/class-management" element={<RoleGuard roles={['TEACHER']} requireHomeroom><ClassManagementPage /></RoleGuard>} />
          <Route path="/students/search" element={<RoleGuard roles={['TEACHER']}><StudentSearchPage /></RoleGuard>} />
          <Route path="/grades" element={<RoleGuard roles={['TEACHER']}><GradeManagementPage /></RoleGuard>} />
          <Route path="/attendance" element={<RoleGuard roles={['TEACHER']}><AttendancePage /></RoleGuard>} />
          <Route path="/feedback" element={<RoleGuard roles={['TEACHER']}><FeedbackPage /></RoleGuard>} />
          <Route path="/counseling" element={<RoleGuard roles={['TEACHER']}><CounselingPage /></RoleGuard>} />
          <Route path="/student-records" element={<RoleGuard roles={['TEACHER']}><StudentRecordPage /></RoleGuard>} />
          <Route path="/reports" element={<RoleGuard roles={['TEACHER']}><ReportPage /></RoleGuard>} />
          {/* 학생 전용 */}
          <Route path="/my-grades" element={<RoleGuard roles={['STUDENT']}><MyGradesPage /></RoleGuard>} />
          <Route path="/my-attendance" element={<RoleGuard roles={['STUDENT']}><MyAttendancePage /></RoleGuard>} />
          <Route path="/my-feedback" element={<RoleGuard roles={['STUDENT']}><MyFeedbackPage /></RoleGuard>} />
          <Route path="/my-records" element={<RoleGuard roles={['STUDENT']}><MyRecordsPage /></RoleGuard>} />
          {/* 학부모 전용 */}
          <Route path="/child-grades" element={<RoleGuard roles={['PARENT']}><ChildGradesPage /></RoleGuard>} />
          <Route path="/child-feedback" element={<RoleGuard roles={['PARENT']}><ChildFeedbackPage /></RoleGuard>} />
          {/* 관리자 전용 */}
          <Route path="/admin/users" element={<RoleGuard roles={['ADMIN']}><UserManagementPage /></RoleGuard>} />
          <Route path="/admin/schools" element={<RoleGuard roles={['ADMIN']}><SchoolManagementPage /></RoleGuard>} />
          <Route path="/admin/courses" element={<RoleGuard roles={['ADMIN']}><CourseManagementPage /></RoleGuard>} />
          <Route path="/admin/approvals" element={<RoleGuard roles={['ADMIN']}><ApprovalPage /></RoleGuard>} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
