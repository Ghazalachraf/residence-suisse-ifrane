import 'server-only';
import { getActions, getClients, getObjectifs, getPlan, getReservations, getStock, Client } from './data';
import { STATUTS_ACTIFS } from './config';
import { addMonths, monthOf, parseDate, parseNum } from './utils';

export const INDICATEURS = [
  'Nouveaux leads',
  'Visites réalisées',
  'Appels & WhatsApp',
  'Clients relancés',
  'Réservations',
  'Ventes conclues',
  'Annulations',
  'Taux visite → réservation (%)',
] as const;

const isVisite = (t: string) => t.startsWith('Visite');
const isContact = (t: string) => /appel|whatsapp|relance/i.test(t);

export async function rapportMensuel(mois: string) {
  const [clients, actions, resas, objectifs, plan, stock] = await Promise.all([
    getClients(), getActions(), getReservations(), getObjectifs(), getPlan(), getStock(),
  ]);
  const dansMois = (d: string) => monthOf(d) === mois;
  const actionsMois = actions.filter((a) => dansMois(a.date));
  const visites = actionsMois.filter((a) => isVisite(a.type));
  const contacts = actionsMois.filter((a) => isContact(a.type));
  const resasMois = resas.filter((r) => dansMois(r.date));
  const reservations = resasMois.filter((r) => r.etat !== 'Annulé').length;
  const ventes = resas.filter((r) => r.etat === 'Vendu' && dansMois(r.date)).length;
  const annulations = resasMois.filter((r) => r.etat === 'Annulé').length;
  const visiteurs = new Set(visites.map((v) => v.code)).size;

  const realise: Record<string, number> = {
    'Nouveaux leads': clients.filter((c) => dansMois(c.creation)).length,
    'Visites réalisées': visites.length,
    'Appels & WhatsApp': contacts.length,
    'Clients relancés': new Set(contacts.map((a) => a.code)).size,
    'Réservations': reservations,
    'Ventes conclues': ventes,
    'Annulations': annulations,
    'Taux visite → réservation (%)': visiteurs ? Math.round((reservations / visiteurs) * 100) : 0,
  };

  const objMois = (m: string) => objectifs.filter((o) => o.mois === m);
  const bilan = INDICATEURS.map((ind) => {
    const o = objMois(mois).find((x) => x.indicateur === ind);
    const objectif = o ? parseNum(o.objectif) : null;
    const r = realise[ind];
    return {
      indicateur: ind, objectif, realise: r,
      ecart: objectif === null ? null : r - objectif,
      taux: objectif ? Math.round((r / objectif) * 100) : null,
      commentaire: o?.justification ?? '',
    };
  });
  // indicateurs personnalisés ajoutés par l'utilisateur
  for (const o of objMois(mois)) {
    if ((INDICATEURS as readonly string[]).includes(o.indicateur)) continue;
    bilan.push({ indicateur: o.indicateur as typeof INDICATEURS[number], objectif: parseNum(o.objectif), realise: 0, ecart: null, taux: null, commentaire: o.justification });
  }

  const pipeline = clients
    .filter((c) => STATUTS_ACTIFS.includes(c.statut))
    .map((c: Client) => {
      const sesActions = actions.filter((a) => a.code === c.code);
      const dernier = sesActions.map((a) => parseDate(a.date)).sort().pop() ?? '';
      return {
        client: c, dernierContact: dernier,
        relancesMois: sesActions.filter((a) => dansMois(a.date) && isContact(a.type)).length,
      };
    })
    .filter((p) => p.dernierContact >= addMonths(mois, -1) || ['Prospect chaud', 'Négociation'].includes(p.client.statut))
    .sort((a, b) => (parseDate(a.client.dateProchaine) || '9').localeCompare(parseDate(b.client.dateProchaine) || '9'));

  const suivant = addMonths(mois, 1);
  const objectifsSuivant = objMois(suivant).map((o) => {
    const r = realise[o.indicateur];
    const obj = parseNum(o.objectif);
    return { ...o, realiseM: r ?? null, evolution: r ? Math.round(((obj - r) / r) * 100) : null };
  });

  const stockResume = stock.reduce<Record<string, number>>((acc, l) => ((acc[l.etat || '—'] = (acc[l.etat || '—'] ?? 0) + 1), acc), {});

  return {
    mois, suivant, bilan, pipeline, objectifsSuivant,
    plan: plan.filter((p) => p.mois === suivant || p.mois === mois),
    stockResume,
  };
}
