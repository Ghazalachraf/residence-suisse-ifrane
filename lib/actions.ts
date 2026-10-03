'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { appendRow, updateRow } from './sheets';
import {
  getActions, getClients, getPlan, getReservations, getStock, getTarifs,
  nextId, tarifDe, toSheet,
} from './data';
import { COMMERCIAL, ETATS_LOT_LIBRES } from './config';
import { nowTime, parseDate, today } from './utils';
import { sessionToken } from './auth';

const s = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

function refresh(...paths: string[]) {
  ['/', ...paths].forEach((p) => revalidatePath(p));
}

/* ---------- Session ---------- */

export async function login(form: FormData) {
  const pwd = s(form, 'password');
  if (!process.env.APP_PASSWORD || pwd !== process.env.APP_PASSWORD) {
    redirect('/login?erreur=1');
  }
  cookies().set('rs_session', await sessionToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, path: '/',
  });
  redirect('/');
}

export async function logout() {
  cookies().delete('rs_session');
  redirect('/login');
}

/* ---------- Clients ---------- */

async function addActionRow(code: string, f: Partial<Record<'type' | 'date' | 'heure' | 'duree' | 'resultat' | 'note', string>>) {
  const actions = await getActions();
  await appendRow('Actions', toSheet('Actions', {
    id: nextId('AC', actions.map((a) => a.id), 4),
    code,
    date: parseDate(f.date) || today(),
    heure: f.heure || nowTime(),
    type: f.type || 'Note',
    duree: f.duree || '',
    resultat: f.resultat || '',
    note: f.note || '',
    traitePar: COMMERCIAL,
    source: 'Plateforme',
  }));
}

export async function createClient(form: FormData) {
  const clients = await getClients();
  const nom = s(form, 'nom');
  if (!nom) redirect('/clients/nouveau?erreur=nom');
  const code = nextId('CA', clients.map((c) => c.code));
  await appendRow('Clients', toSheet('Clients', {
    code, nom,
    tel: s(form, 'tel'), tel2: s(form, 'tel2'), ville: s(form, 'ville'),
    type: s(form, 'type'), origine: s(form, 'origine'), interet: s(form, 'interet'),
    degre: s(form, 'degre'), statut: s(form, 'statut') || 'Nouveau',
    prochaine: s(form, 'prochaine'), dateProchaine: parseDate(s(form, 'dateProchaine')),
    blocage: s(form, 'blocage'), traitePar: COMMERCIAL,
    creation: today(), maj: today(), notes: s(form, 'notes'),
  }));
  const premier = s(form, 'premierType');
  if (premier) {
    await addActionRow(code, {
      type: premier, date: s(form, 'premierDate'), heure: s(form, 'premierHeure'),
      duree: s(form, 'premierDuree'), note: s(form, 'premierNote'), resultat: 'Oui',
    });
  }
  refresh('/clients', '/pipeline');
  redirect(`/clients/${code}?ok=cree`);
}

export async function updateClient(form: FormData) {
  const code = s(form, 'code');
  const c = (await getClients()).find((x) => x.code === code);
  if (!c) redirect('/clients');
  const fields = ['nom', 'tel', 'tel2', 'ville', 'type', 'origine', 'interet', 'degre', 'statut', 'prochaine', 'blocage', 'notes'] as const;
  const patch: Record<string, string> = {};
  for (const k of fields) if (form.has(k)) patch[k] = s(form, k);
  if (form.has('dateProchaine')) patch.dateProchaine = parseDate(s(form, 'dateProchaine'));
  patch.maj = today();
  await updateRow('Clients', c._raw, toSheet('Clients', patch));
  refresh('/clients', `/clients/${code}`, '/pipeline');
  redirect(`/clients/${code}?ok=maj`);
}

export async function addAction(form: FormData) {
  const code = s(form, 'code');
  const c = (await getClients()).find((x) => x.code === code);
  if (!c) redirect('/clients');
  await addActionRow(code, {
    type: s(form, 'type'), date: s(form, 'date'), heure: s(form, 'heure'),
    duree: s(form, 'duree'), resultat: s(form, 'resultat'), note: s(form, 'note'),
  });
  const patch: Record<string, string> = { maj: today() };
  for (const k of ['statut', 'degre', 'prochaine', 'blocage'] as const) if (s(form, k)) patch[k] = s(form, k);
  if (form.has('dateProchaine')) patch.dateProchaine = parseDate(s(form, 'dateProchaine'));
  await updateRow('Clients', c._raw, toSheet('Clients', patch));
  refresh('/clients', `/clients/${code}`, '/relances', '/pipeline');
  const back = s(form, 'retour');
  redirect(back || `/clients/${code}?ok=action`);
}

export async function moveStatut(code: string, statut: string) {
  const c = (await getClients()).find((x) => x.code === code);
  if (!c || c.statut === statut) return;
  await updateRow('Clients', c._raw, toSheet('Clients', { statut, maj: today() }));
  await addActionRow(code, { type: 'Note', note: `Statut : ${c.statut || '—'} → ${statut}` });
  refresh('/pipeline', '/clients', `/clients/${code}`);
}

/* ---------- Réservations & stock ---------- */

export async function createReservation(form: FormData) {
  const code = s(form, 'code');
  const lotId = s(form, 'lot');
  const [clients, stock, tarifs, resas] = await Promise.all([getClients(), getStock(), getTarifs(), getReservations()]);
  const c = clients.find((x) => x.code === code);
  const lot = stock.find((x) => x.lot === lotId);
  if (!c || !lot) redirect('/reservations?erreur=selection');
  if (!ETATS_LOT_LIBRES.includes(lot.etat)) redirect('/reservations?erreur=indisponible');
  const t = tarifDe(lot, tarifs);
  const prixManuel = Number(s(form, 'prix').replace(/\s/g, ''));
  const prix = prixManuel > 0 ? prixManuel : Math.round(t.net);
  await appendRow('Reservations', toSheet('Reservations', {
    id: nextId('RS', resas.map((r) => r.id)),
    code, lot: lotId, date: parseDate(s(form, 'date')) || today(),
    etat: 'Réservé', paiement: s(form, 'paiement'),
    prixFige: prix || '', prixM2: prix && t.surface ? Math.round(prix / t.surface) : '',
    observation: s(form, 'observation'), traitePar: COMMERCIAL,
  }));
  await updateRow('Stock', lot._raw, toSheet('Stock', { etat: 'Réservé', code }));
  await updateRow('Clients', c._raw, toSheet('Clients', { statut: 'Réservation', maj: today() }));
  await addActionRow(code, { type: 'Réservation', note: `Réservation du lot ${lotId}${prix ? ` — ${prix} DH` : ''}` });
  refresh('/reservations', '/stock', '/clients', `/clients/${code}`, '/pipeline');
  redirect('/reservations?ok=reserve');
}

const ETAT_STOCK: Record<string, string> = {
  'Réservé': 'Réservé', 'En cours de signature': 'Compromis', 'Vendu': 'Vendu', 'Annulé': 'Disponible',
};
const ETAT_CLIENT: Record<string, string> = {
  'Réservé': 'Réservation', 'En cours de signature': 'Réservation', 'Vendu': 'Vente', 'Annulé': 'À relancer',
};

export async function updateReservationEtat(form: FormData) {
  const id = s(form, 'id');
  const etat = s(form, 'etat');
  const [resas, stock, clients] = await Promise.all([getReservations(), getStock(), getClients()]);
  const r = resas.find((x) => x.id === id);
  if (!r || r.etat === etat) return;
  await updateRow('Reservations', r._raw, toSheet('Reservations', { etat }));
  const lot = stock.find((x) => x.lot === r.lot);
  if (lot && ETAT_STOCK[etat]) {
    await updateRow('Stock', lot._raw, toSheet('Stock', { etat: ETAT_STOCK[etat], code: etat === 'Annulé' ? '' : r.code }));
  }
  const c = clients.find((x) => x.code === r.code);
  if (c && ETAT_CLIENT[etat]) await updateRow('Clients', c._raw, toSheet('Clients', { statut: ETAT_CLIENT[etat], maj: today() }));
  if (c) await addActionRow(r.code, { type: 'Note', note: `Réservation ${r.lot} : ${r.etat} → ${etat}` });
  refresh('/reservations', '/stock', '/clients', `/clients/${r.code}`, '/pipeline');
}

export async function updateLot(form: FormData) {
  const lot = (await getStock()).find((x) => x.lot === s(form, 'lot'));
  if (!lot) redirect('/stock?erreur=lot');
  const patch: Record<string, string> = { etat: s(form, 'etat') };
  if (form.has('verif')) patch.verif = s(form, 'verif');
  await updateRow('Stock', lot._raw, toSheet('Stock', patch));
  refresh('/stock', '/reservations');
  redirect('/stock?ok=lot');
}

/* ---------- Tarifs ---------- */

export async function saveTarifs(form: FormData) {
  const tarifs = await getTarifs();
  const motif = s(form, 'motif') || 'Mise à jour';
  const date = parseDate(s(form, 'dateEffet')) || today();
  for (const t of tarifs) {
    const key = `${t.tranche}|${t.niveau}`;
    const cat = s(form, `cat:${key}`).replace(/\s/g, '');
    const net = s(form, `net:${key}`).replace(/\s/g, '');
    const oldCat = t.catalogue.replace(/[\s\u202f\u00a0]/g, '');
    const oldNet = t.net.replace(/[\s\u202f\u00a0]/g, '');
    if (cat === oldCat && net === oldNet) continue;
    await updateRow('Tarifs', t._raw, toSheet('Tarifs', {
      catalogue: cat ? Number(cat) : '', net: net ? Number(net) : '', dateEffet: date, note: motif,
    }));
    await appendRow('Historique_Tarifs', toSheet('Historique_Tarifs', {
      date, tranche: t.tranche, niveau: t.niveau,
      ancienCat: oldCat, nouveauCat: cat, ancienNet: oldNet, nouveauNet: net, motif,
    }));
  }
  refresh('/tarifs', '/stock', '/reservations');
  redirect('/tarifs?ok=1');
}

/* ---------- Fiche mensuelle ---------- */

export async function addObjectif(form: FormData) {
  await appendRow('Objectifs', toSheet('Objectifs', {
    mois: s(form, 'mois'), indicateur: s(form, 'indicateur'), objectif: s(form, 'objectif'),
    justification: s(form, 'justification'), responsable: COMMERCIAL, echeance: parseDate(s(form, 'echeance')),
  }));
  refresh('/mensuel');
  redirect(`/mensuel?mois=${s(form, 'retourMois')}#objectifs`);
}

export async function addPlan(form: FormData) {
  await appendRow('Plan_Action', toSheet('Plan_Action', {
    mois: s(form, 'mois'), action: s(form, 'action'), resultat: s(form, 'resultat'), canal: s(form, 'canal'),
    cible: s(form, 'cible'), priorite: s(form, 'priorite'), responsable: COMMERCIAL,
    debut: parseDate(s(form, 'debut')), echeance: parseDate(s(form, 'echeance')),
    indicateur: s(form, 'indicateur'), statut: 'À faire',
  }));
  refresh('/mensuel');
  redirect(`/mensuel?mois=${s(form, 'retourMois')}#plan`);
}

export async function updatePlanStatut(form: FormData) {
  const p = (await getPlan()).find((x) => x._row === Number(s(form, 'row')));
  if (!p) return;
  await updateRow('Plan_Action', p._raw, toSheet('Plan_Action', { statut: s(form, 'statut') }));
  refresh('/mensuel');
}
