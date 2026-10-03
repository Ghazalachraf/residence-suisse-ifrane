import PipelineBoard from '@/components/PipelineBoard';
import { ExportLink, Header } from '@/components/ui';
import { getClients } from '@/lib/data';
import { STATUTS } from '@/lib/config';
import { fmtDate, parseDate, today } from '@/lib/utils';

export default async function Pipeline({ searchParams }: { searchParams: { tout?: string } }) {
  const clients = await getClients();
  const j = today();
  const colonnes = searchParams.tout ? [...STATUTS] : STATUTS.filter((s) => s !== 'Perdu');
  const cartes = clients
    .filter((c) => colonnes.includes(c.statut as (typeof STATUTS)[number]) || (!c.statut && colonnes.includes('Nouveau')))
    .map((c) => ({
      code: c.code, nom: c.nom, interet: c.interet, degre: c.degre, statut: c.statut || 'Nouveau',
      dateProchaine: parseDate(c.dateProchaine), dateLabel: fmtDate(c.dateProchaine, { day: 'numeric', month: 'short' }),
      enRetard: !!parseDate(c.dateProchaine) && parseDate(c.dateProchaine) < j,
    }))
    .sort((a, b) => (a.dateProchaine || '9').localeCompare(b.dateProchaine || '9'));
  const perdus = clients.filter((c) => c.statut === 'Perdu').length;

  return (
    <>
      <Header titre="Pipeline" sous="Glisse une carte vers une autre colonne pour changer le statut du client. Le changement est noté dans sa timeline.">
        <a href={searchParams.tout ? '/pipeline' : '/pipeline?tout=1'} className="btn-ghost">
          {searchParams.tout ? 'Masquer les perdus' : `Afficher les perdus (${perdus})`}
        </a>
        <ExportLink section="clients" />
      </Header>
      <PipelineBoard colonnes={colonnes} cartes={cartes} />
    </>
  );
}
