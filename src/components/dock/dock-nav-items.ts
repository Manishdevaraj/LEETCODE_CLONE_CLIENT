import {
  LayoutDashboard,
  Code2,
  Users,
  Shield,
  Building2,
  Layers,
  Upload,
  ClipboardList,
  CircleDot,
  BookOpen,
  BarChart3,
  Eye,
  UserCog,
  GraduationCap,
  Library,
  FileCheck,
  BookMarked,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  code: string;
  label: string;
  route: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { code: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
  { code: 'questions', label: 'Questions', route: '/questions', icon: Code2 },
  { code: 'user_management', label: 'Users', route: '/admin/users', icon: Users },
  { code: 'role_management', label: 'Roles', route: '/admin/roles', icon: Shield },
  { code: 'college_management', label: 'Colleges', route: '/admin/colleges', icon: Building2 },
  { code: 'batch_management', label: 'Batches', route: '/admin/batches', icon: Layers },
  { code: 'bulk_upload', label: 'Bulk Upload', route: '/admin/bulk-upload', icon: Upload },
  { code: 'test_management', label: 'Tests', route: '/admin/tests', icon: ClipboardList },
  { code: 'mcq_bank', label: 'MCQ Bank', route: '/admin/mcq-bank', icon: CircleDot },
  { code: 'course_management', label: 'Courses', route: '/admin/courses', icon: BookOpen },
  { code: 'reports', label: 'Reports', route: '/admin/reports', icon: BarChart3 },
  { code: 'proctor_review', label: 'Proctoring', route: '/admin/proctor', icon: Eye },
  { code: 'staff_management', label: 'Staff', route: '/admin/staff', icon: UserCog },
  { code: 'student_management', label: 'Students', route: '/admin/students', icon: GraduationCap },
  { code: 'question_bank', label: 'Question Bank', route: '/admin/question-bank', icon: Library },
  { code: 'student_tests', label: 'My Tests', route: '/student/tests', icon: FileCheck },
  { code: 'student_courses', label: 'My Courses', route: '/student/courses', icon: BookMarked },
];
