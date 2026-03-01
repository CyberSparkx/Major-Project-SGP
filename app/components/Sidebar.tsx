'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { href: '/chat', icon: '💬', label: 'Chat' },
    { href: '/news', icon: '📰', label: 'News' },
    { href: '/social', icon: '📣', label: 'Social' },
    { href: '/temparature', icon: '☀', label: 'Temparature' },
  ];

  return (
    <aside
      className="w-24 h-full bg-[#0d1b2a] flex flex-col items-center py-6 relative
                  shadow-[4px_0_25px_rgba(0,0,51)]"
    >
      {/* Logo */}
      <div
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 
                      flex items-center justify-center text-white font-bold text-lg mb-12 shadow-lg"
      >
        AS
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-6">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;

          return (
            <div key={index} className="group relative">
              <Link
                href={item.href}
                target="_blank"
                className={`w-14 h-14 flex items-center justify-center rounded-xl text-xl
                transition-all duration-300 ease-in-out
                ${
                  isActive
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg scale-110'
                    : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                }`}
              >
                {item.icon}
              </Link>

              {/* Tooltip */}
              <span
                className="absolute left-20 top-1/2 -translate-y-1/2 
                               bg-black text-white text-xs px-3 py-1 rounded-md
                               opacity-0 group-hover:opacity-100
                               transition duration-300 whitespace-nowrap"
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Bottom Logout */}
      <div className="mt-auto text-xs text-white/40 hover:text-white cursor-pointer">
        Logout
      </div>
    </aside>
  );
}
