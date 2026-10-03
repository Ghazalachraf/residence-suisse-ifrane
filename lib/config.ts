export const TABLES = {
  Clients: process.env.SHEET_CLIENTS ?? '1FFlQL_SvXXB4ImSnwRqK9Bl6osaMuJFuFl5hcbHFGZ8',
  Actions: process.env.SHEET_ACTIONS ?? '1h0RN57UDVmeQibFBvPXxxqqDrphQUgmC87wLSJi-NqU',
  Reservations: process.env.SHEET_RESERVATIONS ?? '1zVigUp9Wd0MoAhOLt-SzwEqS_Lraqw_MrME5z0i_yWI',
  Stock: process.env.SHEET_STOCK ?? '1ZRFtFt6jU1sgpzmorXK8jGkY_Cr6y5phmTZNjV2Oido',
  Tarifs: process.env.SHEET_TARIFS ?? '1Zr2XdGILqt5t-eDXJRrrlRoXdZUmcV2rRljTuMU8vAs',
  Historique_Tarifs: process.env.SHEET_HISTORIQUE_TARIFS ?? '1Fjnc1241KPf57BDawGnvK4BVm7NndjFtRmgvffct3-s',
  Objectifs: process.env.SHEET_OBJECTIFS ?? '1kv0Y_LcTOLnHzOj4X-iMzcV6UVZwZcySBFD_V43cW0M',
  Plan_Action: process.env.SHEET_PLAN_ACTION ?? '1YyFiq7AMSb2RhYTGIF-pyi6Zpbi-DvXrBFgEmJ1DhAw',
  Listes: process.env.SHEET_LISTES ?? '1ob67bl-9TPwdPv6QAEkkoI15r5d3UaLNkLRwk9LaoMw',
} as const;

export type Table = keyof typeof TABLES;

export const COMMERCIAL = 'Achraf';
export const PROJET = 'Résidence Suisse — Ifrane';

export const STATUTS = [
  'Nouveau', 'À relancer', 'Visite planifiée', 'Visite réalisée',
  'Prospect chaud', 'Négociation', 'Réservation', 'Vente', 'Perdu',
] as const;

export const STATUTS_ACTIFS = ['Nouveau', 'À relancer', 'Visite planifiée', 'Visite réalisée', 'Prospect chaud', 'Négociation'];

export const ETATS_LOT_LIBRES = ['Disponible', 'Option'];
