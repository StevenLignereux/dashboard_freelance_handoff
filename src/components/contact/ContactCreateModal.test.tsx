import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useCallback } from 'react';
import { AppStoreProvider } from '../../store/AppStore';
import { ContactCreateModal } from './ContactCreateModal';

function withWrapper(ui: React.ReactElement) {
  return <AppStoreProvider>{ui}</AppStoreProvider>;
}

describe('ContactCreateModal — régression saisie persistante (BUG 1)', () => {
  it('conserve prénom/nom malgré rerender du parent (useCallback inline évité)', () => {
    function Harness() {
      const onClose = useCallback(() => undefined, []);
      return <ContactCreateModal open={true} onClose={onClose} />;
    }

    const { rerender } = render(withWrapper(<Harness />));

    const firstName = screen.getByRole('textbox', { name: /^Prénom\s*\*?$/i });
    const lastName = screen.getByRole('textbox', { name: /^Nom\s*\*?$/i });

    fireEvent.change(firstName, { target: { value: 'Jean' } });
    fireEvent.change(lastName, { target: { value: 'Dupont' } });

    expect(firstName).toHaveValue('Jean');
    expect(lastName).toHaveValue('Dupont');

    act(() => {
      rerender(withWrapper(<Harness />));
    });

    expect(firstName).toHaveValue('Jean');
    expect(lastName).toHaveValue('Dupont');

    act(() => {
      rerender(withWrapper(<Harness />));
      rerender(withWrapper(<Harness />));
    });

    expect(firstName).toHaveValue('Jean');
    expect(lastName).toHaveValue('Dupont');
  });

  it('réinitialise uniquement à l’ouverture d’une NOUVELLE session (fermé → ouvert)', () => {
    function Harness({ open }: { open: boolean }) {
      const onClose = useCallback(() => undefined, []);
      return <ContactCreateModal open={open} onClose={onClose} />;
    }

    const { rerender } = render(withWrapper(<Harness open={false} />));

    expect(
      screen.queryByRole('textbox', { name: /^Prénom\s*\*?$/i })
    ).not.toBeInTheDocument();

    rerender(withWrapper(<Harness open={true} />));
    const firstName = screen.getByRole('textbox', { name: /^Prénom\s*\*?$/i });
    fireEvent.change(firstName, { target: { value: 'Toto' } });
    expect(firstName).toHaveValue('Toto');

    rerender(withWrapper(<Harness open={false} />));
    expect(
      screen.queryByRole('textbox', { name: /^Prénom\s*\*?$/i })
    ).not.toBeInTheDocument();

    rerender(withWrapper(<Harness open={true} />));
    const firstName2 = screen.getByRole('textbox', { name: /^Prénom\s*\*?$/i });
    expect(firstName2).toHaveValue('');
  });
});
