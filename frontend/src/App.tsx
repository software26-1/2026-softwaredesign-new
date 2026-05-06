import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentSearchPage } from './pages/StudentSearchPage';
import { GradeManagementPage } from './pages/GradeManagementPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { CounselingPage } from './pages/CounselingPage';
import { StudentRecordPage } from './pages/StudentRecordPage';
import { ReportPage } from './pages/ReportPage';
import { AttendancePage } from './pages/AttendancePage';
import { NotificationPage } from './pages/NotificationPage';
import { MyGradesPage } from './pages/student/MyGradesPage';
import { MyFeedbackPage } from './pages/student/MyFeedbackPage';
import { MyRecordsPage } from './pages/student/MyRecordsPage';
import { MyAttendancePage } from './pages/student/MyAttendancePage';
import { ChildGradesPage } from './pages/parent/ChildGradesPage';
import { ChildFeedbackPage } from './pages/parent/ChildFeedbackPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { SchoolManagementPage } from './pages/admin/SchoolManagementPage';
import { MyPage } from './pages/MyPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          {/* 교사 */}
          <Route path="/students/search" element={<StudentSearchPage />} />
          <Route path="/grades" element={<GradeManagementPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/counseling" element={<CounselingPage />} />
          <Route path="/student-records" element={<StudentRecordPage />} />
          <Route path="/reports" element={<ReportPage />} />
          {/* 학생 */}
          <Route path="/my-grades" element={<MyGradesPage />} />
          <Route path="/my-attendance" element={<MyAttendancePage />} />
          <Route path="/my-feedback" element={<MyFeedbackPage />} />
          <Route path="/my-records" element={<MyRecordsPage />} />
          {/* 학부모 */}
          <Route path="/child-grades" element={<ChildGradesPage />} />
          <Route path="/child-feedback" element={<ChildFeedbackPage />} />
          {/* 관리자 */}
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/schools" element={<SchoolManagementPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
