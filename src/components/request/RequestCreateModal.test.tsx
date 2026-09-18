import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../../store/AppStore';
import { RequestCreateModal } from './RequestCreateModal';
import type { ReactElement } from 'react';
import type {
  Contact,
  Exchange,
  Mission,
  Request,
  NextAction,
} from '../../types';
import { seedContacts, seedRequests, seedMissions, seedExchanges } from '../../data/seedData';
import type { CreateContactInput, CreateRequestInput, IRepository, UpdateContactInput, UpdateRequestInput } from '../../data/repositories/interface';

type RepositorySpy = IRepository & {
  createRequestSpy: Mock<(input: CreateRequestInput) => Promise<Request>>;
};

import type { CreateRequestActionInput } from '../../data/repositories/interface';

function buildRepository(overrides?: Partial<IRepository>): RepositorySpy {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sc = seedContacts as unknown as Contact[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sr = seedRequests as unknown as Request[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sm = seedMissions as unknown as Mission[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const se = seedExchanges as unknown as Exchange[];

  const createRequestSpy = vi
    .fn<(input: CreateRequestInput) => Promise<Request>>()
    .mockImplementation(
      overrides?.createRequest ??
        ((input) => {
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

  const createRequestActionSpy = vi
    .fn<(input: CreateRequestActionInput) => Promise<NextAction>>()
    .mockImplementation(
      overrides?.createRequestAction ??
        (() => Promise.reject(new Error('not implemented')))
    );

  return {
    loadContacts: () => Promise.resolve(sc),
    loadRequests: () => Promise.resolve(sr),
    loadMissions: () => Promise.resolve(sm),
    loadExchanges: () => Promise.resolve(se),
    createContact: (_input: CreateContactInput) =>
      Promise.reject(new Error('not implemented')),
    updateContact: (id: string, _in: UpdateContactInput) => {
      const c = sc.find((x) => x.id === id);
      return Promise.resolve(c ?? sc[0]);
    },
    archiveContact:
      overrides?.archiveContact ?? (() => Promise.resolve()),
    updateRequest: vi.fn<(requestId: string, input: UpdateRequestInput) => Promise<Request>>(),
    archiveRequest: vi.fn<(requestId: string) => Promise<void>>(),
    createRequestAction: createRequestActionSpy,
    updateRequestAction: () =>
      Promise.reject(new Error('not implemented')),
    createMission: () =>
      Promise.reject(new Error('not implemented')),
    updateMission: () =>
      Promise.reject(new Error('not implemented')),
    ...overrides,
    createRequest: createRequestSpy,
    createRequestSpy,
  };
}

function withWrapper(ui: ReactElement, repository?: IRepository) {
  const repo = repository ?? buildRepository();
  return <AppStoreProvider repository={repo}>{ui}</AppStoreProvider>;
}

async function waitForDataLoaded() {
  await waitFor(() => {
    expect(screen.queryByTestId('appstore-not-ready')).not.toBeInTheDocument();
  });
}

function DataReady() {
  const store = useAppStore();
  if (store.data.loading || store.data.error) {
    return <div data-testid="appstore-not-ready" />;
  }
  return null;
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

const TEST_CONTACT: Contact = {
  id: 'c-test-create-req',
  firstName: 'Alice',
  lastName: 'Martin',
  company: 'ACME Corp',
  email: 'alice@acme.fr',
  phone: '+33 6 00 00 00 01',
  notes: 'Test contact',
  relationship: 'prospect',
  archived: false,
  createdAt: '2024-06-15T00:00:00Z',
  lastActivityAt: '2024-06-20T00:00:00Z',
  totalRequests: 0,
  totalMissions: 0,
  avatarSeed: 'c-test-create-req-seed',
};

describe('RequestCreateModal', () => {
  it('45. create modal contact fixé → shows contact full name in the modal', async () => {
    const onClose = vi.fn();
    render(
      withWrapper(
        <>
          <DataReady />
          <RequestCreateModal contact={TEST_CONTACT} onClose={onClose} />
        </>
      )
    );

    await waitForDataLoaded();

    const dialog = screen.getByRole('dialog', { name: /Créer une demande/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Alice Martin');
    expect(dialog).toHaveTextContent('ACME Corp');
  });

  it('46. create titre obligatoire → submit empty → addRequest NOT called', async () => {
    const onClose = vi.fn();
    const repo = buildRepository();

    render(
      withWrapper(
        <>
          <DataReady />
          <RequestCreateModal contact={TEST_CONTACT} onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const submitButton = screen.getByRole('button', { name: /Créer la demande/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(repo.createRequestSpy).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('47. create appelle addRequest → type title "Demo", submit → addRequest called once with { contactId: X, title: \'Demo\', description: null }', async () => {
    const onClose = vi.fn();
    const repo = buildRepository();

    render(
      withWrapper(
        <>
          <DataReady />
          <RequestCreateModal contact={TEST_CONTACT} onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const titleInput = screen.getByRole('textbox', { name: /^Titre/i });
    fireEvent.change(titleInput, { target: { value: 'Demo' } });

    const submitButton = screen.getByRole('button', { name: /Créer la demande/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(repo.createRequestSpy).toHaveBeenCalledTimes(1);
    expect(repo.createRequestSpy).toHaveBeenCalledWith({
      contactId: TEST_CONTACT.id,
      title: 'Demo',
      description: null,
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('48. create erreur role=alert → mock addRequest rejects, submit → screen.getByRole(\'alert\') visible', async () => {
    const onClose = vi.fn();
    const repo = buildRepository({
      createRequest: () => Promise.reject(new Error('create request failed')),
    });

    render(
      withWrapper(
        <>
          <DataReady />
          <RequestCreateModal contact={TEST_CONTACT} onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const titleInput = screen.getByRole('textbox', { name: /^Titre/i });
    fireEvent.change(titleInput, { target: { value: 'Demo Error' } });

    const submitButton = screen.getByRole('button', { name: /Créer la demande/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/create request failed/);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('59. Create: pending lock Escape/backdrop → submit deferred, Escape/backdrop NOT close, resolve then close', async () => {
    const d = deferred<Request>();
    const createRequestMock = vi
      .fn<(input: CreateRequestInput) => Promise<Request>>()
      .mockReturnValue(d.promise);
    const onClose = vi.fn();
    const repo = buildRepository({ createRequest: createRequestMock });

    render(
      withWrapper(
        <>
          <DataReady />
          <RequestCreateModal contact={TEST_CONTACT} onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const titleInput = screen.getByRole('textbox', { name: /^Titre/i });
    fireEvent.change(titleInput, { target: { value: 'Demo pending' } });

    const submitButton = screen.getByRole('button', { name: /Créer la demande/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(createRequestMock).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    const dialog = screen.getByRole('dialog', { name: /Créer une demande/i });
    expect(dialog).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(dialog).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    const backdrop = dialog.parentElement?.querySelector<HTMLElement>('.absolute.inset-0.bg-black\\/75') ?? null;
    expect(backdrop).not.toBeNull();
    if (!backdrop) throw new Error('backdrop missing');
    fireEvent.click(backdrop);
    expect(dialog).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    const created: Request = {
      id: 'r-created-59',
      contactId: TEST_CONTACT.id,
      title: 'Demo pending',
      status: 'nouveau',
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      archived: false,
    };
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      d.resolve(created);
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('60. Create: pending + rejection → lock active, error alert visible, modal stays and retryable', async () => {
    const d = deferred<Request>();
    const createRequestMock = vi
      .fn<(input: CreateRequestInput) => Promise<Request>>()
      .mockReturnValueOnce(d.promise)
      .mockResolvedValueOnce({
        id: 'r-created-60-bis',
        contactId: TEST_CONTACT.id,
        title: 'Retry',
        status: 'nouveau',
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        archived: false,
      });
    const onClose = vi.fn();
    const repo = buildRepository({ createRequest: createRequestMock });

    render(
      withWrapper(
        <>
          <DataReady />
          <RequestCreateModal contact={TEST_CONTACT} onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const titleInput = screen.getByRole('textbox', { name: /^Titre/i });
    fireEvent.change(titleInput, { target: { value: 'Demo fail' } });

    const submitButton = screen.getByRole('button', { name: /Créer la demande/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Try Escape during pending: should not close
    const dialog = screen.getByRole('dialog', { name: /Créer une demande/i });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(dialog).toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      d.reject(new Error('boom create'));
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/boom create/);
    });

    // Modal still open and retryable
    expect(dialog).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.change(titleInput, { target: { value: 'Retry' } });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(createRequestMock).toHaveBeenCalledTimes(2);
  });
});
