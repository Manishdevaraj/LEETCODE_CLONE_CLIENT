// @ts-nocheck
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
      {/* Logo / Brand */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
          LC
        </div>
        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          LeetCode Clone
        </span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {user && (
          <>
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
