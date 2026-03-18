import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  motion,
  useTransform,
  useSpring,
  type MotionValue,
  AnimatePresence,
} from 'framer-motion';
import type { NavItem } from './dock-nav-items';

interface DockItemProps {
  item: NavItem;
  mouseX: MotionValue<number>;
}

export default function DockItem({ item, mouseX }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  const isActive = location.pathname === item.route;

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return 200;
    return val - (bounds.x + bounds.width / 2);
  });

  const sizeSync = useTransform(distance, [-150, 0, 150], [40, 64, 40]);
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 150, damping: 12 });

  const Icon = item.icon;

  return (
    <Link to={item.route} className="relative flex flex-col items-center">
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-10 whitespace-nowrap rounded-md bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs font-medium text-white shadow-lg pointer-events-none"
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon container */}
      <motion.div
        ref={ref}
        style={{ width: size, height: size }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`flex items-center justify-center rounded-xl transition-colors ${
          isActive
            ? 'bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-blue-400'
            : 'text-zinc-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <Icon style={{ width: '50%', height: '50%' }} strokeWidth={1.8} />
      </motion.div>

      {/* Active dot */}
      {isActive && (
        <motion.div
          layoutId="active-dot"
          className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-blue-400"
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      )}
    </Link>
  );
}
