/**
 * App Store - Provider + Hooks.
 *
 * Backend 1C : connexion à la couche Repository via IRepository.
 * Ne connaît PLUS directement seedData.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Contact, Exchange, Mission, NavItemKey, NextAction, Request } from '../types';
import { clock } from '../config/clock';
import type { CreateContactInput, CreateMissionInput, CreateRequestActionInput, CreateRequestInput, IRepository, UpdateContactInput, UpdateMissionInput, UpdateRequestInput } from '../data/repositories/interface';
import { createRepository } from '../data/repositories/factory';

interface AppStoreDataSlice {
  contacts: Contact[];
  requests: Request[];
  missions: Mission[];
  exchanges: Exchange[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  addContact: (input: CreateContactInput) => Promise<Contact>;
  updateContact: (contactId: string, input: UpdateContactInput) => Promise<Contact>;
  archiveContact: (contactId: string) => Promise<void>;
  addRequest: (input: CreateRequestInput) => Promise<Request>;
  updateRequest: (requestId: string, input: UpdateRequestInput) => Promise<Request>;
  createMission: (input: CreateMissionInput) => Promise<Mission>;
  updateMission: (missionId: string, input: UpdateMissionInput) => Promise<Mission>;
  createRequestAction: (input: CreateRequestActionInput) => Promise<NextAction>;
  archiveRequest: (requestId: string) => Promise<void>;
}

interface AppStoreValue {
  nav: {
    active: NavItemKey;
    setActive: (k: NavItemKey) => void;
  };
  search: {
    query: string;
    setQuery: (s: string) => void;
  };
  data: AppStoreDataSlice;
  ui: {
    reducedMotion: boolean;
    now: Date;
  };
}

export type AppStoreData = AppStoreDataSlice;

interface AppStoreProviderProps {
  children: ReactNode;
  /**
   * Repository à utiliser.
   * Si non fourni : création via la factory (DEFAULT_DATA_SOURCE = seed).
   * Injection préférée en tests : un faux repository injecté par Provider.
   */
  repository?: IRepository;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children, repository }: AppStoreProviderProps) {
  // Lazy initialization : createRepository() n'est évalué QU'UNE SEULE FOIS
  // (premier appel du useState lazy initializer), pas à chaque render.
  const [repositoryInstance] = useState<IRepository>(() => {
    return repository ?? createRepository();
  });
  const repositoryRef = useRef<IRepository>(repositoryInstance);
  repositoryRef.current = repositoryInstance;

  const mountedRef = useRef<boolean>(false);

  const [active, setActive] = useState<NavItemKey>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mql.matches;
  });
  const [now, setNow] = useState<Date>(() => clock.now());

  const loadAll = useCallback(async () => {
    const repo = repositoryRef.current;
    setLoading(true);
    setError(null);
    try {
      const [loadedContacts, loadedRequests, loadedMissions, loadedExchanges] =
        await Promise.all([
          repo.loadContacts(),
          repo.loadRequests(),
          repo.loadMissions(),
          repo.loadExchanges(),
        ]);
      if (!mountedRef.current) return;
      setContacts(loadedContacts);
      setRequests(loadedRequests);
      setMissions(loadedMissions);
      setExchanges(loadedExchanges);
      setError(null);
    } catch (e) {
      if (!mountedRef.current) return;
      const message =
        e instanceof Error ? e.message : String(e);
      setError(`Impossible de charger les données : ${message}`);
      // Pas de publication d'état partiel : tableaux conservent ce qu'ils avaient
      // mais on reset simplement loading=false pour laisser place à l'erreur.
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadAll();
    return () => {
      mountedRef.current = false;
    };
  }, [loadAll]);

  const reload = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  const redRef = useRef<MediaQueryList | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    redRef.current = mql;
    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mql.addEventListener('change', handler);
    return () => {
      mql.removeEventListener('change', handler);
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(clock.now());
    }, 1000 * 30);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  const addContact: AppStoreDataSlice['addContact'] = useCallback(
    async (input) => {
      const repo = repositoryRef.current;
      const created = await repo.createContact(input);
      setContacts((prev) => {
        if (prev.some((c) => c.id === created.id)) {
          return prev;
        }
        return [created, ...prev];
      });
      return created;
    },
    []
  );

  const updateContact: AppStoreDataSlice['updateContact'] = useCallback(
    async (contactId, input) => {
      const repo = repositoryRef.current;
      const updated = await repo.updateContact(contactId, input);
      setContacts((prev) => {
        const idx = prev.findIndex((c) => c.id === contactId);
        if (idx === -1) {
          return prev;
        }
        const next = prev.slice();
        next[idx] = updated;
        return next;
      });
      return updated;
    },
    []
  );

  const archiveContact: AppStoreDataSlice['archiveContact'] = useCallback(
    async (contactId) => {
      const repo = repositoryRef.current;
      await repo.archiveContact(contactId);
      setContacts((prev) => {
        return prev.map((c) => {
          if (c.id !== contactId) return c;
          return { ...c, archived: true };
        }).filter((c) => !c.archived);
      });
    },
    []
  );

  const addRequest = useCallback<AppStoreDataSlice['addRequest']>(async (input) => {
    const repo = repositoryRef.current;
    const created = await repo.createRequest(input);
    setRequests((prev) => {
      if (prev.some((r) => r.id === created.id)) return prev;
      return [created, ...prev];
    });
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.id === created.contactId);
      if (idx === -1) return prev;
      const c = prev[idx];
      const next = prev.slice();
      next[idx] = { ...c, totalRequests: c.totalRequests + 1, activeRequestId: created.id };
      return next;
    });
    return created;
  }, []);

  const updateRequest = useCallback<AppStoreDataSlice['updateRequest']>(async (requestId, input) => {
    const repo = repositoryRef.current;
    const updated = await repo.updateRequest(requestId, input);
    setRequests((prev) => {
      const idx = prev.findIndex((r) => r.id === requestId);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = updated;
      return next;
    });
    return updated;
  }, []);

  const createRequestAction = useCallback<AppStoreDataSlice['createRequestAction']>(
  async (input) => {
    const repo = repositoryRef.current;
    const created = await repo.createRequestAction(input);

    setRequests((prev) => {
      const idx = prev.findIndex((request) => request.id === input.requestId);

      if (idx === -1) {
        return prev;
      }

      const next = prev.slice();
      next[idx] = {
        ...prev[idx],
        nextAction: created,
      };

      return next;
    });

    return created;
  },
  []
);

  const archiveRequest = useCallback<AppStoreDataSlice['archiveRequest']>(async (requestId) => {
    const repo = repositoryRef.current;
    await repo.archiveRequest(requestId);
    setRequests((prev) => {
      return prev.map((r) => (r.id === requestId ? { ...r, archived: true } : r));
    });
    setContacts((prev) => {
      return prev.map((c) => {
        if (c.activeRequestId !== requestId) return c;
        return { ...c, activeRequestId: undefined };
      });
    });
  }, []);

  const createMission = useCallback<AppStoreDataSlice['createMission']>(async (input) => {
    const repo = repositoryRef.current;
    const created = await repo.createMission(input);
    setMissions((prev) => {
      if (prev.some((m) => m.id === created.id)) return prev;
      return [created, ...prev];
    });
    setContacts((prev) => {
      const idx = prev.findIndex((c) => c.id === input.contactId);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], totalMissions: next[idx].totalMissions + 1 };
      return next;
    });
    return created;
  }, []);

  const updateMission = useCallback<AppStoreDataSlice['updateMission']>(async (missionId, input) => {
    const repo = repositoryRef.current;
    const updated = await repo.updateMission(missionId, input);
    setMissions((prev) => {
      const idx = prev.findIndex((m) => m.id === missionId);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = updated;
      return next;
    });
    return updated;
  }, []);

  const data: AppStoreDataSlice = useMemo(
    () => ({
      contacts,
      requests,
      missions,
      exchanges,
      loading,
      error,
      reload,
      addContact,
      updateContact,
      archiveContact,
      addRequest,
      updateRequest,
      createMission,
      updateMission,
      createRequestAction,
      archiveRequest,
    }),
    [contacts, requests, missions, exchanges, loading, error, reload, addContact, updateContact, archiveContact, addRequest, updateRequest, createMission, updateMission, createRequestAction, archiveRequest]
  );

  const value: AppStoreValue = useMemo(
    () => ({
      nav: { active, setActive },
      search: { query: searchQuery, setQuery: setSearchQuery },
      data,
      ui: { reducedMotion, now },
    }),
    [active, searchQuery, data, reducedMotion, now]
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider');
  return ctx;
}

export function useReducedMotion(): boolean {
  return useAppStore().ui.reducedMotion;
}
