import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../../store/AppStore';
import { ContactCardModal } from './ContactCardModal';
import type { ReactElement } from 'react';
import { useEffect } from 'react';

function withWrapper(ui: ReactElement) {
  return <AppStoreProvider>{ui}</AppStoreProvider>;
}

async function waitForDataLoaded() {
  await waitFor(() => {
    const store = (globalThis as unknown as { _appStoreSnapshot?: ReturnType<typeof useAppStore> })._appStoreSnapshot;
    if (!store) {
      // Fallback: au moins provider a fini le chargement (plus de loading=true) : dialog apparaitra donc
      // La modal ContactCardModal render immédiatement mais utilise store.data.contacts.
      // On utilise un hook helper en dessous.
    }
    expect(screen.queryByRole('status', { name: /chargement/i })).not.toBeInTheDocument();
  });
}

function DataReady() {
  const store = useAppStore();
  useEffect(() => {
    (globalThis as unknown as { _appStoreSnapshot?: ReturnType<typeof useAppStore> })._appStoreSnapshot = store;
  });
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

    await waitFor(() => {
      expect(screen.queryByTestId('appstore-not-ready')).not.toBeInTheDocument();
    });
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

    await waitFor(() => {
      expect(screen.queryByTestId('appstore-not-ready')).not.toBeInTheDocument();
    });
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

    await waitFor(() => {
      expect(screen.queryByTestId('appstore-not-ready')).not.toBeInTheDocument();
    });
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

    await waitFor(() => {
      expect(screen.queryByTestId('appstore-not-ready')).not.toBeInTheDocument();
    });
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

    await waitFor(() => {
      expect(screen.queryByTestId('appstore-not-ready')).not.toBeInTheDocument();
    });
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
