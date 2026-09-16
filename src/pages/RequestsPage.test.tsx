import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../store/AppStore';
import { RequestsPage } from '../pages/RequestsPage';
import type { ReactElement } from 'react';
import type {
  Contact,
  Exchange,
  Mission,
  Request,
} from '../types';
import { seedContacts, seedRequests, seedMissions, seedExchanges } from '../data/seedData';
import type { CreateContactInput, CreateRequestActionInput, CreateRequestInput, IRepository, UpdateContactInput, UpdateRequestInput } from '../data/repositories/interface';

function buildRepository(overrides?: Partial<IRepository>): IRepository {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sc = seedContacts as unknown as Contact[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sr = seedRequests as unknown as Request[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sm = seedMissions as unknown as Mission[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const se = seedExchanges as unknown as Exchange[];

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
    archiveContact: () => Promise.resolve(),
    createRequestAction: vi.fn<(input: CreateRequestActionInput) => Promise<NonNullable<Request['actions']>[number]>>(),
    createRequest: vi.fn<(input: CreateRequestInput) => Promise<Request>>(),
    updateRequest: vi.fn<(requestId: string, input: UpdateRequestInput) => Promise<Request>>(),
    archiveRequest: vi.fn<(requestId: string) => Promise<void>>(),
    ...overrides,
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

describe('RequestsPage', () => {
  it('56. RequestsRow archived n\'affiche pas NextActionView. archived request shows "Demande archivée" and no action content', async () => {
    const onOpenContact = vi.fn();

    render(
      withWrapper(
        <>
          <DataReady />
          <RequestsPage onOpenContact={onOpenContact} />
        </>
      )
    );

    await waitForDataLoaded();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Demandes/i })).toBeInTheDocument();
    });

    const archivedRow = screen.getByText('Devis dépannage').closest('button');
    expect(archivedRow).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const r = archivedRow!;
    expect(r).toHaveTextContent('Demande archivée');

    const w = within(r);
    expect(w.getAllByText('Demande archivée').length).toBeGreaterThanOrEqual(1);
    expect(w.queryByText(/Aucune action prévue/i)).toBeNull();

    const archivedChip = screen.getAllByText('Archivée').find((el) => el.closest('button') === r);
    expect(archivedChip).toBeInTheDocument();
  });
});
