import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppStoreProvider } from '../../store/AppStore';
import { ContactCardModal } from './ContactCardModal';

function withWrapper(ui: React.ReactElement) {
  return <AppStoreProvider>{ui}</AppStoreProvider>;
}

describe('ContactCardModal — BUG 7 : ouvrir la demande sélectionnée', () => {
  const noop = () => undefined;

  it('affiche la demande dont l’id est transmis (Devis dépannage) et non l’active par défaut', () => {
    render(
      withWrapper(
        <ContactCardModal
          contactId="c-jean-dupont"
          requestId="r-jean-devis"
          onClose={noop}
        />
      )
    );

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

  it('retombe sur la demande active si aucun requestId n’est fourni', () => {
    render(
      withWrapper(
        <ContactCardModal
          contactId="c-jean-dupont"
          requestId={null}
          onClose={noop}
        />
      )
    );

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
});

describe('ContactCardModal — BUG 4 : Ctrl/Cmd+K ne déplace pas le focus hors modale', () => {
  const noop = () => undefined;

  it('garde le focus à l’intérieur quand on presse Ctrl+K', () => {
    render(
      withWrapper(
        <ContactCardModal
          contactId="c-jean-dupont"
          onClose={noop}
        />
      )
    );

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

  it('garde le focus à l’intérieur avec Cmd+K (metaKey)', () => {
    render(
      withWrapper(
        <ContactCardModal
          contactId="c-jean-dupont"
          onClose={noop}
        />
      )
    );

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
