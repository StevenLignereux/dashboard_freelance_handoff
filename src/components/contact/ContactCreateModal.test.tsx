import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useCallback } from 'react';
import type { Contact, Request } from '../../types';
import type { CreateContactInput, CreateRequestInput, IRepository, UpdateRequestInput } from '../../data/repositories/interface';
import { AppStoreProvider } from '../../store/AppStore';
import { ContactCreateModal } from './ContactCreateModal';

function buildRepository(overrides?: Partial<IRepository>): IRepository {
  return {
    loadContacts: () => Promise.resolve([]),
    loadRequests: () => Promise.resolve([]),
    loadMissions: () => Promise.resolve([]),
    loadExchanges: () => Promise.resolve([]),
    createContact: (_input: CreateContactInput) =>
      Promise.reject(new Error('not implemented')),
    updateContact: (id, _input) => Promise.reject(new Error(`updateContact ${id} not implemented`)),
    archiveContact: (_id) => Promise.reject(new Error('archiveContact not implemented')),
    createRequest: vi.fn<(input: CreateRequestInput) => Promise<Request>>(),
    updateRequest: vi.fn<(requestId: string, input: UpdateRequestInput) => Promise<Request>>(),
    archiveRequest: vi.fn<(requestId: string) => Promise<void>>(),
    ...overrides,
  };
}

const DEFAULT_CONTACT_FIELDS = {
  firstName: 'Jean',
  lastName: 'Dupont',
  relationship: 'prospect',
} as const;

const BASE_CREATED: Contact = {
  id: 'c-created',
  firstName: 'Jean',
  lastName: 'Dupont',
  company: undefined,
  email: undefined,
  phone: undefined,
  notes: undefined,
  relationship: 'prospect',
  archived: false,
  createdAt: '2024-06-01T00:00:00Z',
  lastActivityAt: '2024-06-01T00:00:00Z',
  totalRequests: 0,
  totalMissions: 0,
  avatarSeed: 'c-created-abcd',
};

function fillRequired(createdSpy?: () => void) {
  const fn = createdSpy ?? (() => undefined);
  const firstName = screen.getByRole('textbox', { name: /^Prénom\s*\*?$/i });
  const lastName = screen.getByRole('textbox', { name: /^Nom\s*\*?$/i });
  fireEvent.change(firstName, { target: { value: DEFAULT_CONTACT_FIELDS.firstName } });
  fireEvent.change(lastName, { target: { value: DEFAULT_CONTACT_FIELDS.lastName } });
  fn();
}

function getDialogForm(): HTMLFormElement {
  const dialog = screen.getByRole('dialog');
  const form = dialog.querySelector('form');
  if (!form) {
    throw new Error('form not found inside dialog');
  }
  return form;
}

describe('ContactCreateModal — régression saisie persistante (BUG 1)', () => {
  it('conserve prénom/nom malgré rerender du parent (useCallback inline évité)', () => {
    function Harness() {
      const onClose = useCallback(() => undefined, []);
      return <ContactCreateModal open={true} onClose={onClose} />;
    }

    const { rerender } = render(
      <AppStoreProvider>
        <Harness />
      </AppStoreProvider>
    );

    const firstName = screen.getByRole('textbox', { name: /^Prénom\s*\*?$/i });
    const lastName = screen.getByRole('textbox', { name: /^Nom\s*\*?$/i });

    fireEvent.change(firstName, { target: { value: 'Jean' } });
    fireEvent.change(lastName, { target: { value: 'Dupont' } });

    expect(firstName).toHaveValue('Jean');
    expect(lastName).toHaveValue('Dupont');

    act(() => {
      rerender(
        <AppStoreProvider>
          <Harness />
        </AppStoreProvider>
      );
    });

    expect(firstName).toHaveValue('Jean');
    expect(lastName).toHaveValue('Dupont');

    act(() => {
      rerender(
        <AppStoreProvider>
          <Harness />
        </AppStoreProvider>
      );
      rerender(
        <AppStoreProvider>
          <Harness />
        </AppStoreProvider>
      );
    });

    expect(firstName).toHaveValue('Jean');
    expect(lastName).toHaveValue('Dupont');
  });

  it('réinitialise uniquement à l’ouverture d’une NOUVELLE session (fermé → ouvert)', () => {
    function Harness({ open }: { open: boolean }) {
      const onClose = useCallback(() => undefined, []);
      return <ContactCreateModal open={open} onClose={onClose} />;
    }

    const { rerender } = render(
      <AppStoreProvider>
        <Harness open={false} />
      </AppStoreProvider>
    );

    expect(
      screen.queryByRole('textbox', { name: /^Prénom\s*\*?$/i })
    ).not.toBeInTheDocument();

    rerender(
      <AppStoreProvider>
        <Harness open={true} />
      </AppStoreProvider>
    );
    const firstName = screen.getByRole('textbox', { name: /^Prénom\s*\*?$/i });
    fireEvent.change(firstName, { target: { value: 'Toto' } });
    expect(firstName).toHaveValue('Toto');

    rerender(
      <AppStoreProvider>
        <Harness open={false} />
      </AppStoreProvider>
    );
    expect(
      screen.queryByRole('textbox', { name: /^Prénom\s*\*?$/i })
    ).not.toBeInTheDocument();

    rerender(
      <AppStoreProvider>
        <Harness open={true} />
      </AppStoreProvider>
    );
    const firstName2 = screen.getByRole('textbox', { name: /^Prénom\s*\*?$/i });
    expect(firstName2).toHaveValue('');
  });
});

describe('ContactCreateModal — création async Backend 1C', () => {
  it('succès asynchrone : submit appelle createContact + affiche "<Nom> ajouté"', async () => {
    const createFn = vi.fn<(input: CreateContactInput) => Promise<Contact>>(
      () => Promise.resolve(BASE_CREATED)
    );
    const repo = buildRepository({ createContact: createFn });

    const onClose = vi.fn();
    render(
      <AppStoreProvider repository={repo}>
        <ContactCreateModal open={true} onClose={onClose} />
      </AppStoreProvider>
    );

    fillRequired();

    act(() => {
      fireEvent.submit(getDialogForm());
    });

    expect(createFn).toHaveBeenCalledTimes(1);
    expect(createFn).toHaveBeenCalledWith({
      firstName: 'Jean',
      lastName: 'Dupont',
      company: undefined,
      email: undefined,
      phone: undefined,
      notes: undefined,
      relationship: 'prospect',
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dupont ajouté/ })).toBeInTheDocument();
    });
  });

  it('bouton submit est désactivé pendant isSubmitting + texte "Création…"', async () => {
    let resolveCreated: ((c: Contact) => void) | undefined;
    const pending = new Promise<Contact>((res) => {
      resolveCreated = res;
    });
    const createFn = vi.fn(() => pending);

    const repo = buildRepository({ createContact: createFn });
    const onClose = vi.fn();

    render(
      <AppStoreProvider repository={repo}>
        <ContactCreateModal open={true} onClose={onClose} />
      </AppStoreProvider>
    );

    fillRequired();

    const idleBtn = screen.getByRole('button', { name: /^Créer le contact$/ });
    expect(idleBtn).toBeEnabled();

    await act(async () => {
      fireEvent.submit(getDialogForm());
      await new Promise<void>((r) => {
        setTimeout(() => {
          r();
        }, 10);
      });
    });

    const submitStateBtn = screen.getByRole('button', { name: /^Création…$/ });
    expect(submitStateBtn).toBeDisabled();

    act(() => {
      if (resolveCreated) resolveCreated(BASE_CREATED);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dupont ajouté/ })).toBeInTheDocument();
    });
  });

  it('message succès seulement après résolution (pas avant)', async () => {
    let resolveCreated: ((c: Contact) => void) | undefined;
    const pending = new Promise<Contact>((res) => {
      resolveCreated = res;
    });
    const repo = buildRepository({ createContact: () => pending });

    render(
      <AppStoreProvider repository={repo}>
        <ContactCreateModal open={true} onClose={() => undefined} />
      </AppStoreProvider>
    );

    fillRequired();

    await act(async () => {
      fireEvent.submit(getDialogForm());
      await new Promise<void>((r) => {
        setTimeout(() => {
          r();
        }, 5);
      });
    });

    expect(screen.queryByRole('button', { name: /ajouté/i })).not.toBeInTheDocument();

    act(() => {
      if (resolveCreated) resolveCreated(BASE_CREATED);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Dupont ajouté/ })).toBeInTheDocument();
    });
  });

  it('erreur repository : message role="alert", modal reste ouverte, bouton submit réutilisable', async () => {
    const createFn = vi.fn<(input: CreateContactInput) => Promise<Contact>>(
      () => Promise.reject(new Error('Échec création'))
    );
    const repo = buildRepository({ createContact: createFn });
    const onClose = vi.fn();

    render(
      <AppStoreProvider repository={repo}>
        <ContactCreateModal open={true} onClose={onClose} />
      </AppStoreProvider>
    );

    fillRequired();

    await act(async () => {
      fireEvent.submit(getDialogForm());
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/Échec création/);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /^Créer le contact$/ });
    expect(submitBtn).toBeEnabled();

    expect(screen.queryByRole('button', { name: /ajouté/i })).not.toBeInTheDocument();
  });
});
