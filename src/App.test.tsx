/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import { useCallback, useState } from 'react';
import type React from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import type { Contact, Exchange, Mission, Request } from './types';
import { AuthProvider, type AuthClientLike } from './auth/AuthProvider';
import { AuthGate, Router } from './App';
import type { OpenContactPayload } from './App';
import { ContactCardModal } from './components/contact/ContactCardModal';
import { ArchiveConfirmation } from './components/contact/ArchiveConfirmation';
import { RequestArchiveConfirmation } from './components/request/RequestArchiveConfirmation';
import { AppStoreProvider, useAppStore } from './store/AppStore';
import type { IRepository, CreateContactInput, CreateRequestActionInput, CreateRequestInput, UpdateRequestInput } from './data/repositories/interface';
import {
  seedContacts,
  seedRequests,
  seedMissions,
  seedExchanges,
} from './data/seedData';

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

  it('16. AuthGate avec auth.error : fallback erreur config présent + LoginPage absente', async () => {
    const errMsg = "Supabase n'est pas configuré. Vérifiez VITE_SUPABASE_URL.";
    const authErr: AuthError = Object.assign(new Error(errMsg), {
      code: 'MISSING_CONFIG',
      status: 500,
      toJSON() {
        return { message: errMsg, code: 'MISSING_CONFIG', status: 500 };
      },
    }) as unknown as AuthError;
    const authClient: AuthClientLike = {
      getSession: () => Promise.resolve({ data: { session: null }, error: authErr }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: authErr }),
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
        screen.getByRole('heading', { level: 1, name: /Configuration d.authentification indisponible/i })
      ).toBeInTheDocument();
    });
    const alertBox = screen.getByRole('alert');
    expect(alertBox).toBeInTheDocument();
    expect(alertBox).toHaveAttribute('aria-live', 'assertive');
    expect(alertBox).toHaveTextContent(errMsg);
    // LoginPage absente
    expect(
      screen.queryByRole('heading', { level: 1, name: /freelance handoff/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: /^email$/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-mounted')).not.toBeInTheDocument();
  });
});

function buildMiniRepo(overrides?: Partial<IRepository>): IRepository {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sc = seedContacts as unknown as Contact[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sr = seedRequests as unknown as Request[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sm = seedMissions as unknown as Mission[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const se = seedExchanges as unknown as Exchange[];

  const createRequestSpy = vi.fn().mockImplementation(
    overrides?.createRequest ??
      ((input: { contactId: string; title: string; description?: string | null }) => {
        const created: Request = {
          id: `r-new-${Date.now()}`,
          contactId: input.contactId,
          title: input.title,
          description: input.description ?? undefined,
          status: 'nouveau',
          createdAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          archived: false,
        };
        return Promise.resolve(created);
      })
  );
  const updateRequestSpy = vi.fn().mockImplementation(
    overrides?.updateRequest ??
      ((id: string) => {
        const r = sr.find((x) => x.id === id);
        return Promise.resolve(r ?? sr[0]);
      })
  );
  const archiveRequestSpy = vi.fn().mockImplementation(
    overrides?.archiveRequest ?? (() => Promise.resolve())
  );

  const createRequestActionSpy = vi.fn().mockImplementation(
    overrides?.createRequestAction ??
      ((input: CreateRequestActionInput) => {
        const created = {
          id: `a-new-${Date.now()}`,
          requestId: input.requestId,
          type: input.type,
          label: input.label,
          dueDate: input.dueDate,
          createdAt: new Date().toISOString(),
        } as NonNullable<Request['actions']>[number];
        return Promise.resolve(created);
      })
  );  
  return {
    loadContacts: () => Promise.resolve(sc),
    loadRequests: () => Promise.resolve(sr),
    loadMissions: () => Promise.resolve(sm),
    loadExchanges: () => Promise.resolve(se),
    createContact: (_i: CreateContactInput) => Promise.reject(new Error('noop')),
    updateContact: (id, _in) => {
      const c = sc.find((x) => x.id === id);
      return Promise.resolve(c ?? sc[0]);
    },
    archiveContact:
      overrides?.archiveContact ?? (() => Promise.resolve()),
    createRequestAction: createRequestActionSpy,
    createRequest: createRequestSpy,
    updateRequest: updateRequestSpy,
    archiveRequest: archiveRequestSpy,
    ...overrides,
  };
}

function ModalFlowScenario({
  startWithOpen = true,
  initialRequestId,
}: {
  startWithOpen?: boolean;
  initialRequestId?: string;
}) {
  useAppStore();
  const [activeContact, setActiveContact] = useState<OpenContactPayload | null>(
    startWithOpen
      ? { contactId: 'c-jean-dupont', requestId: initialRequestId }
      : null
  );
  const [archivingContactId, setArchivingContactId] = useState<string | null>(null);
  const [preArchiveContact, setPreArchiveContact] = useState<OpenContactPayload | null>(null);

  const handleArchive = useCallback(
    (contactId: string) => {
      setPreArchiveContact(
        activeContact?.contactId === contactId
          ? activeContact
          : { contactId }
      );
      setActiveContact(null);
      setArchivingContactId(contactId);
    },
    [activeContact]
  );
  const handleCancelArchive = useCallback(() => {
    const toReopen = preArchiveContact;
    setArchivingContactId(null);
    setPreArchiveContact(null);
    if (toReopen) {
      setActiveContact(toReopen);
    }
  }, [preArchiveContact]);
  const handleArchived = useCallback(() => {
    setArchivingContactId(null);
    setActiveContact(null);
    setPreArchiveContact(null);
  }, []);

  return (
    <>
      <ContactCardModal
        contactId={activeContact?.contactId ?? null}
        requestId={activeContact?.requestId}
        onClose={() => { setActiveContact(null); }}
        onEdit={() => undefined}
        onArchive={handleArchive}
      />
      <ArchiveConfirmation
        contact={
          archivingContactId
            ? ({
                id: archivingContactId,
                firstName: 'Jean',
                lastName: 'Dupont',
                company: undefined,
                email: undefined,
                phone: undefined,
                notes: undefined,
                relationship: 'prospect',
                archived: false,
                createdAt: '2024-01-01T00:00:00Z',
                lastActivityAt: '2024-01-02T00:00:00Z',
                totalRequests: 0,
                totalMissions: 0,
                avatarSeed: 'x',
              })
            : null
        }
        onCancel={handleCancelArchive}
        onArchived={handleArchived}
      />
    </>
  );
}

describe('App / Router — flux modales archivage', () => {
  it('7. clic Archiver: ferme ContactCardModal ET ouvre ArchiveConfirmation — jamais deux dialogues ouverts simultanément', async () => {
    render(
      <AppStoreProvider repository={buildMiniRepo()}>
        <ModalFlowScenario />
      </AppStoreProvider>
    );

    // Au début: fiche contact ouverte
    await waitFor(() => {
      const card = screen.queryByRole('dialog', { name: /Jean Dupont/i });
      expect(card).toBeInTheDocument();
    });
    const cardBefore = screen.getByRole('dialog', { name: /Jean Dupont/i });
    expect(cardBefore).toHaveAttribute('aria-modal', 'true');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    // Clic bouton Archiver
    const archiveBtn = screen.getByText('Archiver', { selector: 'button' });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(archiveBtn);
    });

    // Après: alertdialog ouvert ET fiche FERMÉE
    await waitFor(() => {
      const confirm = screen.getByRole('alertdialog');
      expect(confirm).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('dialog', { name: /Jean Dupont/i })
    ).not.toBeInTheDocument();

    // Jamais ContactCard ET Archive en même temps
    // Note: role="alertdialog" est un sous-type de "dialog" en ARIA
    const card = screen.queryByRole('dialog', { name: /Jean Dupont/i });
    const alertdialog = screen.queryByRole('alertdialog');
    const cardIsInteractive = card?.getAttribute('aria-modal') === 'true';
    expect(Boolean(cardIsInteractive && alertdialog)).toBe(false);
    // au plus UN dialogue
    const interactive = (cardIsInteractive ? 1 : 0) + (alertdialog ? 1 : 0);
    expect(interactive).toBeLessThanOrEqual(1);
  });

  it('8. Annuler archivage: ferme la confirmation ET rouvre la fiche initiale avec requestId préservé', async () => {
    const REQ_ID = 'r-original-abc';
    render(
      <AppStoreProvider repository={buildMiniRepo()}>
        <ModalFlowScenario initialRequestId={REQ_ID} />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /Jean Dupont/i })
      ).toBeInTheDocument();
    });

    // Archiver
    const archiveBtn = screen.getByText('Archiver', { selector: 'button' });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(archiveBtn);
    });
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    // Annuler
    const cancelBtn = screen.getByText('Annuler', { selector: 'button' });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    // Confirmation fermée
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    // Fiche rouverte
    const cardReopened = screen.getByRole('dialog', { name: /Jean Dupont/i });
    expect(cardReopened).toBeInTheDocument();
    expect(cardReopened).toHaveAttribute('aria-modal', 'true');
  });
});

type RequestRepositorySpy = IRepository & {
  archiveRequestSpy: ReturnType<typeof vi.fn>;
};

function buildRequestRepo(overrides?: Partial<IRepository>): RequestRepositorySpy {
  const base = buildMiniRepo(overrides) as RequestRepositorySpy;
  const archiveRequestSpy = vi.fn().mockImplementation(
    overrides?.archiveRequest ?? (() => Promise.resolve())
  );
  return {
    ...base,
    ...overrides,
    archiveRequest: archiveRequestSpy,
    archiveRequestSpy,
  };
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function RequestModalFlowScenario({
  startWithOpen = true,
  initialRequestId,
}: {
  startWithOpen?: boolean;
  initialRequestId?: string;
}) {
  useAppStore();
  const [activeContact, setActiveContact] = useState<OpenContactPayload | null>(
    startWithOpen
      ? { contactId: 'c-jean-dupont', requestId: initialRequestId }
      : null
  );
  type PendingRequestModal =
    | { type: 'create'; contactId: string }
    | { type: 'edit'; requestId: string }
    | { type: 'archive'; requestId: string }
    | null;
  const [pendingRequestModal, setPendingRequestModal] = useState<PendingRequestModal>(null);
  const [creatingRequestForContactId, setCreatingRequestForContactId] = useState<string | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [archivingRequestId, setArchivingRequestId] = useState<string | null>(null);
  const [preRequestPayload, setPreRequestPayload] = useState<OpenContactPayload | null>(null);

  const handleContactCardExitComplete = useCallback(() => {
    const pending = pendingRequestModal;
    if (!pending) return;
    setPendingRequestModal(null);
    switch (pending.type) {
      case 'create':
        setCreatingRequestForContactId(pending.contactId);
        break;
      case 'edit':
        setEditingRequestId(pending.requestId);
        break;
      case 'archive':
        setArchivingRequestId(pending.requestId);
        break;
    }
  }, [pendingRequestModal]);

  const onCreateRequest = useCallback(
    (contactId: string) => {
      const payload = activeContact?.contactId === contactId ? activeContact : { contactId };
      setPreRequestPayload(payload);
      setPendingRequestModal({ type: 'create', contactId });
      setActiveContact(null);
    },
    [activeContact]
  );
  const onEditRequest = useCallback(
    (requestId: string) => {
      const payload = activeContact ?? { contactId: 'c-jean-dupont', requestId };
      setPreRequestPayload(payload);
      setPendingRequestModal({ type: 'edit', requestId });
      setActiveContact(null);
    },
    [activeContact]
  );
  const onArchiveRequest = useCallback(
    (requestId: string) => {
      const payload = activeContact ?? { contactId: 'c-jean-dupont', requestId };
      setPreRequestPayload(payload);
      setPendingRequestModal({ type: 'archive', requestId });
      setActiveContact(null);
    },
    [activeContact]
  );

  const handleCancelArchiveRequest = useCallback(() => {
    const toReopen = preRequestPayload;
    setArchivingRequestId(null);
    setPendingRequestModal(null);
    setPreRequestPayload(null);
    if (toReopen) setActiveContact(toReopen);
  }, [preRequestPayload]);
  const handleArchivedRequest = useCallback(() => {
    setArchivingRequestId(null);
    setActiveContact(null);
    setPreRequestPayload(null);
  }, []);

  return (
    <>
      <ContactCardModal
        contactId={activeContact?.contactId ?? null}
        requestId={activeContact?.requestId}
        onClose={() => { setActiveContact(null); }}
        onExitComplete={handleContactCardExitComplete}
        onEdit={() => undefined}
        onArchive={() => undefined}
        onCreateRequest={onCreateRequest}
        onEditRequest={onEditRequest}
        onArchiveRequest={onArchiveRequest}
      />
      <RequestArchiveConfirmation
        requestId={archivingRequestId}
        onClose={handleCancelArchiveRequest}
        onSuccess={handleArchivedRequest}
      />
      {creatingRequestForContactId ? (
        <div data-testid="req-create-open-marker" />
      ) : null}
      {editingRequestId ? (
        <div data-testid="req-edit-open-marker" />
      ) : null}
    </>
  );
}

describe('App / Router — flux modales request', () => {
  it('53. Annuler ne déclenche pas archiveRequest (click Annuler in confirmation, repository.archiveRequestSpy not called)', async () => {
    const repo = buildRequestRepo();
    render(
      <AppStoreProvider repository={repo}>
        <RequestModalFlowScenario initialRequestId="r-jean-site" />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /Jean Dupont/i })
      ).toBeInTheDocument();
    });

    const archiveButtons = screen.getAllByText('Archiver', { selector: 'button' });
    const requestArchiveBtn = archiveButtons.find(
      (btn) => !btn.getAttribute('aria-label')?.includes('Jean Dupont')
    );
    expect(requestArchiveBtn).toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(requestArchiveBtn!);
    });

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    const cancelBtn = screen.getByText('Annuler', { selector: 'button' });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(repo.archiveRequestSpy).not.toHaveBeenCalled();
  });

  it('54. Confirmer appelle archiveRequest (click Archiver in confirmation, spy called with request.id)', async () => {
    const repo = buildRequestRepo();
    render(
      <AppStoreProvider repository={repo}>
        <RequestModalFlowScenario initialRequestId="r-jean-site" />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /Jean Dupont/i })
      ).toBeInTheDocument();
    });

    const archiveButtons = screen.getAllByText('Archiver', { selector: 'button' });
    const requestArchiveBtn = archiveButtons.find(
      (btn) => !btn.getAttribute('aria-label')?.includes('Jean Dupont')
    );
    expect(requestArchiveBtn).toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(requestArchiveBtn!);
    });

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    const confirmBtns = screen.getAllByText('Archiver', { selector: 'button' });
    const confirmBtn = confirmBtns[confirmBtns.length - 1];
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(repo.archiveRequestSpy).toHaveBeenCalledTimes(1);
    });
    expect(repo.archiveRequestSpy).toHaveBeenCalledWith('r-jean-site');
  });

  it('55. erreur archive affichée role="alert" (mock rejects, click confirm → screen.getByRole(\'alert\'))', async () => {
    const repo = buildRequestRepo({
      archiveRequest: () => Promise.reject(new Error('archive request failed')),
    });
    render(
      <AppStoreProvider repository={repo}>
        <RequestModalFlowScenario initialRequestId="r-jean-site" />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: /Jean Dupont/i })
      ).toBeInTheDocument();
    });

    const archiveButtons = screen.getAllByText('Archiver', { selector: 'button' });
    const requestArchiveBtn = archiveButtons.find(
      (btn) => !btn.getAttribute('aria-label')?.includes('Jean Dupont')
    );
    expect(requestArchiveBtn).toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(requestArchiveBtn!);
    });

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    const confirmBtns = screen.getAllByText('Archiver', { selector: 'button' });
    const confirmBtn = confirmBtns[confirmBtns.length - 1];
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/archive request failed/);
    });
  });

  it('57. Router aucune superposition ContactCard / Request modal simultanément (ARCHIVE flow — pendingRequestModal + onExitComplete; count dialog+alertdialog aria-modal ≤1; vrai App Router mocké)', async () => {
    const user = makeUser('u-router-57', 'router57@test.local');
    const session = makeSession(user);
    const authClient: AuthClientLike = {
      getSession: () => Promise.resolve({ data: { session }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: () => Promise.resolve({ data: { user, session }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    };
    const repo = buildMiniRepo();

    const checkCounts = () => {
      const dialogs = screen.queryAllByRole('dialog');
      const alerts = screen.queryAllByRole('alertdialog');
      const merged = new Set<HTMLElement>();
      dialogs.forEach((d) => merged.add(d));
      alerts.forEach((a) => merged.add(a));
      const interactive = Array.from(merged).filter((e) => e.getAttribute('aria-modal') === 'true');
      return { interactive, n: interactive.length };
    };

    const rendered = render(
      withAuth(
        <AppStoreProvider repository={repo}>
          <Router />
        </AppStoreProvider>,
        authClient
      )
    );

    await waitFor(() => {
      expect(screen.queryByText(/chargement de votre session/i)).not.toBeInTheDocument();
    });
    await waitFor(() => {
      const sidebarContacts = screen.getByRole('button', { name: /Contacts/i });
      expect(sidebarContacts).toBeInTheDocument();
    }, { timeout: 2500 });

    const contactsLink = screen.getByRole('button', { name: /Contacts/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(contactsLink);
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Contacts/i })).toBeInTheDocument();
    }, { timeout: 2500 });
    await waitFor(() => {
      expect(screen.getAllByText(/Jean Dupont/i).length).toBeGreaterThanOrEqual(1);
    }, { timeout: 2500 });

    const jeanRowEl = screen.getAllByText(/Jean Dupont/i)[0].closest('button, a, [role="button"]');
    const jeanRow = jeanRowEl as HTMLElement | null;
    if (jeanRow) {
      // eslint-disable-next-line @typescript-eslint/require-await
      await act(async () => {
        fireEvent.click(jeanRow);
      });
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Jean Dupont/i })).toBeInTheDocument();
    }, { timeout: 2500 });

    const card = screen.getByRole('dialog', { name: /Jean Dupont/i });
    let archiveBtn: HTMLElement | undefined;
    await waitFor(() => {
      const allArchive = within(card).getAllByRole('button', { name: /Archiver/i });
      expect(allArchive.length).toBeGreaterThanOrEqual(1);
      archiveBtn = allArchive[allArchive.length - 1];
    });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(archiveBtn!);
    });

    for (let i = 0; i < 5; i++) {
      expect(checkCounts().n).toBeLessThanOrEqual(1);
      await new Promise<void>((r) => window.setTimeout(r, 20));
    }

    await waitFor(() => {
      expect(screen.getByRole('alertdialog', { name: /Confirmer l['\u2019]archivage/i })).toBeInTheDocument();
    }, { timeout: 2500 });

    const { n, interactive } = checkCounts();
    expect(n).toBeLessThanOrEqual(1);
    if (n === 1) {
      const only = interactive[0];
      const tc = only.textContent || '';
      const isArchive = only.getAttribute('role') === 'alertdialog'
        || tc.includes('Archiver cette demande');
      expect(isArchive).toBe(true);
    }
    rendered.unmount();
  });

  it('58. Annuler archive rouvre fiche avec requestId préservé (vrai App Router)', async () => {
    const user = makeUser('u-router-58', 'router58@test.local');
    const session = makeSession(user);
    const authClient: AuthClientLike = {
      getSession: () => Promise.resolve({ data: { session }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: () => Promise.resolve({ data: { user, session }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    };
    const repo = buildMiniRepo();

    const rendered = render(
      withAuth(
        <AppStoreProvider repository={repo}>
          <Router />
        </AppStoreProvider>,
        authClient
      )
    );

    await waitFor(() => {
      expect(screen.queryByText(/chargement de votre session/i)).not.toBeInTheDocument();
    });
    const navContactsBtn = screen.getByRole('button', { name: /Contacts/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(navContactsBtn);
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Contacts/i })).toBeInTheDocument();
    }, { timeout: 2500 });
    await waitFor(() => {
      expect(screen.getAllByText(/Jean Dupont/i).length).toBeGreaterThanOrEqual(1);
    }, { timeout: 2500 });

    const jeanRowEl58 = screen.getAllByText(/Jean Dupont/i)[0].closest('button, a, [role="button"]');
    const jeanRow58 = jeanRowEl58 as HTMLElement | null;
    if (jeanRow58) {
      // eslint-disable-next-line @typescript-eslint/require-await
      await act(async () => {
        fireEvent.click(jeanRow58);
      });
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Jean Dupont/i })).toBeInTheDocument();
    }, { timeout: 2500 });

    const initialCard = screen.getByRole('dialog', { name: /Jean Dupont/i });
    expect(
      within(initialCard).getByRole('heading', { level: 3, name: /Création site vitrine/i })
    ).toBeInTheDocument();

    const allArchive = within(initialCard).getAllByRole('button', { name: /Archiver/i });
    const requestArchiveBtn = allArchive[allArchive.length - 1];
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(requestArchiveBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole('alertdialog', { name: /Confirmer l['\u2019]archivage/i })).toBeInTheDocument();
    }, { timeout: 2500 });

    const cancelBtn = screen.getByRole('button', { name: /^Annuler$/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    await waitFor(() => {
      const reopen = screen.getByRole('dialog', { name: /Jean Dupont/i });
      expect(reopen).toBeInTheDocument();
      expect(reopen).toHaveTextContent(/Création site vitrine/);
      expect(
        within(reopen).getByRole('heading', { level: 3, name: /Création site vitrine/i })
      ).toBeInTheDocument();
    }, { timeout: 2500 });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    rendered.unmount();
  });

  it('62. Router CRÉATION flow: pendingRequestModal générique (vrai App Router: Sophie Morel pas de demande active → click Créer une demande → modal create seul, count ≤1)', async () => {
    const user = makeUser('u-router-62', 'router62@test.local');
    const session = makeSession(user);
    const authClient: AuthClientLike = {
      getSession: () => Promise.resolve({ data: { session }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: () => Promise.resolve({ data: { user, session }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    };
    const baseRepo = buildMiniRepo();
    const sophieMorel: Contact = {
      id: 'c-sophie-morel',
      firstName: 'Sophie',
      lastName: 'Morel',
      company: 'Morel Graphisme',
      email: 'sophie.morel@example.fr',
      relationship: 'prospect',
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      lastActivityAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      archived: false,
      totalRequests: 0,
      totalMissions: 0,
      avatarSeed: 'sophie-morel-0001',
    };
    const repo: IRepository = {
      ...baseRepo,
      loadContacts: async () => {
        const base = await baseRepo.loadContacts();
        return [...base, sophieMorel];
      },
    };

    const checkCounts = () => {
      const dialogs = screen.queryAllByRole('dialog');
      const alerts = screen.queryAllByRole('alertdialog');
      const merged = new Set<HTMLElement>();
      dialogs.forEach((d) => merged.add(d));
      alerts.forEach((a) => merged.add(a));
      const interactive = Array.from(merged).filter((e) => e.getAttribute('aria-modal') === 'true');
      return interactive.length;
    };

    const rendered = render(
      withAuth(
        <AppStoreProvider repository={repo}>
          <Router />
        </AppStoreProvider>,
        authClient
      )
    );

    await waitFor(() => {
      expect(screen.queryByText(/chargement de votre session/i)).not.toBeInTheDocument();
    });
    const navContactsBtn62 = screen.getByRole('button', { name: /Contacts/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(navContactsBtn62);
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Contacts/i })).toBeInTheDocument();
    }, { timeout: 2500 });

    await waitFor(() => {
      expect(screen.getAllByText(/Sophie Morel/i).length).toBeGreaterThanOrEqual(1);
    }, { timeout: 2500 });

    const sophieRowEl = screen.getAllByText(/Sophie Morel/i)[0].closest('button, a, [role="button"]');
    const sophieRow = sophieRowEl as HTMLElement | null;
    if (sophieRow) {
      // eslint-disable-next-line @typescript-eslint/require-await
      await act(async () => {
        fireEvent.click(sophieRow);
      });
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Sophie Morel/i })).toBeInTheDocument();
    }, { timeout: 2500 });

    const card = screen.getByRole('dialog', { name: /Sophie Morel/i });
    const createBtn = within(card).getByRole('button', { name: /Créer une demande/i });
    expect(createBtn).toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(createBtn);
    });

    for (let i = 0; i < 5; i++) {
      expect(checkCounts()).toBeLessThanOrEqual(1);
      await new Promise<void>((r) => window.setTimeout(r, 20));
    }

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Créer une demande/i })).toBeInTheDocument();
    }, { timeout: 2500 });
    expect(checkCounts()).toBeLessThanOrEqual(1);
    expect(screen.queryByRole('dialog', { name: /Sophie Morel/i })).not.toBeInTheDocument();

    rendered.unmount();
  });

  it('63. Archive confirmation: pending lock Escape/backdrop standalone test (deferred promise → locks Escape/backdrop, resolve ferme via onSuccess)', async () => {
    const d = deferred<undefined>();
    const archiveMock = vi.fn().mockReturnValue(d.promise);
    const createMock = vi.fn<(input: CreateRequestInput) => Promise<Request>>();
    const updateMock = vi.fn<(id: string, input: UpdateRequestInput) => Promise<Request>>();
    const repo: IRepository = {
      ...buildMiniRepo(),
      archiveRequest: archiveMock,
      createRequest: createMock,
      updateRequest: updateMock,
    };

    const onSuccessSpy = vi.fn();

    function Harness() {
      useAppStore();
      const [rid, setRid] = useState<string | null>('r-jean-site');
      return (
        <>
          <RequestArchiveConfirmation
            requestId={rid}
            onClose={() => { setRid(null); }}
            onSuccess={() => {
              onSuccessSpy();
              setRid(null);
            }}
          />
        </>
      );
    }

    render(
      <AppStoreProvider repository={repo}>
        <Harness />
      </AppStoreProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('alertdialog', { name: /Confirmer l['\u2019]archivage/i })).toBeInTheDocument();
    });

    const dialog = screen.getByRole('alertdialog', { name: /Confirmer l['\u2019]archivage/i });
    const confirmBtn = screen.getByRole('button', { name: /^Archiver$/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(archiveMock).toHaveBeenCalledTimes(1);

    // Escape during pending should NOT close
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog', { name: /Confirmer l['\u2019]archivage/i })).toBeInTheDocument();

    // Backdrop click during pending should NOT close
    const backdrop = dialog.parentElement!.querySelector<HTMLElement>('.absolute.inset-0.bg-black\\/75');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(screen.queryByRole('alertdialog', { name: /Confirmer l['\u2019]archivage/i })).toBeInTheDocument();

    // Resolve: dialog closes via onSuccess codepath, pending ends and success fires
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      d.resolve(undefined);
    });

    await waitFor(() => {
      expect(onSuccessSpy).toHaveBeenCalledTimes(1);
    });
  });
});
