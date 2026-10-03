import Mountains from '@/components/Mountains';
import { BottomNav, SideNav } from '@/components/Nav';
import { logout } from '@/lib/actions';
import { saison } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const s = saison();
  return (
    <div style={{ ['--saison' as string]: s.accent }} className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col overflow-hidden bg-sapin lg:flex">
        <div className="px-5 pb-6 pt-7">
          <p className="font-display text-[24px] leading-none text-neige">Résidence Suisse</p>
          <p className="mt-1.5 text-[12px] text-neige/60">Ifrane, back office commercial</p>
        </div>
        <div className="flex-1 px-2"><SideNav /></div>
        <div className="relative">
          <p className="absolute left-5 top-0 text-[12px] text-neige/70">{s.nom} à Ifrane</p>
          <Mountains s={s} className="mt-5 h-[120px] w-full" />
          <form action={logout} className="absolute bottom-3 right-4">
            <button className="text-[12px] text-neige/60 hover:text-neige">Se déconnecter</button>
          </form>
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex items-center justify-between bg-sapin px-4 py-3 lg:hidden">
        <p className="font-display text-[20px] text-neige">Résidence Suisse</p>
        <span className="text-[12px] text-neige/70">{s.nom}</span>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-[1180px] flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>
      <BottomNav />
    </div>
  );
}
