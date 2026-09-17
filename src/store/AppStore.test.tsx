import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import type React from 'react';
import { useRef } from 'react';
import type { Contact, Exchange, Mission, NextAction, Request } from '../types';
import type { CreateContactInput, CreateRequestActionInput, CreateRequestInput, IRepository, UpdateContactInput, UpdateRequestInput } from '../data/repositories/interface';
import { AppStoreProvider, useAppStore, type AppStoreData } from './AppStore';
import * as factoryModule from '../data/repositories/factory';

type RepositorySpy = IRepository & {
  loadContactsSpy: Mock<() => Promise<Contact[]>>;
  loadRequestsSpy: Mock<() => Promise<Request[]>>;
  loadMissionsSpy: Mock<() => Promise<Mission[]>>;
  loadExchangesSpy: Mock<() => Promise<Exchange[]>>;
  createContactSpy: Mock<(input: CreateContactInput) => Promise<Contact>>;
  updateContactSpy: Mock<(contactId: string, input: UpdateContactInput) => Promise<Contact>>;
  archiveContactSpy: Mock<(contactId: string) => Promise<void>>;
  createRequestSpy: Mock<(input: CreateRequestInput) => Promise<Request>>;
  updateRequestSpy: Mock<(requestId: string, input: UpdateRequestInput) => Promise<Request>>;
  createRequestActionSpy: Mock<(input: CreateRequestActionInput) => Promise<NextAction>>;
  archiveRequestSpy: Mock<(requestId: string) => Promise<void>>;
};

/**
 * Crée UN SEUL vi.fn() par méthode. Chaque spy sert à la fois :
 * - d'implémentation effective (champ loadContacts / createContact ...)
 * - de spy comptable (champ loadContactsSpy / createContactSpy ...)
 * Si overrides fourni, il devient l'implémentation mockée du spy.
 */
function buildRepository(overrides?: Partial<IRepository>): RepositorySpy {
  const loadContactsSpy = vi
    .fn<() => Promise<Contact[]>>()
    .mockImplementation(overrides?.loadContacts ?? (() => Promise.resolve([])));

  const loadRequestsSpy = vi
    .fn<() => Promise<Request[]>>()
    .mockImplementation(overrides?.loadRequests ?? (() => Promise.resolve([])));

  const loadMissionsSpy = vi
    .fn<() => Promise<Mission[]>>()
    .mockImplementation(overrides?.loadMissions ?? (() => Promise.resolve([])));

  const loadExchangesSpy = vi
    .fn<() => Promise<Exchange[]>>()
    .mockImplementation(overrides?.loadExchanges ?? (() => Promise.resolve([])));

  const createContactSpy = vi
    .fn<(input: CreateContactInput) => Promise<Contact>>()
    .mockImplementation(
      overrides?.createContact ??
        (() => Promise.reject(new Error('not implemented')))
    );

  const updateContactSpy = vi
    .fn<(contactId: string, input: UpdateContactInput) => Promise<Contact>>()
    .mockImplementation(
      overrides?.updateContact ??
        (() => Promise.reject(new Error('not implemented')))
    );

  const archiveContactSpy = vi
    .fn<(contactId: string) => Promise<void>>()
    .mockImplementation(
      overrides?.archiveContact ??
        (() => Promise.reject(new Error('not implemented')))
    );

  const createRequestSpy = vi
    .fn<(input: CreateRequestInput) => Promise<Request>>()
    .mockImplementation(
      overrides?.createRequest ??
        (() => Promise.reject(new Error('not implemented')))
    );

  const updateRequestSpy = vi
    .fn<(requestId: string, input: UpdateRequestInput) => Promise<Request>>()
    .mockImplementation(
      overrides?.updateRequest ??
        (() => Promise.reject(new Error('not implemented')))
    );

  const archiveRequestSpy = vi
    .fn<(requestId: string) => Promise<void>>()
    .mockImplementation(
      overrides?.archiveRequest ??
        (() => Promise.reject(new Error('not implemented')))
    );

  const createRequestActionSpy = vi
    .fn<(input: CreateRequestActionInput) => Promise<NextAction>>()
    .mockImplementation(
      overrides?.createRequestAction ??
        (() => Promise.reject(new Error('not implemented')))
    );

  return {
    loadContacts: loadContactsSpy,
    loadRequests: loadRequestsSpy,
    loadMissions: loadMissionsSpy,
    loadExchanges: loadExchangesSpy,
    createContact: createContactSpy,
    updateContact: updateContactSpy,
    archiveContact: archiveContactSpy,
    createRequestAction: createRequestActionSpy,
    createRequest: createRequestSpy,
    updateRequest: updateRequestSpy,
    archiveRequest: archiveRequestSpy,
    loadContactsSpy,
    loadRequestsSpy,
    loadMissionsSpy,
    loadExchangesSpy,
    createContactSpy,
    updateContactSpy,
    archiveContactSpy,
    createRequestSpy,
    updateRequestSpy,
    createRequestActionSpy,
    archiveRequestSpy,
  };
}

function useOnce(fn: () => void) {
  const called = useRef(false);
  if (!called.current) {
    called.current = true;
    fn();
  }
}

interface SnapBox<T> {
  latest: T | null;
}

function snap<T extends object>(
  name: string,
  pick: (data: AppStoreData) => T
): { Capture: () => React.JSX.Element; getLatest: () => T } {
  const box: SnapBox<T> = { latest: null };
  const Capture = () => {
    const store = useAppStore();
    box.latest = pick(store.data);
    return <div data-testid={name} />;
  };
  const getLatest = (): T => {
    return box.latest as unknown as T;
  };
  return { Capture, getLatest };
}

const SAMPLE_CONTACT_JEAN: Contact = {
  id: 'c-1',
  firstName: 'Jean',
  lastName: 'Dupont',
  company: 'ACME',
  email: 'jean@acme.fr',
  phone: undefined,
  notes: undefined,
  relationship: 'prospect',
  archived: false,
  createdAt: '2024-01-01T00:00:00Z',
  lastActivityAt: '2024-01-02T00:00:00Z',
  totalRequests: 0,
  totalMissions: 0,
  avatarSeed: 'c-1-aaaa',
};

const SAMPLE_CONTACT_CREATED: Contact = {
  id: 'c-new',
  firstName: 'Paul',
  lastName: 'Martin',
  company: 'PM Co',
  email: 'paul@pm.co',
  phone: undefined,
  notes: undefined,
  relationship: 'prospect',
  archived: false,
  createdAt: '2024-06-01T00:00:00Z',
  lastActivityAt: '2024-06-01T00:00:00Z',
  totalRequests: 0,
  totalMissions: 0,
  avatarSeed: 'c-new-bbbb',
};

const SAMPLE_CONTACT_JEAN_UPDATED: Contact = {
  ...SAMPLE_CONTACT_JEAN,
  firstName: 'Jean-Paul',
  company: 'ACME Corp',
  email: 'jeanpaul@acme.fr',
  relationship: 'client' as const,
};

const SAMPLE_REQUEST_1: Request = {
  id: 'r-1',
  contactId: 'c-1',
  title: 'Demande initiale',
  description: 'Description initiale',
  status: 'nouveau',
  createdAt: '2024-06-01T00:00:00Z',
  lastActivityAt: '2024-06-02T00:00:00Z',
  archived: false,
};

const SAMPLE_REQUEST_CREATED: Request = {
  id: 'r-new',
  contactId: 'c-1',
  title: 'Nouvelle demande',
  description: undefined,
  status: 'nouveau',
  createdAt: '2024-06-15T00:00:00Z',
  lastActivityAt: '2024-06-15T00:00:00Z',
  archived: false,
};

const SAMPLE_NEXT_ACTION: NextAction = {
  id: 'a-1',
  type: 'appel',
  label: 'Appeler le client',
  dueDate: '2024-06-20T10:00:00Z',
};

describe('AppStore → Repository', () => {
  it('1. loading = true au démarrage avant résolution', () => {
    let resolve: (() => void) | undefined;
    const slow = new Promise<unknown[]>((res) => {
      resolve = () => {
        res([[], [], [], []]);
      };
    });
    const repo = buildRepository({
      loadContacts: () => slow.then((a) => a[0] as Contact[]),
      loadRequests: () => slow.then((a) => a[1] as Request[]),
      loadMissions: () => slow.then((a) => a[2] as Mission[]),
      loadExchanges: () => slow.then((a) => a[3] as Exchange[]),
    });

    const Snapshot = () => {
      const store = useAppStore();
      useOnce(() => {
        expect(store.data.loading).toBe(true);
      });
      return (
        <div
          data-testid="loading-snapshot"
          data-loading={String(store.data.loading)}
        />
      );
    };

    render(
      <AppStoreProvider repository={repo}>
        <Snapshot />
      </AppStoreProvider>
    );

    expect(screen.getByTestId('loading-snapshot')).toHaveAttribute(
      'data-loading',
      'true'
    );
    if (resolve) resolve();
  });

  it('2. chargement réussi publie les 4 collections, loading=false, error=null', async () => {
    const { Capture, getLatest } = snap('capture-2', (d) => d);

    render(
      <AppStoreProvider
        repository={buildRepository({
          loadContacts: () => Promise.resolve([SAMPLE_CONTACT_JEAN]),
          loadRequests: () => Promise.resolve([]),
          loadMissions: () => Promise.resolve([]),
          loadExchanges: () => Promise.resolve([]),
        })}
      >
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      const d = getLatest();
      expect(d.loading).toBe(false);
      expect(d.error).toBe(null);
      expect(d.contacts).toEqual([SAMPLE_CONTACT_JEAN]);
      expect(d.requests).toEqual([]);
      expect(d.missions).toEqual([]);
      expect(d.exchanges).toEqual([]);
    });
  });

  it('3. appelle les 4 méthodes load du repository', async () => {
    const repo = buildRepository();

    render(
      <AppStoreProvider repository={repo}>
        <div />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(repo.loadContactsSpy).toHaveBeenCalledTimes(1);
      expect(repo.loadRequestsSpy).toHaveBeenCalledTimes(1);
      expect(repo.loadMissionsSpy).toHaveBeenCalledTimes(1);
      expect(repo.loadExchangesSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('4. en cas d’erreur : aucune donnée partielle + loading false + error', async () => {
    const { Capture, getLatest } = snap('capture-4', (d) => d);

    render(
      <AppStoreProvider
        repository={buildRepository({
          loadContacts: () => Promise.resolve([SAMPLE_CONTACT_JEAN]),
          loadRequests: () => Promise.reject(new Error('requests boom')),
          loadMissions: () => Promise.resolve([]),
          loadExchanges: () => Promise.resolve([]),
        })}
      >
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      const d = getLatest();
      expect(d.loading).toBe(false);
      expect(d.error).not.toBe(null);
    });

    const d = getLatest();
    expect(d.contacts).toEqual([]);
    expect(d.requests).toEqual([]);
    expect(d.missions).toEqual([]);
    expect(d.exchanges).toEqual([]);
  });

  it('5. reload() relance les 4 lectures du repository', async () => {
    const repo = buildRepository();
    let reloadFn: () => Promise<void> = () => Promise.resolve();
    const Capture = () => {
      const store = useAppStore();
      reloadFn = store.data.reload;
      return <div />;
    };

    render(
      <AppStoreProvider repository={repo}>
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(repo.loadContactsSpy).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await reloadFn();
    });

    expect(repo.loadContactsSpy).toHaveBeenCalledTimes(2);
    expect(repo.loadRequestsSpy).toHaveBeenCalledTimes(2);
    expect(repo.loadMissionsSpy).toHaveBeenCalledTimes(2);
    expect(repo.loadExchangesSpy).toHaveBeenCalledTimes(2);
  });

  it('6. addContact appelle repository.createContact avec le payload', async () => {
    const repo = buildRepository({
      createContact: () => Promise.resolve(SAMPLE_CONTACT_CREATED),
    });
    let addContactFn: (input: CreateContactInput) => Promise<Contact> = () => {
      return Promise.reject(new Error('not initialized'));
    };
    const Capture = () => {
      const store = useAppStore();
      addContactFn = store.data.addContact;
      return <div />;
    };

    render(
      <AppStoreProvider repository={repo}>
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(typeof addContactFn).toBe('function');
    });

    const payload: CreateContactInput = {
      firstName: 'Paul',
      lastName: 'Martin',
      company: 'PM Co',
      email: 'paul@pm.co',
      relationship: 'prospect',
    };

    const result = await act(async () => addContactFn(payload));

    expect(repo.createContactSpy).toHaveBeenCalledTimes(1);
    expect(repo.createContactSpy).toHaveBeenCalledWith(payload);
    expect(result.id).toBe('c-new');
  });

  it('7. le Contact créé est ajouté au state après succès', async () => {
    const { Capture, getLatest } = snap('capture-7', (d) => ({
      contacts: d.contacts,
      addContact: d.addContact,
    }));

    render(
      <AppStoreProvider
        repository={buildRepository({
          loadContacts: () => Promise.resolve([]),
          createContact: () => Promise.resolve(SAMPLE_CONTACT_CREATED),
        })}
      >
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(getLatest().contacts).toHaveLength(0);
    });

    await act(async () => {
      await getLatest().addContact({
        firstName: 'Paul',
        lastName: 'Martin',
        relationship: 'prospect',
      });
    });

    const after = getLatest().contacts;
    expect(after).toHaveLength(1);
    expect(after[0]?.id).toBe('c-new');
  });

  it('8. aucun doublon si le repository retourne un id déjà présent', async () => {
    const { Capture, getLatest } = snap('capture-8', (d) => ({
      contacts: d.contacts,
      addContact: d.addContact,
    }));

    render(
      <AppStoreProvider
        repository={buildRepository({
          loadContacts: () => Promise.resolve([SAMPLE_CONTACT_CREATED]),
          createContact: () => Promise.resolve(SAMPLE_CONTACT_CREATED),
        })}
      >
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(getLatest().contacts).toHaveLength(1);
    });

    await act(async () => {
      await getLatest().addContact({
        firstName: 'Paul',
        lastName: 'Martin',
        relationship: 'prospect',
      });
    });

    expect(getLatest().contacts).toHaveLength(1);
  });

  it('9. createContact échoue : Promise rejetée + state contacts inchangé', async () => {
    const { Capture, getLatest } = snap('capture-9', (d) => ({
      contacts: d.contacts,
      addContact: d.addContact,
    }));

    render(
      <AppStoreProvider
        repository={buildRepository({
          loadContacts: () => Promise.resolve([SAMPLE_CONTACT_JEAN]),
          createContact: () => Promise.reject(new Error('create boom')),
        })}
      >
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(getLatest().contacts).toHaveLength(1);
    });

    let caughtError: unknown = null;
    await act(async () => {
      try {
        await getLatest().addContact({
          firstName: 'Paul',
          lastName: 'Martin',
          relationship: 'prospect',
        });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toMatch(/create boom/);
    const after = getLatest().contacts;
    expect(after).toHaveLength(1);
    expect(after[0]?.id).toBe('c-1');
  });

  it('12. updateContact appelle repository.updateContact et remplace le bon contact sans doublon', async () => {
    const repo = buildRepository({
      loadContacts: () => Promise.resolve([SAMPLE_CONTACT_JEAN]),
      updateContact: (id, input) => {
        expect(id).toBe(SAMPLE_CONTACT_JEAN.id);
        expect(input.firstName).toBe('Jean-Paul');
        return Promise.resolve(SAMPLE_CONTACT_JEAN_UPDATED);
      },
    });
    const { Capture, getLatest } = snap('capture-12', (d) => ({
      contacts: d.contacts,
      updateContact: d.updateContact,
    }));

    render(
      <AppStoreProvider repository={repo}>
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(getLatest().contacts).toHaveLength(1);
      expect(getLatest().contacts[0]?.id).toBe('c-1');
    });

    const before = getLatest().contacts;
    expect(before[0]?.firstName).toBe('Jean');

    await act(async () => {
      await getLatest().updateContact(SAMPLE_CONTACT_JEAN.id, { firstName: 'Jean-Paul' });
    });

    expect(repo.updateContactSpy).toHaveBeenCalledTimes(1);
    expect(repo.updateContactSpy).toHaveBeenCalledWith(SAMPLE_CONTACT_JEAN.id, { firstName: 'Jean-Paul' });

    const after = getLatest().contacts;
    expect(after).toHaveLength(1);
    expect(after[0]?.id).toBe('c-1');
    expect(after[0]?.firstName).toBe('Jean-Paul');
    expect(after[0]?.company).toBe('ACME Corp');
    expect(after[0]?.totalRequests).toBe(0);
  });

  it('13. updateContact échoue : Promise rejetée + state contacts inchangé', async () => {
    const { Capture, getLatest } = snap('capture-13', (d) => ({
      contacts: d.contacts,
      updateContact: d.updateContact,
    }));

    render(
      <AppStoreProvider
        repository={buildRepository({
          loadContacts: () => Promise.resolve([SAMPLE_CONTACT_JEAN]),
          updateContact: () => Promise.reject(new Error('update boom')),
        })}
      >
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(getLatest().contacts).toHaveLength(1);
    });

    let caughtError: unknown = null;
    await act(async () => {
      try {
        await getLatest().updateContact(SAMPLE_CONTACT_JEAN.id, { firstName: 'Jean-Paul' });
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toMatch(/update boom/);
    const after = getLatest().contacts;
    expect(after).toHaveLength(1);
    expect(after[0]?.id).toBe('c-1');
    expect(after[0]?.firstName).toBe('Jean');
  });

  it('14. archiveContact appelle repository.archiveContact et retire le contact de la liste active', async () => {
    const repo = buildRepository({
      loadContacts: () => Promise.resolve([SAMPLE_CONTACT_JEAN, SAMPLE_CONTACT_CREATED]),
      archiveContact: (id) => {
        expect(id).toBe(SAMPLE_CONTACT_JEAN.id);
        return Promise.resolve();
      },
    });
    const { Capture, getLatest } = snap('capture-14', (d) => ({
      contacts: d.contacts,
      archiveContact: d.archiveContact,
    }));

    render(
      <AppStoreProvider repository={repo}>
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(getLatest().contacts).toHaveLength(2);
    });

    await act(async () => {
      await getLatest().archiveContact(SAMPLE_CONTACT_JEAN.id);
    });

    expect(repo.archiveContactSpy).toHaveBeenCalledTimes(1);
    expect(repo.archiveContactSpy).toHaveBeenCalledWith(SAMPLE_CONTACT_JEAN.id);

    const after = getLatest().contacts;
    expect(after).toHaveLength(1);
    expect(after[0]?.id).toBe('c-new');
    expect(after.some((c) => c.id === 'c-1')).toBe(false);
  });

  it('15. archiveContact échoue : Promise rejetée + state contacts inchangé', async () => {
    const { Capture, getLatest } = snap('capture-15', (d) => ({
      contacts: d.contacts,
      archiveContact: d.archiveContact,
    }));

    render(
      <AppStoreProvider
        repository={buildRepository({
          loadContacts: () => Promise.resolve([SAMPLE_CONTACT_JEAN]),
          archiveContact: () => Promise.reject(new Error('archive boom')),
        })}
      >
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(getLatest().contacts).toHaveLength(1);
    });

    let caughtError: unknown = null;
    await act(async () => {
      try {
        await getLatest().archiveContact(SAMPLE_CONTACT_JEAN.id);
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toMatch(/archive boom/);
    const after = getLatest().contacts;
    expect(after).toHaveLength(1);
    expect(after[0]?.id).toBe('c-1');
  });

  it('9. updateContact sur ID ABSENT du state: repository appelé mais state inchangé, pas de nouvel entrée insérée', async () => {
    const OTHER_ID = 'c-absent-xyz-999';
    const repo = buildRepository({
      loadContacts: () => Promise.resolve([SAMPLE_CONTACT_JEAN]),
      updateContact: (id, _input) => {
        // Retourne un contact mis à jour simulé malgré l'absence côté state
        return Promise.resolve({
          ...SAMPLE_CONTACT_JEAN,
          id,
          firstName: 'ShouldNotAppear',
        });
      },
    });
    const { Capture, getLatest } = snap('capture-upd-absent', (d) => ({
      contacts: d.contacts,
      updateContact: d.updateContact,
    }));

    render(
      <AppStoreProvider repository={repo}>
        <Capture />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(getLatest().contacts).toHaveLength(1);
    });

    const beforeIds = getLatest().contacts.map((c) => c.id);
    let returnedVal: Contact | null = null;
    await act(async () => {
      returnedVal = (await getLatest().updateContact(OTHER_ID, { firstName: 'X' }));
    });

    expect(repo.updateContactSpy).toHaveBeenCalledWith(OTHER_ID, { firstName: 'X' });
    // Repository retourne bien une valeur (non nulle)
    expect(returnedVal).not.toBeNull();
    expect((returnedVal as unknown as Contact).id).toBe(OTHER_ID);
    // MAIS state n'a pas été modifié
    const after = getLatest().contacts;
    expect(after).toHaveLength(1);
    const afterIds = after.map((c) => c.id);
    expect(afterIds).toEqual(beforeIds);
    expect(after.some((c) => c.id === OTHER_ID)).toBe(false);
  });

  describe('Stabilité instance repository (lazy init)', () => {
    it('10. repository injecté en prop : instance utilisée reste stable après rerenders', async () => {
      const injectedRepo = buildRepository();

      function Dummy({ count }: { count: number }) {
        return (
          <AppStoreProvider repository={injectedRepo}>
            <div data-testid="dummy" data-count={String(count)} />
          </AppStoreProvider>
        );
      }
      const { rerender } = render(<Dummy count={0} />);

      await waitFor(() => {
        expect(injectedRepo.loadContactsSpy).toHaveBeenCalledTimes(1);
      });

      act(() => {
        rerender(<Dummy count={1} />);
      });
      act(() => {
        rerender(<Dummy count={2} />);
      });
      act(() => {
        rerender(<Dummy count={3} />);
      });

      await waitFor(() => {
        expect(injectedRepo.loadContactsSpy).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('dummy')).toHaveAttribute('data-count', '3');
      });
    });

    it('11. repository par défaut : createRepository() appelé exactement 1× malgré rerenders', async () => {
      const baseRepo = buildRepository();
      const createSpy = vi
        .spyOn(factoryModule, 'createRepository')
        .mockImplementation(() => baseRepo);

      try {
        function Dummy({ count }: { count: number }) {
          return (
            <AppStoreProvider>
              <div data-testid="dummy" data-count={String(count)} />
            </AppStoreProvider>
          );
        }
        const { rerender } = render(<Dummy count={0} />);

        await waitFor(() => {
          expect(createSpy).toHaveBeenCalledTimes(1);
          expect(baseRepo.loadContactsSpy).toHaveBeenCalledTimes(1);
        });

        act(() => {
          rerender(<Dummy count={1} />);
        });
        act(() => {
          rerender(<Dummy count={2} />);
        });
        act(() => {
          rerender(<Dummy count={3} />);
        });

        await waitFor(() => {
          expect(createSpy).toHaveBeenCalledTimes(1);
          expect(baseRepo.loadContactsSpy).toHaveBeenCalledTimes(1);
        });
      } finally {
        createSpy.mockRestore();
      }
    });
  });

  describe('AppStore → Request CRUD (tests 32-42)', () => {
    it('32. addRequest ajoute une seule demande', async () => {
      const { Capture, getLatest } = snap('capture-32', (d) => ({
        requests: d.requests,
        addRequest: d.addRequest,
      }));

      render(
        <AppStoreProvider
          repository={buildRepository({
            loadRequests: () => Promise.resolve([SAMPLE_REQUEST_1]),
            createRequest: () => Promise.resolve(SAMPLE_REQUEST_CREATED),
          })}
        >
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(1);
      });

      const before = getLatest().requests;
      await act(async () => {
        await getLatest().addRequest({ contactId: 'c-1', title: 't' });
      });

      const after = getLatest().requests;
      expect(after.length).toBe(before.length + 1);
      const found = after.filter((r) => r.id === SAMPLE_REQUEST_CREATED.id);
      expect(found).toHaveLength(1);
    });

    it('33. addRequest update totalRequests', async () => {
      const contactWithRequest: Contact = {
        ...SAMPLE_CONTACT_JEAN,
        id: 'c-1',
        totalRequests: 2,
      };
      const { Capture, getLatest } = snap('capture-33', (d) => ({
        contacts: d.contacts,
        addRequest: d.addRequest,
      }));

      render(
        <AppStoreProvider
          repository={buildRepository({
            loadContacts: () => Promise.resolve([contactWithRequest]),
            createRequest: () => Promise.resolve(SAMPLE_REQUEST_CREATED),
          })}
        >
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().contacts).toHaveLength(1);
      });

      const before = getLatest().contacts[0].totalRequests;
      await act(async () => {
        await getLatest().addRequest({ contactId: 'c-1', title: 't' });
      });

      const after = getLatest().contacts[0].totalRequests;
      expect(after).toBe(before + 1);
    });

    it('34. addRequest update activeRequestId', async () => {
      const contactSansActive: Contact = {
        ...SAMPLE_CONTACT_JEAN,
        id: 'c-1',
        activeRequestId: undefined,
      };
      const { Capture, getLatest } = snap('capture-34', (d) => ({
        contacts: d.contacts,
        addRequest: d.addRequest,
      }));

      render(
        <AppStoreProvider
          repository={buildRepository({
            loadContacts: () => Promise.resolve([contactSansActive]),
            createRequest: () => Promise.resolve({ ...SAMPLE_REQUEST_CREATED, id: 'r-spy-id' }),
          })}
        >
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().contacts).toHaveLength(1);
      });

      await act(async () => {
        await getLatest().addRequest({ contactId: 'c-1', title: 't' });
      });

      const after = getLatest().contacts[0];
      expect(after.activeRequestId).toBe('r-spy-id');
    });

    it('35. erreur addRequest → state inchangé', async () => {
      const { Capture, getLatest } = snap('capture-35', (d) => ({
        requests: d.requests,
        contacts: d.contacts,
        addRequest: d.addRequest,
      }));

      render(
        <AppStoreProvider
          repository={buildRepository({
            loadContacts: () => Promise.resolve([SAMPLE_CONTACT_JEAN]),
            loadRequests: () => Promise.resolve([SAMPLE_REQUEST_1]),
            createRequest: () => Promise.reject(new Error('create request boom')),
          })}
        >
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(1);
        expect(getLatest().contacts).toHaveLength(1);
      });

      const beforeRequests = [...getLatest().requests];
      const beforeContactTotal = getLatest().contacts[0].totalRequests;
      let caughtError: unknown = null;

      await act(async () => {
        try {
          await getLatest().addRequest({ contactId: SAMPLE_CONTACT_JEAN.id, title: 'X' });
        } catch (err) {
          caughtError = err;
        }
      });

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toMatch(/create request boom/);
      expect(getLatest().requests).toEqual(beforeRequests);
      expect(getLatest().contacts[0].totalRequests).toBe(beforeContactTotal);
    });

    it('36. updateRequest remplace la bonne demande', async () => {
      const updatedRequest: Request = {
        ...SAMPLE_REQUEST_1,
        title: 'Titre modifié !!!',
      };
      const { Capture, getLatest } = snap('capture-36', (d) => ({
        requests: d.requests,
        updateRequest: d.updateRequest,
      }));

      render(
        <AppStoreProvider
          repository={buildRepository({
            loadRequests: () => Promise.resolve([SAMPLE_REQUEST_1]),
            updateRequest: (_id, _input) => Promise.resolve(updatedRequest),
          })}
        >
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(1);
      });

      await act(async () => {
        await getLatest().updateRequest(SAMPLE_REQUEST_1.id, { title: 'Titre modifié !!!' });
      });

      const after = getLatest().requests;
      expect(after).toHaveLength(1);
      expect(after[0]?.id).toBe(SAMPLE_REQUEST_1.id);
      expect(after[0]?.title).toBe('Titre modifié !!!');
    });

    it('37. updateRequest absent → aucune insertion', async () => {
      const repo = buildRepository({
        loadRequests: () => Promise.resolve([SAMPLE_REQUEST_1]),
        updateRequest: () => Promise.resolve({ ...SAMPLE_REQUEST_1, id: 'r-absent', title: 'Should not appear' }),
      });
      const { Capture, getLatest } = snap('capture-37', (d) => ({
        requests: d.requests,
        updateRequest: d.updateRequest,
      }));

      render(
        <AppStoreProvider repository={repo}>
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(1);
      });

      const beforeIds = getLatest().requests.map((r) => r.id);
      await act(async () => {
        await getLatest().updateRequest('r-absent-xyz', { title: 'X' });
      });

      const after = getLatest().requests;
      expect(after).toHaveLength(1);
      const afterIds = after.map((r) => r.id);
      expect(afterIds).toEqual(beforeIds);
      expect(after.some((r) => r.id === 'r-absent')).toBe(false);
    });

    it('38. erreur update → state inchangé', async () => {
      const { Capture, getLatest } = snap('capture-38', (d) => ({
        requests: d.requests,
        updateRequest: d.updateRequest,
      }));

      render(
        <AppStoreProvider
          repository={buildRepository({
            loadRequests: () => Promise.resolve([SAMPLE_REQUEST_1]),
            updateRequest: () => Promise.reject(new Error('update request boom')),
          })}
        >
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(1);
      });

      const before = [...getLatest().requests];
      let caughtError: unknown = null;

      await act(async () => {
        try {
          await getLatest().updateRequest(SAMPLE_REQUEST_1.id, { title: 'X' });
        } catch (err) {
          caughtError = err;
        }
      });

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toMatch(/update request boom/);
      expect(getLatest().requests).toEqual(before);
    });

    it('39. archiveRequest marque archived=true', async () => {
      const { Capture, getLatest } = snap('capture-39', (d) => ({
        requests: d.requests,
        archiveRequest: d.archiveRequest,
      }));

      render(
        <AppStoreProvider
          repository={buildRepository({
            loadRequests: () => Promise.resolve([SAMPLE_REQUEST_1]),
            archiveRequest: () => Promise.resolve(),
          })}
        >
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(1);
      });

      await act(async () => {
        await getLatest().archiveRequest(SAMPLE_REQUEST_1.id);
      });

      const after = getLatest().requests;
      const target = after.find((r) => r.id === SAMPLE_REQUEST_1.id);
      expect(target).toBeDefined();
      expect(target?.archived).toBe(true);
    });

    it('40. archive clear activeRequestId', async () => {
      const contactAvecActive: Contact = {
        ...SAMPLE_CONTACT_JEAN,
        id: 'c-1',
        activeRequestId: SAMPLE_REQUEST_1.id,
      };
      const { Capture, getLatest } = snap('capture-40', (d) => ({
        contacts: d.contacts,
        archiveRequest: d.archiveRequest,
      }));

      render(
        <AppStoreProvider
          repository={buildRepository({
            loadContacts: () => Promise.resolve([contactAvecActive]),
            archiveRequest: () => Promise.resolve(),
          })}
        >
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().contacts).toHaveLength(1);
      });

      expect(getLatest().contacts[0]?.activeRequestId).toBe(SAMPLE_REQUEST_1.id);

      await act(async () => {
        await getLatest().archiveRequest(SAMPLE_REQUEST_1.id);
      });

      const after = getLatest().contacts[0];
      expect(after.activeRequestId).toBeUndefined();
    });

    it('41. archive totalRequests inchangé', async () => {
      const contactAvecRequests: Contact = {
        ...SAMPLE_CONTACT_JEAN,
        id: 'c-1',
        totalRequests: 5,
      };
      const { Capture, getLatest } = snap('capture-41', (d) => ({
        contacts: d.contacts,
        archiveRequest: d.archiveRequest,
      }));

      render(
        <AppStoreProvider
          repository={buildRepository({
            loadContacts: () => Promise.resolve([contactAvecRequests]),
            archiveRequest: () => Promise.resolve(),
          })}
        >
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().contacts).toHaveLength(1);
      });

      const before = getLatest().contacts[0].totalRequests;
      await act(async () => {
        await getLatest().archiveRequest(SAMPLE_REQUEST_1.id);
      });

      const after = getLatest().contacts[0].totalRequests;
      expect(after).toBe(before);
    });

    it('42. erreur archive → state inchangé', async () => {
      const contactAvecActive: Contact = {
        ...SAMPLE_CONTACT_JEAN,
        id: 'c-1',
        activeRequestId: SAMPLE_REQUEST_1.id,
      };
      const { Capture, getLatest } = snap('capture-42', (d) => ({
        requests: d.requests,
        contacts: d.contacts,
        archiveRequest: d.archiveRequest,
      }));

      render(
        <AppStoreProvider
          repository={buildRepository({
            loadContacts: () => Promise.resolve([contactAvecActive]),
            loadRequests: () => Promise.resolve([SAMPLE_REQUEST_1]),
            archiveRequest: () => Promise.reject(new Error('archive request boom')),
          })}
        >
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(1);
        expect(getLatest().contacts).toHaveLength(1);
      });

      const beforeRequest = { ...getLatest().requests[0] };
      const beforeActiveId = getLatest().contacts[0].activeRequestId;
      let caughtError: unknown = null;

      await act(async () => {
        try {
          await getLatest().archiveRequest(SAMPLE_REQUEST_1.id);
        } catch (err) {
          caughtError = err;
        }
      });

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toMatch(/archive request boom/);
      expect(getLatest().requests[0]?.archived).toBe(beforeRequest.archived);
      expect(getLatest().contacts[0].activeRequestId).toBe(beforeActiveId);
    });
  });

    describe('AppStore → Request Actions (tests 43-46)', () => {
    it('43. createRequestAction appelle le repository avec le bon payload et retourne l’action créée', async () => {
      const repo = buildRepository({
        loadRequests: () => Promise.resolve([SAMPLE_REQUEST_1]),
        createRequestAction: () => Promise.resolve(SAMPLE_NEXT_ACTION),
      });

      const { Capture, getLatest } = snap('capture-43', (d) => ({
        requests: d.requests,
        createRequestAction: d.createRequestAction,
      }));

      render(
        <AppStoreProvider repository={repo}>
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(1);
      });

      const payload: CreateRequestActionInput = {
        requestId: SAMPLE_REQUEST_1.id,
        type: 'appel',
        label: 'Appeler le client',
        dueDate: '2024-06-20T10:00:00Z',
      };

      const result = await act(async () => {
        return getLatest().createRequestAction(payload);
      });

      expect(repo.createRequestActionSpy).toHaveBeenCalledTimes(1);
      expect(repo.createRequestActionSpy).toHaveBeenCalledWith(payload);
      expect(result).toEqual(SAMPLE_NEXT_ACTION);
    });

    it('44. createRequestAction met à jour uniquement nextAction de la bonne demande sans modifier status ni lastActivityAt', async () => {
      const otherRequest: Request = {
        ...SAMPLE_REQUEST_1,
        id: 'r-2',
        title: 'Autre demande',
      };

      const repo = buildRepository({
        loadRequests: () =>
          Promise.resolve([SAMPLE_REQUEST_1, otherRequest]),
        createRequestAction: () => Promise.resolve(SAMPLE_NEXT_ACTION),
      });

      const { Capture, getLatest } = snap('capture-44', (d) => ({
        requests: d.requests,
        createRequestAction: d.createRequestAction,
      }));

      render(
        <AppStoreProvider repository={repo}>
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(2);
      });

      const beforeTarget = getLatest().requests.find(
        (request) => request.id === SAMPLE_REQUEST_1.id
      );

      const beforeOther = getLatest().requests.find(
        (request) => request.id === otherRequest.id
      );

      await act(async () => {
        await getLatest().createRequestAction({
          requestId: SAMPLE_REQUEST_1.id,
          type: 'appel',
          label: 'Appeler le client',
          dueDate: '2024-06-20T10:00:00Z',
        });
      });

      const afterTarget = getLatest().requests.find(
        (request) => request.id === SAMPLE_REQUEST_1.id
      );

      const afterOther = getLatest().requests.find(
        (request) => request.id === otherRequest.id
      );

      expect(afterTarget?.nextAction).toEqual(SAMPLE_NEXT_ACTION);
      expect(afterTarget?.status).toBe(beforeTarget?.status);
      expect(afterTarget?.lastActivityAt).toBe(beforeTarget?.lastActivityAt);

      expect(beforeTarget?.nextAction).toBeUndefined();
      expect(afterTarget).not.toBe(beforeTarget);

      expect(afterOther).toEqual(beforeOther);
    });

    it('45. erreur createRequestAction → Promise rejetée et state requests inchangé', async () => {
      const repo = buildRepository({
        loadRequests: () => Promise.resolve([SAMPLE_REQUEST_1]),
        createRequestAction: () =>
          Promise.reject(new Error('create action boom')),
      });

      const { Capture, getLatest } = snap('capture-45', (d) => ({
        requests: d.requests,
        createRequestAction: d.createRequestAction,
      }));

      render(
        <AppStoreProvider repository={repo}>
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(1);
      });

      const before = [...getLatest().requests];
      let caughtError: unknown = null;

      await act(async () => {
        try {
          await getLatest().createRequestAction({
            requestId: SAMPLE_REQUEST_1.id,
            type: 'appel',
            label: 'Appeler le client',
            dueDate: '2024-06-20T10:00:00Z',
          });
        } catch (error) {
          caughtError = error;
        }
      });

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toMatch(/create action boom/);
      expect(getLatest().requests).toEqual(before);
    });

    it('46. demande absente du state → aucune demande fantôme ajoutée', async () => {
      const repo = buildRepository({
        loadRequests: () => Promise.resolve([SAMPLE_REQUEST_1]),
        createRequestAction: () => Promise.resolve(SAMPLE_NEXT_ACTION),
      });

      const { Capture, getLatest } = snap('capture-46', (d) => ({
        requests: d.requests,
        createRequestAction: d.createRequestAction,
      }));

      render(
        <AppStoreProvider repository={repo}>
          <Capture />
        </AppStoreProvider>
      );

      await waitFor(() => {
        expect(getLatest().requests).toHaveLength(1);
      });

      const before = [...getLatest().requests];

      await act(async () => {
        await getLatest().createRequestAction({
          requestId: 'r-absente-du-state',
          type: 'appel',
          label: 'Test',
          dueDate: '2024-06-20T10:00:00Z',
        });
      });

      expect(getLatest().requests).toEqual(before);
      expect(getLatest().requests).toHaveLength(1);
    });
  });

});

export type { AppStoreData };
