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
  // Lazy init : une seule résolution du client, pas à chaque render.
  const [client] = useState<AuthClientLike>(() => {
    return authClient ?? getSupabaseOrThrow().auth;
  });
  const clientRef = useRef<AuthClientLike>(client);
  clientRef.current = client;

  const mountedRef = useRef<boolean>(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleSessionChange = useCallback(
    (incoming: Session | null) => {
      if (!mountedRef.current) return;
      setSession(incoming);
      setUser(incoming?.user ?? null);
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await clientRef.current.signInWithPassword({
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
    const result = await clientRef.current.signOut();
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
    mountedRef.current = true;
    let cancelled = false;

    const runInitial = async () => {
      try {
        const result = await clientRef.current.getSession();
        if (cancelled || !mountedRef.current) return;
        if (result.error) {
          throw result.error;
        }
        handleSessionChange(result.data.session ?? null);
        setError(null);
      } catch (e) {
        if (cancelled || !mountedRef.current) return;
        const message = e instanceof Error ? e.message : String(e);
        setError(`Impossible de récupérer la session : ${message}`);
      } finally {
        if (!cancelled && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    const {
      data: { subscription },
    } = clientRef.current.onAuthStateChange((_event, incoming) => {
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
    };
  }, [handleSessionChange]);

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
