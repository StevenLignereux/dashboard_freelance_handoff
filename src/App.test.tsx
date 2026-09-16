import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { AuthProvider, type AuthClientLike } from './auth/AuthProvider';
import { AuthGate } from './App';

function makeUser(id = 'u-app', email = 'app@test.local'): User {
  return {
    id,
    email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  };
}

function makeSession(user: User): Session {
  return {
    access_token: 'at-app',
    refresh_token: 'rt-app',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
}

function withAuth(
  ui: React.ReactNode,
  authClient: AuthClientLike
) {
  return (
    <AuthProvider authClient={authClient}>{ui}</AuthProvider>
  );
}

describe('App / AuthGate', () => {
  it('13. loading auth : affiche le fallback "Chargement de votre session…"', () => {
    const pending = new Promise<{
      data: { session: Session | null };
      error: null;
    }>(() => undefined);
    const authClient: AuthClientLike = {
      getSession: () => pending,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    };

    render(
      withAuth(
        <AuthGate>
          <div data-testid="app-mounted" />
        </AuthGate>,
        authClient
      )
    );

    expect(
      screen.getByRole('status', { name: undefined })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/chargement de votre session/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('app-mounted')).not.toBeInTheDocument();
  });

  it('14. sans session : affiche LoginPage, pas de AppStore monté', async () => {
    const authClient: AuthClientLike = {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    };

    render(
      withAuth(
        <AuthGate>
          <div data-testid="app-mounted" />
        </AuthGate>,
        authClient
      )
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: /freelance handoff/i })
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('textbox', { name: /^email$/i })).toBeInTheDocument();
    expect(screen.queryByTestId('app-mounted')).not.toBeInTheDocument();
  });

  it('15. avec session : AuthGate rend les enfants (AppStore monté)', async () => {
    const user = makeUser();
    const session = makeSession(user);
    const authClient: AuthClientLike = {
      getSession: () => Promise.resolve({ data: { session }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: () => Promise.resolve({ data: { user, session }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    };

    render(
      withAuth(
        <AuthGate>
          <div data-testid="app-mounted" />
        </AuthGate>,
        authClient
      )
    );

    await waitFor(() => {
      expect(screen.getByTestId('app-mounted')).toBeInTheDocument();
    });
  });
});
