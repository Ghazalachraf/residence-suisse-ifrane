export const LIENS = [
  { href: '/', label: "Aujourd'hui", mobile: true },
  { href: '/clients', label: 'Clients', mobile: true },
  { href: '/relances', label: 'Relances', mobile: false },
  { href: '/pipeline', label: 'Pipeline', mobile: true },
  { href: '/reservations', label: 'Réservations', mobile: false },
  { href: '/stock', label: 'Stock', mobile: true },
  { href: '/tarifs', label: 'Tarifs', mobile: false },
  { href: '/mensuel', label: 'Fiche mensuelle', mobile: false },
];
export const LIENS_PLUS = LIENS.filter((l) => !l.mobile);
