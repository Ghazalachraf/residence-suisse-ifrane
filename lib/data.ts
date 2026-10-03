import 'server-only';
import { readTable, Row } from './sheets';
import { Table } from './config';
import { parseDate, parseNum } from './utils';

export const COLS = {
  Clients: {
    code: 'Code client', nom: 'Nom et prénom', tel: 'Téléphone', tel2: 'Téléphone 2', ville: 'Ville',
    type: 'Type client', origine: 'Origine prospect', interet: 'Intérêt pour', degre: "Degré d'intérêt",
    statut: 'Statut pipeline', prochaine: 'Prochaine action', dateProchaine: 'Date prochaine action',
    blocage: 'Blocage / objection', traitePar: 'Traité par', creation: 'Date création',
    maj: 'Dernière mise à jour', notes: 'Notes',
  },
  Actions: {
    id: 'ID action', code: 'Code client', date: 'Date', heure: 'Heure', type: 'Type action',
    duree: 'Durée (min)', resultat: 'Résultat / réponse', note: 'Note', traitePar: 'Traité par', source: 'Source import',
  },
  Reservations: {
    id: 'ID réservation', code: 'Code client', lot: 'Lot', date: 'Date réservation', etat: 'État réservation',
    paiement: 'Mode de paiement', prixFige: 'Prix net figé (DH)', prixM2: 'Prix/m² figé (DH)',
    observation: 'Observation', traitePar: 'Traité par',
  },
  Stock: {
    lot: 'Lot', tranche: 'Tranche', immeuble: 'Immeuble', niveau: 'Niveau', num: 'N° appt',
    surface: 'Surface (m²)', modele: 'Modèle', etat: 'État', code: 'Code client',
    clientRef: 'Client (référence import)', verif: 'À vérifier',
  },
  Tarifs: {
    tranche: 'Tranche', niveau: 'Niveau', catalogue: 'Prix catalogue (DH/m²)', net: 'Prix net (DH/m²)',
    dateEffet: "Date d'effet", note: 'Note',
  },
  Historique_Tarifs: {
    date: 'Date modification', tranche: 'Tranche', niveau: 'Niveau', ancienCat: 'Ancien catalogue',
    nouveauCat: 'Nouveau catalogue', ancienNet: 'Ancien net', nouveauNet: 'Nouveau net', motif: 'Motif',
  },
  Objectifs: {
    mois: 'Mois', indicateur: 'Indicateur', objectif: 'Objectif', justification: 'Justification / hypothèse',
    responsable: 'Responsable', echeance: 'Échéance',
  },
  Plan_Action: {
    mois: 'Mois', action: 'Action à réaliser', resultat: 'Résultat attendu', canal: 'Canal', cible: 'Cible',
    priorite: 'Priorité', responsable: 'Responsable', debut: 'Date début', echeance: 'Échéance',
    indicateur: 'Indicateur de réussite', statut: 'Statut',
  },
} as const;

type Cols = typeof COLS;
export type Rec<T extends keyof Cols> = { [K in keyof Cols[T]]: string } & { _row: number; _raw: Row };

function pick<T extends keyof Cols>(t: T, row: Row): Rec<T> {
  const m = COLS[t] as Record<string, string>;
  const o: Record<string, unknown> = { _row: row._row, _raw: row };
  for (const k in m) o[k] = row[m[k]] ?? '';
  return o as Rec<T>;
}

/** Convertit un objet { cle: valeur } vers les en-têtes de colonnes de la table. */
export function toSheet<T extends keyof Cols>(t: T, obj: Partial<Record<keyof Cols[T], string | number>>) {
  const m = COLS[t] as Record<string, string>;
  const o: Record<string, string | number> = {};
  for (const k in obj) {
    const v = obj[k as keyof typeof obj];
    if (v !== undefined) o[m[k]] = v as string | number;
  }
  return o;
}

async function all<T extends keyof Cols>(t: T): Promise<Rec<T>[]> {
  return (await readTable(t as Table)).map((r) => pick(t, r));
}

export type Client = Rec<'Clients'>;
export type Action = Rec<'Actions'>;
export type Reservation = Rec<'Reservations'>;
export type Lot = Rec<'Stock'>;
export type Tarif = Rec<'Tarifs'>;

export const getClients = () => all('Clients');
export const getActions = () => all('Actions');
export const getReservations = () => all('Reservations');
export const getStock = () => all('Stock');
export const getTarifs = () => all('Tarifs');
export const getHistoriqueTarifs = () => all('Historique_Tarifs');
export const getObjectifs = () => all('Objectifs');
export const getPlan = () => all('Plan_Action');

export async function getClient(code: string) {
  return (await getClients()).find((c) => c.code === code);
}

export async function getListes(): Promise<Record<string, string[]>> {
  const rows = await readTable('Listes');
  const out: Record<string, string[]> = {};
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (k === '_row' || !r[k]) continue;
      (out[k] ??= []).push(r[k]);
    }
  }
  return out;
}

export function tarifDe(lot: Lot, tarifs: Tarif[]) {
  const t = tarifs.find((x) => x.tranche === lot.tranche && x.niveau === lot.niveau);
  const net = parseNum(t?.net);
  const cat = parseNum(t?.catalogue);
  const surface = parseNum(lot.surface);
  return { netM2: net, catM2: cat, net: net * surface, catalogue: cat * surface, surface };
}

export const sortByDateDesc = <T extends { date: string; heure?: string }>(a: T, b: T) =>
  (parseDate(b.date) + (b.heure ?? '')).localeCompare(parseDate(a.date) + (a.heure ?? ''));

export function nextId(prefix: string, ids: string[], pad = 3) {
  const max = ids.reduce((m, id) => {
    const n = parseInt(id.replace(prefix, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return prefix + String(max + 1).padStart(pad, '0');
}
