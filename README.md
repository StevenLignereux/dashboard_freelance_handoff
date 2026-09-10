# Kit de handoff — Dashboard freelance

Ce dossier contient tout le nécessaire pour lancer la première phase du projet dans Trae.

## Fichiers

- `CAHIER_DES_CHARGES_V1.md`  
  Source de vérité fonctionnelle + UX + design.

- `NOTES_REFERENCE_VISUELLE_V0.md`  
  Indique précisément comment interpréter la maquette et quels éléments ne pas reproduire.

- `REFERENCE_VISUELLE_DASHBOARD_V0.png`  
  Maquette d’ambiance validée.

- `PROMPT_TRAE_DEMARRAGE.md`  
  Prompt prêt à copier dans Trae pour démarrer le prototype front-end.

## Ordre conseillé

1. Importer/placer ces quatre fichiers dans le projet.
2. Donner le contenu de `PROMPT_TRAE_DEMARRAGE.md` à Trae.
3. Faire construire uniquement la phase UI avec données mock.
4. Valider visuellement et fonctionnellement.
5. Ensuite seulement : choisir/valider le backend, l’authentification et la persistance.

## Règle principale

Ne pas ajouter de fonctions non validées simplement parce qu’elles semblent utiles.

La V1 doit d’abord réussir le suivi des contacts, prochaines actions, relances et missions.
