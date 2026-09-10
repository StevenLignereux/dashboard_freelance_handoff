# Dashboard freelance — Cahier des charges V1

**Statut : référence fonctionnelle et visuelle pour démarrage du développement**  
**Version : V1 — 10 septembre 2026**

---

## 1. Vision du produit

Construire un dashboard personnel pour freelance qui permet de suivre simplement une relation client depuis le premier contact jusqu’à la mission terminée.

L’application doit répondre en priorité à une question quotidienne :

> **Qu’est-ce que je dois faire aujourd’hui pour ne laisser passer aucun prospect, client ou projet ?**

Le produit n’a pas vocation à devenir un CRM complexe. Sa valeur vient de trois choses :

1. une gestion simple des contacts, demandes, échanges et missions ;
2. un système de prochaine action et de relance qui évite les oublis ;
3. une identité visuelle forte et ludique qui donne envie d’ouvrir et d’utiliser l’outil.

### Promesse produit

**Ne jamais oublier une relation, une relance ou une prochaine action — dans une interface professionnelle avec l’âme d’un jeu.**

---

## 2. Principes directeurs

### Fonctionnels

- Les actions utiles doivent être visibles immédiatement.
- Peu de champs obligatoires.
- Peu de clics.
- Le vocabulaire doit rester naturel et compréhensible.
- L’historique d’une relation doit être facile à retrouver.
- Le système ne doit jamais envoyer automatiquement une communication au client dans la V1.

### UX

- Simple à comprendre.
- Rapide à utiliser.
- Agréable à regarder.
- Satisfaisant à manipuler.
- Le fun ne doit jamais ajouter une étape supplémentaire à l’utilisateur.
- Si toutes les animations sont désactivées, l’application reste parfaitement compréhensible et fonctionnelle.

### Positionnement visuel

**Trading Cards × Productivity**

Les cartes à collectionner servent d’inspiration visuelle, mais le produit ne copie ni Pokémon, ni Magic, ni aucune licence existante.

---

## 3. Utilisateur de la V1

La V1 est conçue pour :

- un freelance ;
- travaillant seul ;
- gérant ses prospects et clients lui-même ;
- utilisant l’application comme outil privé.

### Important

La V1 ne nécessite pas :

- d’équipes ;
- de rôles multiples ;
- d’assignation commerciale ;
- de gestion avancée des permissions entre collaborateurs.

Une authentification reste nécessaire et les données doivent être privées.

---

## 4. Modèle métier

Le parcours principal est :

**Contact → Demande → Échanges → Mission**

Un même contact peut posséder plusieurs demandes dans le temps.

### Exemple

Un client demande d’abord un dépannage informatique. Une première demande est créée.

Quelques mois plus tard, ce même client demande un site web. Il reste le même contact, mais une nouvelle demande lui est associée.

---

## 5. Entités principales

### 5.1 Contact

Représente une personne ou un interlocuteur.

Champs V1 :

- `id`
- prénom
- nom
- entreprise éventuelle
- téléphone éventuel
- e-mail éventuel
- notes
- type de relation
- date de création
- date de dernière activité
- statut d’archivage

Types de relation possibles :

- Prospect
- Client
- Client récurrent
- Ancien client

Le type de relation ne correspond jamais à une « rareté ». Aucun classement du type commun/rare/épique/légendaire.

---

### 5.2 Demande

Représente un besoin exprimé par un contact.

Champs V1 :

- `id`
- `contact_id`
- titre
- description
- état
- date de création
- date de dernière activité
- prochaine action éventuelle
- date de prochaine action éventuelle
- statut d’archivage

États :

1. Nouveau
2. À comprendre
3. Échange prévu
4. Solution proposée
5. En attente
6. Mission confirmée
7. Sans suite

---

### 5.3 Échange

Permet de conserver l’historique.

Types possibles :

- appel ;
- e-mail ;
- message ;
- rencontre ;
- note personnelle.

Champs V1 :

- `id`
- `request_id`
- type
- date
- résumé

L’objectif est de mémoriser le contexte, pas d’intégrer automatiquement toutes les messageries dès la V1.

---

### 5.4 Mission

Une demande confirmée peut devenir une mission.

États :

1. À démarrer
2. En cours
3. En attente
4. Terminée

Champs V1 :

- `id`
- `request_id`
- titre
- état
- date de début éventuelle
- date de fin éventuelle
- progression facultative
- notes éventuelles

La mission n’est pas un remplacement de Trello, Jira, Notion ou Asana.

---

## 6. Système de prochaine action

Une demande peut posséder une prochaine action avec une date.

Exemples :

- rappeler le client ;
- envoyer une proposition ;
- préparer un devis ;
- demander des documents ;
- demander une précision ;
- relancer ;
- organiser un échange.

Cette information alimente directement le dashboard.

---

## 7. Règle automatique de relance

La relance est une fonction centrale du produit.

### Règle V1

Lorsqu’une demande est en état **Solution proposée** :

- si aucune prochaine action n’est programmée ;
- et si cinq jours se sont écoulés depuis la dernière activité pertinente ;

alors une action de relance apparaît automatiquement dans le dashboard.

Exemple :

**Relancer Jean Dupont — Création du site vitrine**

### Important

La V1 **n’envoie pas automatiquement d’e-mail ou de message**.

Elle rappelle seulement à l’utilisateur qu’une relance doit être effectuée.

---

## 8. Architecture de navigation V1

Navigation principale :

- Tableau de bord
- Contacts
- Demandes
- Missions
- Paramètres

### Hors V1

Les éléments suivants apparaissaient dans la maquette uniquement pour habiller le visuel et **ne doivent pas être implémentés** :

- Calendrier
- Statistiques
- Modèles
- Ressources

Le produit pourra évoluer plus tard si un besoin réel apparaît.

---

## 9. Tableau de bord

Le dashboard est l’écran principal.

Il doit être orienté **action**, et non graphiques décoratifs.

### Zone d’accueil

Exemple :

**Bonjour ! 👋**  
**3 choses méritent ton attention aujourd’hui.**

Le nom affiché dans la maquette est fictif.

### Bloc 1 — À traiter en priorité

Contient les actions en retard ou urgentes.

Exemples :

- relance en retard ;
- action dépassée ;
- demande bloquée nécessitant une intervention.

Le retard doit être visible par :

- texte explicite ;
- icône ;
- accent visuel.

La couleur seule ne doit jamais porter l’information.

### Bloc 2 — À faire aujourd’hui

Actions prévues pour la journée.

Exemples :

- relancer un client ;
- envoyer une proposition ;
- appeler un contact ;
- effectuer un échange prévu.

### Bloc 3 — Missions en cours

Vue synthétique des missions :

- à démarrer ;
- en cours ;
- éventuellement en attente.

Une progression visuelle peut être utilisée si elle correspond à une vraie donnée.

### Bloc secondaire — À venir

Les prochaines actions planifiées après aujourd’hui peuvent apparaître plus bas ou dans une section secondaire.

Le haut de l’écran doit rester réservé aux actions immédiates.

---

## 10. Vue Contacts

La vue Contacts est le principal élément distinctif du produit.

Deux modes :

### Vue Cartes

Mode visuel principal.

### Vue Liste

Mode compact et productif, utile quand le nombre de contacts devient important.

Les deux vues utilisent exactement les mêmes données.

---

## 11. Carte Contact V1

### Format desktop

Environ **270 × 380 px**, format portrait inspiré d’une trading card.

La carte doit être comprise en environ deux secondes.

### Informations affichées

- badge de relation ;
- identité visuelle du contact ;
- nom et prénom ;
- entreprise éventuelle ;
- demande active principale ;
- état de la demande ;
- prochaine action ;
- date ou retard de la prochaine action ;
- nombre de demandes ;
- nombre de missions réalisées.

### Identité visuelle du contact

Par défaut :

- initiales ;
- fond/dégradé généré ;
- motif ou texture légère.

Une photo ou un logo pourra éventuellement être ajouté plus tard, mais ce n’est pas nécessaire à la V1.

### Bordure

La bordure reflète l’état de la demande, jamais la « valeur » du client.

Proposition de correspondance :

- Nouveau → cyan
- À comprendre → bleu
- Échange prévu → violet
- Solution proposée → ambre
- En attente → orange doux
- Mission confirmée → vert menthe
- Sans suite → gris

Le statut doit toujours être affiché aussi sous forme textuelle.

### Bas de carte

Exemples :

- `2 demandes · 1 mission`
- `7 demandes · 5 missions`

Ces informations traduisent l’histoire réelle de la relation.

---

## 12. Interactions de la carte

### Au repos

Carte sombre, propre, bordure colorée discrète.

### Hover desktop

- élévation légère ;
- inclinaison suivant le curseur ;
- maximum environ 2–3° ;
- reflet foil/holographique discret ;
- retour fluide au repos.

Aucune information indispensable ne doit être disponible uniquement au hover.

### Clic

- petite compression ;
- ouverture d’un panneau latéral sur desktop.

### Panneau latéral

Affiche rapidement :

- coordonnées ;
- demande active ;
- prochaine action ;
- historique récent ;
- missions éventuelles.

Une fiche complète pourra être accessible si nécessaire.

### Mobile

Pas d’effet tilt dépendant du doigt.

- carte presque pleine largeur ;
- tap avec feedback léger ;
- fiche contact ouverte en plein écran.

---

## 13. Évolution visuelle de la relation

Les cartes peuvent évoluer visuellement selon des faits réels.

Exemples :

- Prospect → Client
- Client → Client récurrent
- ajout du nombre de missions réalisées
- ajout d’une nouvelle demande
- mise à jour de la dernière activité

Aucun système artificiel de :

- niveau ;
- XP ;
- monnaie virtuelle ;
- rareté ;
- classement des clients.

La progression réelle de l’activité est elle-même la récompense.

---

## 14. Direction artistique

### Ambiance

- sombre ;
- moderne ;
- légèrement futuriste ;
- énergique ;
- professionnelle ;
- inspirée du jeu sans ressembler à une interface de jeu vidéo.

### Palette de départ

Fond principal :
`#0D0F14`

Surfaces :
`#161A22`

Violet principal :
`#7C5CFF`

Cyan :
`#22D3EE`

Accent chaud :
`#FF7A59`

Succès :
`#34D399`

Attention :
`#FBBF24`

Ces valeurs sont une base de design et peuvent être légèrement ajustées pendant l’implémentation pour garantir lisibilité et cohérence.

### Typographie souhaitée

Titres / gros chiffres :
**Space Grotesk** ou équivalent moderne.

Texte courant :
**Inter** ou équivalent très lisible.

---

## 15. Micro-interactions et animations

Le produit doit être fun grâce à des feedbacks ponctuels, pas grâce à des éléments qui bougent en permanence.

### Niveau 1 — Micro

Exemples :

- hover ;
- bouton ;
- sélection ;
- pression.

Durée indicative :
**100–200 ms**

### Niveau 2 — Action

Exemples :

- ouverture de panneau ;
- changement d’état ;
- déplacement d’un élément.

Durée indicative :
**200–350 ms**

### Niveau 3 — Célébration

Réservé aux événements significatifs :

- mission confirmée ;
- mission terminée ;
- prospect devenant client.

Durée indicative :
**500–800 ms**

Exemple : reflet foil plus marqué, petite particule ou micro-célébration, puis retour immédiat au calme.

### Interdictions

- pas d’animation permanente en arrière-plan ;
- pas de flottement continu des cartes ;
- pas de transitions longues à chaque clic ;
- pas de clignotement agressif ;
- pas d’élément décoratif gênant la lecture.

### Performance

Privilégier autant que possible les animations basées sur :

- `transform`
- `opacity`

Éviter les animations qui déclenchent inutilement des recalculs de layout ou des repaint coûteux.

---

## 16. Accessibilité

Le style visuel ne doit pas dégrader l’accessibilité.

### Obligatoire

- viser WCAG 2.2 AA ;
- contraste minimum de 4.5:1 pour le texte courant ;
- ne jamais utiliser uniquement la couleur pour communiquer un état ;
- navigation clavier fonctionnelle ;
- focus visible ;
- aucune fonction essentielle uniquement au hover ;
- labels accessibles pour les icônes ;
- formulaires correctement associés à leurs labels.

### Réduction des mouvements

Respecter :

`prefers-reduced-motion: reduce`

Dans ce mode :

- supprimer le tilt ;
- réduire les déplacements ;
- remplacer certaines animations par des fondus ;
- supprimer ou simplifier les célébrations non essentielles.

---

## 17. Responsive

L’application doit être utilisable sur :

- desktop ;
- tablette ;
- smartphone.

### Desktop

Expérience principale :

- sidebar ;
- grille de cartes ;
- panneau latéral.

### Tablette

- sidebar adaptable/repliable ;
- grille réduite ;
- interactions tactiles.

### Smartphone

- navigation compacte ;
- cartes pleine largeur ;
- aucune dépendance au hover ;
- fiche contact plein écran ;
- actions prioritaires visibles rapidement.

---

## 18. Recherche et filtres

Recherche simple sur :

- prénom ;
- nom ;
- entreprise ;
- titre de demande.

Filtres V1 utiles :

- relation ;
- état de demande ;
- contacts nécessitant une action ;
- archivés/non archivés.

Ne pas transformer la V1 en moteur de recherche avancé.

---

## 19. Archivage et suppression

Privilégier l’archivage lorsque l’historique a de la valeur.

L’utilisateur doit pouvoir retrouver un ancien client ou une ancienne demande.

La suppression définitive doit être explicite et protégée contre une mauvaise manipulation.

---

## 20. Authentification et sécurité

L’application contient des données clients.

La V1 doit prévoir :

- authentification ;
- pages privées ;
- isolation des données par utilisateur ;
- aucune donnée client publiquement accessible ;
- règles de sécurité côté base de données adaptées à la technologie retenue.

Même si la V1 ne compte qu’un seul utilisateur, ne pas construire l’application sur une base publiquement ouverte.

---

## 21. Fonctions explicitement hors périmètre V1

Ne pas implémenter sans validation ultérieure :

- facturation ;
- comptabilité ;
- création/signature de devis ;
- signature électronique ;
- newsletter ;
- campagnes e-mail ;
- séquences commerciales automatiques ;
- portail client ;
- CRM d’équipe ;
- permissions complexes ;
- IA ;
- gestion de projet avancée ;
- stockage documentaire complexe ;
- intégrations externes multiples ;
- statistiques avancées ;
- calendrier complet.

---

## 22. Nom du produit

**Aucun nom définitif n’est validé.**

Le nom **FreelanceFlow** visible sur la maquette est un placeholder graphique uniquement.

Ne pas figer ce nom dans l’architecture, le package, le domaine ou les données.

Utiliser un nom de travail neutre dans le code si nécessaire.

---

## 23. Éléments décoratifs du visuel

Les citations/motivations présentes dans la maquette sont facultatives.

Elles peuvent contribuer à l’ambiance si elles :

- ne prennent pas la place d’informations utiles ;
- ne repoussent pas les actions prioritaires sous la ligne de flottaison ;
- restent désactivables/supprimables facilement.

Elles ne font pas partie du cœur fonctionnel.

---

## 24. Critères de réussite de la V1

La V1 est fonctionnellement réussie si l’utilisateur peut :

1. se connecter ;
2. créer et modifier un contact ;
3. rechercher un contact ;
4. consulter un contact en carte ou en liste ;
5. créer une demande liée à un contact ;
6. changer l’état d’une demande ;
7. enregistrer un échange ;
8. consulter l’historique ;
9. définir une prochaine action et une date ;
10. voir les actions en retard ;
11. voir les actions du jour ;
12. voir les actions à venir ;
13. obtenir une relance automatique après cinq jours dans le cas défini ;
14. marquer la relance comme effectuée ;
15. transformer une demande confirmée en mission ;
16. suivre l’état d’une mission ;
17. terminer une mission ;
18. archiver les éléments inactifs ;
19. utiliser l’application sur desktop et mobile ;
20. utiliser les fonctions principales même lorsque les animations sont réduites.

---

## 25. Critères de réussite visuelle

La V1 est visuellement réussie si :

- une capture d’écran est reconnaissable grâce aux cartes contacts ;
- l’interface reste professionnelle ;
- les cartes sont lisibles immédiatement ;
- le dashboard indique clairement quoi faire ;
- les animations donnent du feedback sans distraire ;
- aucune animation n’est requise pour comprendre une fonction ;
- la couleur enrichit l’information sans être son seul vecteur ;
- l’expérience mobile reste propre malgré l’absence de hover.

---

## 26. Règle anti-usine-à-gaz

Avant d’ajouter une fonction, poser trois questions :

1. Résout-elle un problème réellement rencontré ?
2. Aide-t-elle directement au suivi, à la relance ou à la mission ?
3. Peut-elle attendre après la V1 ?

Si la réponse à la troisième question est oui, elle attend.

> **La V1 doit résoudre parfaitement le suivi et la relance avant de chercher à résoudre autre chose.**

---

## 27. Référence visuelle

Le fichier :

**`REFERENCE_VISUELLE_DASHBOARD_V0.png`**

est la direction artistique de référence.

Il sert à définir :

- l’ambiance ;
- la densité ;
- les cartes ;
- les accents néon ;
- les panneaux ;
- la hiérarchie générale.

Il **ne doit pas être interprété comme une liste exhaustive de fonctionnalités**.

Les éléments non présents dans ce cahier des charges ne doivent pas être implémentés simplement parce qu’ils apparaissent dans la maquette.

---

## 28. Références techniques d’accessibilité/performance retenues

- WCAG 2.2 — utilisation de la couleur : une information ne doit pas dépendre uniquement de la couleur.
- WCAG 2.2 — contraste minimal : 4.5:1 pour le texte courant, sauf exceptions prévues par le standard.
- `prefers-reduced-motion` : réduire/supprimer les mouvements non essentiels lorsque l’utilisateur le demande.
- Animations : privilégier `transform` et `opacity` pour limiter le coût de rendu.

---

# Résumé en une phrase

**Un dashboard privé et ultra-simple pour freelance qui montre quoi faire aujourd’hui, évite les oublis de relance, suit les relations jusqu’aux missions et transforme les contacts en cartes visuelles vivantes, sans gamification artificielle ni complexité superflue.**
