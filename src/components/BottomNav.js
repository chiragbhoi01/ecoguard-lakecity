'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/dashboard', icon: '🗺️', label: 'Map' },
    { href: '/leaderboard', icon: '🏆', label: 'Ranks' },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-700 z-50">
      <div className="flex justify-around p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center transition-colors duration-300 ${isActive ? 'text-green-400' : 'text-gray-400 hover:text-green-300'}`}>
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
