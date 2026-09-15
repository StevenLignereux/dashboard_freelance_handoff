import { ContactsSection } from '../components/contact/ContactsSection';

interface ContactsPageProps {
  onOpenContact: (contactId: string | { contactId: string; requestId?: string }) => void;
  activeContactId: string | null;
  onOpenCreate?: () => void;
}

export function ContactsPage({ onOpenContact, activeContactId, onOpenCreate }: ContactsPageProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-[1600px] mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl tracking-tight">
            Contacts
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Vos relations, de la première prise de contact aux missions en cours.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="btn-primary !py-2.5 !px-4 text-sm inline-flex items-center gap-2 self-start md:self-end"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau contact
        </button>
      </header>
      <ContactsSection
        onOpenContact={onOpenContact}
        activeContactId={activeContactId}
        onOpenCreate={onOpenCreate}
      />
    </div>
  );
}
