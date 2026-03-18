import { Link } from 'react-router-dom';
import { useMotionValue } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { NAV_ITEMS } from './dock-nav-items';
import DockItem from './DockItem';
import DockUserMenu from './DockUserMenu';

export default function DockBar() {
  const { user } = useAuth();
  const mouseX = useMotionValue(Infinity);

  const visibleItems = NAV_ITEMS.filter(
    (item) => user?.pageAccess?.includes(item.code)
  );

  return (
    <nav
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-end gap-1 px-3 pb-2 pt-2 rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl shadow-lg shadow-black/40"
    >
      {/* Logo */}
      <Link
        to="/"
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow shrink-0"
      >
        SW
      </Link>

      {/* Separator */}
      <div className="w-px h-8 bg-zinc-700/50 mx-1 shrink-0 self-center" />

      {/* Nav items */}
      {user && visibleItems.length > 0 && (
        <>
          {visibleItems.map((item) => (
            <DockItem key={item.code} item={item} mouseX={mouseX} />
          ))}
        </>
      )}

      {/* Separator */}
      {user && (
        <>
          <div className="w-px h-8 bg-zinc-700/50 mx-1 shrink-0 self-center" />
          <DockUserMenu />
        </>
      )}
    </nav>
  );
}
