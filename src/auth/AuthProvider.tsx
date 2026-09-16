/**
 * AuthProvider - Fournisseur d'authentification Supabase minimaliste.
 *
 * Backend 2A : email + mot de passe, aucun Sign up public, aucun OAuth.
 *
 * - Ne connaît PAS AppStore (aucune dépendance circulaire)
 * - Rien n'est persisté localement au-delà de ce que Supabase fait déjà
 * - Injection d'un authClient optionnelle pour les tests (pas de vrai réseau)
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
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { getSupabaseOrThrow } from '../lib/supabase/client';

/**
 * Interface minimale du client auth pour injection dans les tests.
 * Elle correspond strictement aux méthodes de SupabaseClient.auth utilisées.
 */
export interface AuthClientLike {
  getSession: () => Promise<{
    data: { session: Session | null };
    error: AuthError | null;
  }>;
  onAuthStateChange: (
    callback: (event: string, session: Session | null) => void
  ) => {
    data: {
      subscription: {
        unsubscribe: () => void;
      };
    };
  };
  signInWithPassword: (args: {
    email: string;
    password: string;
  }) => Promise<{
    data: { user: User | null; session: Session | null };
    error: AuthError | null;
  }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

interface AuthValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
  /**
   * Client auth injectable — réservé aux tests.
   * En production : utilise getSupabaseOrThrow().auth (interdit en test sans mock).
   */
  authClient?: AuthClientLike;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children, authClient }: AuthProviderProps) {
  const initResult = useMemo<{
    client: AuthClientLike | null;
    error: string | null;
  }>(() => {
    if (authClient) {
      return { client: authClient, error: null };
    }
    try {
      return { client: getSupabaseOrThrow().auth, error: null };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { client: null, error: message };
    }
  }, [authClient]);

  const clientRef = useRef<AuthClientLike | null>(initResult.client);
  clientRef.current = initResult.client;

  const mountedRef = useRef<boolean>(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const authEventSeenRef = useRef<boolean>(false);

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(
    initResult.error === null
  );
  const [error, setError] = useState<string | null>(
    initResult.error ?? null
  );

  const handleSessionChange = useCallback(
    (incoming: Session | null) => {
      if (!mountedRef.current) return;
      setSession(incoming);
      setUser(incoming?.user ?? null);
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const client = clientRef.current;
    if (!client) {
      throw new Error(
        "Authentification indisponible : Supabase n'est pas configuré."
      );
    }
    const result = await client.signInWithPassword({
      email,
      password,
    });
    if (result.error) {
      throw new Error(
        result.error.message ||
          'Identifiants incorrects. Veuillez réessayer.'
      );
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = clientRef.current;
    if (!client) {
      throw new Error(
        "Authentification indisponible : Supabase n'est pas configuré."
      );
    }
    const result = await client.signOut();
    if (result.error) {
      throw new Error(
        result.error.message ||
          'Impossible de vous déconnecter.'
      );
    }
    if (!mountedRef.current) return;
    setSession(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (initResult.error || !initResult.client) {
      return undefined;
    }
    const client = initResult.client;
    mountedRef.current = true;
    let cancelled = false;

    const runInitial = async () => {
      try {
        const result = await client.getSession();
        if (cancelled || !mountedRef.current) return;
        if (authEventSeenRef.current) return;
        if (result.error) {
          throw result.error;
        }
        handleSessionChange(result.data.session ?? null);
        setError(null);
      } catch (e) {
        if (cancelled || !mountedRef.current) return;
        if (authEventSeenRef.current) return;
        const message = e instanceof Error ? e.message : String(e);
        setError(`Impossible de récupérer la session : ${message}`);
      } finally {
        if (!cancelled && mountedRef.current && !authEventSeenRef.current) {
          setLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = client.onAuthStateChange((_event, incoming) => {
      authEventSeenRef.current = true;
      handleSessionChange(incoming);
      if (mountedRef.current) {
        setLoading(false);
        setError(null);
      }
    });
    unsubscribeRef.current = () => {
      subscription.unsubscribe();
    };

    void runInitial();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      authEventSeenRef.current = false;
    };
  }, [handleSessionChange, initResult.client, initResult.error]);

  const value: AuthValue = useMemo(
    () => ({
      session,
      user,
      loading,
      error,
      signIn,
      signOut,
    }),
    [session, user, loading, error, signIn, signOut]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

export type { AuthValue };
