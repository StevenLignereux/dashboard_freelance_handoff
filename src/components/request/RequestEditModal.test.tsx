/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../../store/AppStore';
import { RequestEditModal } from './RequestEditModal';
import type { ReactElement } from 'react';
import type {
  Contact,
  Exchange,
  Mission,
  NextAction,
  Request,
} from '../../types';
import { seedContacts, seedRequests, seedMissions, seedExchanges } from '../../data/seedData';
import type { CreateContactInput, CreateRequestActionInput, CreateRequestInput, IRepository, UpdateContactInput, UpdateRequestInput } from '../../data/repositories/interface';

type RepositorySpy = IRepository & {
  updateRequestSpy: Mock<(requestId: string, input: UpdateRequestInput) => Promise<Request>>;
};

function buildRepository(overrides?: Partial<IRepository>): RepositorySpy {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sc = seedContacts as unknown as Contact[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sr = seedRequests as unknown as Request[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sm = seedMissions as unknown as Mission[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const se = seedExchanges as unknown as Exchange[];

  const updateRequestSpy = vi
    .fn<(requestId: string, input: UpdateRequestInput) => Promise<Request>>()
    .mockImplementation(
      overrides?.updateRequest ??
        ((id, input) => {
          const existing = sr.find((x) => x.id === id);
          const merged = existing
            ? { ...existing, ...input, description: input.description ?? existing.description }
            : sr[0];
          return Promise.resolve(merged);
        })
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
    createRequestAction: vi.fn<(input: CreateRequestActionInput) => Promise<NextAction>>(),
    createRequest: vi.fn<(input: CreateRequestInput) => Promise<Request>>(),
    archiveRequest: vi.fn<(requestId: string) => Promise<void>>(),
    updateRequestAction:
      overrides?.updateRequestAction ??
      ((actionId, input) => {
        const req = sr.find((r) => r.nextAction?.id === actionId);
        if (!req?.nextAction) {
          return Promise.reject(new Error(`updateRequestAction: action ${actionId} not found`));
        }
        const merged: NextAction = {
          ...req.nextAction,
          ...(input.type !== undefined ? { type: input.type } : {}),
          ...(input.label !== undefined ? { label: input.label } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
        };
        return Promise.resolve(merged);
      }),
    createMission: () =>
      Promise.reject(new Error('not implemented')),
    updateMission: () =>
      Promise.reject(new Error('not implemented')),
    createExchange: overrides?.createExchange ?? (() => Promise.reject(new Error('not implemented'))),
    ...overrides,
    updateRequest: updateRequestSpy,
    updateRequestSpy,
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

describe('RequestEditModal', () => {
  it('49. edit prérempli → modal opened with an existing Request → title/description pre-filled in input', async () => {
    const onClose = vi.fn();
    render(
      withWrapper(
        <>
          <DataReady />
          <RequestEditModal requestId="r-jean-site" onClose={onClose} />
        </>
      )
    );

    await waitForDataLoaded();

    const dialog = screen.getByRole('dialog', { name: /Modifier une demande/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Jean Dupont');

    const titleInput = screen.getByRole('textbox', { name: /^Titre/i });
    const descInputs = screen.getAllByRole('textbox');
    const descriptionTextarea = descInputs.find((el) => el.tagName === 'TEXTAREA');
    expect(descriptionTextarea).toBeInTheDocument();

    await waitFor(() => {
      expect(titleInput).toHaveValue('Création site vitrine');
    });
    expect(descriptionTextarea).toHaveValue(
      "Site vitrine 4-5 pages pour présenter l'entreprise, les réalisations et les coordonnées."
    );
  });

  it('50. edit appelle updateRequest → change title, submit → updateRequest called with new title', async () => {
    const onClose = vi.fn();
    const repo = buildRepository();

    render(
      withWrapper(
        <>
          <DataReady />
          <RequestEditModal requestId="r-jean-site" onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const titleInput = screen.getByRole('textbox', { name: /^Titre/i });
    fireEvent.change(titleInput, { target: { value: 'Nouveau titre modifié' } });

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(repo.updateRequestSpy).toHaveBeenCalledTimes(1);
    expect(repo.updateRequestSpy).toHaveBeenCalledWith(
      'r-jean-site',
      expect.objectContaining({ title: 'Nouveau titre modifié' })
    );

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('51. vider description envoie null → clear description, submit → updateRequest arg description === null', async () => {
    const onClose = vi.fn();
    const repo = buildRepository();

    render(
      withWrapper(
        <>
          <DataReady />
          <RequestEditModal requestId="r-jean-site" onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const descInputs = screen.getAllByRole('textbox');
    const descriptionTextarea = descInputs.find((el) => el.tagName === 'TEXTAREA');
    expect(descriptionTextarea).toBeInTheDocument();
    fireEvent.change(descriptionTextarea!, { target: { value: '   ' } });

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(repo.updateRequestSpy).toHaveBeenCalledTimes(1);
    const calls = repo.updateRequestSpy.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    const callAny = calls[0] as any;
    const input = callAny[1];
    expect(input.description).toBe(null);
    /* eslint-enable */
  });

  it('61. Edit: pending lock Escape/backdrop → submit deferred, Escape/backdrop blocked, resolve closes', async () => {
    const d = deferred<Request>();
    const updateMock = vi
      .fn<(requestId: string, input: UpdateRequestInput) => Promise<Request>>()
      .mockReturnValue(d.promise);
    const onClose = vi.fn();
    const repo = buildRepository({ updateRequest: updateMock });

    render(
      withWrapper(
        <>
          <DataReady />
          <RequestEditModal requestId="r-jean-site" onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const dialog = screen.getByRole('dialog', { name: /Modifier une demande/i });
    expect(dialog).toBeInTheDocument();

    const titleInput = screen.getByRole('textbox', { name: /^Titre/i });
    await waitFor(() => { expect(titleInput).toHaveValue('Création site vitrine'); });

    fireEvent.change(titleInput, { target: { value: 'Titre modifié en attente' } });

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: /Modifier une demande/i })).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(dialog).toBeInTheDocument();

    const backdrop = dialog.parentElement?.querySelector<HTMLElement>('.absolute.inset-0.bg-black\\/75') ?? null;
    expect(backdrop).not.toBeNull();
    if (!backdrop) throw new Error('backdrop missing');
    fireEvent.click(backdrop);
    expect(dialog).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    const sample = seedRequests[0];
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      d.resolve({ ...sample, title: 'Titre modifié en attente' });
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
