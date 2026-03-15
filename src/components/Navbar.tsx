import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS: { code: string; label: string; route: string }[] = [
  { code: 'dashboard', label: 'Dashboard', route: '/dashboard' },
  { code: 'questions', label: 'Questions', route: '/questions' },
  { code: 'user_management', label: 'Users', route: '/admin/users' },
  { code: 'role_management', label: 'Roles', route: '/admin/roles' },
  { code: 'college_management', label: 'Colleges', route: '/admin/colleges' },
  { code: 'batch_management', label: 'Batches', route: '/admin/batches' },
  { code: 'bulk_upload', label: 'Bulk Upload', route: '/admin/bulk-upload' },
  { code: 'test_management', label: 'Tests', route: '/admin/tests' },
  { code: 'mcq_bank', label: 'MCQ Bank', route: '/admin/mcq-bank' },
  { code: 'course_management', label: 'Courses', route: '/admin/courses' },
  { code: 'reports', label: 'Reports', route: '/admin/reports' },
  { code: 'proctor_review', label: 'Proctoring', route: '/admin/proctor' },
  { code: 'student_tests', label: 'My Tests', route: '/student/tests' },
  { code: 'student_courses', label: 'My Courses', route: '/student/courses' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => user?.pageAccess?.includes(item.code)
  );

  return (
    <nav className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
            SW
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            SkillWave
          </span>
        </Link>

        {/* Dynamic nav links */}
        {user && visibleItems.length > 0 && (
          <div className="flex items-center gap-1">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.route;
              return (
                <Link
                  key={item.code}
                  to={item.route}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {user && (
          <>
            {user.role && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {user.role.name}
              </span>
            )}
            <span className="text-sm text-zinc-400">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-zinc-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
            >
              Log out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
