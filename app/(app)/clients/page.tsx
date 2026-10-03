import Link from 'next/link';
import { Badge, ContactLinks, Empty, ExportLink, Header } from '@/components/ui';
import { getClients, getListes } from '@/lib/data';
import { STATUTS } from '@/lib/config';
import { fmtDate, parseDate, today } from '@/lib/utils';

export default async function Clients({ searchParams }: { searchParams: { q?: string; statut?: string; type?: string; tri?: string } }) {
  const [clients, listes] = await Promise.all([getClients(), getListes()]);
  const q = (searchParams.q ?? '').toLowerCase().trim();
  const j = today();
  const liste = clients
    .filter((c) => !q || [c.nom, c.tel, c.ville, c.code, c.notes].join(' ').toLowerCase().includes(q))
    .filter((c) => !searchParams.statut || c.statut === searchParams.statut)
    .filter((c) => !searchParams.type || c.type === searchParams.type)
    .sort((a, b) =>
      searchParams.tri === 'relance'
        ? (parseDate(a.dateProchaine) || '9').localeCompare(parseDate(b.dateProchaine) || '9')
        : b.code.localeCompare(a.code),
    );

  return (
    <>
      <Header titre="Clients" sous={`${clients.length} fiches, ${liste.length} affichées`}>
        <ExportLink section="clients" />
        <Link href="/clients/nouveau" className="btn">Nouveau client</Link>
      </Header>

      <form className="mb-5 grid gap-2 sm:grid-cols-[1fr_180px_160px_170px_auto]">
        <input name="q" defaultValue={searchParams.q} placeholder="Nom, téléphone, ville, code…" className="field" aria-label="Rechercher" />
        <select name="statut" defaultValue={searchParams.statut ?? ''} className="field" aria-label="Statut">
          <option value="">Tous les statuts</option>
          {STATUTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select name="type" defaultValue={searchParams.type ?? ''} className="field" aria-label="Type client">
          <option value="">Tous les types</option>
          {(listes['Type client'] ?? []).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select name="tri" defaultValue={searchParams.tri ?? ''} className="field" aria-label="Tri">
          <option value="">Plus récents</option>
          <option value="relance">Prochaine relance</option>
        </select>
        <button className="btn-ghost">Filtrer</button>
      </form>

      {liste.length === 0 ? (
        <Empty href="/clients/nouveau" cta="Saisir un client">Aucun client ne correspond à ces filtres.</Empty>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="tbl min-w-[760px]">
            <thead>
              <tr><th>Client</th><th>Contact</th><th>Type</th><th>Intérêt</th><th>Statut</th><th>Prochaine action</th></tr>
            </thead>
            <tbody>
              {liste.map((c) => {
                const d = parseDate(c.dateProchaine);
                return (
                  <tr key={c.code}>
                    <td>
                      <Link href={`/clients/${c.code}`} className="font-semibold hover:text-cedre">{c.nom}</Link>
                      <span className="block text-[12px] text-granit">{c.code}{c.ville ? `, ${c.ville}` : ''}</span>
                    </td>
                    <td><span className="block text-[13px]">{c.tel || '—'}</span><ContactLinks tel={c.tel} /></td>
                    <td>{c.type || '—'}</td>
                    <td>{c.interet || '—'}<span className="block text-[12px] text-granit">{c.degre}</span></td>
                    <td><Badge v={c.statut} /></td>
                    <td className={d && d < j ? 'font-semibold text-[#9A3F17]' : ''}>
                      {d ? fmtDate(d, { day: 'numeric', month: 'short' }) : '—'}
                      <span className="block text-[12px] font-normal text-granit">{c.prochaine}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
