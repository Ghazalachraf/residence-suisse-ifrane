import Link from 'next/link';
import { Badge, ExportLink, Field, Header, Select } from '@/components/ui';
import { AutoSelect, SubmitButton } from '@/components/AutoSubmit';
import { addObjectif, addPlan, updatePlanStatut } from '@/lib/actions';
import { getListes } from '@/lib/data';
import { INDICATEURS, rapportMensuel } from '@/lib/report';
import { addMonths, fmtDate, monthLabel, today } from '@/lib/utils';

export default async function Mensuel({ searchParams }: { searchParams: { mois?: string } }) {
  const mois = searchParams.mois ?? today().slice(0, 7);
  const [r, l] = await Promise.all([rapportMensuel(mois), getListes()]);
  const titreMois = monthLabel(mois);

  return (
    <>
      <Header titre="Fiche mensuelle" sous={`Pilotage commercial de ${titreMois}, calculé automatiquement depuis tes données.`}>
        <Link className="btn-ghost" href={`/mensuel?mois=${addMonths(mois, -1)}`}>Mois précédent</Link>
        <Link className="btn-ghost" href={`/mensuel?mois=${addMonths(mois, 1)}`}>Mois suivant</Link>
        <ExportLink section="mensuel" mois={mois} label="Exporter la fiche (4 pages)" />
      </Header>

      <section className="panel mb-6 overflow-x-auto">
        <h2 className="px-5 pt-4 text-[22px]">Page 1 : bilan de {titreMois}</h2>
        <table className="tbl mt-2 min-w-[640px]">
          <thead><tr><th>Indicateur</th><th>Objectif</th><th>Réalisé</th><th>Écart</th><th>Taux</th><th>Commentaire</th></tr></thead>
          <tbody>
            {r.bilan.map((b) => (
              <tr key={b.indicateur}>
                <td className="font-semibold">{b.indicateur}</td>
                <td>{b.objectif ?? '—'}</td>
                <td className="font-display text-[20px] text-sapin">{b.realise}</td>
                <td className={b.ecart !== null && b.ecart < 0 ? 'text-[#9A3F17]' : ''}>{b.ecart === null ? '—' : `${b.ecart > 0 ? '+' : ''}${b.ecart}`}</td>
                <td>{b.taux === null ? '—' : `${b.taux} %`}</td>
                <td className="text-[13px] text-granit">{b.commentaire}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-5 pb-4 text-[13px] text-granit">Les objectifs de ce mois viennent de la page 3 de la fiche du mois précédent.</p>
      </section>

      <section className="panel mb-6 overflow-x-auto">
        <h2 className="px-5 pt-4 text-[22px]">Page 2 : relances et pipeline</h2>
        <table className="tbl mt-2 min-w-[820px]">
          <thead><tr><th>Client</th><th>Intérêt</th><th>Dernier contact</th><th>Relances du mois</th><th>Degré</th><th>Blocage</th><th>Prochaine étape</th></tr></thead>
          <tbody>
            {r.pipeline.map(({ client: c, dernierContact, relancesMois }) => (
              <tr key={c.code}>
                <td><Link href={`/clients/${c.code}`} className="font-semibold hover:text-cedre">{c.nom}</Link><span className="block"><Badge v={c.statut} /></span></td>
                <td>{c.interet || '—'}</td>
                <td className="whitespace-nowrap">{fmtDate(dernierContact, { day: 'numeric', month: 'short' })}</td>
                <td>{relancesMois}</td>
                <td>{c.degre || '—'}</td>
                <td className="max-w-[200px] text-[13px]">{c.blocage || '—'}</td>
                <td className="text-[13px]">{c.prochaine || '—'}<span className="block text-granit">{fmtDate(c.dateProchaine, { day: 'numeric', month: 'short' })}</span></td>
              </tr>
            ))}
            {r.pipeline.length === 0 && <tr><td colSpan={7} className="text-granit">Aucun prospect actif sur la période.</td></tr>}
          </tbody>
        </table>
      </section>

      <section id="objectifs" className="panel mb-6 p-5">
        <h2 className="text-[22px]">Page 3 : objectifs de {monthLabel(r.suivant)}</h2>
        {r.objectifsSuivant.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="tbl min-w-[560px]">
              <thead><tr><th>Indicateur</th><th>Réalisé {titreMois}</th><th>Objectif</th><th>Évolution visée</th><th>Justification</th><th>Échéance</th></tr></thead>
              <tbody>
                {r.objectifsSuivant.map((o) => (
                  <tr key={o._row}>
                    <td className="font-semibold">{o.indicateur}</td><td>{o.realiseM ?? '—'}</td><td>{o.objectif}</td>
                    <td>{o.evolution === null ? '—' : `${o.evolution > 0 ? '+' : ''}${o.evolution} %`}</td>
                    <td className="text-[13px]">{o.justification}</td><td>{fmtDate(o.echeance, { day: 'numeric', month: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form action={addObjectif} className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px_1fr_150px_auto] sm:items-end">
          <input type="hidden" name="mois" value={r.suivant} />
          <input type="hidden" name="retourMois" value={mois} />
          <Field label="Indicateur" name="indicateur"><Select name="indicateur" options={INDICATEURS} vide={false} /></Field>
          <Field label="Objectif" name="objectif"><input id="objectif" name="objectif" inputMode="numeric" required className="field" /></Field>
          <Field label="Justification" name="justification"><input id="justification" name="justification" className="field" /></Field>
          <Field label="Échéance" name="echeance"><input id="echeance" name="echeance" type="date" className="field" /></Field>
          <SubmitButton>Ajouter</SubmitButton>
        </form>
      </section>

      <section id="plan" className="panel p-5">
        <h2 className="text-[22px]">Page 4 : plan d&apos;action</h2>
        {r.plan.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="tbl min-w-[720px]">
              <thead><tr><th>Action</th><th>Canal</th><th>Priorité</th><th>Dates</th><th>Indicateur</th><th>Statut</th></tr></thead>
              <tbody>
                {r.plan.map((p) => (
                  <tr key={p._row}>
                    <td className="font-semibold">{p.action}<span className="block text-[12px] font-normal text-granit">{p.resultat}{p.cible ? `, cible : ${p.cible}` : ''}</span></td>
                    <td>{p.canal}</td><td>{p.priorite}</td>
                    <td className="whitespace-nowrap text-[13px]">{fmtDate(p.debut, { day: 'numeric', month: 'short' })} au {fmtDate(p.echeance, { day: 'numeric', month: 'short' })}</td>
                    <td className="text-[13px]">{p.indicateur}</td>
                    <td>
                      <form action={updatePlanStatut}>
                        <input type="hidden" name="row" value={p._row} />
                        <AutoSelect name="statut" options={['À faire', 'En cours', 'Fait', 'Abandonné']} defaultValue={p.statut || 'À faire'} label={`Statut de ${p.action}`} />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form action={addPlan} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="retourMois" value={mois} />
          <Field label="Action à réaliser" name="action" className="sm:col-span-2"><input id="action" name="action" required className="field" /></Field>
          <Field label="Résultat attendu" name="resultat" className="sm:col-span-2"><input id="resultat" name="resultat" className="field" /></Field>
          <Field label="Mois" name="mois">
            <select id="mois" name="mois" defaultValue={r.suivant} className="field">
              <option value={mois}>{titreMois}</option><option value={r.suivant}>{monthLabel(r.suivant)}</option>
            </select>
          </Field>
          <Field label="Canal" name="canal"><Select name="canal" options={l['Canal'] ?? []} /></Field>
          <Field label="Priorité" name="priorite"><Select name="priorite" options={l['Priorité'] ?? []} defaultValue="Normale" /></Field>
          <Field label="Cible" name="cible"><input id="cible" name="cible" className="field" placeholder="MRE, estivants…" /></Field>
          <Field label="Date début" name="debut"><input id="debut" name="debut" type="date" className="field" /></Field>
          <Field label="Échéance" name="echeance"><input id="echeance" name="echeance" type="date" className="field" /></Field>
          <Field label="Indicateur de réussite" name="indicateur" className="sm:col-span-2"><input id="indicateur" name="indicateur" className="field" /></Field>
          <div className="sm:col-span-4"><SubmitButton>Ajouter au plan d&apos;action</SubmitButton></div>
        </form>
      </section>
    </>
  );
}
