import Link from 'next/link';
import Mountains from '@/components/Mountains';
import { Badge, ContactLinks, Empty } from '@/components/ui';
import { getActions, getClients, getReservations, getStock, Client } from '@/lib/data';
import { STATUTS_ACTIFS } from '@/lib/config';
import { addDays, fmtDate, monthOf, parseDate, saison, today } from '@/lib/utils';

function Ligne({ c, derniere }: { c: Client; derniere?: string }) {
  return (
    <li className="flex flex-col gap-2 border-b border-pierre/70 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link href={`/clients/${c.code}`} className="text-[15px] font-semibold hover:text-cedre">{c.nom}</Link>
        <span className="ml-2 align-middle"><Badge v={c.statut} /></span>
        <p className="mt-0.5 truncate text-[13px] text-granit">
          {c.prochaine || 'Relance'}{c.interet ? ` pour ${c.interet}` : ''}{derniere ? `. Dernière note : ${derniere}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-[13px] text-granit">{fmtDate(c.dateProchaine, { day: 'numeric', month: 'short' })}</span>
        <ContactLinks tel={c.tel} />
      </div>
    </li>
  );
}

export default async function Aujourdhui() {
  const [clients, actions, resas, stock] = await Promise.all([getClients(), getActions(), getReservations(), getStock()]);
  const j = today();
  const s = saison(j);
  const mois = j.slice(0, 7);
  const actifs = clients.filter((c) => STATUTS_ACTIFS.includes(c.statut) && parseDate(c.dateProchaine));
  const retard = actifs.filter((c) => parseDate(c.dateProchaine) < j);
  const aujourdhui = actifs.filter((c) => parseDate(c.dateProchaine) === j);
  const semaine = actifs.filter((c) => parseDate(c.dateProchaine) > j && parseDate(c.dateProchaine) <= addDays(j, 7));
  const tri = (a: Client, b: Client) => parseDate(a.dateProchaine).localeCompare(parseDate(b.dateProchaine));
  const derniereNote = (code: string) =>
    actions.filter((a) => a.code === code && a.note).sort((a, b) => parseDate(b.date).localeCompare(parseDate(a.date)))[0]?.note;

  const aRappeler = retard.length + aujourdhui.length;
  const jour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Casablanca' }).format(new Date());

  const chiffres = [
    { n: clients.filter((c) => ['Prospect chaud', 'Négociation'].includes(c.statut)).length, l: 'prospects chauds ou en négociation', href: '/pipeline' },
    { n: clients.filter((c) => monthOf(c.creation) === mois).length, l: 'nouveaux clients ce mois', href: '/clients' },
    { n: resas.filter((r) => monthOf(r.date) === mois && r.etat !== 'Annulé').length, l: 'réservations ce mois', href: '/reservations' },
    { n: stock.filter((l) => l.etat === 'Disponible').length, l: 'lots disponibles', href: '/stock' },
  ];

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-[14px] bg-sapin text-neige">
        <div className="relative z-10 px-6 pb-24 pt-7 sm:px-8 sm:pb-28">
          <p className="text-[14px] text-neige/70 first-letter:uppercase">{jour}</p>
          <h1 className="mt-1 max-w-[18ch] text-[36px] leading-[1.1] text-neige sm:text-[48px]">
            {aRappeler === 0 ? 'Aucune relance en attente' : `${aRappeler} client${aRappeler > 1 ? 's' : ''} à rappeler`}
          </h1>
          <p className="mt-2 text-[15px] text-neige/75">
            {retard.length > 0 ? `Dont ${retard.length} en retard. ` : ''}
            {semaine.length > 0 ? `${semaine.length} autre${semaine.length > 1 ? 's' : ''} prévu${semaine.length > 1 ? 's' : ''} d'ici 7 jours.` : ''}
          </p>
          <Link href="/clients/nouveau" className="mt-5 inline-flex rounded-md bg-neige px-4 py-2 text-[14px] font-semibold text-sapin hover:bg-white">
            Saisir un nouveau client
          </Link>
        </div>
        <Mountains s={s} className="absolute inset-x-0 bottom-0 h-[110px] w-full" />
      </section>

      <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-pierre bg-pierre lg:grid-cols-4">
        {chiffres.map((c) => (
          <Link key={c.l} href={c.href} className="bg-white px-4 py-4 hover:bg-givre">
            <span className="font-display text-[32px] leading-none text-sapin">{c.n}</span>
            <span className="mt-1 block text-[13px] text-granit">{c.l}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel min-w-0 p-5">
          <h2 className="text-[22px]">En retard</h2>
          {retard.length ? <ul className="mt-2">{retard.sort(tri).map((c) => <Ligne key={c.code} c={c} derniere={derniereNote(c.code)} />)}</ul>
            : <p className="mt-2 text-[14px] text-granit">Rien en retard, bien joué.</p>}
        </section>
        <section className="panel min-w-0 p-5">
          <h2 className="text-[22px]">Aujourd&apos;hui</h2>
          {aujourdhui.length ? <ul className="mt-2">{aujourdhui.map((c) => <Ligne key={c.code} c={c} derniere={derniereNote(c.code)} />)}</ul>
            : <p className="mt-2 text-[14px] text-granit">Aucune relance prévue aujourd&apos;hui.</p>}
        </section>
        <section className="panel min-w-0 p-5 lg:col-span-2">
          <h2 className="text-[22px]">Les 7 prochains jours</h2>
          {semaine.length ? <ul className="mt-2">{semaine.sort(tri).map((c) => <Ligne key={c.code} c={c} />)}</ul>
            : <div className="mt-3"><Empty href="/clients" cta="Voir les clients">Aucune relance planifiée cette semaine. Ajoute une date de prochaine action sur tes fiches clients.</Empty></div>}
        </section>
      </div>
    </>
  );
}
