import Link from 'next/link';
import { firstPhone, waLink } from '@/lib/utils';

const STATUT_COULEUR: Record<string, string> = {
  'Nouveau': 'bg-[#EEF0F2] text-[#4A5560]',
  'À relancer': 'bg-[#FBF0DC] text-[#8A5A0B]',
  'Visite planifiée': 'bg-[#E3EEF5] text-[#2C5E7A]',
  'Visite réalisée': 'bg-[#E1F0EC] text-[#22604F]',
  'Prospect chaud': 'bg-[#F8E3D9] text-[#9A3F17]',
  'Négociation': 'bg-[#EEE5F3] text-[#5E3A7A]',
  'Réservation': 'bg-[#DCEEDC] text-[#24612A]',
  'Vente': 'bg-sapin text-neige',
  'Perdu': 'bg-[#EDEBE6] text-granit line-through',
  // états de lot
  'Disponible': 'bg-[#DCEEDC] text-[#24612A]',
  'Option': 'bg-[#EEE5F3] text-[#5E3A7A]',
  'Réservé': 'bg-[#FBF0DC] text-[#8A5A0B]',
  'En cours de réservation': 'bg-[#FBF0DC] text-[#8A5A0B]',
  'Compromis': 'bg-[#F8E3D9] text-[#9A3F17]',
  'En cours de signature': 'bg-[#F8E3D9] text-[#9A3F17]',
  'Vendu': 'bg-[#E4E1D8] text-[#3D3C37]',
  'Vendu contentieux Fethi': 'bg-[#F2DCDC] text-[#7A2424]',
  'Annulé': 'bg-[#EDEBE6] text-granit line-through',
  'À préciser': 'bg-white text-granit border border-dashed border-granit/50',
};

export const TUILE_LOT: Record<string, string> = {
  'Disponible': 'bg-[#E9F4E6] border-[#9CC59A] text-[#1F4F24]',
  'Option': 'bg-[#F3ECF7] border-[#BFA3D1] text-[#4D2F66]',
  'Réservé': 'bg-[#FCF3E1] border-[#E3C27E] text-[#6E480A]',
  'En cours de réservation': 'bg-[#FCF3E1] border-[#E3C27E] text-[#6E480A]',
  'Compromis': 'bg-[#FAEAE1] border-[#DDA184] text-[#7C3313]',
  'Vendu': 'bg-[#D8D5CC] border-[#B9B5AA] text-[#45443F]',
  'Vendu contentieux Fethi': 'bg-[#F2DCDC] border-[#D49A9A] text-[#6E2020]',
  'À préciser': 'bg-white border-dashed border-granit/50 text-granit',
};

export function Badge({ v }: { v: string }) {
  if (!v) return <span className="text-granit">—</span>;
  return (
    <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[12px] font-medium ${STATUT_COULEUR[v] ?? 'bg-givre text-granit'}`}>
      {v}
    </span>
  );
}

export function Header({ titre, children, sous }: { titre: string; sous?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[34px] leading-tight sm:text-[40px]">{titre}</h1>
        {sous && <p className="mt-1 text-[15px] text-granit">{sous}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function ExportLink({ section, mois, label = 'Exporter en Excel' }: { section: string; mois?: string; label?: string }) {
  return (
    <a className="btn-ghost" href={`/api/export/${section}${mois ? `?mois=${mois}` : ''}`}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2v8m0 0 3-3m-3 3L5 7M3 13h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {label}
    </a>
  );
}

const MESSAGES: Record<string, string> = {
  cree: 'Client créé.', maj: 'Fiche mise à jour.', action: 'Action ajoutée à la timeline.', reserve: 'Réservation enregistrée, le lot est passé en Réservé.',
  lot: 'État du lot mis à jour.', '1': 'Modifications enregistrées.',
};
const ERREURS: Record<string, string> = {
  nom: 'Le nom du client est obligatoire.', selection: 'Choisis un client et un lot.',
  indisponible: "Ce lot n'est plus disponible. Choisis un lot en état Disponible ou Option.", lot: 'Lot introuvable.',
};

export function Flash({ ok, erreur }: { ok?: string; erreur?: string }) {
  if (erreur) return <p role="alert" className="mb-5 rounded-md border border-[#D49A9A] bg-[#F9ECEC] px-4 py-3 text-[14px] text-[#6E2020]">{ERREURS[erreur] ?? erreur}</p>;
  if (ok) return <p role="status" className="mb-5 rounded-md border border-[#9CC59A] bg-[#EEF6EC] px-4 py-3 text-[14px] text-[#1F4F24]">{MESSAGES[ok] ?? 'Enregistré.'}</p>;
  return null;
}

export function Field({ label, name, children, className = '' }: { label: string; name?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`} htmlFor={name}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Select({ name, options, defaultValue, vide = true, required }: { name: string; options: readonly string[]; defaultValue?: string; vide?: boolean; required?: boolean }) {
  const opts = defaultValue && !options.includes(defaultValue) ? [defaultValue, ...options] : options;
  return (
    <select id={name} name={name} defaultValue={defaultValue ?? ''} className="field" required={required}>
      {vide && <option value="">—</option>}
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function ContactLinks({ tel }: { tel: string }) {
  if (!tel) return null;
  const t = firstPhone(tel);
  return (
    <span className="inline-flex gap-1.5">
      <a href={`tel:${t.replace(/\s/g, '')}`} className="rounded border border-pierre px-2 py-0.5 text-[12px] text-sapin hover:border-cedre">Appeler</a>
      <a href={waLink(t)} target="_blank" rel="noreferrer" className="rounded border border-pierre px-2 py-0.5 text-[12px] text-sapin hover:border-cedre">WhatsApp</a>
    </span>
  );
}

export function Empty({ children, href, cta }: { children: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="rounded-[10px] border border-dashed border-pierre px-5 py-8 text-center text-[14px] text-granit">
      <p>{children}</p>
      {href && cta && <Link href={href} className="btn mt-4">{cta}</Link>}
    </div>
  );
}
