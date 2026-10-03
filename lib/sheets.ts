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
  const h = await headers(t);
  const merged = h.map((k) => (patch[k] !== undefined ? patch[k] : row[k] ?? ''));
  await api().spreadsheets.values.update({
    spreadsheetId: TABLES[t],
    range: `'${await tab(t)}'!A${row._row}`,
    valueInputOption: 'RAW',
    requestBody: { values: [merged] },
  });
}

/** Mode test local (lecture seule) : LOCAL_CSV_DIR=dossier contenant Clients.csv, Stock.csv… */
async function localCsv(t: Table): Promise<string[][]> {
  const { readFile } = await import('node:fs/promises');
  const txt = await readFile(`${process.env.LOCAL_CSV_DIR}/${t}.csv`, 'utf8').catch(() => '');
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"' && txt[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
