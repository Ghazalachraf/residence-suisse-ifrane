# CLAUDE.md — Back office Résidence Suisse

## Contexte métier
- Utilisateur unique : Achraf, conseiller commercial (AD Facilities, branche Adfectus) sur le projet immobilier **Résidence Suisse**, Ifrane (promoteur Farah Maghreb).
- Objectif : remplacer 4 tableaux Google Sheets déconnectés (visites, relances, histoire client, réservations) + la fiche mensuelle demandée par le directeur, par une plateforme unique synchronisée.
- Langue de l'interface et du code métier : **français**. Usage mobile (terrain) et ordinateur (bureau) à parts égales.

## Stack
- Next.js 14 App Router, TypeScript strict, Tailwind 3, server actions.
- Base de données : **Google Sheets** (un fichier par table) dans le dossier Drive « Plateforme Résidence Suisse — Base de données » (id `1cHcjfJgFiripHIiYOHMn7--sLZrvX5jw`). IDs dans `lib/config.ts`, surchargeables par variables `SHEET_*`.
- Accès via compte de service Google (`googleapis`, JWT) : `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`.
- Auth : mot de passe unique `APP_PASSWORD`, cookie `rs_session` = SHA-256(`APP_PASSWORD:AUTH_SECRET`), vérifié dans `middleware.ts`.
- Exports Excel : `exceljs`, route `app/api/export/[section]/route.ts`, logique dans `lib/export.ts`.
- Déploiement prévu : Vercel.

## Architecture
- `lib/sheets.ts` : `readTable` (cache par requête), `appendRow`, `updateRow` (RAW). Mode test lecture seule via `LOCAL_CSV_DIR`.
- `lib/data.ts` : `COLS` = mapping clé → en-tête de colonne exact du Sheet. **Ne jamais renommer un en-tête sans mettre à jour `COLS`.** Getters typés, `tarifDe()` (prix = surface × prix/m² selon tranche + niveau), `nextId()`.
- `lib/actions.ts` : toutes les mutations (server actions). Règles métier :
  - Une seule fiche par client (code `CA001`…). Chaque visite/appel/WhatsApp = une ligne dans `Actions` (`AC0001`…).
  - Changement de statut pipeline → note automatique dans la timeline.
  - Réservation (`RS001`…) : lot doit être Disponible/Option ; prix **figé** à la réservation ; stock → Réservé ; client → Réservation.
  - État réservation : En cours de signature → stock Compromis ; Vendu → stock Vendu + client Vente ; Annulé → stock Disponible + client À relancer.
  - Changement de tarif → ligne dans `Historique_Tarifs`.
- `lib/report.ts` : calcul de la fiche mensuelle (bilan M, pipeline, objectifs M+1, plan d'action).
- Pages dans `app/(app)/` : `/` (Aujourd'hui), `/clients`, `/clients/nouveau`, `/clients/[code]`, `/relances`, `/pipeline`, `/reservations`, `/stock`, `/tarifs`, `/mensuel`, `/plus` (menu mobile).

## Tables (Google Sheets)
Clients, Actions, Reservations, Stock (145 lots : RI A modèle P 87–88 m², RI B modèle G 116–118 m², RI D 111 m²), Tarifs, Historique_Tarifs, Objectifs, Plan_Action, Listes (valeurs des menus déroulants).
- Niveaux : RDC, 1er étage, Comble (= étage 2).
- Statuts pipeline : Nouveau → À relancer → Visite planifiée → Visite réalisée → Prospect chaud → Négociation → Réservation → Vente / Perdu.

## Design
- Vert sapin `#1E3A2F` (structure), cèdre `#2F5D4A`, fond neige `#FBFAF6`, bordures pierre `#E4E1D8`.
- Titres Libre Caslon Display, interface Public Sans.
- Élément signature : silhouette montagnes + cèdres (`components/Mountains.tsx`) teintée selon la saison (`saison()` dans `lib/utils.ts`). Garder le reste sobre.
- Éviter : labels en majuscules, cartes identiques avec ombres, flèches dans les boutons.

## Commandes
```bash
npm install
npm run dev
npm run build
LOCAL_CSV_DIR=./demo npm run dev   # test sans Google (lecture seule)
```

## À faire
1. **Importer l'historique** des 4 anciens Sheets dans Clients / Actions / Reservations, en fusionnant les doublons de clients (même téléphone ou nom proche) :
   - Fiche de suivi des visites : `1bhxwqYEkJ9tBDOa_gOH14Ykv7AW8x5USUuIDFzV3ffs`
   - Suivi relances clients : `1C66ES9T9wSOYabsV5Mg5FMxKqMAWE7jrA5SwVPJvLrg`
   - Histoire client : `1maRINVKxp4lkHA9mwljMcPmDwdSy2JfGrD30QIz__YU`
   - Réservations : `1sTvvDRbPa6ASKhpSIN0SJ4gQ3PtnswR2Fw1gM4YsLHw`
   - Corrections connues : immeubles A24/A25 dans les réservations = **B24/B25** ; Rhazal Safae = annulée ; relier chaque réservation au lot du Stock (colonne `Code client`).
   - Fiche mensuelle existante (septembre/octobre) : `1bXydgxS5B3hLv1t3xSlVJ5vHubO18VGjdeVBrbuwHUY`.
2. Stock à vérifier : D2-3 en doublon (renommé D2-4, à confirmer), A7-4 compromis sans réservation, B20-2 « À préciser ».
3. Prix RI D à renseigner (page Tarifs) quand Achraf les aura.
