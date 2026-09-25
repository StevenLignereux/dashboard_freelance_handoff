/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * Tests pour le Seed Repository
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SeedRepository } from './seedRepository';

describe('SeedRepository', () => {
  let repository: SeedRepository;

  beforeEach(() => {
    repository = new SeedRepository();
  });

  describe('loadContacts', () => {
    it('retourne les contacts seed', async () => {
      const contacts = await repository.loadContacts();

      expect(contacts).toBeDefined();
      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThan(0);
    });

    it('les contacts ont les champs attendus', async () => {
      const contacts = await repository.loadContacts();
      const firstContact = contacts[0];

      expect(firstContact).toHaveProperty('id');
      expect(firstContact).toHaveProperty('firstName');
      expect(firstContact).toHaveProperty('lastName');
      expect(firstContact).toHaveProperty('totalRequests');
      expect(firstContact).toHaveProperty('totalMissions');
      expect(firstContact).toHaveProperty('avatarSeed');
    });
  });

  describe('loadRequests', () => {
    it('retourne les demandes seed', async () => {
      const requests = await repository.loadRequests();

      expect(requests).toBeDefined();
      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBeGreaterThan(0);
    });

    it('les demandes ont les champs attendus', async () => {
      const requests = await repository.loadRequests();
      const firstRequest = requests[0];

      expect(firstRequest).toHaveProperty('id');
      expect(firstRequest).toHaveProperty('contactId');
      expect(firstRequest).toHaveProperty('title');
      expect(firstRequest).toHaveProperty('status');
    });
  });

  describe('loadMissions', () => {
    it('retourne les missions seed', async () => {
      const missions = await repository.loadMissions();

      expect(missions).toBeDefined();
      expect(Array.isArray(missions)).toBe(true);
      expect(missions.length).toBeGreaterThan(0);
    });

    it('les missions ont les champs attendus', async () => {
      const missions = await repository.loadMissions();
      const firstMission = missions[0];

      expect(firstMission).toHaveProperty('id');
      expect(firstMission).toHaveProperty('requestId');
      expect(firstMission).toHaveProperty('contactId');
      expect(firstMission).toHaveProperty('title');
      expect(firstMission).toHaveProperty('status');
    });
  });

  describe('loadExchanges', () => {
    it('retourne les échanges seed', async () => {
      const exchanges = await repository.loadExchanges();

      expect(exchanges).toBeDefined();
      expect(Array.isArray(exchanges)).toBe(true);
      expect(exchanges.length).toBeGreaterThan(0);
    });

    it('les échanges ont les champs attendus', async () => {
      const exchanges = await repository.loadExchanges();
      const firstExchange = exchanges[0];

      expect(firstExchange).toHaveProperty('id');
      expect(firstExchange).toHaveProperty('requestId');
      expect(firstExchange).toHaveProperty('type');
      expect(firstExchange).toHaveProperty('date');
      expect(firstExchange).toHaveProperty('summary');
    });
  });

  describe('createContact', () => {
    it('crée un contact avec un ID généré', async () => {
      const newContact = {
        firstName: 'Marie',
        lastName: 'Curie',
        company: 'Laboratoire',
        email: 'marie@example.com',
        phone: '+33123456789',
        notes: 'Scientifique',
        relationship: 'prospect' as const,
      };

      const created = await repository.createContact(newContact);

      expect(created.id).toBeDefined();
      expect(created.id).toMatch(/^c-[a-z0-9-]+$/);
      expect(created.firstName).toBe('Marie');
      expect(created.lastName).toBe('Curie');
    });

    it('initialise archived = false même si le contrat CreateContactInput ne le demande pas', async () => {
      const created = await repository.createContact({
        firstName: 'Nouveau',
        lastName: 'SansArchived',
        relationship: 'prospect',
      });
      expect(created.archived).toBe(false);
    });

    it('génère les champs dérivés', async () => {
      const newContact = {
        firstName: 'Marie',
        lastName: 'Curie',
        company: 'Laboratoire',
        email: 'marie@example.com',
        phone: '+33123456789',
        notes: 'Scientifique',
        relationship: 'prospect' as const,
      };

      const created = await repository.createContact(newContact);

      expect(created.totalRequests).toBe(0);
      expect(created.totalMissions).toBe(0);
      expect(created.avatarSeed).toBeDefined();
      expect(created.avatarSeed).toContain(created.id);
    });

    it('génère createdAt et lastActivityAt', async () => {
      const newContact = {
        firstName: 'Marie',
        lastName: 'Curie',
        company: 'Laboratoire',
        email: 'marie@example.com',
        phone: '+33123456789',
        notes: 'Scientifique',
        relationship: 'prospect' as const,
      };

      const created = await repository.createContact(newContact);

      expect(created.createdAt).toBeDefined();
      expect(created.lastActivityAt).toBeDefined();
      expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt);
    });

    it('fonctionne sans variables Supabase', async () => {
      const newContact = {
        firstName: 'Marie',
        lastName: 'Curie',
        company: 'Laboratoire',
        email: 'marie@example.com',
        phone: '+33123456789',
        notes: 'Scientifique',
        relationship: 'prospect' as const,
      };

      const created = await repository.createContact(newContact);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
    });

    it('ajoute le contact à la source mémoire, visible au loadContacts suivant, une seule fois', async () => {
      const before = await repository.loadContacts();
      const countBefore = before.length;

      const newContact = {
        firstName: 'Test',
        lastName: 'Persist',
        company: 'Persistent Co',
        email: undefined,
        phone: undefined,
        notes: undefined,
        relationship: 'prospect' as const,
      };

      const created = await repository.createContact(newContact);
      expect(created.firstName).toBe('Test');
      expect(created.lastName).toBe('Persist');

      const after = await repository.loadContacts();

      expect(after).toHaveLength(countBefore + 1);

      const found = after.filter((c) => c.id === created.id);
      expect(found).toHaveLength(1);
      expect(found[0]?.firstName).toBe('Test');
      expect(found[0]?.lastName).toBe('Persist');
    });

    it('ne pollue pas les exports globaux seedContacts (2 instances indépendantes)', async () => {
      const repoA = new SeedRepository();
      const repoB = new SeedRepository();

      const before = await repoA.loadContacts();
      const baseCount = before.length;

      await repoA.createContact({
        firstName: 'RepoA',
        lastName: 'Only',
        relationship: 'prospect',
      });

      const aAfter = await repoA.loadContacts();
      const bAfter = await repoB.loadContacts();

      expect(aAfter).toHaveLength(baseCount + 1);
      expect(bAfter).toHaveLength(baseCount);
    });
  });

  describe('updateContact', () => {
    it('modifie les champs autorisés sans toucher aux interdits', async () => {
      const before = await repository.loadContacts();
      const target = before.find((c) => c.id === 'c-jean-dupont');
      expect(target).toBeDefined();
      if (!target) throw new Error('missing jean');

      const originalId = target.id;
      const originalCreatedAt = target.createdAt;
      const originalTotalRequests = target.totalRequests;
      const originalTotalMissions = target.totalMissions;
      const originalArchived = target.archived;
      const originalActiveRequestId = target.activeRequestId;
      const originalAvatarSeed = target.avatarSeed;

      const updated = await repository.updateContact(target.id, {
        firstName: 'Jean-EDITÉ',
        lastName: 'Dupont-EDITÉ',
        company: 'Dupont Rénové',
        email: 'jean.edite@example.fr',
        phone: '+33 6 00 00 00 01',
        notes: 'Notes éditées',
        relationship: 'client_recurrent',
      });

      expect(updated.id).toBe(originalId);
      expect(updated.firstName).toBe('Jean-EDITÉ');
      expect(updated.lastName).toBe('Dupont-EDITÉ');
      expect(updated.company).toBe('Dupont Rénové');
      expect(updated.email).toBe('jean.edite@example.fr');
      expect(updated.phone).toBe('+33 6 00 00 00 01');
      expect(updated.notes).toBe('Notes éditées');
      expect(updated.relationship).toBe('client_recurrent');

      expect(updated.createdAt).toBe(originalCreatedAt);
      expect(updated.totalRequests).toBe(originalTotalRequests);
      expect(updated.totalMissions).toBe(originalTotalMissions);
      expect(updated.archived).toBe(originalArchived);
      expect(updated.activeRequestId).toBe(originalActiveRequestId);
      expect(updated.avatarSeed).toBe(originalAvatarSeed);
    });

    it('préserve les champs dérivés + persisté dans l\'instance après update', async () => {
      const before = await repository.loadContacts();
      const target = before[0];
      const originalTotalRequests = target.totalRequests;
      const originalActiveRequestId = target.activeRequestId;
      const originalTotalMissions = target.totalMissions;

      await repository.updateContact(target.id, { firstName: 'Modifié' });

      const after = await repository.loadContacts();
      const found = after.find((c) => c.id === target.id);
      expect(found).toBeDefined();
      expect(found?.firstName).toBe('Modifié');
      expect(found?.totalRequests).toBe(originalTotalRequests);
      expect(found?.totalMissions).toBe(originalTotalMissions);
      expect(found?.activeRequestId).toBe(originalActiveRequestId);
    });

    it('lance une erreur explicite si contact inconnu', async () => {
      await expect(
        repository.updateContact('c-inexistant-zzz', { firstName: 'Personne' })
      ).rejects.toThrow(/contact id=c-inexistant-zzz not found/);
    });
  });

  describe('archiveContact', () => {
    it('passe archived = true sur le contact visé', async () => {
      const before = await repository.loadContacts();
      const target = before.find((c) => c.id === 'c-sophie-martin');
      expect(target).toBeDefined();
      if (!target) throw new Error('missing sophie');
      expect(target.archived).toBe(false);
      const targetId = target.id;

      await repository.archiveContact(targetId);

      const after = await repository.loadContacts();
      const found = after.find((c) => c.id === targetId);
      expect(found).toBeDefined();
      expect(found?.archived).toBe(true);
    });

    it('ne touche pas aux autres contacts', async () => {
      const before = await repository.loadContacts();
      const baseCount = before.length;
      const jean = before.find((c) => c.id === 'c-jean-dupont');
      expect(jean?.archived).toBe(false);

      const sophie = before.find((c) => c.id === 'c-sophie-martin');
      expect(sophie).toBeDefined();
      if (!sophie) throw new Error('missing sophie');
      await repository.archiveContact(sophie.id);

      const after = await repository.loadContacts();
      expect(after).toHaveLength(baseCount);
      const jeanAfter = after.find((c) => c.id === 'c-jean-dupont');
      expect(jeanAfter?.archived).toBe(false);
    });

    it('lance une erreur explicite si contact inconnu', async () => {
      await expect(
        repository.archiveContact('c-nexiste-pas-999')
      ).rejects.toThrow(/id=c-nexiste-pas-999 not found/);
    });
  });

  describe('updateContact — null efface valeur existante', () => {
    it('3. null sur company/email/phone/notes remplace précédente valeur par undefined', async () => {
      const repository = new SeedRepository();
      const before = await repository.loadContacts();
      const target = before.find((c) => c.id === 'c-jean-dupont');
      if (!target) throw new Error('missing jean');
      expect(target.company).toBeDefined();
      expect(target.email).toBeDefined();
      expect(target.phone).toBeDefined();

      const updated = await repository.updateContact(target.id, {
        company: null,
        email: null,
        phone: null,
        notes: null,
      });

      expect(updated.company).toBeUndefined();
      expect(updated.email).toBeUndefined();
      expect(updated.phone).toBeUndefined();
      expect(updated.notes).toBeUndefined();
      expect(updated.firstName).toBe(target.firstName);
      expect(updated.lastName).toBe(target.lastName);
      expect(updated.id).toBe(target.id);
      expect(updated.totalRequests).toBe(target.totalRequests);
    });
  });

  describe('Request CRUD (Backend 3B.1)', () => {
    it('1. createRequest crée status=nouveau / archived=false', async () => {
      const repo = new SeedRepository();
      const contacts = await repo.loadContacts();
      const c = contacts[0]; expect(c).toBeTruthy();
      const reqs = await repo.loadRequests();
      for (const r of reqs.filter(x => x.contactId === c.id && !x.archived && x.status !== 'sans_suite')) await repo.archiveRequest(r.id);
      const created = await repo.createRequest({ contactId: c.id, title: 'Nouvelle demande test' });
      expect(created.status).toBe('nouveau');
      expect(created.archived).toBe(false);
      expect(created.contactId).toBe(c.id);
    });

    it('2. createRequest met à jour totalRequests du contact', async () => {
      const repo = new SeedRepository();
      const contacts = await repo.loadContacts();
      const c = contacts[1] ?? contacts[0]; expect(c).toBeTruthy();
      const reqs = await repo.loadRequests();
      for (const r of reqs.filter(x => x.contactId === c.id && !x.archived && x.status !== 'sans_suite')) await repo.archiveRequest(r.id);
      const reloadC = (await repo.loadContacts()).find(x => x.id === c.id)!;
      const before = reloadC.totalRequests;
      await repo.createRequest({ contactId: c.id, title: 'Autre demande' });
      const after = (await repo.loadContacts()).find(x => x.id === c.id)!;
      expect(after.totalRequests).toBe(before + 1);
    });

    it('3. createRequest définit activeRequestId', async () => {
      const repo = new SeedRepository();
      const contacts = await repo.loadContacts();
      const c = contacts[2] ?? contacts[0]; expect(c).toBeTruthy();
      const reqs = await repo.loadRequests();
      for (const r of reqs.filter(x => x.contactId === c.id && !x.archived && x.status !== 'sans_suite')) await repo.archiveRequest(r.id);
      const created = await repo.createRequest({ contactId: c.id, title: 'Demande active' });
      const after = (await repo.loadContacts()).find(x => x.id === c.id)!;
      expect(after.activeRequestId).toBe(created.id);
    });

    it('4. createRequest contact inconnu → erreur', async () => {
      const repo = new SeedRepository();
      await expect(repo.createRequest({ contactId: 'c-not-exists-xyz', title: 'X' })).rejects.toThrow(/contact id=c-not-exists-xyz not found/);
    });

    it('5. createRequest contact archivé → erreur', async () => {
      const repo = new SeedRepository();
      const contacts = await repo.loadContacts();
      const active = contacts.find(c => !c.archived)!; expect(active).toBeTruthy();
      await repo.archiveContact(active.id);
      await expect(repo.createRequest({ contactId: active.id, title: 'X' })).rejects.toThrow(/is archived/);
    });

    it('6. createRequest avec demande active existante → erreur', async () => {
      const repo = new SeedRepository();
      const reqs = await repo.loadRequests();
      const active = reqs.find(r => !r.archived && r.status !== 'sans_suite');
      if (!active) {
        const c = (await repo.loadContacts())[0];
        await repo.createRequest({ contactId: c.id, title: 'Première' });
      }
      const reqs2 = await repo.loadRequests();
      const act = reqs2.find(r => !r.archived && r.status !== 'sans_suite')!;
      await expect(repo.createRequest({ contactId: act.contactId, title: 'Deuxième' })).rejects.toThrow(/already has an active request/);
    });

    it('7. updateRequest modifie titre', async () => {
      const repo = new SeedRepository();
      const reqs = await repo.loadRequests();
      const r = reqs[0]; expect(r).toBeTruthy();
      const updated = await repo.updateRequest(r.id, { title: 'Nouveau titre !!!' });
      expect(updated.title).toBe('Nouveau titre !!!');
      expect(updated.id).toBe(r.id);
    });

    it('8. updateRequest description null efface', async () => {
      const repo = new SeedRepository();
      const reqs = await repo.loadRequests();
      const r = reqs[0]; expect(r).toBeTruthy();
      const after = await repo.updateRequest(r.id, { description: null });
      expect(after.description).toBeUndefined();
    });

    it('9. updateRequest préserve status/dates/contact/nextAction', async () => {
      const repo = new SeedRepository();
      const reqs = await repo.loadRequests();
      const r = reqs[0]; expect(r).toBeTruthy();
      const before = { ...r };
      const updated = await repo.updateRequest(r.id, { title: 'Preserve test' });
      expect(updated.status).toBe(before.status);
      expect(updated.createdAt).toBe(before.createdAt);
      expect(updated.lastActivityAt).toBe(before.lastActivityAt);
      expect(updated.contactId).toBe(before.contactId);
      expect(updated.archived).toBe(before.archived);
      if (before.nextAction) expect(updated.nextAction?.id).toBe(before.nextAction.id);
    });

    it('terminee clôt la demande sans l’archiver et libère le contact', async () => {
      const contact = await repository.createContact({
        firstName: 'Test', lastName: 'Lifecycle', relationship: 'prospect',
      });
      const request = await repository.createRequest({ contactId: contact.id, title: 'Projet' });

      const updated = await repository.updateRequest(request.id, { status: 'terminee' });
      const refreshedContact = (await repository.loadContacts()).find((item) => item.id === contact.id);

      expect(updated.status).toBe('terminee');
      expect(updated.archived).toBe(false);
      expect(refreshedContact?.activeRequestId).toBeUndefined();
    });

    it('réouverture refusée si une autre demande est déjà active', async () => {
      const contact = await repository.createContact({
        firstName: 'Test', lastName: 'Lifecycle', relationship: 'prospect',
      });
      const first = await repository.createRequest({ contactId: contact.id, title: 'Première' });
      await repository.updateRequest(first.id, { status: 'terminee' });
      const second = await repository.createRequest({ contactId: contact.id, title: 'Seconde' });

      await expect(repository.updateRequest(first.id, { status: 'nouveau' }))
        .rejects.toThrow(/already has an active request/i);
      expect((await repository.loadRequests()).find((item) => item.id === first.id)?.status).toBe('terminee');
      expect((await repository.loadContacts()).find((item) => item.id === contact.id)?.activeRequestId).toBe(second.id);
    });

    it('10. updateRequest inconnu → erreur', async () => {
      const repo = new SeedRepository();
      await expect(repo.updateRequest('r-nope-xyz', { title: 'X' })).rejects.toThrow(/id=r-nope-xyz not found/);
    });

    it('11. archiveRequest met archived=true', async () => {
      const repo = new SeedRepository();
      const reqs = await repo.loadRequests();
      const r = reqs.find(x => !x.archived) ?? reqs[0]; expect(r).toBeTruthy();
      await repo.archiveRequest(r.id);
      const again = await repo.loadRequests();
      expect(again.find(x => x.id === r.id)!.archived).toBe(true);
    });

    it('12. archiveRequest clear activeRequestId', async () => {
      const repo = new SeedRepository();
      const contacts = await repo.loadContacts();
      const avec = contacts.find(c => c.activeRequestId);
      if (avec) {
        await repo.archiveRequest(avec.activeRequestId!);
        const after = (await repo.loadContacts()).find(x => x.id === avec.id)!;
        expect(after.activeRequestId).toBeUndefined();
      } else {
        const c = contacts.find(c => !c.archived)!;
        const created = await repo.createRequest({ contactId: c.id, title: 'X' });
        await repo.archiveRequest(created.id);
        const after = (await repo.loadContacts()).find(x => x.id === c.id)!;
        expect(after.activeRequestId).toBeUndefined();
      }
    });

    it('13. archive ne décrémente pas totalRequests', async () => {
      const repo = new SeedRepository();
      const reqs = await repo.loadRequests();
      const r = reqs.find(x => !x.archived) ?? reqs[0]; expect(r).toBeTruthy();
      const beforeC = (await repo.loadContacts()).find(x => x.id === r.contactId)!;
      const before = beforeC.totalRequests;
      await repo.archiveRequest(r.id);
      const after = (await repo.loadContacts()).find(x => x.id === r.contactId)!;
      expect(after.totalRequests).toBe(before);
    });

    it('14. archive inconnue → erreur', async () => {
      const repo = new SeedRepository();
      await expect(repo.archiveRequest('r-unknown-xyz')).rejects.toThrow(/id=r-unknown-xyz not found/);
    });
  });

  describe('mission lifecycle', () => {
    it('confirme la demande même si la mission est créée déjà terminée', async () => {
      const contact = await repository.createContact({ firstName: 'Jean', lastName: 'Test', relationship: 'prospect' });
      const request = await repository.createRequest({ contactId: contact.id, title: 'Site' });

      await repository.createMission({ requestId: request.id, contactId: contact.id, title: 'Site', status: 'terminee' });

      expect((await repository.loadRequests()).find((item) => item.id === request.id)?.status).toBe('mission_confirmee');
    });

    it('la première mission confirme la demande et convertit le prospect en client', async () => {
      const contact = await repository.createContact({ firstName: 'Jean', lastName: 'Test', relationship: 'prospect' });
      const request = await repository.createRequest({ contactId: contact.id, title: 'Site' });

      await repository.createMission({ requestId: request.id, contactId: contact.id, title: 'Site' });

      expect((await repository.loadRequests()).find((item) => item.id === request.id)?.status).toBe('mission_confirmee');
      expect((await repository.loadContacts()).find((item) => item.id === contact.id)?.relationship).toBe('client');
    });

    it('une mission ultérieure requalifie un ancien client en client récurrent', async () => {
      const contact = await repository.createContact({ firstName: 'Jean', lastName: 'Test', relationship: 'prospect' });
      const firstRequest = await repository.createRequest({ contactId: contact.id, title: 'Premier site' });
      const firstMission = await repository.createMission({ requestId: firstRequest.id, contactId: contact.id, title: 'Premier site' });
      const completedFirstMission = await repository.updateMission(firstMission.id, { status: 'terminee' });
      await repository.updateContact(contact.id, { relationship: 'ancien_client' });
      const secondRequest = await repository.createRequest({ contactId: contact.id, title: 'Second site' });

      await repository.createMission({ requestId: secondRequest.id, contactId: contact.id, title: 'Second site' });

      expect(completedFirstMission.status).toBe('terminee');
      expect((await repository.loadContacts()).find((item) => item.id === contact.id)?.relationship).toBe('client_recurrent');
      expect((await repository.loadRequests()).find((item) => item.id === secondRequest.id)?.status).toBe('mission_confirmee');
    });

    it('classe en récurrent un prospect qui a déjà une mission historique', async () => {
      const contact = await repository.createContact({ firstName: 'Jean', lastName: 'Test', relationship: 'prospect' });
      const firstRequest = await repository.createRequest({ contactId: contact.id, title: 'Historique' });
      const historicalMission = await repository.createMission({ requestId: firstRequest.id, contactId: contact.id, title: 'Historique' });
      await repository.updateMission(historicalMission.id, { status: 'terminee' });
      await repository.updateContact(contact.id, { relationship: 'prospect' });
      const nextRequest = await repository.createRequest({ contactId: contact.id, title: 'Nouvelle prestation' });

      await repository.createMission({ requestId: nextRequest.id, contactId: contact.id, title: 'Nouvelle prestation' });

      expect((await repository.loadContacts()).find((item) => item.id === contact.id)?.relationship).toBe('client_recurrent');
    });

    it('refuse les demandes terminées et archivées avant de créer une mission', async () => {
      const contact = await repository.createContact({ firstName: 'Jean', lastName: 'Test', relationship: 'prospect' });
      const terminal = await repository.createRequest({ contactId: contact.id, title: 'Terminé' });
      await repository.updateRequest(terminal.id, { status: 'sans_suite' });
      const archived = await repository.createRequest({ contactId: contact.id, title: 'Archivé' });
      await repository.archiveRequest(archived.id);
      const missionCountBefore = (await repository.loadMissions()).length;

      await expect(repository.createMission({ requestId: terminal.id, contactId: contact.id, title: 'Refusée' }))
        .rejects.toThrow(/closed or archived/i);
      await expect(repository.createMission({ requestId: archived.id, contactId: contact.id, title: 'Refusée' }))
        .rejects.toThrow(/closed or archived/i);
      expect(await repository.loadMissions()).toHaveLength(missionCountBefore);
    });

    it('termine la demande seulement après la dernière mission', async () => {
      const contact = await repository.createContact({ firstName: 'Jean', lastName: 'Test', relationship: 'prospect' });
      const request = await repository.createRequest({ contactId: contact.id, title: 'Projet' });
      const first = await repository.createMission({ requestId: request.id, contactId: contact.id, title: 'Lot 1' });
      const second = await repository.createMission({ requestId: request.id, contactId: contact.id, title: 'Lot 2' });

      await repository.updateMission(first.id, { status: 'terminee' });
      expect((await repository.loadRequests()).find((item) => item.id === request.id)?.status).toBe('mission_confirmee');

      await repository.updateMission(second.id, { status: 'terminee' });
      expect((await repository.loadRequests()).find((item) => item.id === request.id)?.status).toBe('terminee');
      expect((await repository.loadContacts()).find((item) => item.id === contact.id)?.activeRequestId).toBeUndefined();
    });

    it('refuse une mission dont le contact ne correspond pas à la demande', async () => {
      const firstContact = await repository.createContact({ firstName: 'Jean', lastName: 'Test', relationship: 'prospect' });
      const secondContact = await repository.createContact({ firstName: 'Camille', lastName: 'Test', relationship: 'prospect' });
      const request = await repository.createRequest({ contactId: firstContact.id, title: 'Projet' });

      await expect(repository.createMission({ requestId: request.id, contactId: secondContact.id, title: 'Incorrecte' }))
        .rejects.toThrow(/does not belong to contact/i);
    });
  });

  describe('createRequestAction', () => {
  it('creates an action on a non-archived request with no open action, returns and persists the NextAction', async () => {
  const repo = new SeedRepository();

  const contacts = await repo.loadContacts();
  const contact = contacts.find((item) => !item.archived);

  expect(contact).toBeDefined();

  if (!contact) {
    throw new Error('missing non-archived contact');
  }

  const existingRequests = await repo.loadRequests();

  for (const request of existingRequests) {
    if (
      request.contactId === contact.id &&
      !request.archived &&
      request.status !== 'sans_suite'
    ) {
      await repo.archiveRequest(request.id);
    }
  }

  const target = await repo.createRequest({
    contactId: contact.id,
    title: 'Request for action test',
  });

  expect(target.nextAction).toBeUndefined();

  const actionType = 'appel' as const;
  const actionLabel = 'Call client to confirm details';
  const dueDate = new Date(Date.now() + 86400000).toISOString();

  const createdAction = await repo.createRequestAction({
    requestId: target.id,
    type: actionType,
    label: actionLabel,
    dueDate,
  });

  expect(createdAction).toBeDefined();
  expect(createdAction.type).toBe(actionType);
  expect(createdAction.label).toBe(actionLabel);
  expect(createdAction.dueDate).toBe(dueDate);

  const updatedReqs = await repo.loadRequests();
  const updatedRequest = updatedReqs.find(
    (request) => request.id === target.id
  );

  expect(updatedRequest?.nextAction).toBeDefined();
  expect(updatedRequest?.nextAction?.id).toBe(createdAction.id);
  expect(updatedRequest?.nextAction?.type).toBe(actionType);
  expect(updatedRequest?.nextAction?.label).toBe(actionLabel);
  expect(updatedRequest?.nextAction?.dueDate).toBe(dueDate);
});

it('rejects creating a second action for the same request, error mentions open action exists', async () => {
  const repo = new SeedRepository();

  const contacts = await repo.loadContacts();
  const contact = contacts.find((item) => !item.archived);

  expect(contact).toBeDefined();

  if (!contact) {
    throw new Error('missing non-archived contact');
  }

  const existingRequests = await repo.loadRequests();

  for (const request of existingRequests) {
    if (
      request.contactId === contact.id &&
      !request.archived &&
      request.status !== 'sans_suite'
    ) {
      await repo.archiveRequest(request.id);
    }
  }

  const target = await repo.createRequest({
    contactId: contact.id,
    title: 'Request for duplicate action test',
  });

  await repo.createRequestAction({
    requestId: target.id,
    type: 'appel',
    label: 'First action',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
  });

  await expect(
    repo.createRequestAction({
      requestId: target.id,
      type: 'devis',
      label: 'Second action',
      dueDate: new Date(Date.now() + 172800000).toISOString(),
    })
  ).rejects.toThrow(/already has an open action/);
});

  it('rejects creating an action for an archived request', async () => {
    const repo = new SeedRepository();
    const reqs = await repo.loadRequests();

    const target = reqs.find((request) => !request.archived);

    expect(target).toBeDefined();

    if (!target) {
      throw new Error('missing non-archived request');
    }

    await repo.archiveRequest(target.id);

    await expect(
      repo.createRequestAction({
        requestId: target.id,
        type: 'appel',
        label: 'Action on archived',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      })
    ).rejects.toThrow(/is archived/);
  });

  it('rejects creating an action for an unknown request id', async () => {
    const repo = new SeedRepository();

    await expect(
      repo.createRequestAction({
        requestId: 'r-unknown-123',
        type: 'appel',
        label: 'Action on unknown',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      })
    ).rejects.toThrow(/id=r-unknown-123 not found/);
  });
});

  

  
});
