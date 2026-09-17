import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/AppStore';
import type { Contact, RelationshipType } from '../../types';
import { relationshipMeta } from '../../tokens/design-tokens';

interface ContactEditModalProps {
  contact: Contact | null;
  onClose: () => void;
}

const REL_OPTIONS: RelationshipType[] = [
  'prospect',
  'client',
  'client_recurrent',
  'ancien_client',
];

const INPUT_CLASS =
  'w-full h-10 px-3.5 rounded-xl bg-bg-surface/80 border border-brand-violet/20 text-sm text-slate-800 placeholder:text-slate-400 caret-brand-violet ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-brand-violet/50 ' +
  'transition-all duration-150 shadow-[inset_0_1px_0_rgba(124,92,255,0.04)]';

const TEXTAREA_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl bg-bg-surface/80 border border-brand-violet/20 text-sm text-slate-800 placeholder:text-slate-400 caret-brand-violet ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-brand-violet/50 ' +
  'transition-all duration-150 shadow-[inset_0_1px_0_rgba(124,92,255,0.04)]';

export function ContactEditModal({ contact, onClose }: ContactEditModalProps) {
  const store = useAppStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('prospect');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previouslyInert = useRef<Element[]>([]);
  const firstNameRef = useRef<HTMLInputElement | null>(null);

  const open = !!contact;

  useEffect(() => {
    if (!contact) return;
    setFirstName(contact.firstName);
    setLastName(contact.lastName);
    setCompany(contact.company ?? '');
    setEmail(contact.email ?? '');
    setPhone(contact.phone ?? '');
    setNotes(contact.notes ?? '');
    setRelationship(contact.relationship);
    setIsSubmitting(false);
    setSubmitError(null);
  }, [contact]);

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const roots: Element[] = [];
    document.querySelectorAll<HTMLElement>('body > *').forEach((el) => {
      if (el.contains(modalRef.current)) return;
      if (el.getAttribute('aria-hidden') !== 'true' && el.getAttribute('inert') === null) {
        el.setAttribute('data-inert-modal-saved', '1');
        el.setAttribute('aria-hidden', 'true');
        (el).inert = true;
        roots.push(el);
      }
    });
    previouslyInert.current = roots;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      firstNameRef.current?.focus({ preventScroll: true });
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const sel = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');
      const focusables = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(sel)
      ).filter((el) => el.getAttribute('aria-hidden') !== 'true');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = '';
      previouslyInert.current.forEach((el) => {
        el.removeAttribute('data-inert-modal-saved');
        el.removeAttribute('aria-hidden');
        (el as HTMLElement).inert = false;
      });
      previouslyInert.current = [];
      if (lastFocusedRef.current) {
        lastFocusedRef.current.focus({ preventScroll: true });
      }
    };
  }, [open, onClose]);

  if (!contact) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await store.data.updateContact(contact.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        relationship,
      });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Une erreur est survenue.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Modifier ${contact.firstName} ${contact.lastName}`}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className="relative w-full sm:max-w-lg bg-bg sm:rounded-2xl border border-brand-violet/20 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.53)] animate-slideInRight sm:animate-fadeIn flex flex-col max-h-[90vh] overflow-hidden"
        tabIndex={-1}
      >
        <header className="px-5 py-4 border-b border-brand-violet/10 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-cyan to-brand-violet flex items-center justify-center shadow-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-bold text-slate-900 text-lg leading-tight">
              Modifier le contact
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {contact.firstName} {contact.lastName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="btn-ghost !p-2 hover:bg-brand-violet/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Prénom" required>
                <input
                  ref={firstNameRef}
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); }}
                  required
                  className={INPUT_CLASS}
                  placeholder="Camille"
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Nom" required>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); }}
                  required
                  className={INPUT_CLASS}
                  placeholder="Robert"
                  autoComplete="family-name"
                />
              </Field>
            </div>
            <Field label="Entreprise">
              <input
                type="text"
                value={company}
                onChange={(e) => { setCompany(e.target.value); }}
                className={INPUT_CLASS}
                placeholder="Studio Bloom"
                autoComplete="organization"
              />
            </Field>
            <Field label="Type de relation">
              <div className="flex flex-wrap gap-2">
                {REL_OPTIONS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { setRelationship(k); }}
                    aria-pressed={relationship === k}
                    className={`btn-toggle ${relationship === k ? 'btn-toggle-active' : ''}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${relationshipMeta[k].dotColor}`}
                      aria-hidden="true"
                    />
                    {relationshipMeta[k].label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); }}
                  className={INPUT_CLASS}
                  placeholder="camille@studio.fr"
                  autoComplete="email"
                />
              </Field>
              <Field label="Téléphone">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); }}
                  className={INPUT_CLASS}
                  placeholder="+33 6 00 00 00 00"
                  autoComplete="tel"
                />
              </Field>
            </div>
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); }}
                rows={3}
                className={`${TEXTAREA_CLASS} resize-none`}
                placeholder="Premières impressions, budget estimé, contexte…"
              />
            </Field>
            {submitError && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-xl border border-brand-coral/25 bg-brand-coral/10 px-3.5 py-2.5 text-xs text-brand-coral"
              >
                Erreur : {submitError}
              </div>
            )}
          </div>

          <footer className="px-5 py-4 border-t border-brand-violet/10 flex items-center justify-end gap-2 bg-bg-surface/40 backdrop-blur shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost !py-2 !px-3.5"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary !py-2 !px-3.5 inline-flex items-center gap-2"
              disabled={!firstName.trim() || !lastName.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Enregistrement…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Enregistrer
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
        {label}
        {required && <span className="text-brand-coral">*</span>}
      </span>
      {children}
    </label>
  );
}
