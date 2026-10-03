import { Badge, ExportLink, Field, Flash, Header, Select, TUILE_LOT } from '@/components/ui';
import { SubmitButton } from '@/components/AutoSubmit';
import { updateLot } from '@/lib/actions';
import { getClients, getListes, getStock, getTarifs, tarifDe, Lot } from '@/lib/data';
import { fmtNum } from '@/lib/utils';

const ORDRE_NIVEAU = ['Comble', '1er étage', 'RDC'];

export default async function Stock({ searchParams }: { searchParams: { tranche?: string; etat?: string; ok?: string; erreur?: string } }) {
  const [stock, tarifs, clients, l] = await Promise.all([getStock(), getTarifs(), getClients(), getListes()]);
  const nom = (code: string) => clients.find((c) => c.code === code)?.nom;
  const tranches = Array.from(new Set(stock.map((x) => x.tranche))).sort();
  const filtre = stock
    .filter((x) => !searchParams.tranche || x.tranche === searchParams.tranche)
    .filter((x) => !searchParams.etat || x.etat === searchParams.etat);
  const compte = stock.reduce<Record<string, number>>((a, x) => ((a[x.etat] = (a[x.etat] ?? 0) + 1), a), {});
  const immeubles = Array.from(new Set(filtre.map((x) => x.immeuble))).sort((a, b) =>
    a[0] === b[0] ? parseInt(a.slice(1)) - parseInt(b.slice(1)) : a.localeCompare(b));
  const aVerifier = stock.filter((x) => x.verif);
  const etats = l['État lot'] ?? Object.keys(TUILE_LOT);

  const tuile = (x: Lot) => {
    const t = tarifDe(x, tarifs);
    const client = nom(x.code) || x.clientRef;
    return (
      <div key={x.lot} title={x.verif || undefined} className={`relative rounded-md border px-2 py-1.5 text-[12px] leading-tight ${TUILE_LOT[x.etat] ?? 'border-pierre bg-white'}`}>
        <span className="block font-semibold">{x.lot}</span>
        <span className="block">{x.surface} m²{x.etat === 'Disponible' && t.net ? `, ${fmtNum(t.net / 1000)} k` : ''}</span>
        {client && <span className="block truncate opacity-80">{client}</span>}
        {x.verif && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#9A3F17]" aria-label="À vérifier" />}
      </div>
    );
  };

  return (
    <>
      <Header titre="Stock" sous={`${stock.length} lots, ${compte['Disponible'] ?? 0} disponibles`}>
        <ExportLink section="stock" />
      </Header>
      <Flash ok={searchParams.ok} erreur={searchParams.erreur} />

      <div className="mb-5 flex flex-wrap gap-2">
        {Object.entries(compte).sort((a, b) => b[1] - a[1]).map(([e, n]) => (
          <a key={e} href={`/stock?etat=${encodeURIComponent(e)}${searchParams.tranche ? `&tranche=${searchParams.tranche}` : ''}`}
            className={`rounded-md border px-3 py-1.5 text-[13px] ${searchParams.etat === e ? 'border-sapin bg-sapin text-neige' : 'border-pierre bg-white'}`}>
            {e} <span className="font-semibold">{n}</span>
          </a>
        ))}
        {(searchParams.etat || searchParams.tranche) && <a href="/stock" className="px-2 py-1.5 text-[13px] text-cedre underline">Tout afficher</a>}
      </div>
      <div className="mb-6 flex gap-2">
        {tranches.map((t) => (
          <a key={t} href={`/stock?tranche=${encodeURIComponent(t)}${searchParams.etat ? `&etat=${encodeURIComponent(searchParams.etat)}` : ''}`}
            className={`rounded-md border px-3 py-1.5 text-[13px] font-semibold ${searchParams.tranche === t ? 'border-sapin bg-sapin text-neige' : 'border-pierre bg-white text-sapin'}`}>{t}</a>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {immeubles.map((imm) => {
          const lots = filtre.filter((x) => x.immeuble === imm);
          return (
            <section key={imm} className="panel p-4">
              <h2 className="mb-3 flex items-baseline justify-between text-[20px]">
                Immeuble {imm}<span className="font-sans text-[12px] text-granit">{lots[0]?.tranche}, modèle {lots[0]?.modele}</span>
              </h2>
              {ORDRE_NIVEAU.map((n) => {
                const ligne = lots.filter((x) => x.niveau === n).sort((a, b) => Number(a.num) - Number(b.num));
                if (!ligne.length) return null;
                return (
                  <div key={n} className="mb-2 grid grid-cols-[70px_1fr] items-start gap-2 last:mb-0">
                    <span className="pt-1.5 text-[12px] text-granit">{n}</span>
                    <div className="grid grid-cols-2 gap-1.5">{ligne.map(tuile)}</div>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-[22px]">Modifier l&apos;état d&apos;un lot</h2>
          <p className="mt-1 text-[13px] text-granit">Les réservations mettent le stock à jour automatiquement. Utilise ce formulaire pour les ventes des autres commerciaux ou les corrections.</p>
          <form action={updateLot} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Lot" name="lot">
              <select id="lot" name="lot" required className="field">
                <option value="">Choisir</option>
                {stock.map((x) => <option key={x.lot} value={x.lot}>{x.lot} ({x.etat})</option>)}
              </select>
            </Field>
            <Field label="Nouvel état" name="etat"><Select name="etat" options={etats} vide={false} /></Field>
            <Field label="Note de vérification (vide = résolu)" name="verif" className="sm:col-span-2"><input id="verif" name="verif" className="field" /></Field>
            <div className="sm:col-span-2"><SubmitButton>Mettre à jour le lot</SubmitButton></div>
          </form>
        </section>
        <section className="panel p-5">
          <h2 className="text-[22px]">À vérifier</h2>
          {aVerifier.length === 0 ? <p className="mt-2 text-[14px] text-granit">Aucune incohérence signalée.</p> : (
            <ul className="mt-3 space-y-2 text-[14px]">
              {aVerifier.map((x) => <li key={x.lot}><span className="font-semibold">{x.lot}</span> <Badge v={x.etat} /><span className="block text-[13px] text-granit">{x.verif}</span></li>)}
            </ul>
          )}
          <p className="mt-4 text-[13px] text-granit">Sur les tuiles disponibles, le prix net est affiché en milliers de DH, calculé avec la grille de la page Tarifs.</p>
        </section>
      </div>
    </>
  );
}
