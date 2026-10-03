import 'server-only';
import ExcelJS from 'exceljs';
import { COMMERCIAL, PROJET } from './config';
import {
  getActions, getClients, getReservations, getStock, getTarifs, getHistoriqueTarifs, tarifDe,
} from './data';
import { rapportMensuel } from './report';
import { fmtDate, monthLabel, monthOf, parseNum, today } from './utils';

const SAPIN = 'FF1E3A2F';
const PIERRE = 'FFE4E1D8';
const GIVRE = 'FFF1F3EF';

type Col = { header: string; key: string; width?: number; num?: boolean };

function table(ws: ExcelJS.Worksheet, startRow: number, cols: Col[], rows: Record<string, unknown>[]) {
  const head = ws.getRow(startRow);
  cols.forEach((c, i) => {
    const cell = head.getCell(i + 1);
    cell.value = c.header;
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SAPIN } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    ws.getColumn(i + 1).width = Math.max(ws.getColumn(i + 1).width ?? 0, c.width ?? 16);
  });
  head.height = 28;
  rows.forEach((r, j) => {
    const row = ws.getRow(startRow + 1 + j);
    cols.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const v = r[c.key];
      cell.value = (v === null || v === undefined ? '' : v) as ExcelJS.CellValue;
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = { vertical: 'top', wrapText: true };
      if (c.num) cell.numFmt = '#,##0';
      if (j % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GIVRE } };
      cell.border = { bottom: { style: 'thin', color: { argb: PIERRE } } };
    });
  });
  return startRow + rows.length + 1;
}

function entete(ws: ExcelJS.Worksheet, titre: string, sousTitre: string, span: number) {
  ws.mergeCells(1, 1, 1, span);
  const t = ws.getCell(1, 1);
  t.value = titre;
  t.font = { name: 'Arial', bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SAPIN } };
  t.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;
  ws.mergeCells(2, 1, 2, span);
  const st = ws.getCell(2, 1);
  st.value = sousTitre;
  st.font = { name: 'Arial', italic: true, size: 10, color: { argb: SAPIN } };
  st.alignment = { horizontal: 'center' };
  const info = ws.getRow(4);
  info.getCell(1).value = `Commercial : ${COMMERCIAL}`;
  info.getCell(3).value = `Projet : ${PROJET}`;
  info.getCell(span > 6 ? 6 : span).value = `Édité le : ${fmtDate(today())}`;
  info.font = { name: 'Arial', size: 10, bold: true };
}

function simple(titre: string, cols: Col[], rows: Record<string, unknown>[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(titre.slice(0, 31));
  entete(ws, `${titre.toUpperCase()} — RÉSIDENCE SUISSE`, `Export du ${fmtDate(today())}`, cols.length);
  table(ws, 6, cols, rows);
  ws.views = [{ state: 'frozen', ySplit: 6 }];
  return wb;
}

export async function buildExport(section: string, mois?: string): Promise<{ wb: ExcelJS.Workbook; name: string }> {
  const m = mois || today().slice(0, 7);
  const clients = await getClients();
  const nomDe = (code: string) => clients.find((c) => c.code === code)?.nom ?? '';

  switch (section) {
    case 'clients':
      return {
        name: `Clients_${today()}`,
        wb: simple('Clients', [
          { header: 'Code', key: 'code', width: 9 }, { header: 'Nom et prénom', key: 'nom', width: 26 },
          { header: 'Téléphone', key: 'tel', width: 18 }, { header: 'Ville', key: 'ville', width: 14 },
          { header: 'Type client', key: 'type', width: 13 }, { header: 'Origine', key: 'origine', width: 16 },
          { header: 'Intérêt', key: 'interet', width: 14 }, { header: "Degré d'intérêt", key: 'degre', width: 12 },
          { header: 'Statut', key: 'statut', width: 15 }, { header: 'Prochaine action', key: 'prochaine', width: 22 },
          { header: 'Date prochaine action', key: 'dateProchaine', width: 14 }, { header: 'Blocage / objection', key: 'blocage', width: 26 },
          { header: 'Création', key: 'creation', width: 12 }, { header: 'Notes', key: 'notes', width: 40 },
        ], clients.map((c) => ({ ...c, dateProchaine: fmtDate(c.dateProchaine), creation: fmtDate(c.creation) }))),
      };
    case 'relances': {
      const actions = (await getActions()).filter((a) => monthOf(a.date) === m);
      return {
        name: `Relances_${m}`,
        wb: simple(`Relances ${monthLabel(m)}`, [
          { header: 'Date', key: 'date', width: 12 }, { header: 'Heure', key: 'heure', width: 8 },
          { header: 'Code', key: 'code', width: 9 }, { header: 'Client', key: 'nom', width: 24 },
          { header: 'Type', key: 'type', width: 20 }, { header: 'Résultat', key: 'resultat', width: 14 },
          { header: 'Note', key: 'note', width: 50 }, { header: 'Traité par', key: 'traitePar', width: 11 },
        ], actions.map((a) => ({ ...a, date: fmtDate(a.date), nom: nomDe(a.code) }))),
      };
    }
    case 'reservations': {
      const resas = await getReservations();
      return {
        name: `Reservations_${today()}`,
        wb: simple('Réservations', [
          { header: 'ID', key: 'id', width: 8 }, { header: 'Client', key: 'nom', width: 24 },
          { header: 'Lot', key: 'lot', width: 9 }, { header: 'Date', key: 'date', width: 12 },
          { header: 'État', key: 'etat', width: 18 }, { header: 'Paiement', key: 'paiement', width: 20 },
          { header: 'Prix net figé (DH)', key: 'prix', width: 16, num: true }, { header: 'Prix/m² (DH)', key: 'm2', width: 12, num: true },
          { header: 'Observation', key: 'observation', width: 36 },
        ], resas.map((r) => ({ ...r, nom: nomDe(r.code), date: fmtDate(r.date), prix: parseNum(r.prixFige) || '', m2: parseNum(r.prixM2) || '' }))),
      };
    }
    case 'stock': {
      const [stock, tarifs] = await Promise.all([getStock(), getTarifs()]);
      return {
        name: `Stock_${today()}`,
        wb: simple('État de stock', [
          { header: 'Lot', key: 'lot', width: 9 }, { header: 'Tranche', key: 'tranche', width: 9 },
          { header: 'Immeuble', key: 'immeuble', width: 10 }, { header: 'Niveau', key: 'niveau', width: 11 },
          { header: 'Surface (m²)', key: 'surface', width: 11, num: true }, { header: 'État', key: 'etat', width: 22 },
          { header: 'Prix net/m²', key: 'm2', width: 12, num: true }, { header: 'Prix net total (DH)', key: 'total', width: 16, num: true },
          { header: 'Client', key: 'client', width: 22 }, { header: 'À vérifier', key: 'verif', width: 36 },
        ], stock.map((l) => {
          const t = tarifDe(l, tarifs);
          return { ...l, surface: parseNum(l.surface), m2: t.netM2 || '', total: Math.round(t.net) || '', client: nomDe(l.code) || l.clientRef };
        })),
      };
    }
    case 'tarifs': {
      const [tarifs, hist] = await Promise.all([getTarifs(), getHistoriqueTarifs()]);
      const wb = simple('Grille tarifaire', [
        { header: 'Tranche', key: 'tranche' }, { header: 'Niveau', key: 'niveau' },
        { header: 'Catalogue (DH/m²)', key: 'cat', num: true }, { header: 'Net (DH/m²)', key: 'net', num: true },
        { header: "Date d'effet", key: 'dateEffet' }, { header: 'Note', key: 'note', width: 30 },
      ], tarifs.map((t) => ({ ...t, cat: parseNum(t.catalogue) || '', net: parseNum(t.net) || '', dateEffet: fmtDate(t.dateEffet) })));
      const ws = wb.addWorksheet('Historique');
      table(ws, 1, [
        { header: 'Date', key: 'date' }, { header: 'Tranche', key: 'tranche' }, { header: 'Niveau', key: 'niveau' },
        { header: 'Ancien net', key: 'ancienNet' }, { header: 'Nouveau net', key: 'nouveauNet' },
        { header: 'Ancien catalogue', key: 'ancienCat' }, { header: 'Nouveau catalogue', key: 'nouveauCat' }, { header: 'Motif', key: 'motif', width: 30 },
      ], hist.map((h) => ({ ...h, date: fmtDate(h.date) })));
      return { name: `Tarifs_${today()}`, wb };
    }
    case 'mensuel':
      return { name: `Fiche_mensuelle_${m}`, wb: await ficheMensuelle(m) };
    default:
      throw new Error('Section inconnue');
  }
}

async function ficheMensuelle(mois: string) {
  const r = await rapportMensuel(mois);
  const wb = new ExcelJS.Workbook();
  const titre = 'FICHE MENSUELLE DE PILOTAGE COMMERCIAL';

  const p1 = wb.addWorksheet('01 - Bilan du mois');
  entete(p1, titre, `PAGE 1 • Réalisations et performance du mois — ${monthLabel(mois)}`, 6);
  table(p1, 6, [
    { header: 'Indicateur', key: 'indicateur', width: 30 }, { header: 'Objectif', key: 'objectif', width: 11 },
    { header: 'Réalisé', key: 'realise', width: 11 }, { header: 'Écart', key: 'ecart', width: 10 },
    { header: 'Taux réalisation', key: 'taux', width: 14 }, { header: 'Commentaires / explication', key: 'commentaire', width: 44 },
  ], r.bilan.map((b) => ({ ...b, taux: b.taux === null ? '' : `${b.taux}%` })));

  const p2 = wb.addWorksheet('02 - Relances & Pipeline');
  entete(p2, titre, `PAGE 2 • Relances effectuées, prospects chauds et prochaines étapes — ${monthLabel(mois)}`, 9);
  table(p2, 6, [
    { header: 'Client / prospect', key: 'nom', width: 24 }, { header: 'Téléphone', key: 'tel', width: 17 },
    { header: 'Bien / intérêt', key: 'interet', width: 14 }, { header: 'Dernier contact', key: 'dernier', width: 13 },
    { header: 'Relances du mois', key: 'relances', width: 10 }, { header: 'Degré intérêt', key: 'degre', width: 11 },
    { header: 'Blocage / objection', key: 'blocage', width: 28 }, { header: 'Prochaine étape', key: 'prochaine', width: 22 },
    { header: 'Date prochaine action', key: 'date', width: 13 },
  ], r.pipeline.map((p) => ({
    nom: p.client.nom, tel: p.client.tel, interet: p.client.interet, dernier: fmtDate(p.dernierContact),
    relances: p.relancesMois, degre: p.client.degre, blocage: p.client.blocage,
    prochaine: p.client.prochaine || p.client.statut, date: fmtDate(p.client.dateProchaine),
  })));

  const p3 = wb.addWorksheet('03 - Objectifs M+1');
  entete(p3, titre, `PAGE 3 • Objectifs chiffrés à atteindre en ${monthLabel(r.suivant)}`, 7);
  table(p3, 6, [
    { header: 'Indicateur', key: 'indicateur', width: 30 }, { header: 'Réalisé M', key: 'realiseM', width: 11 },
    { header: 'Objectif M+1', key: 'objectif', width: 12 }, { header: 'Évolution visée', key: 'evolution', width: 13 },
    { header: 'Justification / hypothèse', key: 'justification', width: 40 }, { header: 'Responsable', key: 'responsable', width: 12 },
    { header: 'Échéance', key: 'echeance', width: 12 },
  ], r.objectifsSuivant.map((o) => ({ ...o, evolution: o.evolution === null ? '' : `${o.evolution > 0 ? '+' : ''}${o.evolution}%`, echeance: fmtDate(o.echeance) })));

  const p4 = wb.addWorksheet("04 - Plan d'action");
  entete(p4, titre, `PAGE 4 • Plan d'action commercial — ${monthLabel(r.suivant)}`, 11);
  table(p4, 6, [
    { header: 'Mois', key: 'mois', width: 9 }, { header: 'Action à réaliser', key: 'action', width: 32 },
    { header: 'Résultat attendu', key: 'resultat', width: 24 }, { header: 'Canal', key: 'canal', width: 14 },
    { header: 'Cible', key: 'cible', width: 14 }, { header: 'Priorité', key: 'priorite', width: 10 },
    { header: 'Responsable', key: 'responsable', width: 11 }, { header: 'Date début', key: 'debut', width: 12 },
    { header: 'Échéance', key: 'echeance', width: 12 }, { header: 'Indicateur de réussite', key: 'indicateur', width: 22 },
    { header: 'Statut', key: 'statut', width: 10 },
  ], r.plan.map((p) => ({ ...p, debut: fmtDate(p.debut), echeance: fmtDate(p.echeance) })));

  return wb;
}
