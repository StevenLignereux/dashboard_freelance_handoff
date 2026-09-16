import { describe, it, expect, vi, afterEach, type Mock } from 'vitest';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import { useRef, type ReactNode } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import {
  AuthProvider,
  useAuth,
  type AuthClientLike,
  type AuthValue,
} from './AuthProvider';

interface FakeAuthClient extends AuthClientLike {
  getSessionSpy: Mock<AuthClientLike['getSession']>;
  onAuthStateChangeSpy: Mock<AuthClientLike['onAuthStateChange']>;
  signInWithPasswordSpy: Mock<AuthClientLike['signInWithPassword']>;
  signOutSpy: Mock<AuthClientLike['signOut']>;
  triggerStateChange: (event: string, session: Session | null) => void;
  unsubscribeCalled: number;
}

function makeUser(id = 'u-1', email = 'me@test.local'): User {
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
    access_token: 'at-xxx',
    refresh_token: 'rt-xxx',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
}

function makeAuthError(message: string): AuthError {
  return Object.assign(new Error(message), {
    code: 'INVALID_CREDENTIALS',
    status: 400,
    toJSON() {
      return { message, code: 'INVALID_CREDENTIALS', status: 400 };
    },
  }) as unknown as AuthError;
}

function buildFakeAuthClient(initialSession: Session | null = null): FakeAuthClient {
  let listener: ((event: string, session: Session | null) => void) | null = null;
  let unsubscribeCalled = 0;

  const getSessionSpy = vi
    .fn<AuthClientLike['getSession']>()
    .mockResolvedValue({
      data: { session: initialSession },
      error: null,
    });

  const signInWithPasswordSpy = vi
    .fn<AuthClientLike['signInWithPassword']>()
    .mockResolvedValue({
      data: { user: initialSession?.user ?? null, session: initialSession },
      error: null,
    });

  const signOutSpy = vi
    .fn<AuthClientLike['signOut']>()
    .mockResolvedValue({ error: null });

  const onAuthStateChangeSpy = vi
    .fn<AuthClientLike['onAuthStateChange']>()
    .mockImplementation((cb) => {
      listener = cb;
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              unsubscribeCalled += 1;
            },
          },
        },
      };
    });

  return {
    getSession: getSessionSpy,
    getSessionSpy,
    onAuthStateChange: onAuthStateChangeSpy,
    onAuthStateChangeSpy,
    signInWithPassword: signInWithPasswordSpy,
    signInWithPasswordSpy,
    signOut: signOutSpy,
    signOutSpy,
    triggerStateChange: (event: string, s: Session | null) => {
      if (listener) listener(event, s);
    },
    get unsubscribeCalled() {
      return unsubscribeCalled;
    },
  };
}

function Capture({
  onCapture,
}: {
  onCapture: (v: AuthValue) => void;
}) {
  const auth = useAuth();
  onCapture(auth);
  return <div data-testid="capture" />;
}

function wrap(
  children: ReactNode,
  authClient: FakeAuthClient
): ReactNode {
  return (
    <AuthProvider authClient={authClient}>{children}</AuthProvider>
  );
}

describe('AuthProvider', () => {
  afterEach(() => {
    cleanup();
  });

  it('1. loading = true au démarrage avant résolution getSession', async () => {
    let resolve: ((r: Awaited<ReturnType<AuthClientLike['getSession']>>) => void) | undefined;
    const slow = new Promise<Awaited<ReturnType<AuthClientLike['getSession']>>>((r) => {
      resolve = r;
    });
    const client = buildFakeAuthClient(null);
    client.getSessionSpy.mockReturnValue(slow);

    const capture: AuthValue[] = [];
    render(wrap(<Capture onCapture={(a) => { capture.push(a); }} />, client));

    expect(capture[0]?.loading).toBe(true);
    const resolver = resolve;
    if (resolver) {
      act(() => {
        resolver({ data: { session: null }, error: null });
      });
    }
    await waitFor(() => {
      expect(screen.getByTestId('capture')).toBeInTheDocument();
    });
  });

  it('2. session existante récupérée après getSession → user/session remplis, loading false', async () => {
    const user = makeUser('u-2', 'paul@test.local');
    const session = makeSession(user);
    const client = buildFakeAuthClient(session);

    const last: { current: AuthValue | null } = { current: null };
    render(
      wrap(<Capture onCapture={(a) => { last.current = a; }} />, client)
    );

    await waitFor(() => {
      expect(last.current?.loading).toBe(false);
    });

    expect(client.getSessionSpy).toHaveBeenCalledTimes(1);
    expect(last.current?.session?.user.id).toBe('u-2');
    expect(last.current?.user?.email).toBe('paul@test.local');
    expect(last.current?.error).toBe(null);
  });

  it('3. aucune session → session=null, user=null, loading=false', async () => {
    const client = buildFakeAuthClient(null);
    const last: { current: AuthValue | null } = { current: null };

    render(wrap(<Capture onCapture={(a) => { last.current = a; }} />, client));

    await waitFor(() => {
      expect(last.current?.loading).toBe(false);
    });

    expect(last.current?.session).toBe(null);
    expect(last.current?.user).toBe(null);
  });

  it('4. onAuthStateChange met à jour session/user', async () => {
    const client = buildFakeAuthClient(null);
    const last: { current: AuthValue | null } = { current: null };

    render(wrap(<Capture onCapture={(a) => { last.current = a; }} />, client));
    await waitFor(() => {
      expect(last.current?.loading).toBe(false);
    });
    expect(last.current?.session).toBe(null);

    const user = makeUser('u-3', 'signed-in@test.local');
    const session = makeSession(user);
    act(() => {
      client.triggerStateChange('SIGNED_IN', session);
    });

    await waitFor(() => {
      expect(last.current?.user?.id).toBe('u-3');
    });
    expect(last.current?.session?.access_token).toBe('at-xxx');
  });

  it('5. unsubscribe appelé au unmount du Provider', () => {
    const client = buildFakeAuthClient(null);
    const { unmount } = render(
      wrap(<div data-testid="x" />, client)
    );

    expect(client.onAuthStateChangeSpy).toHaveBeenCalledTimes(1);
    expect(client.unsubscribeCalled).toBe(0);

    act(() => {
      unmount();
    });

    expect(client.unsubscribeCalled).toBe(1);
  });

  it('6. signIn appelle signInWithPassword avec email/password', async () => {
    const user = makeUser('u-4', 'a@b.co');
    const session = makeSession(user);
    const client = buildFakeAuthClient(null);
    client.signInWithPasswordSpy.mockResolvedValue({
      data: { user, session },
      error: null,
    });

    let signIn: (email: string, password: string) => Promise<void> = () => {
      return Promise.resolve();
    };
    render(
      wrap(
        <Capture
          onCapture={(a) => {
            signIn = a.signIn;
          }}
        />,
        client
      )
    );
    await waitFor(() => {
      expect(typeof signIn).toBe('function');
    });

    await act(async () => {
      await signIn('a@b.co', 'secret123');
    });

    expect(client.signInWithPasswordSpy).toHaveBeenCalledTimes(1);
    expect(client.signInWithPasswordSpy).toHaveBeenCalledWith({
      email: 'a@b.co',
      password: 'secret123',
    });
  });

  it('7. erreur signIn : message propagé (throw)', async () => {
    const client = buildFakeAuthClient(null);
    client.signInWithPasswordSpy.mockResolvedValue({
      data: { user: null, session: null },
      error: makeAuthError('Identifiants invalides.'),
    });

    let signIn: (email: string, password: string) => Promise<void> = () => {
      return Promise.resolve();
    };
    render(
      wrap(
        <Capture
          onCapture={(a) => {
            signIn = a.signIn;
          }}
        />,
        client
      )
    );
    await waitFor(() => {
      expect(typeof signIn).toBe('function');
    });

    let caught: unknown = null;
    await act(async () => {
      try {
        await signIn('bad@test.local', 'wrong');
      } catch (e) {
        caught = e;
      }
    });

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toMatch(/Identifiants invalides/);
  });

  it('8. signOut appelle signOut → session/user null', async () => {
    const user = makeUser('u-5');
    const session = makeSession(user);
    const client = buildFakeAuthClient(session);

    let authVal: AuthValue | null = null;
    render(
      wrap(
        <Capture
          onCapture={(a) => {
            authVal = a;
          }}
        />,
        client
      )
    );
    await waitFor(() => {
      expect(authVal?.loading).toBe(false);
    });

    await act(async () => {
      if (authVal) {
        await authVal.signOut();
      }
    });

    expect(client.signOutSpy).toHaveBeenCalledTimes(1);
    expect((authVal as unknown as AuthValue).session).toBe(null);
    expect((authVal as unknown as AuthValue).user).toBe(null);
  });
});

export type { AuthClientLike };
