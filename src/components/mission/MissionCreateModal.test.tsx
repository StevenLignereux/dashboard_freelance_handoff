import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../../store/AppStore';
import type { IRepository } from '../../data/repositories/interface';
import { seedContacts, seedRequests } from '../../data/seedData';
import { MissionCreateModal } from './MissionCreateModal';

function DataReady() {
  const store = useAppStore();
  if (store.data.loading || store.data.error) return <div data-testid="not-ready" />;
  return null;
}

describe('MissionCreateModal', () => {
  it('affiche l’erreur si la demande est clôturée côté serveur et garde la modale ouverte', async () => {
    const onClose = vi.fn();
    const repository: IRepository = {
      loadContacts: () => Promise.resolve(seedContacts),
      loadRequests: () => Promise.resolve(seedRequests),
      loadMissions: () => Promise.resolve([]),
      loadExchanges: () => Promise.resolve([]),
      createContact: vi.fn(), updateContact: vi.fn(), archiveContact: vi.fn(),
      createRequestAction: vi.fn(), updateRequestAction: vi.fn(),
      createRequest: vi.fn(), updateRequest: vi.fn(), archiveRequest: vi.fn(),
      createMission: () => Promise.reject(new Error('Cannot create a mission for a closed or archived request.')),
      updateMission: vi.fn(), createExchange: vi.fn(),
    };

    render(<AppStoreProvider repository={repository}>
      <DataReady />
      <MissionCreateModal contactId="c-jean-dupont" requestId="r-jean-site" onClose={onClose} />
    </AppStoreProvider>);
    await waitFor(() => expect(screen.queryByTestId('not-ready')).not.toBeInTheDocument());

    fireEvent.change(screen.getByRole('textbox', { name: /Titre/i }), { target: { value: 'Nouvelle mission' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la mission' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/closed or archived/i);
    expect(screen.getByRole('dialog', { name: 'Créer une mission' })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
