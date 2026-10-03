import Link from 'next/link';
import { Badge, ContactLinks, Empty, ExportLink, Header } from '@/components/ui';
import { getActions, getClients, sortByDateDesc } from '@/lib/data';
import { STATUTS_ACTIFS } from '@/lib/config';
import { addMonths, fmtDate, monthLabel, monthOf, parseDate, today } from '@/lib/utils';

export default async function Relances({ searchParams }: { searchParams: { mois?: string } }) {
  const [clients, actions] = await Promise.all([getClients(), getActions()]);
  const j = today();
  const mois = searchParams.mois ?? j.slice(0, 7);
  const nom = (code: string) => clients.find((c) => c.code === code)?.nom ?? code;
  const aFaire = clients
    .filter((c) => STATUTS_ACTIFS.includes(c.statut) && parseDate(c.dateProchaine) && parseDate(c.dateProchaine) <= j)
    .sort((a, b) => parseDate(a.dateProchaine).localeCompare(parseDate(b.dateProchaine)));
  const sansDate = clients.filter((c) => STATUTS_ACTIFS.includes(c.statut) && !parseDate(c.dateProchaine));
  const historique = actions.filter((a) => monthOf(a.date) === mois && /appel|whatsapp|relance/i.test(a.type)).sort(sortByDateDesc);
  const repondu = historique.filter((a) => a.resultat === 'Oui').length;

  return (
    <>
      <Header titre="Relances" sous={`${aFaire.length} à faire maintenant, ${sansDate.length} clients actifs sans date de relance`}>
        <ExportLink section="relances" mois={mois} label={`Exporter ${monthLabel(mois)}`} />
      </Header>

      <section className="panel mb-6 p-5">
        <h2 className="text-[22px]">À relancer maintenant</h2>
        {aFaire.length === 0 ? <p className="mt-2 text-[14px] text-granit">Toutes les relances prévues sont faites.</p> : (
          <ul className="mt-2">
            {aFaire.map((c) => (
              <li key={c.code} className="flex flex-col gap-2 border-b border-pierre/70 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/clients/${c.code}`} className="font-semibold hover:text-cedre">{c.nom}</Link> <Badge v={c.statut} />
                  <p className="text-[13px] text-granit">{c.prochaine || 'Relance'}, prévue le {fmtDate(c.dateProchaine)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ContactLinks tel={c.tel} />
                  <Link href={`/clients/${c.code}#`} className="rounded bg-sapin px-2.5 py-1 text-[12px] font-semibold text-neige">Noter la relance</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {sansDate.length > 0 && (
        <details className="panel mb-6 p-5">
          <summary className="cursor-pointer text-[15px] font-semibold text-sapin">{sansDate.length} clients actifs sans date de relance</summary>
          <ul className="mt-3 columns-1 gap-6 text-[14px] sm:columns-2">
            {sansDate.map((c) => <li key={c.code} className="py-1"><Link href={`/clients/${c.code}`} className="hover:text-cedre">{c.nom}</Link> <span className="text-granit">({c.statut})</span></li>)}
          </ul>
        </details>
      )}

      <section className="panel p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[22px] first-letter:uppercase">Historique de {monthLabel(mois)}</h2>
          <div className="flex gap-2 text-[13px]">
            <Link className="btn-ghost py-1" href={`/relances?mois=${addMonths(mois, -1)}`}>Mois précédent</Link>
            {mois < j.slice(0, 7) && <Link className="btn-ghost py-1" href={`/relances?mois=${addMonths(mois, 1)}`}>Mois suivant</Link>}
          </div>
        </div>
        <p className="mt-1 text-[14px] text-granit">{historique.length} relances, {repondu} avec réponse.</p>
        {historique.length === 0 ? <div className="mt-4"><Empty>Aucune relance enregistrée ce mois-ci.</Empty></div> : (
          <div className="mt-4 overflow-x-auto">
            <table className="tbl min-w-[640px]">
              <thead><tr><th>Date</th><th>Client</th><th>Canal</th><th>Réponse</th><th>Note</th></tr></thead>
              <tbody>
                {historique.map((a) => (
                  <tr key={a.id || a._row}>
                    <td className="whitespace-nowrap">{fmtDate(a.date, { day: 'numeric', month: 'short' })}<span className="block text-[12px] text-granit">{a.heure}</span></td>
                    <td><Link href={`/clients/${a.code}`} className="hover:text-cedre">{nom(a.code)}</Link></td>
                    <td>{a.type}</td>
                    <td>{a.resultat || '—'}</td>
                    <td className="max-w-[360px]">{a.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
