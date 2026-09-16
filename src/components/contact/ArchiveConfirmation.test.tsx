import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../../store/AppStore';
import { ArchiveConfirmation } from './ArchiveConfirmation';
import type { ReactElement } from 'react';
import type {
  Contact,
  Exchange,
  Mission,
  Request,
} from '../../types';
import { seedContacts, seedRequests, seedMissions, seedExchanges } from '../../data/seedData';
import type { CreateContactInput, CreateRequestActionInput, CreateRequestInput, IRepository, UpdateRequestInput } from '../../data/repositories/interface';

type RepositorySpy = IRepository & {
  archiveContactSpy: Mock<(contactId: string) => Promise<void>>;
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

  const archiveContactSpy = vi
    .fn<(contactId: string) => Promise<void>>()
    .mockImplementation(
      overrides?.archiveContact ?? (() => Promise.resolve())
    );

  return {
    loadContacts: () => Promise.resolve(sc),
    loadRequests: () => Promise.resolve(sr),
    loadMissions: () => Promise.resolve(sm),
    loadExchanges: () => Promise.resolve(se),
    createContact: (_input: CreateContactInput) =>
      Promise.reject(new Error('not implemented')),
    updateContact:
      overrides?.updateContact ??
      ((id) => {
        const c = sc.find((x) => x.id === id);
        return Promise.resolve(c ?? sc[0]);
      }),
    archiveContact: archiveContactSpy,
    createRequestAction: vi.fn<(input: CreateRequestActionInput) => Promise<NonNullable<Request['actions']>[number]>>(),
    createRequest: vi.fn<(input: CreateRequestInput) => Promise<Request>>(),
    updateRequest: vi.fn<(requestId: string, input: UpdateRequestInput) => Promise<Request>>(),
    archiveRequest: vi.fn<(requestId: string) => Promise<void>>(),
    ...overrides,
    archiveContactSpy,
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

const TEST_CONTACT: Contact = {
  id: 'c-test-2',
  firstName: 'Marc',
  lastName: 'Lefebvre',
  company: 'Agence XYZ',
  email: 'marc@xyz.fr',
  phone: undefined,
  notes: undefined,
  relationship: 'ancien_client',
  archived: false,
  createdAt: '2024-01-10T00:00:00Z',
  lastActivityAt: '2024-05-20T00:00:00Z',
  totalRequests: 3,
  totalMissions: 2,
  avatarSeed: 'c-test-2-seed',
};

describe('ArchiveConfirmation — ouverture et contenu', () => {
  it('affiche le nom du contact dans le message', async () => {
    const onCancel = vi.fn();
    const onArchived = vi.fn();

    render(
      withWrapper(
        <>
          <DataReady />
          <ArchiveConfirmation
            contact={TEST_CONTACT}
            onCancel={onCancel}
            onArchived={onArchived}
          />
        </>
      )
    );

    await waitForDataLoaded();

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();

    expect(screen.getByText(/Archiver ce contact ?/i)).toBeInTheDocument();
    expect(screen.getByText(/Marc Lefebvre/i)).toBeInTheDocument();
    expect(screen.getByText(/ne sera plus affiché dans la liste active/i)).toBeInTheDocument();
  });
});

describe('ArchiveConfirmation — 21. Annuler ne fait rien', () => {
  it('clic sur Annuler ferme la boîte sans appeler archiveContact', async () => {
    const onCancel = vi.fn();
    const onArchived = vi.fn();
    const repo = buildRepository();

    render(
      withWrapper(
        <>
          <DataReady />
          <ArchiveConfirmation
            contact={TEST_CONTACT}
            onCancel={onCancel}
            onArchived={onArchived}
          />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const cancelButton = screen.getByRole('button', { name: /Annuler/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onArchived).not.toHaveBeenCalled();
    expect(repo.archiveContactSpy).not.toHaveBeenCalled();
  });
});

describe('ArchiveConfirmation — 22. Confirmer appelle archiveContact', () => {
  it('clic sur Archiver appelle store.archiveContact et onArchived', async () => {
    const onCancel = vi.fn();
    const onArchived = vi.fn();
    const repo = buildRepository();

    render(
      withWrapper(
        <>
          <DataReady />
          <ArchiveConfirmation
            contact={TEST_CONTACT}
            onCancel={onCancel}
            onArchived={onArchived}
          />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const archiveButton = screen.getByRole('button', { name: /Archiver/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(archiveButton);
    });

    expect(repo.archiveContactSpy).toHaveBeenCalledTimes(1);
    expect(repo.archiveContactSpy).toHaveBeenCalledWith(TEST_CONTACT.id);

    await waitFor(() => {
      expect(onArchived).toHaveBeenCalledTimes(1);
    });

    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe('ArchiveConfirmation — 23. Erreur archivage affichée', () => {
  it('affiche un role=alert en cas d’erreur et ne ferme pas', async () => {
    const onCancel = vi.fn();
    const onArchived = vi.fn();
    const repo = buildRepository({
      archiveContact: () => Promise.reject(new Error('permission denied')),
    });

    render(
      withWrapper(
        <>
          <DataReady />
          <ArchiveConfirmation
            contact={TEST_CONTACT}
            onCancel={onCancel}
            onArchived={onArchived}
          />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const archiveButton = screen.getByRole('button', { name: /Archiver/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(archiveButton);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/permission denied/);
    });

    expect(onArchived).not.toHaveBeenCalled();
  });
});

describe('ArchiveConfirmation — État pending pendant archivage', () => {
  it('désactive les boutons et affiche "Archivage…" pendant le traitement', async () => {
    const onCancel = vi.fn();
    const onArchived = vi.fn();
    let resolveArchive: (() => void) | undefined;
    const slowArchive = new Promise<void>((res) => {
      resolveArchive = res;
    });
    const repo = buildRepository({
      archiveContact: () => slowArchive,
    });

    render(
      withWrapper(
        <>
          <DataReady />
          <ArchiveConfirmation
            contact={TEST_CONTACT}
            onCancel={onCancel}
            onArchived={onArchived}
          />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const archiveButton = screen.getByRole('button', { name: /^Archiver$/i });
    expect(archiveButton).not.toBeDisabled();

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(archiveButton);
    });

    await waitFor(() => {
      const pendingBtn = screen.getByRole('button', { name: /Archivage…/i });
      expect(pendingBtn).toBeDisabled();
    });

    if (resolveArchive) {
      resolveArchive();
    }
  });
});
