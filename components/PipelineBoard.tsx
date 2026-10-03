'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { moveStatut } from '@/lib/actions';

type Carte = { code: string; nom: string; interet: string; degre: string; statut: string; dateProchaine: string; dateLabel: string; enRetard: boolean };

export default function PipelineBoard({ colonnes, cartes }: { colonnes: string[]; cartes: Carte[] }) {
  const [, start] = useTransition();
  const [items, deplacer] = useOptimistic(cartes, (state, m: { code: string; statut: string }) =>
    state.map((c) => (c.code === m.code ? { ...c, statut: m.statut } : c)),
  );

  const changer = (code: string, statut: string) =>
    start(async () => {
      deplacer({ code, statut });
      await moveStatut(code, statut);
    });

  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
      {colonnes.map((col) => {
        const liste = items.filter((c) => c.statut === col);
        return (
          <section
            key={col}
            className="flex w-[260px] shrink-0 snap-start flex-col rounded-[10px] bg-givre"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => changer(e.dataTransfer.getData('code'), col)}
          >
            <h2 className="flex items-baseline justify-between px-3 pb-2 pt-3 font-sans text-[13px] font-semibold text-sapin">
              {col}
              <span className="font-normal text-granit">{liste.length}</span>
            </h2>
            <div className="flex min-h-[80px] flex-col gap-2 px-2 pb-3">
              {liste.map((c) => (
                <article
                  key={c.code}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('code', c.code)}
                  className="cursor-grab rounded-md border border-pierre bg-white p-3 active:cursor-grabbing"
                >
                  <Link href={`/clients/${c.code}`} className="block text-[14px] font-semibold text-encre hover:text-cedre">{c.nom}</Link>
                  <p className="mt-0.5 text-[12px] text-granit">{[c.interet, c.degre].filter(Boolean).join(', ') || 'Intérêt non renseigné'}</p>
                  {c.dateProchaine && (
                    <p className={`mt-1.5 text-[12px] ${c.enRetard ? 'font-semibold text-[#9A3F17]' : 'text-granit'}`}>
                      {c.enRetard ? 'En retard : ' : 'Prochaine action : '}{c.dateLabel}
                    </p>
                  )}
                  <select
                    aria-label={`Changer le statut de ${c.nom}`}
                    value={c.statut}
                    onChange={(e) => changer(c.code, e.target.value)}
                    className="mt-2 w-full rounded border border-pierre bg-neige px-1.5 py-1 text-[12px] lg:hidden"
                  >
                    {colonnes.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
