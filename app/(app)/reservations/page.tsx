import Link from 'next/link';
import { Badge, Empty, ExportLink, Field, Flash, Header, Select } from '@/components/ui';
import { AutoSelect, SubmitButton } from '@/components/AutoSubmit';
import { createReservation, updateReservationEtat } from '@/lib/actions';
import { getClients, getListes, getReservations, getStock, getTarifs, tarifDe } from '@/lib/data';
import { ETATS_LOT_LIBRES } from '@/lib/config';
import { fmtDate, fmtDH, fmtNum, parseDate, parseNum, today } from '@/lib/utils';

export default async function Reservations({ searchParams }: { searchParams: { client?: string; ok?: string; erreur?: string } }) {
  const [resas, clients, stock, tarifs, l] = await Promise.all([getReservations(), getClients(), getStock(), getTarifs(), getListes()]);
  const nom = (code: string) => clients.find((c) => c.code === code)?.nom ?? code;
  const libres = stock.filter((x) => ETATS_LOT_LIBRES.includes(x.etat));
  const tri = [...resas].sort((a, b) => parseDate(b.date).localeCompare(parseDate(a.date)));
  const actives = resas.filter((r) => r.etat !== 'Annulé');
  const ca = actives.reduce((s, r) => s + parseNum(r.prixFige), 0);
  const etats = l['État réservation'] ?? ['Réservé', 'En cours de signature', 'Vendu', 'Annulé'];

  return (
    <>
      <Header titre="Réservations" sous={`${actives.length} actives, ${resas.length - actives.length} annulées, ${fmtDH(ca)} en cours`}>
        <ExportLink section="reservations" />
      </Header>
      <Flash ok={searchParams.ok} erreur={searchParams.erreur} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="panel overflow-x-auto">
          {tri.length === 0 ? <div className="p-5"><Empty>Aucune réservation pour l&apos;instant. Utilise le formulaire pour réserver un lot.</Empty></div> : (
            <table className="tbl min-w-[680px]">
              <thead><tr><th>Client</th><th>Lot</th><th>Date</th><th>Prix figé</th><th>Paiement</th><th>État</th></tr></thead>
              <tbody>
                {tri.map((r) => (
                  <tr key={r.id || r._row}>
                    <td><Link href={`/clients/${r.code}`} className="font-semibold hover:text-cedre">{nom(r.code)}</Link>
                      {r.observation && <span className="block max-w-[260px] text-[12px] text-granit">{r.observation}</span>}</td>
                    <td className="font-semibold">{r.lot}</td>
                    <td className="whitespace-nowrap">{fmtDate(r.date, { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                    <td className="whitespace-nowrap">{fmtDH(parseNum(r.prixFige))}{r.prixM2 && <span className="block text-[12px] text-granit">{fmtNum(parseNum(r.prixM2))} DH/m²</span>}</td>
                    <td>{r.paiement || '—'}</td>
                    <td>
                      <form action={updateReservationEtat} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <span className="hidden xl:inline"><Badge v={r.etat} /></span>
                        <AutoSelect name="etat" options={etats} defaultValue={r.etat} label={`État de la réservation ${r.lot}`} />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <aside className="panel h-fit p-5">
          <h2 className="text-[22px]">Réserver un lot</h2>
          <p className="mt-1 text-[13px] text-granit">Le prix est figé au moment de la réservation : un changement de grille ne le modifiera pas.</p>
          <form action={createReservation} className="mt-4 grid gap-3">
            <Field label="Client" name="code">
              <select id="code" name="code" defaultValue={searchParams.client ?? ''} required className="field">
                <option value="">Choisir un client</option>
                {[...clients].sort((a, b) => a.nom.localeCompare(b.nom)).map((c) => <option key={c.code} value={c.code}>{c.nom} ({c.code})</option>)}
              </select>
            </Field>
            <Field label={`Lot (${libres.length} disponibles)`} name="lot">
              <select id="lot" name="lot" required className="field">
                <option value="">Choisir un lot</option>
                {libres.map((x) => {
                  const t = tarifDe(x, tarifs);
                  return <option key={x.lot} value={x.lot}>{x.lot}, {x.niveau}, {x.surface} m², {t.net ? fmtDH(t.net) : 'prix à définir'}{x.etat === 'Option' ? ' (option)' : ''}</option>;
                })}
              </select>
            </Field>
            <Field label="Prix négocié en DH (vide = prix net de la grille)" name="prix"><input id="prix" name="prix" inputMode="numeric" className="field" placeholder="ex. 780000" /></Field>
            <Field label="Date de réservation" name="date"><input id="date" name="date" type="date" defaultValue={today()} className="field" /></Field>
            <Field label="Mode de paiement" name="paiement"><Select name="paiement" options={l['Mode de paiement'] ?? []} /></Field>
            <Field label="Observation" name="observation"><textarea id="observation" name="observation" rows={2} className="field" placeholder="Crédit bancaire en cours, 50 % comptant…" /></Field>
            <SubmitButton>Enregistrer la réservation</SubmitButton>
          </form>
        </aside>
      </div>
    </>
  );
}
