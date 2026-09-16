import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../../store/AppStore';
import { ContactEditModal } from './ContactEditModal';
import type { ReactElement } from 'react';
import type {
  Contact,
  Exchange,
  Mission,
  Request,
} from '../../types';
import { seedContacts, seedRequests, seedMissions, seedExchanges } from '../../data/seedData';
import type { CreateContactInput, IRepository, UpdateContactInput } from '../../data/repositories/interface';

type RepositorySpy = IRepository & {
  updateContactSpy: Mock<(contactId: string, input: UpdateContactInput) => Promise<Contact>>;
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

  const updateContactSpy = vi
    .fn<(contactId: string, input: UpdateContactInput) => Promise<Contact>>()
    .mockImplementation(
      overrides?.updateContact ??
        ((id) => {
          const c = sc.find((x) => x.id === id);
          return Promise.resolve(c ?? sc[0]);
        })
    );

  return {
    loadContacts: () => Promise.resolve(sc),
    loadRequests: () => Promise.resolve(sr),
    loadMissions: () => Promise.resolve(sm),
    loadExchanges: () => Promise.resolve(se),
    createContact: (_input: CreateContactInput) =>
      Promise.reject(new Error('not implemented')),
    archiveContact:
      overrides?.archiveContact ?? (() => Promise.resolve()),
    ...overrides,
    updateContact: updateContactSpy,
    updateContactSpy,
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
  id: 'c-test-1',
  firstName: 'Camille',
  lastName: 'Robert',
  company: 'Studio Bloom',
  email: 'camille@studio.fr',
  phone: '+33 6 00 00 00 00',
  notes: 'Premières impressions positives, budget ~8k€',
  relationship: 'prospect',
  archived: false,
  createdAt: '2024-06-15T00:00:00Z',
  lastActivityAt: '2024-06-20T00:00:00Z',
  totalRequests: 2,
  totalMissions: 1,
  avatarSeed: 'c-test-1-seed',
};

describe('ContactEditModal — 17. Formulaire prérempli', () => {
  it('preremplit les champs avec les valeurs du contact', async () => {
    const noop = () => undefined;
    render(
      withWrapper(
        <>
          <DataReady />
          <ContactEditModal contact={TEST_CONTACT} onClose={noop} />
        </>
      )
    );

    await waitForDataLoaded();

    const dialog = screen.getByRole('dialog', { name: /Modifier Camille Robert/i });
    expect(dialog).toBeInTheDocument();

    const firstNameInput = screen.getByRole('textbox', { name: /^Prénom/i });
    const lastNameInput = screen.getByRole('textbox', { name: /^Nom\b/i });
    const companyInput = screen.getByRole('textbox', { name: /^Entreprise/i });
    const emailInput = screen.getByRole('textbox', { name: /^Email/i });
    const phoneInput = screen.getByRole('textbox', { name: /^Téléphone/i });
    const notesInput = screen.getByRole('textbox', { name: /^Notes/i });

    expect(firstNameInput).toHaveValue('Camille');
    expect(lastNameInput).toHaveValue('Robert');
    expect(companyInput).toHaveValue('Studio Bloom');
    expect(emailInput).toHaveValue('camille@studio.fr');
    expect(phoneInput).toHaveValue('+33 6 00 00 00 00');
    expect(notesInput).toHaveValue('Premières impressions positives, budget ~8k€');

    const prospectBtn = screen.getByText('Prospect', { selector: 'button' });
    expect(prospectBtn).toBeInTheDocument();
    expect(prospectBtn).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('ContactEditModal — 18. Sauvegarde appelle updateContact', () => {
  it('soumet le formulaire et appelle store.updateContact avec le payload', async () => {
    const onClose = vi.fn();
    const repo = buildRepository({
      updateContact: (_id, input) => {
        const merged = { ...TEST_CONTACT, ...input } as unknown as Contact;
        return Promise.resolve(merged);
      },
    });

    render(
      withWrapper(
        <>
          <DataReady />
          <ContactEditModal contact={TEST_CONTACT} onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const firstNameInput = screen.getByRole('textbox', { name: /^Prénom/i });
    const lastNameInput = screen.getByRole('textbox', { name: /^Nom\b/i });
    const companyInput = screen.getByRole('textbox', { name: /^Entreprise/i });

    fireEvent.change(firstNameInput, { target: { value: 'Camille-Anne' } });
    fireEvent.change(lastNameInput, { target: { value: 'Robert-Dupont' } });
    fireEvent.change(companyInput, { target: { value: 'Studio Bloom & Co' } });

    const clientBtn = screen.getByText('Client', { selector: 'button' });
    fireEvent.click(clientBtn);

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(repo.updateContactSpy).toHaveBeenCalledTimes(1);
    expect(repo.updateContactSpy).toHaveBeenCalledWith(TEST_CONTACT.id, {
      firstName: 'Camille-Anne',
      lastName: 'Robert-Dupont',
      company: 'Studio Bloom & Co',
      email: 'camille@studio.fr',
      phone: '+33 6 00 00 00 00',
      notes: 'Premières impressions positives, budget ~8k€',
      relationship: 'client',
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

describe('ContactEditModal — 19. Erreur sauvegarde affichée', () => {
  it('affiche un role=alert en cas d’erreur pendant la sauvegarde', async () => {
    const onClose = vi.fn();
    const repo = buildRepository({
      updateContact: () => Promise.reject(new Error('network timeout')),
    });

    render(
      withWrapper(
        <>
          <DataReady />
          <ContactEditModal contact={TEST_CONTACT} onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/network timeout/);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('ContactEditModal — bouton disabled pendant sauvegarde', () => {
  it('désactive le bouton Enregistrer et affiche l’état "Enregistrement…"', async () => {
    const onClose = vi.fn();
    let resolveUpdate: ((c: Contact) => void) | undefined;
    const slowUpdate = new Promise<Contact>((res) => {
      resolveUpdate = res;
    });
    const repo = buildRepository({
      updateContact: () => slowUpdate,
    });

    render(
      withWrapper(
        <>
          <DataReady />
          <ContactEditModal contact={TEST_CONTACT} onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    expect(saveButton).not.toBeDisabled();

    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      const pendingBtn = screen.getByRole('button', { name: /Enregistrement…/i });
      expect(pendingBtn).toBeDisabled();
    });

    if (resolveUpdate) {
      resolveUpdate(TEST_CONTACT);
    }
  });
});

describe('ContactEditModal — vider champs facultatifs envoie null', () => {
  it('1. vide téléphone → payload.phone = null', async () => {
    const onClose = vi.fn();
    const repo = buildRepository();

    render(
      withWrapper(
        <>
          <DataReady />
          <ContactEditModal contact={TEST_CONTACT} onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const phoneInput = screen.getByRole('textbox', { name: /^Téléphone/i });
    fireEvent.change(phoneInput, { target: { value: '   ' } });

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(repo.updateContactSpy).toHaveBeenCalledTimes(1);
    expect(repo.updateContactSpy).toHaveBeenCalledWith(
      TEST_CONTACT.id,
      expect.objectContaining({ phone: null })
    );
  });

  it('2. vide entreprise / email / notes → tous null dans payload', async () => {
    const onClose = vi.fn();
    const repo = buildRepository();

    render(
      withWrapper(
        <>
          <DataReady />
          <ContactEditModal contact={TEST_CONTACT} onClose={onClose} />
        </>,
        repo
      )
    );

    await waitForDataLoaded();

    const companyInput = screen.getByRole('textbox', { name: /^Entreprise/i });
    const emailInput = screen.getByRole('textbox', { name: /^Email/i });
    const notesInput = screen.getByRole('textbox', { name: /^Notes/i });

    fireEvent.change(companyInput, { target: { value: '' } });
    fireEvent.change(emailInput, { target: { value: '   ' } });
    fireEvent.change(notesInput, { target: { value: '\n \t' } });

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    // eslint-disable-next-line @typescript-eslint/require-await
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(repo.updateContactSpy).toHaveBeenCalledTimes(1);
    const calls = repo.updateContactSpy.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    const callAny = calls[0] as any;
    const input = callAny[1];
    expect(input.company).toBe(null);
    expect(input.email).toBe(null);
    expect(input.notes).toBe(null);
    /* eslint-enable */
  });
});
