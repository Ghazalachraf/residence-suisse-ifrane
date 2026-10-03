const TZ = 'Africa/Casablanca';

export function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

export function nowTime(): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date());
}

/** Normalise une date saisie (2026-10-03, 3/10/2026, 03/10/2026) en AAAA-MM-JJ. */
export function parseDate(s?: string): string {
  if (!s) return '';
  const t = s.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}

export function fmtDate(s?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  const d = parseDate(s);
  if (!d) return s || '—';
  return new Intl.DateTimeFormat('fr-FR', { ...opts, timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z'));
}

export function parseNum(s?: string | number): number {
  if (typeof s === 'number') return s;
  if (!s) return 0;
  const n = parseFloat(String(s).replace(/[\s\u00a0\u202f]/g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function fmtDH(n: number): string {
  if (!n) return '—';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' DH';
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
}

export const monthOf = (d: string) => parseDate(d).slice(0, 7);

export function addMonths(mois: string, n: number): string {
  const [y, m] = mois.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export function addDays(day: string, n: number): string {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function monthLabel(mois: string): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(mois + '-01T00:00:00Z'));
}

export function waLink(tel: string): string {
  let d = tel.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '212' + d.slice(1);
  return `https://wa.me/${d}`;
}

export function firstPhone(tel: string): string {
  return tel.split(/[\/,;]| tel | wts /i)[0].trim();
}

export type Saison = { nom: 'Printemps' | 'Été' | 'Automne' | 'Hiver'; accent: string; ciel: string; sol: string };

export function saison(day = today()): Saison {
  const m = Number(day.slice(5, 7));
  if (m >= 3 && m <= 5) return { nom: 'Printemps', accent: '#B9789A', ciel: '#EAF0E6', sol: '#7FA36B' };
  if (m >= 6 && m <= 8) return { nom: 'Été', accent: '#C9962E', ciel: '#EEF3EE', sol: '#4E7A4F' };
  if (m >= 9 && m <= 11) return { nom: 'Automne', accent: '#B0562D', ciel: '#F3EFE7', sol: '#8A6A3A' };
  return { nom: 'Hiver', accent: '#5F8BA3', ciel: '#EDF2F5', sol: '#DCE5EA' };
}
