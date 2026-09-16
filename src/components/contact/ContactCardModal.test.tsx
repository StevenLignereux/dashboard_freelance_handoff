import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../../store/AppStore';
import { ContactCardModal } from './ContactCardModal';
import type { ReactElement } from 'react';
import type {
  Contact,
  Exchange,
  Mission,
  Request,
} from '../../types';
import { seedContacts, seedRequests, seedMissions, seedExchanges } from '../../data/seedData';
import type { CreateContactInput, IRepository } from '../../data/repositories/interface';

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
    ...overrides,
  };
}

function withWrapper(ui: ReactElement, repository?: IRepository) {
  const repo = repository ?? buildRepository();
  return <AppStoreProvider repository={repo}>{ui}</AppStoreProvider>;
}

/**
 * Attend que le store ait terminé son chargement initial.
 * Rien n'est écrit dans globalThis.
 */
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

describe('ContactCardModal — BUG 7 : ouvrir la demande sélectionnée', () => {
  const noop = () => undefined;

  it('affiche la demande dont l’id est transmis (Devis dépannage) et non l’active par défaut', async () => {
    render(
      withWrapper(
        <>
          <DataReady />
          <ContactCardModal
            contactId="c-jean-dupont"
            requestId="r-jean-devis"
            onClose={noop}
          />
        </>
      )
    );

    await waitForDataLoaded();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /Devis dépannage/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 3,
        name: /Création site vitrine/i,
      })
    ).not.toBeInTheDocument();
  });

  it('retombe sur la demande active si aucun requestId n’est fourni', async () => {
    render(
      withWrapper(
        <>
          <DataReady />
          <ContactCardModal
            contactId="c-jean-dupont"
            requestId={null}
            onClose={noop}
          />
        </>
      )
    );

    await waitForDataLoaded();

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /Création site vitrine/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 3, name: /Devis dépannage/i })
    ).not.toBeInTheDocument();
  });

  it('retombe sur la demande active si le requestId appartient à un AUTRE contact', async () => {
    render(
      withWrapper(
        <>
          <DataReady />
          <ContactCardModal
            contactId="c-jean-dupont"
            requestId="r-sophie-ecom"
            onClose={noop}
          />
        </>
      )
    );

    await waitForDataLoaded();

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /Création site vitrine/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        level: 3,
        name: /Refonte site e-commerce/i,
      })
    ).not.toBeInTheDocument();
  });
});

describe('ContactCardModal — BUG 4 : Ctrl/Cmd+K ne déplace pas le focus hors modale', () => {
  const noop = () => undefined;

  it('garde le focus à l’intérieur quand on presse Ctrl+K', async () => {
    render(
      withWrapper(
        <>
          <DataReady />
          <ContactCardModal
            contactId="c-jean-dupont"
            onClose={noop}
          />
        </>
      )
    );

    await waitForDataLoaded();

    const dialog = screen.getByRole('dialog');
    const closeBtn = screen.getByRole('button', { name: /fermer|close/i });

    act(() => {
      closeBtn.focus();
    });
    expect(document.activeElement).toBe(closeBtn);

    act(() => {
      fireEvent.keyDown(window, {
        key: 'k',
        ctrlKey: true,
        code: 'KeyK',
      });
    });

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('garde le focus à l’intérieur avec Cmd+K (metaKey)', async () => {
    render(
      withWrapper(
        <>
          <DataReady />
          <ContactCardModal
            contactId="c-jean-dupont"
            onClose={noop}
          />
        </>
      )
    );

    await waitForDataLoaded();

    const dialog = screen.getByRole('dialog');
    const closeBtn = screen.getByRole('button', { name: /fermer|close/i });

    act(() => {
      closeBtn.focus();
    });

    act(() => {
      fireEvent.keyDown(window, {
        key: 'K',
        metaKey: true,
        code: 'KeyK',
      });
    });

    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});
