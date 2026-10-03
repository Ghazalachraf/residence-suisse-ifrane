import { Field, Flash, Header, Select } from '@/components/ui';
import { SubmitButton } from '@/components/AutoSubmit';
import { createClient } from '@/lib/actions';
import { getListes } from '@/lib/data';
import { STATUTS } from '@/lib/config';
import { nowTime, today } from '@/lib/utils';

export default async function NouveauClient({ searchParams }: { searchParams: { erreur?: string } }) {
  const l = await getListes();
  return (
    <>
      <Header titre="Nouveau client" sous="Une seule fiche par client : les visites et relances suivantes s'ajoutent à sa timeline." />
      <Flash erreur={searchParams.erreur} />
      <form action={createClient} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="panel grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Nom et prénom *" name="nom" className="sm:col-span-2"><input id="nom" name="nom" required className="field" /></Field>
          <Field label="Téléphone" name="tel"><input id="tel" name="tel" type="tel" className="field" placeholder="06 00 00 00 00" /></Field>
          <Field label="Téléphone 2 / WhatsApp étranger" name="tel2"><input id="tel2" name="tel2" className="field" placeholder="+33 6 …" /></Field>
          <Field label="Ville" name="ville"><input id="ville" name="ville" className="field" /></Field>
          <Field label="Type client" name="type"><Select name="type" options={l['Type client'] ?? []} /></Field>
          <Field label="Origine prospect" name="origine"><Select name="origine" options={l['Origine prospect'] ?? []} /></Field>
          <Field label="Intérêt pour" name="interet"><Select name="interet" options={l['Intérêt pour'] ?? []} /></Field>
          <Field label="Degré d'intérêt" name="degre"><Select name="degre" options={l["Degré d'intérêt"] ?? []} /></Field>
          <Field label="Statut" name="statut"><Select name="statut" options={STATUTS} defaultValue="Visite réalisée" vide={false} /></Field>
          <Field label="Prochaine action" name="prochaine"><input id="prochaine" name="prochaine" className="field" placeholder="Relance, visite avec l'épouse…" /></Field>
          <Field label="Date prochaine action" name="dateProchaine"><input id="dateProchaine" name="dateProchaine" type="date" className="field" /></Field>
          <Field label="Blocage / objection" name="blocage" className="sm:col-span-2"><input id="blocage" name="blocage" className="field" placeholder="Prix, escaliers pour les parents, vente d'un bien en cours…" /></Field>
          <Field label="Histoire / contexte" name="notes" className="sm:col-span-2"><textarea id="notes" name="notes" rows={3} className="field" /></Field>
        </section>
        <aside className="panel h-fit p-5">
          <h2 className="text-[20px]">Première interaction</h2>
          <p className="mb-4 mt-1 text-[13px] text-granit">Ajoutée directement à la timeline du client.</p>
          <div className="grid gap-3">
            <Field label="Type" name="premierType"><Select name="premierType" options={l['Type action'] ?? []} defaultValue="Visite appartement témoin" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" name="premierDate"><input id="premierDate" name="premierDate" type="date" defaultValue={today()} className="field" /></Field>
              <Field label="Heure" name="premierHeure"><input id="premierHeure" name="premierHeure" type="time" defaultValue={nowTime()} className="field" /></Field>
            </div>
            <Field label="Durée (min)" name="premierDuree"><input id="premierDuree" name="premierDuree" type="number" min="0" className="field" /></Field>
            <Field label="Note" name="premierNote"><textarea id="premierNote" name="premierNote" rows={3} className="field" /></Field>
          </div>
          <SubmitButton className="btn mt-5 w-full">Créer la fiche client</SubmitButton>
        </aside>
      </form>
    </>
  );
}
