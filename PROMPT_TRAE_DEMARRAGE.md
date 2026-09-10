# Prompt de démarrage pour Trae

Tu vas démarrer l’implémentation d’un dashboard personnel pour freelance.

Avant de coder, lis entièrement :

1. `CAHIER_DES_CHARGES_V1.md`
2. `NOTES_REFERENCE_VISUELLE_V0.md`
3. `REFERENCE_VISUELLE_DASHBOARD_V0.png`

Ces trois fichiers constituent la source de vérité pour cette phase.

## Objectif de cette première phase

Construire **le prototype front-end fidèle de l’interface V1 avec des données fictives**, afin de valider l’UX et la direction artistique AVANT d’implémenter le backend et la logique métier définitive.

### Priorités

1. Layout desktop du dashboard.
2. Navigation V1 uniquement.
3. Blocs :
   - À traiter en priorité
   - À faire aujourd’hui
   - Missions en cours
4. Section Contacts.
5. Composant `ContactCard`.
6. Vue cartes / vue liste.
7. Panneau latéral d’un contact.
8. Responsive mobile de base.
9. Micro-interactions principales.
10. Support `prefers-reduced-motion`.

## Contraintes très importantes

- N’invente aucune fonctionnalité hors cahier des charges.
- N’implémente pas Calendrier, Statistiques, Modèles ou Ressources.
- `FreelanceFlow` est un placeholder, pas le nom officiel.
- N’utilise aucun élément visuel ou asset appartenant à Pokémon, Magic ou une autre licence.
- L’inspiration est uniquement le langage visuel d’une trading card.
- Le statut doit toujours être compréhensible sans la couleur.
- Le fun ne doit jamais ajouter une étape supplémentaire.
- Le prototype doit être fonctionnel sans animation.
- Aucun backend réel n’est nécessaire dans cette première étape.
- Utilise des données mock propres et centralisées.
- Ne construis pas encore la facturation, la comptabilité, l’IA, le calendrier ou les intégrations.

## Architecture attendue

Séparer proprement :

- composants UI ;
- données mock ;
- types/interfaces métier ;
- tokens de design ;
- animations ;
- pages/vues.

Éviter un composant géant contenant tout le dashboard.

Préparer au minimum des composants équivalents à :

- `AppShell`
- `Sidebar`
- `TopBar`
- `AttentionPanel`
- `TodayPanel`
- `ActiveMissionsPanel`
- `ContactsSection`
- `ContactCard`
- `ContactListItem`
- `ContactDrawer`
- `StatusBadge`
- `RelationshipBadge`
- `NextAction`
- `EmptyState`

Les noms exacts peuvent être adaptés à la convention du projet.

## Données mock minimales

Créer plusieurs contacts permettant de tester :

- prospect nouveau ;
- solution proposée ;
- relance en retard ;
- échange prévu ;
- client avec mission ;
- client récurrent ;
- ancien client.

Inclure au moins :

- Jean Dupont
- Sophie Martin
- Lucas Bernard
- Camille Robert
- Antoine Morel
- Thomas Petit

Ces identités sont fictives et servent uniquement au prototype.

## Design

Reproduire l’ambiance de la maquette, pas ses erreurs fonctionnelles.

Palette de départ :

- fond : `#0D0F14`
- surface : `#161A22`
- violet : `#7C5CFF`
- cyan : `#22D3EE`
- corail : `#FF7A59`
- vert : `#34D399`
- ambre : `#FBBF24`

Typographie :
- titres : Space Grotesk ou équivalent ;
- texte : Inter ou équivalent.

Le rendu doit rester lisible sans glow.

## ContactCard

Elle doit :

- être portrait sur desktop ;
- avoir une identité générée par initiales ;
- afficher relation, demande, état, prochaine action et mini-stats ;
- avoir une bordure liée à l’état ;
- posséder un hover foil léger ;
- s’incliner au maximum d’environ 2–3° ;
- s’ouvrir dans un drawer au clic ;
- rester entièrement utilisable au clavier ;
- ne cacher aucune information indispensable derrière le hover.

## Animations

Trois niveaux :

- micro : 100–200 ms ;
- action : 200–350 ms ;
- célébration : 500–800 ms.

Privilégier `transform` et `opacity`.

Avec `prefers-reduced-motion: reduce` :
- supprimer tilt ;
- réduire déplacements ;
- simplifier les célébrations ;
- conserver les feedbacks d’état essentiels.

## Responsive

Desktop :
- sidebar ;
- grille de cartes ;
- drawer latéral.

Mobile :
- navigation compacte ;
- une carte par ligne ou presque pleine largeur ;
- pas de dépendance au hover ;
- fiche contact plein écran.

## Definition of Done — Phase UI

La phase est terminée quand :

- le dashboard ressemble visuellement à la référence ;
- toutes les fonctions V1 visibles dans la maquette sont navigables avec des mocks ;
- le mode cartes/liste fonctionne ;
- le drawer contact fonctionne ;
- le responsive de base fonctionne ;
- le clavier permet d’utiliser les interactions principales ;
- le mode reduced-motion est traité ;
- aucun élément hors périmètre V1 n’a été ajouté ;
- le code est suffisamment structuré pour brancher ensuite un backend sans refaire toute l’UI.

## À la fin

Fournis :
1. un récapitulatif de ce qui a été implémenté ;
2. la structure des fichiers ;
3. les éventuels choix techniques pris ;
4. les écarts par rapport à la maquette et leur justification ;
5. les points à valider avant de passer au backend.

**Commence maintenant par la phase UI uniquement.**
