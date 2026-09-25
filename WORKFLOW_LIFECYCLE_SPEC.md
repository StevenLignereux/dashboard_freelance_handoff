# Spécification — cycle de vie des demandes

## Objectif

Rendre explicite la fin d’une demande et synchroniser les statuts de demande et de contact avec la création et la fin des missions, sans confondre clôture métier et archivage.

## Comportement attendu

### Demandes

- Ajouter le statut `terminee` aux statuts de demande, avec son libellé et son apparence dans l’interface.
- Depuis la fiche de demande, permettre de modifier son statut et de la marquer comme terminée.
- `terminee` et `sans_suite` sont des statuts de clôture. Une demande clôturée n’est plus la demande active du contact et ne compte plus comme `activeRequestId`.
- Une demande terminée reste visible dans l’historique et n’est pas archivée automatiquement.
- Archiver reste une action distincte d’organisation : le drapeau `archived` est indépendant du statut et masque la demande du flux courant comme aujourd’hui.
- Une demande clôturée ou archivée ne peut pas recevoir une nouvelle mission. Pour une nouvelle prestation, le parcours passe par la création d’une nouvelle demande.
- La modification manuelle d’une demande peut la rouvrir en choisissant un statut non terminal, à condition qu’aucune autre demande active n’existe pour le contact. Le conflit doit produire une erreur compréhensible et laisser les données inchangées.

### Missions et contacts

- À la création d’une mission, passer la demande liée à `mission_confirmee`.
- À la première mission d’un contact, faire passer `prospect` à `client`.
- À la création d’une mission ultérieure, faire passer `client` ou `ancien_client` à `client_recurrent`. Un contact déjà `client_recurrent` le reste.
- Ne pas recalculer `ancien_client` avec une durée d’inactivité. Ce statut reste une décision manuelle jusqu’à la création effective d’une nouvelle mission.
- Quand une mission passe à `terminee`, terminer aussi la demande si toutes ses missions sont terminées. Si au moins une mission liée reste ouverte, conserver `mission_confirmee`.
- Les changements de statut automatiques ci-dessus doivent être enregistrés ensemble côté Supabase afin d’éviter une mission créée sans mise à jour correspondante de sa demande ou du contact.

## Interface concernée

- Édition de demande dans la fiche contact : contrôle de statut et action de clôture.
- Vue Demandes : badge du nouveau statut; les demandes terminées restent consultables et identifiables dans l’historique.
- Fiche contact : afficher le statut de relation résultant des transitions et conserver la sélection manuelle existante pour `ancien_client`.
- Modales de création/édition de mission : empêcher la création à partir d’une demande clôturée ou archivée et refléter les statuts mis à jour après succès.

## Stockage et compatibilité

- Ajouter une migration Supabase additive pour autoriser le statut de demande `terminee`.
- Mettre à jour les types TypeScript générés et les deux implémentations de dépôt (Supabase et seed) selon les mêmes règles métier.
- Préserver les demandes et missions existantes; aucun changement destructif ou reclassement historique automatique.
- Garder cohérents le statut de demande, `is_active`, `archived`, `Contact.activeRequestId` et les compteurs dérivés.

## Critères d’acceptation

1. Une demande peut être terminée sans être archivée et reste visible dans l’historique.
2. Terminer une demande ou la passer à `sans_suite` libère la demande active du contact; une nouvelle demande peut ensuite être créée.
3. Une demande peut être rouverte si aucune autre demande active ne bloque le contact.
4. Créer la première mission convertit un prospect en client et confirme la demande.
5. Créer une mission ultérieure convertit le contact en client récurrent et confirme la demande.
6. Terminer la dernière mission termine sa demande; terminer une mission alors qu’une autre reste ouverte ne termine pas la demande.
7. Une demande terminée ou archivée refuse la création de mission, dans les deux dépôts.
8. Une erreur de persistance ne laisse pas l’interface afficher une transition partiellement réussie.

## Hors périmètre

- Édition complète des missions depuis la fiche contact (feature suivante).
- Règle automatique fondée sur l’ancienneté pour classer un contact comme ancien client.
- Archivage automatique d’une demande ou d’un contact.
