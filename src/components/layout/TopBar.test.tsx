/* eslint-disable @typescript-eslint/require-await */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import {
  AuthProvider,
  type AuthClientLike,
} from '../../auth/AuthProvider';
import { AppStoreProvider } from '../../store/AppStore';
import type { IRepository, CreateContactInput } from '../../data/repositories/interface';
import type { Contact, Exchange, Mission, Request } from '../../types';
import { TopBar } from './TopBar';

interface FakeAuthClient extends AuthClientLike {
  getSessionSpy: ReturnType<typeof vi.fn>;
  onAuthStateChangeSpy: ReturnType<typeof vi.fn>;
  signInWithPasswordSpy: ReturnType<typeof vi.fn>;
  signOutSpy: ReturnType<typeof vi.fn>;
  triggerStateChange: (event: string, session: Session | null) => void;
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
    code: 'SIGN_OUT_FAIL',
    status: 500,
    toJSON() {
      return { message, code: 'SIGN_OUT_FAIL', status: 500 };
    },
  }) as unknown as AuthError;
}

function buildFakeAuthClient(initialSession: Session | null = null): FakeAuthClient {
  let listener: ((event: string, session: Session | null) => void) | null = null;

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
            unsubscribe: () => undefined,
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
  };
}

const EMPTY_CONTACT: Contact = {
  id: '',
  firstName: '',
  lastName: '',
  company: '',
  email: '',
  phone: '',
  notes: '',
  relationship: 'prospect',
  createdAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
  archived: false,
  activeRequestId: '',
  totalRequests: 0,
  totalMissions: 0,
  avatarSeed: '',
};

const NOOP_REPO: IRepository = {
  loadContacts: () => Promise.resolve<Contact[]>([]),
  loadRequests: () => Promise.resolve<Request[]>([]),
  loadMissions: () => Promise.resolve<Mission[]>([]),
  loadExchanges: () => Promise.resolve<Exchange[]>([]),
  createContact: async (_input: CreateContactInput) => ({ ...EMPTY_CONTACT }),
};

function wrap(children: ReactNode, authClient: FakeAuthClient) {
  return (
    <AuthProvider authClient={authClient}>
      <AppStoreProvider repository={NOOP_REPO}>{children}</AppStoreProvider>
    </AuthProvider>
  );
}

describe('components/layout/TopBar sign-out', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. bouton Se déconnecter présent quand TopBar monté', async () => {
    const user = makeUser();
    const client = buildFakeAuthClient(makeSession(user));
    render(wrap(<TopBar onToggleSidebar={() => undefined} />, client));

    const btn = await screen.findByRole('button', { name: /Se déconnecter/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('title', 'Se déconnecter');
    expect(btn).not.toBeDisabled();
  });

  it('2. clic appelle signOut exactement une fois', async () => {
    const user = makeUser();
    const client = buildFakeAuthClient(makeSession(user));
    render(wrap(<TopBar onToggleSidebar={() => undefined} />, client));

    const btn = await screen.findByRole('button', { name: /Se déconnecter/i });
    act(() => {
      fireEvent.click(btn);
    });
    await waitFor(() => {
      expect(client.signOutSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('3. double clic pendant pending ne déclenche pas deux signOut', async () => {
    const user = makeUser();
    const client = buildFakeAuthClient(makeSession(user));
    let resolveSignOut: ((v: { error: null }) => void) | undefined;
    const pending = new Promise<{ error: null }>((r) => {
      resolveSignOut = r;
    });
    client.signOutSpy.mockReturnValue(pending);
    render(wrap(<TopBar onToggleSidebar={() => undefined} />, client));

    const btn = await screen.findByRole('button', { name: /Se déconnecter/i });
    act(() => {
      fireEvent.click(btn);
    });
    await waitFor(() => {
      expect(btn).toBeDisabled();
    });
    expect(client.signOutSpy).toHaveBeenCalledTimes(1);
    act(() => {
      fireEvent.click(btn);
    });
    expect(client.signOutSpy).toHaveBeenCalledTimes(1);
    act(() => {
      if (resolveSignOut) resolveSignOut({ error: null });
    });
    await waitFor(() => {
      expect(btn).not.toBeDisabled();
    });
    expect(client.signOutSpy).toHaveBeenCalledTimes(1);
  });

  it('4. erreur signOut affichée avec role=alert, bouton retente après', async () => {
    const user = makeUser();
    const client = buildFakeAuthClient(makeSession(user));
    client.signOutSpy.mockResolvedValueOnce({
      error: makeAuthError('Network error'),
    });
    render(wrap(<TopBar onToggleSidebar={() => undefined} />, client));

    const btn = await screen.findByRole('button', { name: /Se déconnecter/i });
    act(() => {
      fireEvent.click(btn);
    });

    const alertBox = await screen.findByRole('alert');
    expect(alertBox).toHaveAttribute('aria-live', 'assertive');
    expect(alertBox.textContent).toMatch(/Network error/);

    expect(client.signOutSpy).toHaveBeenCalledTimes(1);
    expect(btn).not.toBeDisabled();
    client.signOutSpy.mockResolvedValueOnce({ error: null });
    act(() => {
      fireEvent.click(btn);
    });
    expect(client.signOutSpy).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
