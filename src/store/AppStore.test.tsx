import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import type React from 'react';
import { useRef } from 'react';
import type { Contact, Exchange, Mission, Request } from '../types';
import type { CreateContactInput, IRepository, UpdateContactInput } from '../data/repositories/interface';
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

  return {
    loadContacts: loadContactsSpy,
    loadRequests: loadRequestsSpy,
    loadMissions: loadMissionsSpy,
    loadExchanges: loadExchangesSpy,
    createContact: createContactSpy,
    updateContact: updateContactSpy,
    archiveContact: archiveContactSpy,
    loadContactsSpy,
    loadRequestsSpy,
    loadMissionsSpy,
    loadExchangesSpy,
    createContactSpy,
    updateContactSpy,
    archiveContactSpy,
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
});

export type { AppStoreData };
