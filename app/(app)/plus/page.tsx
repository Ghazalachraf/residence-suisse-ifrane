import Link from 'next/link';
import { LIENS_PLUS } from '@/lib/nav';
import { logout } from '@/lib/actions';

export default function Plus() {
  return (
    <>
      <h1 className="mb-5 text-[34px]">Plus</h1>
      <ul className="panel divide-y divide-pierre">
        {LIENS_PLUS.map((l) => (
          <li key={l.href}><Link href={l.href} className="block px-4 py-4 text-[16px] text-sapin">{l.label}</Link></li>
        ))}
      </ul>
      <form action={logout} className="mt-6"><button className="btn-ghost w-full">Se déconnecter</button></form>
    </>
  );
}
