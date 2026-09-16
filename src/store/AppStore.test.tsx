import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import type React from 'react';
import { useRef } from 'react';
import type { Contact, Exchange, Mission, Request } from '../types';
import type { CreateContactInput, IRepository } from '../data/repositories/interface';
import { AppStoreProvider, useAppStore, type AppStoreData } from './AppStore';

type RepositorySpy = IRepository & {
  loadContactsSpy: Mock<() => Promise<Contact[]>>;
  loadRequestsSpy: Mock<() => Promise<Request[]>>;
  loadMissionsSpy: Mock<() => Promise<Mission[]>>;
  loadExchangesSpy: Mock<() => Promise<Exchange[]>>;
  createContactSpy: Mock<(input: CreateContactInput) => Promise<Contact>>;
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

  return {
    loadContacts: loadContactsSpy,
    loadRequests: loadRequestsSpy,
    loadMissions: loadMissionsSpy,
    loadExchanges: loadExchangesSpy,
    createContact: createContactSpy,
    loadContactsSpy,
    loadRequestsSpy,
    loadMissionsSpy,
    loadExchangesSpy,
    createContactSpy,
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
});

export type { AppStoreData };
