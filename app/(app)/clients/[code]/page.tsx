import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, ContactLinks, Field, Flash, Select } from '@/components/ui';
import { SubmitButton } from '@/components/AutoSubmit';
import { addAction, updateClient } from '@/lib/actions';
import { getActions, getClient, getListes, getReservations, sortByDateDesc } from '@/lib/data';
import { STATUTS } from '@/lib/config';
import { fmtDate, fmtDH, nowTime, parseDate, parseNum, today } from '@/lib/utils';

export default async function FicheClient({ params, searchParams }: { params: { code: string }; searchParams: { ok?: string } }) {
  const code = decodeURIComponent(params.code);
  const [c, actions, resas, l] = await Promise.all([getClient(code), getActions(), getReservations(), getListes()]);
  if (!c) notFound();
  const timeline = actions.filter((a) => a.code === code).sort(sortByDateDesc);
  const sesResas = resas.filter((r) => r.code === code);
  const enRetard = parseDate(c.dateProchaine) && parseDate(c.dateProchaine) < today();

  return (
    <>
      <Link href="/clients" className="text-[13px] text-granit hover:text-sapin">Tous les clients</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[34px] leading-tight sm:text-[40px]">{c.nom}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[14px] text-granit">
            <span>{c.code}</span><Badge v={c.statut} />
            {[c.type, c.ville, c.origine && `via ${c.origine}`].filter(Boolean).join(', ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px]">{c.tel}</span><ContactLinks tel={c.tel} />
          {c.tel2 && <span className="text-[13px] text-granit">{c.tel2}</span>}
        </div>
      </div>
      <Flash ok={searchParams.ok} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-[22px]">Ajouter une action</h2>
            <form action={addAction} className="mt-4 grid gap-3 sm:grid-cols-4">
              <input type="hidden" name="code" value={code} />
              <Field label="Type" name="type" className="sm:col-span-2"><Select name="type" options={l['Type action'] ?? []} defaultValue="Appel sortant" vide={false} /></Field>
              <Field label="Date" name="date"><input id="date" name="date" type="date" defaultValue={today()} className="field" /></Field>
              <Field label="Heure" name="heure"><input id="heure" name="heure" type="time" defaultValue={nowTime()} className="field" /></Field>
              <Field label="Réponse" name="resultat"><Select name="resultat" options={l['Résultat'] ?? []} /></Field>
              <Field label="Durée (min)" name="duree"><input id="duree" name="duree" type="number" min="0" className="field" /></Field>
              <Field label="Nouveau statut" name="statut" className="sm:col-span-2"><Select name="statut" options={STATUTS} defaultValue={c.statut} /></Field>
              <Field label="Note" name="note" className="sm:col-span-4"><textarea id="note" name="note" rows={2} className="field" placeholder="Ce qui s'est dit, la décision du client…" /></Field>
              <Field label="Prochaine action" name="prochaine" className="sm:col-span-2"><input id="prochaine" name="prochaine" defaultValue={c.prochaine} className="field" /></Field>
              <Field label="Date prochaine action" name="dateProchaine"><input id="dateProchaine" name="dateProchaine" type="date" defaultValue={parseDate(c.dateProchaine)} className="field" /></Field>
              <Field label="Degré d'intérêt" name="degre"><Select name="degre" options={l["Degré d'intérêt"] ?? []} defaultValue={c.degre} /></Field>
              <div className="sm:col-span-4"><SubmitButton>Ajouter à la timeline</SubmitButton></div>
            </form>
          </section>

          <section className="panel p-5">
            <h2 className="text-[22px]">Histoire du client</h2>
            {timeline.length === 0 ? (
              <p className="mt-2 text-[14px] text-granit">Aucune action enregistrée pour l&apos;instant.</p>
            ) : (
              <ol className="mt-4 border-l-2 border-pierre pl-5">
                {timeline.map((a) => (
                  <li key={a.id || a._row} className="relative pb-5 last:pb-0">
                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-cedre" />
                    <p className="text-[13px] text-granit">
                      {fmtDate(a.date)}{a.heure ? ` à ${a.heure}` : ''}{a.duree ? `, ${a.duree} min` : ''}{a.resultat ? `, réponse : ${a.resultat}` : ''}
                    </p>
                    <p className="text-[15px] font-semibold text-encre">{a.type}</p>
                    {a.note && <p className="mt-0.5 whitespace-pre-line text-[14px] leading-relaxed">{a.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className={`panel p-5 ${enRetard ? 'border-[#DDA184]' : ''}`}>
            <h2 className="text-[20px]">Prochaine étape</h2>
            <p className="mt-2 text-[15px]">{c.prochaine || 'Non définie'}</p>
            <p className={`text-[14px] ${enRetard ? 'font-semibold text-[#9A3F17]' : 'text-granit'}`}>
              {c.dateProchaine ? `${enRetard ? 'En retard depuis le' : 'Prévue le'} ${fmtDate(c.dateProchaine)}` : 'Pas de date'}
            </p>
            {c.blocage && <p className="mt-3 text-[14px]"><span className="text-granit">Blocage : </span>{c.blocage}</p>}
          </section>

          <section className="panel p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[20px]">Réservations</h2>
              <Link href={`/reservations?client=${code}`} className="text-[13px] font-semibold text-cedre">Réserver un lot</Link>
            </div>
            {sesResas.length === 0 ? <p className="mt-2 text-[14px] text-granit">Aucune réservation.</p> : (
              <ul className="mt-2 space-y-2">
                {sesResas.map((r) => (
                  <li key={r.id} className="text-[14px]">
                    <span className="font-semibold">Lot {r.lot}</span> <Badge v={r.etat} />
                    <span className="block text-[13px] text-granit">{fmtDate(r.date)}, {fmtDH(parseNum(r.prixFige))}{r.paiement ? `, ${r.paiement}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <details className="panel p-5">
            <summary className="cursor-pointer text-[15px] font-semibold text-sapin">Modifier la fiche</summary>
            <form action={updateClient} className="mt-4 grid gap-3">
              <input type="hidden" name="code" value={code} />
              <Field label="Nom et prénom" name="nom"><input id="nom" name="nom" defaultValue={c.nom} className="field" required /></Field>
              <Field label="Téléphone" name="tel"><input id="tel" name="tel" defaultValue={c.tel} className="field" /></Field>
              <Field label="Téléphone 2" name="tel2"><input id="tel2" name="tel2" defaultValue={c.tel2} className="field" /></Field>
              <Field label="Ville" name="ville"><input id="ville" name="ville" defaultValue={c.ville} className="field" /></Field>
              <Field label="Type client" name="type"><Select name="type" options={l['Type client'] ?? []} defaultValue={c.type} /></Field>
              <Field label="Origine" name="origine"><Select name="origine" options={l['Origine prospect'] ?? []} defaultValue={c.origine} /></Field>
              <Field label="Intérêt pour" name="interet"><Select name="interet" options={l['Intérêt pour'] ?? []} defaultValue={c.interet} /></Field>
              <Field label="Blocage / objection" name="blocage"><input id="blocage" name="blocage" defaultValue={c.blocage} className="field" /></Field>
              <Field label="Histoire / contexte" name="notes"><textarea id="notes" name="notes" rows={4} defaultValue={c.notes} className="field" /></Field>
              <SubmitButton>Enregistrer la fiche</SubmitButton>
            </form>
          </details>
          {c.notes && (
            <section className="panel p-5">
              <h2 className="text-[20px]">Contexte</h2>
              <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed">{c.notes}</p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
