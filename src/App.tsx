import { useCallback, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { RequestsPage } from './pages/RequestsPage';
import { MissionsPage } from './pages/MissionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ContactCardModal } from './components/contact/ContactCardModal';
import { AppStoreProvider, useAppStore } from './store/AppStore';
import { ContactCreateModal } from './components/contact/ContactCreateModal';
import { ContactEditModal } from './components/contact/ContactEditModal';
import { ArchiveConfirmation } from './components/contact/ArchiveConfirmation';
import { RequestCreateModal } from './components/request/RequestCreateModal';
import { RequestEditModal } from './components/request/RequestEditModal';
import { RequestArchiveConfirmation } from './components/request/RequestArchiveConfirmation';
import { RequestActionCreateModal } from './components/request/RequestActionCreateModal';
import { MissionCreateModal } from './components/mission/MissionCreateModal';
import { MissionEditModal } from './components/mission/MissionEditModal';
import { ExchangeCreateModal } from './components/exchange/ExchangeCreateModal';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { LoginPage } from './pages/LoginPage';

export interface OpenContactPayload {
  contactId: string;
  requestId?: string;
}

function DataLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Chargement des données"
      className="flex flex-col items-center justify-center py-24 gap-3 text-slate-700"
    >
      <div className="w-8 h-8 rounded-full border-2 border-brand-violet/40 border-t-brand-violet animate-spin" aria-hidden="true" />
      <p className="text-sm">Chargement des données…</p>
    </div>
  );
}

interface DataErrorFallbackProps {
  message?: string;
  onRetry: () => void;
}

function DataErrorFallback({ message, onRetry }: DataErrorFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mx-auto mt-16 max-w-lg w-full p-5 rounded-2xl bg-bg-surface/70 border border-brand-violet/20"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-coral/15 border border-brand-coral/20 flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-brand-coral">
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-semibold text-slate-900 text-base leading-tight">
            Impossible de charger les données.
          </h2>
          {message && (
            <p className="mt-1 text-xs text-slate-500">{message}</p>
          )}
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary mt-3 !py-2 !px-3.5 inline-flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthLoadingFallback() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3 px-4 text-slate-700">
      <div
        className="w-9 h-9 rounded-full border-2 border-brand-violet/40 border-t-brand-violet animate-spin"
        aria-hidden="true"
      />
      <p role="status" aria-live="polite" className="text-sm">
        Chargement de votre session…
      </p>
    </div>
  );
}

function Router() {
  const store = useAppStore();
  const [activeContact, setActiveContact] = useState<OpenContactPayload | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [archivingContactId, setArchivingContactId] = useState<string | null>(null);
  const [preArchiveContact, setPreArchiveContact] = useState<OpenContactPayload | null>(null);
  const [creatingRequestForContactId, setCreatingRequestForContactId] = useState<string | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [archivingRequestId, setArchivingRequestId] = useState<string | null>(null);
  const [preRequestPayload, setPreRequestPayload] = useState<OpenContactPayload | null>(null);
  const [creatingRequestActionForRequestId, setCreatingRequestActionForRequestId] = useState<string | null>(null);
  const [editingRequestActionForRequestId, setEditingRequestActionForRequestId] = useState<string | null>(null);
  const [creatingMissionRequestId, setCreatingMissionRequestId] = useState<string | null>(null);
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [creatingExchangeRequestId, setCreatingExchangeRequestId] = useState<string | null>(null);
  type PendingRequestModal =
    | { type: 'create'; contactId: string }
    | { type: 'edit'; requestId: string }
    | { type: 'archive'; requestId: string }
    | { type: 'action'; requestId: string }
    | { type: 'action-edit'; requestId: string }
    | { type: 'mission-create'; requestId: string }
    | { type: 'mission-edit'; missionId: string }
    | { type: 'exchange-create'; requestId: string }
    | null;
  const [pendingRequestModal, setPendingRequestModal] = useState<PendingRequestModal>(null);

  const editingContact = editingContactId
    ? store.data.contacts.find((c) => c.id === editingContactId) ?? null
    : null;
  const archivingContact = archivingContactId
    ? store.data.contacts.find((c) => c.id === archivingContactId) ?? null
    : null;

  const handleCloseContact = useCallback(() => {
    setActiveContact(null);
  }, []);

  const handleOpenContact = useCallback((payload: string | OpenContactPayload) => {
    if (typeof payload === 'string') {
      setActiveContact({ contactId: payload });
    } else {
      setActiveContact(payload);
    }
  }, []);

  const handleCloseCreate = useCallback(() => {
    setCreateOpen(false);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const handleEdit = useCallback((contactId: string) => {
    setActiveContact(null);
    setEditingContactId(contactId);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingContactId(null);
  }, []);

  const handleArchive = useCallback((contactId: string) => {
    setPreArchiveContact(
      activeContact?.contactId === contactId
        ? activeContact
        : { contactId }
    );
    setActiveContact(null);
    setArchivingContactId(contactId);
  }, [activeContact]);

  const handleCancelArchive = useCallback(() => {
    const toReopen = preArchiveContact;
    setArchivingContactId(null);
    setPreArchiveContact(null);
    if (toReopen) {
      setActiveContact(toReopen);
    }
  }, [preArchiveContact]);

  const handleArchived = useCallback(() => {
    setArchivingContactId(null);
    setActiveContact(null);
    setPreArchiveContact(null);
  }, []);

  const handleContactCardExitComplete = useCallback(() => {
    const pending = pendingRequestModal;
    if (!pending) return;
    setPendingRequestModal(null);
    switch (pending.type) {
      case 'create':
        setCreatingRequestForContactId(pending.contactId);
        break;
      case 'edit':
        setEditingRequestId(pending.requestId);
        break;
      case 'archive':
        setArchivingRequestId(pending.requestId);
        break;
      case 'action':
        setCreatingRequestActionForRequestId(pending.requestId);
        break;
      case 'action-edit':
        setEditingRequestActionForRequestId(pending.requestId);
        break;
      case 'mission-create':
        setCreatingMissionRequestId(pending.requestId);
        break;
      case 'mission-edit':
        setEditingMissionId(pending.missionId);
        break;
      case 'exchange-create':
        setCreatingExchangeRequestId(pending.requestId);
        break;
    }
  }, [pendingRequestModal]);

  const handleCreateRequest = useCallback((contactId: string) => {
    const payload = activeContact?.contactId === contactId ? activeContact : { contactId };
    setPreRequestPayload(payload);
    setPendingRequestModal({ type: 'create', contactId });
    setActiveContact(null);
  }, [activeContact]);

  const handleCancelCreateRequest = useCallback(() => {
    const toReopen = preRequestPayload;
    setCreatingRequestForContactId(null);
    setPendingRequestModal(null);
    setPreRequestPayload(null);
    if (toReopen) {
      setActiveContact(toReopen);
    }
  }, [preRequestPayload]);

  const handleEditRequest = useCallback((requestId: string) => {
    const contactId = store.data.requests.find((r) => r.id === requestId)?.contactId;
    if (!contactId) return;
    const payload = activeContact?.contactId === contactId ? activeContact : { contactId, requestId };
    setPreRequestPayload(payload);
    setPendingRequestModal({ type: 'edit', requestId });
    setActiveContact(null);
  }, [store.data.requests, activeContact]);

  const handleCancelEditRequest = useCallback(() => {
    const toReopen = preRequestPayload;
    setEditingRequestId(null);
    setPendingRequestModal(null);
    setPreRequestPayload(null);
    if (toReopen) {
      setActiveContact(toReopen);
    }
  }, [preRequestPayload]);

  const handleArchiveRequest = useCallback((requestId: string) => {
    const contactId = store.data.requests.find((r) => r.id === requestId)?.contactId;
    if (!contactId) return;
    const payload = activeContact?.contactId === contactId ? activeContact : { contactId, requestId };
    setPreRequestPayload(payload);
    setPendingRequestModal({ type: 'archive', requestId });
    setActiveContact(null);
  }, [store.data.requests, activeContact]);

  const handleCancelArchiveRequest = useCallback(() => {
    const toReopen = preRequestPayload;
    setArchivingRequestId(null);
    setPendingRequestModal(null);
    setPreRequestPayload(null);
    if (toReopen) {
      setActiveContact(toReopen);
    }
  }, [preRequestPayload]);

  const handleCreateRequestAction = useCallback((requestId: string) => {
    const contactId = store.data.requests.find((r) => r.id === requestId)?.contactId;
    if (!contactId) return;
    const payload = activeContact?.contactId === contactId ? activeContact : { contactId, requestId };
    setPreRequestPayload(payload);
    setPendingRequestModal({ type: 'action', requestId });
    setActiveContact(null);
  }, [store.data.requests, activeContact]);

  const handleCancelCreateRequestAction = useCallback(() => {
    const toReopen = preRequestPayload;
    setCreatingRequestActionForRequestId(null);
    setPendingRequestModal(null);
    setPreRequestPayload(null);
    if (toReopen) {
      setActiveContact(toReopen);
    }
  }, [preRequestPayload]);

  const handleEditRequestAction = useCallback((requestId: string) => {
    const contactId = store.data.requests.find((r) => r.id === requestId)?.contactId;
    if (!contactId) return;
    const payload = activeContact?.contactId === contactId ? activeContact : { contactId, requestId };
    setPreRequestPayload(payload);
    setPendingRequestModal({ type: 'action-edit', requestId });
    setActiveContact(null);
  }, [store.data.requests, activeContact]);

  const handleCancelEditRequestAction = useCallback(() => {
    const toReopen = preRequestPayload;
    setEditingRequestActionForRequestId(null);
    setPendingRequestModal(null);
    setPreRequestPayload(null);
    if (toReopen) setActiveContact(toReopen);
  }, [preRequestPayload]);

  const handleCreateMission = useCallback((requestId: string) => {
    const contactId = store.data.requests.find((r) => r.id === requestId)?.contactId;
    if (!contactId) return;
    const payload = activeContact?.contactId === contactId ? activeContact : { contactId, requestId };
    setPreRequestPayload(payload);
    setPendingRequestModal({ type: 'mission-create', requestId });
    setActiveContact(null);
  }, [store.data.requests, activeContact]);

  const handleCancelCreateMission = useCallback(() => {
    const toReopen = preRequestPayload;
    setCreatingMissionRequestId(null);
    setPendingRequestModal(null);
    setPreRequestPayload(null);
    if (toReopen) {
      setActiveContact(toReopen);
    }
  }, [preRequestPayload]);

  const handleEditMission = useCallback((missionId: string) => {
    const mission = store.data.missions.find((item) => item.id === missionId);
    if (!mission) return;
    if (activeContact) {
      const payload = activeContact.contactId === mission.contactId
        ? activeContact
        : { contactId: mission.contactId };
      setPreRequestPayload(payload);
      setPendingRequestModal({ type: 'mission-edit', missionId });
      setActiveContact(null);
      return;
    }
    setEditingMissionId(missionId);
  }, [store.data.missions, activeContact]);

  const handleCancelEditMission = useCallback(() => {
    const toReopen = preRequestPayload;
    setEditingMissionId(null);
    setPendingRequestModal(null);
    setPreRequestPayload(null);
    if (toReopen) setActiveContact(toReopen);
  }, [preRequestPayload]);

  const handleCreateExchange = useCallback((requestId: string) => {
    const contactId = store.data.requests.find((r) => r.id === requestId)?.contactId;
    if (!contactId) return;
    const payload = activeContact?.contactId === contactId ? activeContact : { contactId, requestId };
    setPreRequestPayload(payload);
    setPendingRequestModal({ type: 'exchange-create', requestId });
    setActiveContact(null);
  }, [store.data.requests, activeContact]);

  const handleCancelCreateExchange = useCallback(() => {
    const toReopen = preRequestPayload;
    setCreatingExchangeRequestId(null);
    setPendingRequestModal(null);
    setPreRequestPayload(null);
    if (toReopen) {
      setActiveContact(toReopen);
    }
  }, [preRequestPayload]);

  const handleArchivedRequest = useCallback(() => {
    setArchivingRequestId(null);
    setActiveContact(null);
    setPreRequestPayload(null);
  }, []);

  return (
    <AppShell>
      {store.data.loading ? (
        <DataLoadingFallback />
      ) : store.data.error ? (
        <DataErrorFallback
          message={store.data.error}
          onRetry={() => { void store.data.reload(); }}
        />
      ) : (
        <>
          {store.nav.active === 'dashboard' && (
            <DashboardPage
              onOpenContact={handleOpenContact}
              activeContactId={activeContact?.contactId ?? null}
            />
          )}
          {store.nav.active === 'contacts' && (
            <ContactsPage
              onOpenContact={handleOpenContact}
              activeContactId={activeContact?.contactId ?? null}
              onOpenCreate={handleOpenCreate}
            />
          )}
          {store.nav.active === 'requests' && (
            <RequestsPage onOpenContact={handleOpenContact} />
          )}
          {store.nav.active === 'missions' && (
            <MissionsPage onOpenContact={handleOpenContact} onEditMission={handleEditMission} />
          )}
          {store.nav.active === 'settings' && <SettingsPage />}
          <ContactCardModal
            contactId={activeContact?.contactId ?? null}
            requestId={activeContact?.requestId}
            onClose={handleCloseContact}
            onExitComplete={handleContactCardExitComplete}
            onEdit={handleEdit}
            onArchive={handleArchive}
            onCreateRequest={handleCreateRequest}
            onEditRequest={handleEditRequest}
            onArchiveRequest={handleArchiveRequest}
            onCreateRequestAction={handleCreateRequestAction}
            onEditRequestAction={handleEditRequestAction}
            onCreateMission={handleCreateMission}
            onEditMission={handleEditMission}
            onCreateExchange={handleCreateExchange}
          />
          <ContactCreateModal
            open={createOpen}
            onClose={handleCloseCreate}
          />
          <ContactEditModal
            contact={editingContact}
            onClose={handleCloseEdit}
          />
          <ArchiveConfirmation
            contact={archivingContact}
            onCancel={handleCancelArchive}
            onArchived={handleArchived}
          />
          <RequestCreateModal
            contact={creatingRequestForContactId ? store.data.contacts.find((c) => c.id === creatingRequestForContactId) ?? null : null}
            onClose={handleCancelCreateRequest}
          />
          <RequestEditModal
            requestId={editingRequestId}
            onClose={handleCancelEditRequest}
          />
          <RequestArchiveConfirmation
            requestId={archivingRequestId}
            onClose={handleCancelArchiveRequest}
            onSuccess={handleArchivedRequest}
          />
          <RequestActionCreateModal
            requestId={creatingRequestActionForRequestId}
            onClose={handleCancelCreateRequestAction}
          />
          <RequestActionCreateModal
            requestId={editingRequestActionForRequestId}
            actionId={editingRequestActionForRequestId ? store.data.requests.find((r) => r.id === editingRequestActionForRequestId)?.nextAction?.id : null}
            onClose={handleCancelEditRequestAction}
          />
          <MissionCreateModal
            contactId={creatingMissionRequestId ? (store.data.requests.find((r) => r.id === creatingMissionRequestId)?.contactId ?? null) : null}
            requestId={creatingMissionRequestId}
            onClose={handleCancelCreateMission}
          />
          <MissionEditModal
            missionId={editingMissionId}
            onClose={handleCancelEditMission}
          />
          <ExchangeCreateModal
            requestId={creatingExchangeRequestId}
            onClose={handleCancelCreateExchange}
          />
        </>
      )}
    </AppShell>
  );
}

function AuthErrorFallback({ message }: { message: string }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-12 text-slate-700 bg-bg-base">
      <div
        role="alert"
        aria-live="assertive"
        className="mx-auto w-full max-w-md rounded-2xl bg-bg-surface/70 border border-brand-violet/20 p-6 shadow-2xl shadow-slate-900/25"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-brand-coral/15 border border-brand-coral/20 flex items-center justify-center" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-brand-coral">
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-semibold text-slate-900 text-lg leading-tight">
              Configuration d&rsquo;authentification indisponible
            </h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AuthGate : orchestre le flux d'authentification.
 * AppStoreProvider n'est monté QUE si l'utilisateur est authentifié (session présente).
 * LoginPage est rendue en l'absence de session SAUF si Supabase est mal configuré.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (auth.loading) {
    return <AuthLoadingFallback />;
  }
  if (auth.error && !auth.session) {
    return <AuthErrorFallback message={auth.error} />;
  }
  if (!auth.session) {
    return <LoginPage />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppStoreProvider>
          <Router />
        </AppStoreProvider>
      </AuthGate>
    </AuthProvider>
  );
}

export { AuthGate, Router };
