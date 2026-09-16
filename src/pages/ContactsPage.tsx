import { ContactsSection } from '../components/contact/ContactsSection';

interface ContactsPageProps {
  onOpenContact: (contactId: string | { contactId: string; requestId?: string }) => void;
  activeContactId: string | null;
  onOpenCreate?: () => void;
}

export function ContactsPage({ onOpenContact, activeContactId, onOpenCreate }: ContactsPageProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-[1600px] mx-auto space-y-6">
      <header>
        <div>
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl tracking-tight">
            Contacts
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Vos relations, de la première prise de contact aux missions en cours.
          </p>
        </div>
      </header>
      <ContactsSection
        onOpenContact={onOpenContact}
        activeContactId={activeContactId}
        onOpenCreate={onOpenCreate}
      />
    </div>
  );
}
