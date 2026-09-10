# Référence visuelle V0 — notes d’interprétation

Le fichier `REFERENCE_VISUELLE_DASHBOARD_V0.png` est la maquette d’ambiance validée.

## À conserver

- thème sombre graphite ;
- violet/cyan en accents principaux ;
- cartes contacts comme signature ;
- contours et lueurs très contrôlés ;
- informations de statut sous forme de badge + texte ;
- hiérarchie : priorité / aujourd’hui / missions ;
- impression de produit premium et vivant ;
- micro-interactions ;
- inspiration trading card sans reproduction d’une licence existante.

## À corriger lors de l’implémentation

- `FreelanceFlow` n’est PAS le nom validé du produit ;
- le nom `Manon` est fictif ;
- `Calendrier`, `Statistiques`, `Modèles` et `Ressources` ne font PAS partie de la V1 ;
- les phrases motivationnelles sont décoratives et optionnelles ;
- une barre de progression de mission ne doit être affichée que si une vraie donnée de progression existe ;
- les statuts doivent être exprimés en texte, pas seulement par couleur ;
- les cartes doivent garder une bonne lisibilité même sans effets lumineux ;
- l’holographique est un effet de hover ponctuel, pas une animation constante.

## Hiérarchie souhaitée sur desktop

1. Barre supérieure : recherche + compte.
2. Accueil court : bonjour + nombre d’éléments nécessitant une attention.
3. Ligne prioritaire :
   - À traiter en priorité
   - À faire aujourd’hui
   - Missions en cours
4. Section Contacts :
   - compteur
   - Vue cartes / Vue liste
   - filtre
   - recherche
   - grille de cartes
5. Contenu secondaire éventuel :
   - actions à venir
   - élément décoratif discret

## Carte contact

Format approximatif : 270 × 380 px.

Ordre visuel :

1. Badge relation.
2. Identité visuelle / initiales.
3. Nom + entreprise.
4. Demande active.
5. État.
6. Prochaine action / retard.
7. Stats historiques.

Le regard doit naturellement tomber sur la prochaine action et l’état actuel.

## Motion

- hover : 100–200 ms ;
- ouverture/changement : 200–350 ms ;
- célébration : 500–800 ms ;
- tilt max ~2–3° ;
- aucune information essentielle au hover ;
- `prefers-reduced-motion` respecté.
