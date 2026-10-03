'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LIENS } from '@/lib/nav';


const actif = (path: string, href: string) => (href === '/' ? path === '/' : path.startsWith(href));

export function SideNav() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {LIENS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-md px-3 py-2 text-[14px] transition-colors ${
            actif(path, l.href) ? 'bg-neige/10 font-semibold text-neige' : 'text-neige/70 hover:text-neige'
          }`}
        >
          <span className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${actif(path, l.href) ? 'bg-saison' : 'bg-transparent'}`} />
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-pierre bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      {LIENS.filter((l) => l.mobile).map((l) => (
        <Link key={l.href} href={l.href} className={`py-3 text-center text-[12px] ${actif(path, l.href) ? 'font-semibold text-sapin' : 'text-granit'}`}>
          {l.label}
        </Link>
      ))}
      <Link href="/plus" className={`py-3 text-center text-[12px] ${path === '/plus' ? 'font-semibold text-sapin' : 'text-granit'}`}>Plus</Link>
    </nav>
  );
}

