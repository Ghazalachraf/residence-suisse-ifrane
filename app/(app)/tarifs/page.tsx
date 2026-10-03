import { ExportLink, Flash, Header } from '@/components/ui';
import { SubmitButton } from '@/components/AutoSubmit';
import { saveTarifs } from '@/lib/actions';
import { getHistoriqueTarifs, getStock, getTarifs } from '@/lib/data';
import { fmtDate, fmtDH, fmtNum, parseDate, parseNum, today } from '@/lib/utils';

export default async function Tarifs({ searchParams }: { searchParams: { ok?: string } }) {
  const [tarifs, hist, stock] = await Promise.all([getTarifs(), getHistoriqueTarifs(), getStock()]);
  const tranches = Array.from(new Set(tarifs.map((t) => t.tranche)));
  const surfaceType = (tranche: string, niveau: string) => {
    const lot = stock.find((l) => l.tranche === tranche && l.niveau === niveau);
    return lot ? parseNum(lot.surface) : 0;
  };
  const histTri = [...hist].sort((a, b) => parseDate(b.date).localeCompare(parseDate(a.date)));

  return (
    <>
      <Header titre="Tarifs" sous="Modifie un prix au m² : tous les lots disponibles sont recalculés. Les réservations existantes gardent leur prix figé.">
        <ExportLink section="tarifs" />
      </Header>
      <Flash ok={searchParams.ok} />

      <form action={saveTarifs} className="space-y-5">
        {tranches.map((tr) => (
          <section key={tr} className="panel overflow-x-auto">
            <h2 className="px-5 pt-4 text-[22px]">Tranche {tr}</h2>
            <table className="tbl mt-2 min-w-[620px]">
              <thead><tr><th>Niveau</th><th>Catalogue (DH/m²)</th><th>Net (DH/m²)</th><th>Marge de négociation</th><th>Exemple de lot</th><th>En vigueur depuis</th></tr></thead>
              <tbody>
                {tarifs.filter((t) => t.tranche === tr).map((t) => {
                  const key = `${t.tranche}|${t.niveau}`;
                  const cat = parseNum(t.catalogue), net = parseNum(t.net), surf = surfaceType(t.tranche, t.niveau);
                  return (
                    <tr key={key}>
                      <td className="font-semibold">{t.niveau}</td>
                      <td><input name={`cat:${key}`} defaultValue={cat || ''} inputMode="numeric" aria-label={`Prix catalogue ${key}`} className="field w-32 py-1.5" placeholder="—" /></td>
                      <td><input name={`net:${key}`} defaultValue={net || ''} inputMode="numeric" aria-label={`Prix net ${key}`} className="field w-32 py-1.5" placeholder="À définir" /></td>
                      <td className="text-[13px]">{cat && net ? `${fmtNum(cat - net)} DH/m² (${Math.round(((cat - net) / cat) * 100)} %)` : '—'}</td>
                      <td className="text-[13px]">{surf && net ? `${surf} m² = ${fmtDH(surf * net)}` : '—'}</td>
                      <td className="text-[13px] text-granit">{t.dateEffet ? fmtDate(t.dateEffet) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}
        <section className="panel grid gap-3 p-5 sm:grid-cols-[180px_1fr_auto] sm:items-end">
          <label><span className="label">Date d&apos;effet</span><input type="date" name="dateEffet" defaultValue={today()} className="field" /></label>
          <label><span className="label">Motif du changement</span><input name="motif" className="field" placeholder="Nouvelle grille direction, promotion d'hiver…" /></label>
          <SubmitButton>Enregistrer les prix</SubmitButton>
        </section>
      </form>

      <section className="panel mt-8 overflow-x-auto">
        <h2 className="px-5 pt-4 text-[22px]">Historique des prix</h2>
        <table className="tbl mt-2 min-w-[620px]">
          <thead><tr><th>Date</th><th>Tranche</th><th>Niveau</th><th>Net</th><th>Catalogue</th><th>Motif</th></tr></thead>
          <tbody>
            {histTri.map((h) => (
              <tr key={h._row}>
                <td className="whitespace-nowrap">{fmtDate(h.date)}</td><td>{h.tranche}</td><td>{h.niveau}</td>
                <td>{h.ancienNet ? `${fmtNum(parseNum(h.ancienNet))} → ` : ''}{h.nouveauNet ? fmtNum(parseNum(h.nouveauNet)) : '—'}</td>
                <td>{h.ancienCat ? `${fmtNum(parseNum(h.ancienCat))} → ` : ''}{h.nouveauCat ? fmtNum(parseNum(h.nouveauCat)) : '—'}</td>
                <td className="text-granit">{h.motif}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
