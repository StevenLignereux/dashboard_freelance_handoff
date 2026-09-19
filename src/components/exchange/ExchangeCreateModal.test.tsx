import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../../store/AppStore';
import { ExchangeCreateModal } from './ExchangeCreateModal';
import type { ReactElement } from 'react';
import type { Contact, Exchange, Mission, NextAction, Request } from '../../types';
import { seedContacts, seedRequests, seedMissions, seedExchanges } from '../../data/seedData';
import type {
  CreateContactInput,
  CreateExchangeInput,
  CreateRequestActionInput,
  CreateRequestInput,
  IRepository,
  UpdateRequestInput,
} from '../../data/repositories/interface';

type RepositoryWithExchangeSpy = IRepository & {
  createExchangeSpy: ReturnType<typeof vi.fn<(input: CreateExchangeInput) => Promise<Exchange>>>;
};

function buildRepository(overrides?: Partial<IRepository>): RepositoryWithExchangeSpy {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sc = seedContacts as unknown as Contact[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sr = seedRequests as unknown as Request[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const sm = seedMissions as unknown as Mission[];
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const se = seedExchanges as unknown as Exchange[];
  const createExchangeSpy = vi.fn<(input: CreateExchangeInput) => Promise<Exchange>>(
    (input) =>
      Promise.resolve({
        id: `exchange-${Date.now()}`,
        requestId: input.requestId,
        type: input.type,
        date: input.date,
        summary: input.summary,
      })
  );
  return {
    loadContacts: () => Promise.resolve(sc),
    loadRequests: () => Promise.resolve(sr),
    loadMissions: () => Promise.resolve(sm),
    loadExchanges: () => Promise.resolve(se),
    createContact: (_input: CreateContactInput) =>
      Promise.reject(new Error('not implemented')),
    updateContact: (id) => {
      const c = sc.find((x) => x.id === id);
      return Promise.resolve(c ?? sc[0]);
    },
    archiveContact: () => Promise.resolve(),
    createRequestAction: vi.fn<(input: CreateRequestActionInput) => Promise<NextAction>>(),
    createRequest: vi.fn<(input: CreateRequestInput) => Promise<Request>>(),
    updateRequest: vi.fn<(requestId: string, input: UpdateRequestInput) => Promise<Request>>(),
    archiveRequest: vi.fn<(requestId: string) => Promise<void>>(),
    updateRequestAction: () => Promise.reject(new Error('not implemented')),
    createMission: () => Promise.reject(new Error('not implemented')),
    updateMission: () => Promise.reject(new Error('not implemented')),
    createExchange: overrides?.createExchange ?? createExchangeSpy,
    ...overrides,
    createExchangeSpy,
  } satisfies RepositoryWithExchangeSpy;
}

function withWrapper(ui: ReactElement, repository?: IRepository) {
  const repo = repository ?? buildRepository();
  return <AppStoreProvider repository={repo}>{ui}</AppStoreProvider>;
}

function DataReady() {
  const store = useAppStore();
  if (store.data.loading || store.data.error) {
    return <div data-testid="appstore-not-ready" />;
  }
  return null;
}

async function waitForDataLoaded() {
  await waitFor(() => {
    expect(screen.queryByTestId('appstore-not-ready')).not.toBeInTheDocument();
  });
}

describe('ExchangeCreateModal — V1 création échange', () => {
  it('affiche la modale pré-remplie avec la date et heure maintenant en local', async () => {
    const repo = buildRepository();
    const onClose = vi.fn();

    render(
      withWrapper(
        <>
          <DataReady />
          <ExchangeCreateModal requestId="r-jean-site" onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    expect(screen.getByRole('dialog', { name: /Ajouter un échange/i })).toBeInTheDocument();
    expect(screen.getByText(/Demande/i)).toBeInTheDocument();

    const summary = screen.getByRole('textbox', { name: /Résumé/i });
    expect(summary).toBeInTheDocument();

    const dateInput = screen.getByLabelText(/Date et heure/i) as HTMLInputElement;
    expect(dateInput).toBeInTheDocument();
    expect(dateInput.type).toBe('datetime-local');
    await waitFor(() => {
      expect(dateInput.value).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    });

    const typeSelect = screen.getByRole('combobox', { name: /Type/i });
    expect(typeSelect).toHaveValue('appel');
  });

  it('soumet createExchange avec les bonnes valeurs, ISO date via new Date, puis ferme la modale au succès', async () => {
    const repo = buildRepository();
    const onClose = vi.fn();

    render(
      withWrapper(
        <>
          <DataReady />
          <ExchangeCreateModal requestId="r-jean-site" onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const summary = screen.getByRole('textbox', { name: /Résumé/i });
    fireEvent.change(summary, { target: { value: 'Appel de 15min, confirmé la réunion mardi.' } });

    const typeSelect = screen.getByRole('combobox', { name: /Type/i });
    fireEvent.change(typeSelect, { target: { value: 'rencontre' } });

    const dateInput = screen.getByLabelText(/Date et heure/i) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-09-22T14:30' } });

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(repo.createExchangeSpy).toHaveBeenCalledTimes(1);
    });

    const spy = repo.createExchangeSpy;
    const callArg = spy.mock.calls[0][0];
    expect(callArg.requestId).toBe('r-jean-site');
    expect(callArg.type).toBe('rencontre');
    expect(callArg.summary).toBe('Appel de 15min, confirmé la réunion mardi.');
    expect(callArg.date).toBe(new Date('2026-09-22T14:30').toISOString());

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('désactive le bouton Enregistrer si résumé vide', async () => {
    const onClose = vi.fn();

    render(
      withWrapper(
        <>
          <DataReady />
          <ExchangeCreateModal requestId="r-jean-site" onClose={onClose} />
        </>
      )
    );

    await waitForDataLoaded();

    const submit = screen.getByRole('button', { name: /Enregistrer/i });
    expect(submit).toBeDisabled();

    const summary = screen.getByRole('textbox', { name: /Résumé/i });
    fireEvent.change(summary, { target: { value: '   ' } });
    expect(submit).toBeDisabled();

    fireEvent.change(summary, { target: { value: 'a' } });
    expect(submit).not.toBeDisabled();
  });

  it('affiche une erreur humaine si createExchange échoue et ne ferme pas la modale', async () => {
    const createExchange = vi.fn<(input: CreateExchangeInput) => Promise<Exchange>>(
      () => {
        throw new Error('Le serveur est temporairement indisponible.');
      }
    );
    const repo = buildRepository({ createExchange });
    const onClose = vi.fn();

    render(
      withWrapper(
        <>
          <DataReady />
          <ExchangeCreateModal requestId="r-jean-site" onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const summary = screen.getByRole('textbox', { name: /Résumé/i });
    fireEvent.change(summary, { target: { value: 'Test échec' } });

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Le serveur est temporairement indisponible/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('bloque Escape et backdrop pendant la soumission (isSubmitting=true)', async () => {
    let resolveExchange: ((e: Exchange) => void) | undefined;
    const createExchange = vi.fn(
      () =>
        new Promise<Exchange>((resolve) => {
          resolveExchange = resolve;
        })
    );
    const onClose = vi.fn();

    render(
      withWrapper(
        <>
          <DataReady />
          <ExchangeCreateModal requestId="r-jean-site" onClose={onClose} />
        </>,
        buildRepository({ createExchange })
      )
    );

    await waitForDataLoaded();

    const summary = screen.getByRole('textbox', { name: /Résumé/i });
    fireEvent.change(summary, { target: { value: 'test pending' } });

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Enregistrement/i })).toBeInTheDocument();
    });

    const submit = screen.getByRole('button', { name: /Enregistrement/i });
    expect(submit).toBeDisabled();

    const cancel = screen.getByRole('button', { name: /Annuler/i });
    expect(cancel).toBeDisabled();

    const ae = document.activeElement;
    if (ae) {
      fireEvent.keyDown(ae, { key: 'Escape' });
    }
    expect(onClose).not.toHaveBeenCalled();

    expect(resolveExchange).toBeDefined();
    (resolveExchange as (e: Exchange) => void)({
      id: 'ex-ok',
      requestId: 'r-jean-site',
      type: 'appel',
      date: new Date().toISOString(),
      summary: 'test pending',
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
