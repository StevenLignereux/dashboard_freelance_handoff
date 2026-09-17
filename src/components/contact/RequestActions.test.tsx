/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../../store/AppStore';
import { ContactCardModal } from './ContactCardModal';
import type { ReactElement } from 'react';
import type {
  Contact,
  Exchange,
  Mission,
  NextAction,
  Request,
} from '../../types';
import { seedMissions, seedExchanges } from '../../data/seedData';
import type { CreateContactInput, CreateRequestActionInput, CreateRequestInput, IRepository, UpdateContactInput, UpdateRequestInput } from '../../data/repositories/interface';

const CONTACT_NO_ACTIVE_REQUEST: Contact = {
  id: 'c-no-active',
  firstName: 'Paul',
  lastName: 'Durand',
  company: 'Durand SARL',
  email: 'paul@durand.fr',
  phone: '+33 6 10 20 30 40',
  notes: 'Aucune demande active',
  relationship: 'prospect',
  archived: false,
  createdAt: '2024-05-01T00:00:00Z',
  lastActivityAt: '2024-06-01T00:00:00Z',
  activeRequestId: undefined,
  totalRequests: 0,
  totalMissions: 0,
  avatarSeed: 'c-no-active-seed',
};

const CONTACT_WITH_ACTIVE_REQUEST: Contact = {
  id: 'c-with-active',
  firstName: 'Marie',
  lastName: 'Leroy',
  company: 'Leroy & Fils',
  email: 'marie@leroy.fr',
  phone: '+33 6 50 60 70 80',
  notes: 'Avec demande active',
  relationship: 'client',
  archived: false,
  createdAt: '2024-04-01T00:00:00Z',
  lastActivityAt: '2024-06-10T00:00:00Z',
  activeRequestId: 'r-active-marie',
  totalRequests: 1,
  totalMissions: 0,
  avatarSeed: 'c-with-active-seed',
};

const ACTIVE_REQUEST_MARIE: Request = {
  id: 'r-active-marie',
  contactId: 'c-with-active',
  title: 'Demande active Marie',
  description: 'Description de la demande',
  status: 'a_comprendre',
  createdAt: '2024-06-01T00:00:00Z',
  lastActivityAt: '2024-06-10T00:00:00Z',
  archived: false,
};

const TEST_CONTACTS: Contact[] = [CONTACT_NO_ACTIVE_REQUEST, CONTACT_WITH_ACTIVE_REQUEST];
const TEST_REQUESTS: Request[] = [ACTIVE_REQUEST_MARIE];

function buildRepository(overrides?: Partial<IRepository>): IRepository {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sm = seedMissions as unknown as Mission[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const se = seedExchanges as unknown as Exchange[];

  return {
    loadContacts: () => Promise.resolve(TEST_CONTACTS),
    loadRequests: () => Promise.resolve(TEST_REQUESTS),
    loadMissions: () => Promise.resolve(sm),
    loadExchanges: () => Promise.resolve(se),
    createContact: (_input: CreateContactInput) =>
      Promise.reject(new Error('not implemented')),
    updateContact: (id: string, _in: UpdateContactInput) => {
      const c = TEST_CONTACTS.find((x) => x.id === id);
      return Promise.resolve(c ?? TEST_CONTACTS[0]);
    },
    archiveContact: () => Promise.resolve(),
    createRequestAction: vi.fn<(input: CreateRequestActionInput) => Promise<NextAction>>(),
    createRequest: vi.fn<(input: CreateRequestInput) => Promise<Request>>(),
    updateRequest: vi.fn<(requestId: string, input: UpdateRequestInput) => Promise<Request>>(),
    archiveRequest: vi.fn<(requestId: string) => Promise<void>>(),
    updateRequestAction: () =>
      Promise.reject(new Error('not implemented')),
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

const noop = () => undefined;

describe('ContactCardModal — Request CTA & archive', () => {
  it('43. CTA Créer demande présent sans demande active → render ContactCard with a non-archived contact and NO active request → screen.getByText(\'Créer une demande\') exists', async () => {
    const onCreateRequest = vi.fn();

    render(
      withWrapper(
        <>
          <DataReady />
          <ContactCardModal
            contactId="c-no-active"
            requestId={null}
            onClose={noop}
            onCreateRequest={onCreateRequest}
          />
        </>
      )
    );

    await waitForDataLoaded();

    const createButton = screen.getByText('Créer une demande', { selector: 'button' });
    expect(createButton).toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(createButton);
    });
    expect(onCreateRequest).toHaveBeenCalledTimes(1);
    expect(onCreateRequest).toHaveBeenCalledWith('c-no-active');
  });

  it('44. CTA absent si demande active → contact with active request → no such button exists', async () => {
    render(
      withWrapper(
        <>
          <DataReady />
          <ContactCardModal
            contactId="c-with-active"
            requestId={null}
            onClose={noop}
            onCreateRequest={noop}
          />
        </>
      )
    );

    await waitForDataLoaded();

    expect(
      screen.queryByText('Créer une demande', { selector: 'button' })
    ).not.toBeInTheDocument();
  });

  it('52. archive ouvre confirmation (in ContactCard, active request present, render with onArchiveRequest callback, click "Archiver" in RequestBlock, expect onArchiveRequest callback has been called with request.id)', async () => {
    const onArchiveRequest = vi.fn();

    render(
      withWrapper(
        <>
          <DataReady />
          <ContactCardModal
            contactId="c-with-active"
            requestId={null}
            onClose={noop}
            onArchiveRequest={onArchiveRequest}
          />
        </>
      )
    );

    await waitForDataLoaded();

    const archiveButtons = screen.getAllByText('Archiver', { selector: 'button' });
    const requestArchiveBtn = archiveButtons.find(
      (btn) =>
        !btn.getAttribute('aria-label')?.includes('Marie Leroy')
    );
    expect(requestArchiveBtn).toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(requestArchiveBtn!);
    });

    expect(onArchiveRequest).toHaveBeenCalledTimes(1);
    expect(onArchiveRequest).toHaveBeenCalledWith('r-active-marie');
  });

  it('53. CTA Planifier une action → visible sans nextAction et appelle le callback', async () => {
    const onCreateRequestAction = vi.fn();

    render(
      withWrapper(
        <>
          <DataReady />
          <ContactCardModal
            contactId="c-with-active"
            requestId={null}
            onClose={noop}
            onCreateRequestAction={onCreateRequestAction}
          />
        </>
      )
    );

    await waitForDataLoaded();

    const actionButton = screen.getByRole('button', {
      name: /Planifier une action/i,
    });

    expect(actionButton).toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(actionButton);
    });

    expect(onCreateRequestAction).toHaveBeenCalledTimes(1);
    expect(onCreateRequestAction).toHaveBeenCalledWith('r-active-marie');
  });

  it('54. CTA Planifier une action → absent si une nextAction existe déjà', async () => {
    const requestWithAction: Request = {
      ...ACTIVE_REQUEST_MARIE,
      nextAction: {
        id: 'a-existing',
        type: 'appel',
        label: 'Appeler le client',
        dueDate: '2026-09-18T10:00:00.000Z',
      },
    };

    const repo = buildRepository({
      loadRequests: () => Promise.resolve([requestWithAction]),
    });

    render(
      withWrapper(
        <>
          <DataReady />
          <ContactCardModal
            contactId="c-with-active"
            requestId={null}
            onClose={noop}
            onCreateRequestAction={noop}
          />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    expect(
      screen.queryByRole('button', { name: /Planifier une action/i })
    ).not.toBeInTheDocument();
  });
});
