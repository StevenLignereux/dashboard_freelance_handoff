# Dashboard freelance

CRM privé pour indépendant, construit avec React, TypeScript, Vite et Supabase. Il suit les contacts, les demandes, les échanges, les prochaines actions et les missions dans une interface pensée autour des cartes de contact.

## Démarrer

1. Installer les dépendances : `npm ci`
2. Copier `.env.example` vers `.env.local` et renseigner l’URL Supabase ainsi que la clé publishable.
3. Lancer l’application : `npm run dev`

La source de données par défaut est Supabase. Une erreur de configuration ou de connexion est affichée ; l’application ne bascule pas silencieusement vers les données de démonstration.

Pour travailler sur les données de démonstration, les tests utilisent `SeedRepository`. Le schéma local et ses migrations sont dans `supabase/`.

## Fonctionnalités

- Connexion Supabase et données isolées par utilisateur via RLS.
- Création, modification et archivage des contacts.
- Demandes avec statut, prochaine action, échanges et archivage distinct de la clôture.
- Relances en retard, actions du jour et actions à venir sur le dashboard.
- Missions liées aux demandes, avec suivi de statut, progression et notes.
- Fiche contact qui regroupe l’historique et permet d’agir sur les demandes et missions.
- Vues adaptées au clavier, aux préférences de mouvement réduit et aux petits écrans.

## Vérifications

```sh
npm run typecheck
npm run lint
npm run test -- --run
npm run build
```

Les tests PostgreSQL locaux peuvent être exécutés avec `npx supabase test db` lorsque le stack Supabase local est démarré.
