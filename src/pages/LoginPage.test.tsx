import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { AuthProvider } from '../auth/AuthProvider';
import type { AuthClientLike } from '../auth/AuthProvider';
import { LoginPage } from './LoginPage';

function makeUser(id = 'u-lp', email = 'test@lp.local'): User {
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
    access_token: 'at-lp',
    refresh_token: 'rt-lp',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
}

type Fn<A extends unknown[], R> = (...a: A) => R;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const NOOP = () => {};

function makeAuthError(message: string): AuthError {
  return Object.assign(new Error(message), {
    code: 'INVALID_CREDENTIALS',
    status: 400,
    toJSON() {
      return { message, code: 'INVALID_CREDENTIALS', status: 400 };
    },
  }) as unknown as AuthError;
}

function buildFakeAuth(): AuthClientLike & {
  signInWithPasswordSpy: Fn<Parameters<AuthClientLike['signInWithPassword']>, ReturnType<AuthClientLike['signInWithPassword']>>;
  signInWithPasswordCallCount: () => number;
} {
  let signInCount = 0;
  const signInWithPasswordSpy = vi.fn<
    Fn<Parameters<AuthClientLike['signInWithPassword']>, ReturnType<AuthClientLike['signInWithPassword']>>
  >(() => {
    signInCount += 1;
    const user = makeUser('u-x', 'a@b.co');
    return Promise.resolve({
      data: { user, session: makeSession(user) },
      error: null,
    });
  });
  return {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: NOOP } } }),
    signInWithPassword: signInWithPasswordSpy,
    signInWithPasswordSpy,
    signInWithPasswordCallCount: () => signInCount,
    signOut: () => Promise.resolve({ error: null }),
  };
}

function renderWithAuth(ui: React.ReactNode, authClient: AuthClientLike) {
  return render(
    <AuthProvider authClient={authClient}>{ui}</AuthProvider>
  );
}

describe('LoginPage', () => {
  it('9. affiche formulaire Email + Mot de passe + bouton Se connecter', async () => {
    const authClient = buildFakeAuth();
    renderWithAuth(<LoginPage />, authClient);
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /freelance handoff/i })).toBeInTheDocument();
    });
    expect(
      screen.getByRole('textbox', { name: /^email$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^mot de passe$/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^se connecter$/i })
    ).toBeInTheDocument();
  });

  it('10. bouton désactivé + texte "Connexion…" pendant la soumission', async () => {
    let resolve: ((r: {
      data: { user: User | null; session: Session | null };
      error: null;
    }) => void) | undefined;
    const pending = new Promise<{
      data: { user: User | null; session: Session | null };
      error: null;
    }>((r) => {
      resolve = r;
    });
    const authClient: AuthClientLike & {
      signInWithPasswordSpy: typeof vi.fn;
    } = {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: NOOP } } }),
      signInWithPassword: vi.fn(() => pending),
      signOut: () => Promise.resolve({ error: null }),
      signInWithPasswordSpy: vi.fn(),
    };
    authClient.signInWithPasswordSpy = authClient.signInWithPassword as unknown as typeof vi.fn;

    renderWithAuth(<LoginPage />, authClient);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^se connecter$/i })).toBeInTheDocument();
    });

    const email = screen.getByRole('textbox', { name: /^email$/i });
    const pwd = screen.getByLabelText(/^mot de passe$/i);
    fireEvent.change(email, { target: { value: 'a@b.co' } });
    fireEvent.change(pwd, { target: { value: 'pwd12345' } });

    expect(screen.getByRole('button', { name: /^se connecter$/i })).toBeEnabled();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^se connecter$/i }));
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^connexion…$/i })
      ).toBeDisabled();
    });

    const resolver = resolve;
    if (resolver) {
      const user = makeUser();
      act(() => {
        resolver({ data: { user, session: makeSession(user) }, error: null });
      });
    }
  });

  it('11. erreur signIn affichée dans role="alert"', async () => {
    const signInError = makeAuthError('Mauvais identifiants.');
    const authClient: AuthClientLike = {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: NOOP } } }),
      signInWithPassword: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: signInError,
        }),
      signOut: () => Promise.resolve({ error: null }),
    };

    renderWithAuth(<LoginPage />, authClient);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^se connecter$/i })).toBeInTheDocument();
    });

    const email = screen.getByRole('textbox', { name: /^email$/i });
    const pwd = screen.getByLabelText(/^mot de passe$/i);
    fireEvent.change(email, { target: { value: 'a@b.co' } });
    fireEvent.change(pwd, { target: { value: 'bad' } });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^se connecter$/i }));
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(/Mauvais identifiants/);
    });
  });

  it('12. aucun bouton / lien inscription ou mot de passe oublié', async () => {
    const authClient = buildFakeAuth();
    renderWithAuth(<LoginPage />, authClient);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^se connecter$/i })).toBeInTheDocument();
    });

    const anchors = screen.queryAllByRole('link');
    expect(anchors).toHaveLength(0);

    expect(
      screen.queryByRole('button', { name: /inscription|sign\s*up|créer\s*un\s*compte|mdp|mot\s*de\s*passe\s*oublié|mot\s*de\s*passe\s*oubliée|forgot/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/inscription|oublié|oubliée|sign\s*up/i)
    ).not.toBeInTheDocument();
  });
});
