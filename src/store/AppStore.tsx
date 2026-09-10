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
import {
  seedContacts,
  seedExchanges,
  seedMissions,
  seedRequests,
} from '../data/seedData';
import type { Contact, Exchange, Mission, NavItemKey, Request } from '../types';
import { clock } from '../config/clock';

interface AppStoreValue {
  nav: {
    active: NavItemKey;
    setActive: (k: NavItemKey) => void;
  };
  search: {
    query: string;
    setQuery: (s: string) => void;
  };
  data: {
    contacts: Contact[];
    requests: Request[];
    missions: Mission[];
    exchanges: Exchange[];
    addContact: (c: Omit<Contact, 'id' | 'createdAt' | 'lastActivityAt' | 'totalRequests' | 'totalMissions' | 'avatarSeed' | 'activeRequestId' | 'archived'> & { relationship: Contact['relationship'] }) => Contact;
  };
  ui: {
    reducedMotion: boolean;
    now: Date;
  };
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<NavItemKey>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const [contacts, setContacts] = useState<Contact[]>(() => [...seedContacts]);
  const [requests] = useState<Request[]>(() => [...seedRequests]);
  const [missions] = useState<Mission[]>(() => [...seedMissions]);
  const [exchanges] = useState<Exchange[]>(() => [...seedExchanges]);

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mql.matches;
  });
  const [now, setNow] = useState<Date>(() => clock.now());

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

  const addContact: AppStoreValue['data']['addContact'] = useCallback(
    (input) => {
      const newId = `c-new-${Date.now().toString(36)}`;
      const created = clock.nowIso();
      const c: Contact = {
        id: newId,
        firstName: input.firstName,
        lastName: input.lastName,
        company: input.company,
        email: input.email,
        phone: input.phone,
        notes: input.notes,
        relationship: input.relationship,
        createdAt: created,
        lastActivityAt: created,
        archived: false,
        activeRequestId: undefined,
        totalRequests: 0,
        totalMissions: 0,
        avatarSeed: `${newId}-${(Math.random() * 100000).toFixed(0)}`,
      };
      setContacts((prev) => [c, ...prev]);
      return c;
    },
    []
  );

  const value: AppStoreValue = useMemo(
    () => ({
      nav: { active, setActive },
      search: { query: searchQuery, setQuery: setSearchQuery },
      data: { contacts, requests, missions, exchanges, addContact },
      ui: { reducedMotion, now },
    }),
    [active, searchQuery, contacts, requests, missions, exchanges, addContact, reducedMotion, now]
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
