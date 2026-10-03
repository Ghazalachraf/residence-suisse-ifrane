import 'server-only';
import { google, sheets_v4 } from 'googleapis';
import { cache } from 'react';
import { TABLES, Table } from './config';

export type Row = Record<string, string> & { _row: number };
type Cell = string | number;

let client: sheets_v4.Sheets | null = null;

function api(): sheets_v4.Sheets {
  if (client) return client;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error(
      'Connexion Google non configurée : renseigne GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_PRIVATE_KEY (voir README).',
    );
  }
  const auth = new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  client = google.sheets({ version: 'v4', auth });
  return client;
}

const tabNames = new Map<string, string>();

async function tab(t: Table): Promise<string> {
  const id = TABLES[t];
  const known = tabNames.get(id);
  if (known) return known;
  const res = await api().spreadsheets.get({ spreadsheetId: id, fields: 'sheets.properties.title' });
  const name = res.data.sheets?.[0]?.properties?.title ?? 'Sheet1';
  tabNames.set(id, name);
  return name;
}

async function values(t: Table, range = ''): Promise<string[][]> {
  const name = await tab(t);
  const res = await api().spreadsheets.values.get({
    spreadsheetId: TABLES[t],
    range: `'${name}'${range}`,
    valueRenderOption: 'FORMATTED_VALUE',
  });
  return (res.data.values ?? []) as string[][];
}

/** Lit une table complète. Mis en cache pendant la durée d'une requête. */
export const readTable = cache(async (t: Table): Promise<Row[]> => {
  const v = process.env.LOCAL_CSV_DIR ? await localCsv(t) : await values(t);
  const headers = v[0] ?? [];
  return v
    .slice(1)
    .map((r, i) => {
      const o: Record<string, string | number> = { _row: i + 2 };
      headers.forEach((h, j) => (o[h] = String(r[j] ?? '').trim()));
      return o as Row;
    })
    .filter((o) => headers.some((h) => o[h]));
});

async function headers(t: Table): Promise<string[]> {
  return (await values(t, '!1:1'))[0] ?? [];
}

export async function appendRow(t: Table, obj: Record<string, Cell>) {
  if (process.env.LOCAL_CSV_DIR) return localWrite(t, (rows) => rows.push(rows[0].map((k) => String(obj[k] ?? ''))));
  const h = await headers(t);
  await api().spreadsheets.values.append({
    spreadsheetId: TABLES[t],
    range: `'${await tab(t)}'!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [h.map((k) => obj[k] ?? '')] },
  });
}

export async function updateRow(t: Table, row: Row, patch: Record<string, Cell>) {
  if (process.env.LOCAL_CSV_DIR) {
    return localWrite(t, (rows) => {
      const i = row._row - 1;
      if (!rows[i]) throw new Error(`${t}.csv : ligne ${row._row} introuvable.`);
      rows[i] = rows[0].map((k, j) => String(patch[k] !== undefined ? patch[k] : rows[i][j] ?? ''));
    });
  }
  const h = await headers(t);
  const merged = h.map((k) => (patch[k] !== undefined ? patch[k] : row[k] ?? ''));
  await api().spreadsheets.values.update({
    spreadsheetId: TABLES[t],
    range: `'${await tab(t)}'!A${row._row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [merged] },
  });
}

/*
 * Mode local : LOCAL_CSV_DIR=dossier contenant Clients.csv, Stock.csv… (export « CSV » de chaque Google Sheet).
 * Lecture et écriture. Accepte UTF-8 (avec ou sans BOM) ou ANSI, séparateur « , » ou « ; » (CSV enregistré par Excel FR) ;
 * l'écriture conserve le séparateur du fichier et ajoute un BOM UTF-8 pour qu'Excel affiche les accents.
 */
type CsvFile = { rows: string[][]; sep: string };

const csvPath = (t: Table) => `${process.env.LOCAL_CSV_DIR}/${t}.csv`;

async function localCsv(t: Table): Promise<string[][]> {
  return (await readCsv(t)).rows;
}

async function readCsv(t: Table): Promise<CsvFile> {
  const { readFile } = await import('node:fs/promises');
  const buf = await readFile(csvPath(t)).catch(() => null);
  if (!buf) return { rows: [], sep: ',' };
  let txt = buf.toString('utf8');
  if (txt.includes('�')) txt = buf.toString('latin1');
  txt = txt.replace(/^﻿/, '');
  const first = txt.slice(0, txt.indexOf('\n') >>> 0);
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"' && txt[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return { rows, sep };
}

let writeQueue: Promise<unknown> = Promise.resolve();

/** Relit le fichier, applique la modification, puis le remplace (écritures en file pour éviter les pertes). */
function localWrite(t: Table, edit: (rows: string[][]) => void): Promise<void> {
  const job = writeQueue.then(async () => {
    const { writeFile, rename } = await import('node:fs/promises');
    const { rows, sep } = await readCsv(t);
    if (!rows[0]?.length) throw new Error(`${csvPath(t)} introuvable ou sans en-têtes.`);
    edit(rows);
    const esc = (v: string) => (/["\r\n]/.test(v) || v.includes(sep) ? `"${v.replace(/"/g, '""')}"` : v);
    const out = '﻿' + rows.map((r) => r.map(esc).join(sep)).join('\r\n') + '\r\n';
    const tmp = `${csvPath(t)}.tmp`;
    await writeFile(tmp, out, 'utf8');
    await rename(tmp, csvPath(t)).catch((e) => {
      throw new Error(`Impossible d'enregistrer ${t}.csv (fichier ouvert dans Excel ?) : ${e.message}`);
    });
  });
  writeQueue = job.catch(() => {});
  return job;
}
