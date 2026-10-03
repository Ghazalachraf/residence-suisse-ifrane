# Back office Résidence Suisse — Ifrane

Plateforme de suivi commercial (clients, relances, histoire client, pipeline, réservations, stock, tarifs, fiche mensuelle) avec export Excel par section. Les données sont stockées dans le dossier Google Drive **« Plateforme Résidence Suisse — Base de données »** (un Google Sheet par table).

## Mise en route (une seule fois, environ 15 min)

### 1. Créer le compte de service Google
1. Va sur https://console.cloud.google.com et crée un projet (ex. `residence-suisse`).
2. **API et services → Bibliothèque** : active **Google Sheets API**.
3. **API et services → Identifiants → Créer des identifiants → Compte de service**. Nom : `plateforme`. Valide sans rôle.
4. Ouvre le compte créé → onglet **Clés → Ajouter une clé → JSON**. Un fichier se télécharge.
5. Copie l'adresse du compte (`plateforme@….iam.gserviceaccount.com`).

### 2. Donner accès au dossier
Dans Google Drive, clic droit sur le dossier **Plateforme Résidence Suisse — Base de données** → **Partager** → colle l'adresse du compte de service → rôle **Éditeur**.

### 3. Configurer les variables
Copie `.env.example` en `.env.local` et remplis :
- `APP_PASSWORD` : ton mot de passe de connexion
- `AUTH_SECRET` : une longue chaîne aléatoire
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` : la valeur `client_email` du fichier JSON
- `GOOGLE_PRIVATE_KEY` : la valeur `private_key` du fichier JSON (entre guillemets, avec les `\n`)

### 4. Lancer en local
```bash
npm install
npm run dev      # http://localhost:3000
```

### 5. Mettre en ligne (Vercel)
Importe le repo GitHub dans Vercel, ajoute les 4 variables ci-dessus dans **Settings → Environment Variables**, puis déploie. La plateforme est alors accessible sur mobile et ordinateur.

## Organisation

| Page | Rôle |
|---|---|
| Aujourd'hui | Relances en retard, du jour et des 7 prochains jours, chiffres clés |
| Clients | Liste filtrable, saisie d'un nouveau client avec sa première interaction |
| Fiche client | Infos, prochaine étape, timeline complète, ajout d'action, réservations |
| Relances | À relancer maintenant et historique mensuel |
| Pipeline | Kanban par statut (glisser-déposer, liste déroulante sur mobile) |
| Réservations | Réserver un lot avec prix figé, changer l'état : le stock et le statut client suivent |
| Stock | Plan par immeuble et niveau, états colorés, lots à vérifier |
| Tarifs | Grille modifiable (catalogue et net au m²) avec historique |
| Fiche mensuelle | Les 4 pages du modèle de la direction, calculées automatiquement, objectifs et plan d'action éditables |

Chaque page a un bouton **Exporter en Excel** (`/api/export/clients`, `relances`, `reservations`, `stock`, `tarifs`, `mensuel?mois=AAAA-MM`).

## Règles de la base
- Ne renomme pas les en-têtes (ligne 1) des Google Sheets : la plateforme s'appuie dessus.
- Tu peux corriger une valeur directement dans Google Sheets : elle apparaît dans la plateforme au rechargement.

## Test local sans Google (lecture seule)
`LOCAL_CSV_DIR=./demo npm run dev` lit des fichiers `Clients.csv`, `Stock.csv`… au lieu de Google Sheets.
