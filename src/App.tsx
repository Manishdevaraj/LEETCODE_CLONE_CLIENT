// @ts-nocheck
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import QuestionsPage from "./pages/QuestionsPage";
import Playground from "./pages/Playground";
import LoginPage from "./pages/LoginPage";
import RoleManagementPage from "./pages/admin/RoleManagementPage";
import CollegeManagementPage from "./pages/admin/CollegeManagementPage";
import BatchManagementPage from "./pages/admin/BatchManagementPage";
import BulkUploadPage from "./pages/admin/BulkUploadPage";
import McqBankPage from "./pages/admin/McqBankPage";
import TestManagementPage from "./pages/admin/TestManagementPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import StaffManagementPage from "./pages/admin/StaffManagementPage";
import StudentManagementPage from "./pages/admin/StudentManagementPage";
import QuestionBankPage from "./pages/admin/QuestionBankPage";
import ReportsPage from "./pages/admin/ReportsPage";
import CourseManagementPage from "./pages/admin/CourseManagementPage";
import StudentCoursesPage from "./pages/student/StudentCoursesPage";
import StudentCourseDetailPage from "./pages/student/StudentCourseDetailPage";
import ProctorReviewPage from "./pages/admin/ProctorReviewPage";
import StudentTestsPage from "./pages/student/StudentTestsPage";
import TestLobbyPage from "./pages/student/TestLobbyPage";
import TestExamPage from "./pages/student/TestExamPage";
import TestResultPage from "./pages/student/TestResultPage";

function HomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const roleName = user.role?.name?.toUpperCase();
  if (roleName === 'STUDENT') {
    return <Navigate to="/questions" replace />;
  }
  // MASTER, ADMIN, TEACHER -> dashboard
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Home redirect based on role */}
          <Route path="/" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />

          {/* Existing routes */}
          <Route path="/questions" element={<ProtectedRoute><QuestionsPage /></ProtectedRoute>} />
          <Route path="/playground/:questionId" element={<ProtectedRoute><Playground /></ProtectedRoute>} />

          {/* Dashboard */}
          <Route path="/dashboard" element={
            <RoleBasedRoute pageAccess="dashboard"><AdminDashboardPage /></RoleBasedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/roles" element={
            <RoleBasedRoute pageAccess="role_management"><RoleManagementPage /></RoleBasedRoute>
          } />
          <Route path="/admin/users" element={
            <RoleBasedRoute pageAccess="user_management"><UserManagementPage /></RoleBasedRoute>
          } />
          <Route path="/admin/staff" element={
            <RoleBasedRoute pageAccess="staff_management"><StaffManagementPage /></RoleBasedRoute>
          } />
          <Route path="/admin/students" element={
            <RoleBasedRoute pageAccess="student_management"><StudentManagementPage /></RoleBasedRoute>
          } />
          <Route path="/admin/question-bank" element={
            <RoleBasedRoute pageAccess="question_bank"><QuestionBankPage /></RoleBasedRoute>
          } />
          <Route path="/admin/colleges" element={
            <RoleBasedRoute pageAccess="college_management"><CollegeManagementPage /></RoleBasedRoute>
          } />
          <Route path="/admin/batches" element={
            <RoleBasedRoute pageAccess="batch_management"><BatchManagementPage /></RoleBasedRoute>
          } />
          <Route path="/admin/bulk-upload" element={
            <RoleBasedRoute pageAccess="bulk_upload"><BulkUploadPage /></RoleBasedRoute>
          } />
          <Route path="/admin/tests" element={
            <RoleBasedRoute pageAccess="test_management"><TestManagementPage /></RoleBasedRoute>
          } />
          <Route path="/admin/mcq-bank" element={
            <RoleBasedRoute pageAccess="mcq_bank"><McqBankPage /></RoleBasedRoute>
          } />
          <Route path="/admin/courses" element={
            <RoleBasedRoute pageAccess="course_management"><CourseManagementPage /></RoleBasedRoute>
          } />
          <Route path="/admin/reports" element={
            <RoleBasedRoute pageAccess="reports"><ReportsPage /></RoleBasedRoute>
          } />
          <Route path="/admin/proctor" element={
            <RoleBasedRoute pageAccess="proctor_review"><ProctorReviewPage /></RoleBasedRoute>
          } />

          {/* Student routes */}
          <Route path="/student/tests" element={
            <RoleBasedRoute pageAccess="student_tests"><StudentTestsPage /></RoleBasedRoute>
          } />
          <Route path="/student/tests/join/:secureToken" element={
            <ProtectedRoute><TestLobbyPage /></ProtectedRoute>
          } />
          <Route path="/student/tests/:testId/exam" element={
            <ProtectedRoute><TestExamPage /></ProtectedRoute>
          } />
          <Route path="/student/tests/:testId/result" element={
            <ProtectedRoute><TestResultPage /></ProtectedRoute>
          } />
          <Route path="/student/courses" element={
            <RoleBasedRoute pageAccess="student_courses"><StudentCoursesPage /></RoleBasedRoute>
          } />
          <Route path="/student/courses/:courseId" element={
            <ProtectedRoute><StudentCourseDetailPage /></ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
