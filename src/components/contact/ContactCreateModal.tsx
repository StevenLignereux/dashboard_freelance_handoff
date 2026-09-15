import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../../store/AppStore';
import type { RelationshipType } from '../../types';
import { relationshipMeta } from '../../tokens/design-tokens';

interface ContactCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const REL_OPTIONS: RelationshipType[] = [
  'prospect',
  'client',
  'client_recurrent',
  'ancien_client',
];

const INPUT_CLASS =
  'w-full h-10 px-3.5 rounded-xl bg-bg-surface/80 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 caret-brand-violet ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-brand-violet/50 ' +
  'transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

const TEXTAREA_CLASS =
  'w-full px-3.5 py-2.5 rounded-xl bg-bg-surface/80 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 caret-brand-violet ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-brand-violet/50 ' +
  'transition-all duration-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

export function ContactCreateModal({ open, onClose }: ContactCreateModalProps) {
  const store = useAppStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('prospect');
  const [submitted, setSubmitted] = useState<null | { name: string }>(null);

  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previouslyInert = useRef<Element[]>([]);
  const firstNameRef = useRef<HTMLInputElement | null>(null);

  const reset = useCallback(() => {
    setFirstName('');
    setLastName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setNotes('');
    setRelationship('prospect');
    setSubmitted(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    reset();
  }, [open, reset]);

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

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    const created = store.data.addContact({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      relationship,
    });
    setSubmitted({ name: `${created.firstName} ${created.lastName}` });
    window.setTimeout(() => { onClose(); }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nouveau contact"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className="relative w-full sm:max-w-lg bg-bg sm:rounded-2xl border border-white/10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)] animate-slideInRight sm:animate-fadeIn flex flex-col max-h-[90vh] overflow-hidden"
        tabIndex={-1}
      >
        <header className="px-5 py-4 border-b border-white/5 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-violet to-brand-cyan flex items-center justify-center shadow-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-bold text-white text-lg leading-tight">
              Nouveau contact
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ajouter une personne dans ton réseau (en mémoire).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="btn-ghost !p-2 hover:bg-white/10"
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
          </div>

          <footer className="px-5 py-4 border-t border-white/5 flex items-center justify-end gap-2 bg-bg-surface/40 backdrop-blur shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost !py-2 !px-3.5"
              disabled={!!submitted}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary !py-2 !px-3.5 inline-flex items-center gap-2"
              disabled={!firstName.trim() || !lastName.trim() || !!submitted}
            >
              {submitted ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {submitted.name} ajouté
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Créer le contact
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
      <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
        {label}
        {required && <span className="text-brand-coral">*</span>}
      </span>
      {children}
    </label>
  );
}
