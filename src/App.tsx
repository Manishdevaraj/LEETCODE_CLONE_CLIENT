// @ts-nocheck
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import QuestionsPage from "./pages/QuestionsPage";
import Playground from "./pages/Playground";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RoleManagementPage from "./pages/admin/RoleManagementPage";
import ComingSoon from "./pages/ComingSoon";

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
          <Route path="/signup" element={<SignupPage />} />

          {/* Home redirect based on role */}
          <Route path="/" element={<ProtectedRoute><HomeRedirect /></ProtectedRoute>} />

          {/* Existing routes */}
          <Route path="/questions" element={<ProtectedRoute><QuestionsPage /></ProtectedRoute>} />
          <Route path="/playground/:questionId" element={<ProtectedRoute><Playground /></ProtectedRoute>} />

          {/* Dashboard */}
          <Route path="/dashboard" element={
            <RoleBasedRoute pageAccess="dashboard"><ComingSoon title="Dashboard" /></RoleBasedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin/roles" element={
            <RoleBasedRoute pageAccess="role_management"><RoleManagementPage /></RoleBasedRoute>
          } />
          <Route path="/admin/users" element={
            <RoleBasedRoute pageAccess="user_management"><ComingSoon title="User Management" /></RoleBasedRoute>
          } />
          <Route path="/admin/colleges" element={
            <RoleBasedRoute pageAccess="college_management"><ComingSoon title="College Management" /></RoleBasedRoute>
          } />
          <Route path="/admin/batches" element={
            <RoleBasedRoute pageAccess="batch_management"><ComingSoon title="Batch Management" /></RoleBasedRoute>
          } />
          <Route path="/admin/bulk-upload" element={
            <RoleBasedRoute pageAccess="bulk_upload"><ComingSoon title="Bulk Upload" /></RoleBasedRoute>
          } />
          <Route path="/admin/tests" element={
            <RoleBasedRoute pageAccess="test_management"><ComingSoon title="Test Management" /></RoleBasedRoute>
          } />
          <Route path="/admin/mcq-bank" element={
            <RoleBasedRoute pageAccess="mcq_bank"><ComingSoon title="MCQ Bank" /></RoleBasedRoute>
          } />
          <Route path="/admin/courses" element={
            <RoleBasedRoute pageAccess="course_management"><ComingSoon title="Course Management" /></RoleBasedRoute>
          } />
          <Route path="/admin/reports" element={
            <RoleBasedRoute pageAccess="reports"><ComingSoon title="Reports" /></RoleBasedRoute>
          } />
          <Route path="/admin/proctor" element={
            <RoleBasedRoute pageAccess="proctor_review"><ComingSoon title="Proctoring" /></RoleBasedRoute>
          } />

          {/* Student routes */}
          <Route path="/student/tests" element={
            <RoleBasedRoute pageAccess="student_tests"><ComingSoon title="My Tests" /></RoleBasedRoute>
          } />
          <Route path="/student/courses" element={
            <RoleBasedRoute pageAccess="student_courses"><ComingSoon title="My Courses" /></RoleBasedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
