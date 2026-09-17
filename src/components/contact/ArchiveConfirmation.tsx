import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../../store/AppStore';
import type { Contact } from '../../types';

interface ArchiveConfirmationProps {
  contact: Contact | null;
  onCancel: () => void;
  onArchived: () => void;
}

export function ArchiveConfirmation({ contact, onCancel, onArchived }: ArchiveConfirmationProps) {
  const store = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previouslyInert = useRef<Element[]>([]);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  const open = !!contact;

  useEffect(() => {
    if (!open) return;
    setIsSubmitting(false);
    setSubmitError(null);
  }, [open]);

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
      confirmRef.current?.focus({ preventScroll: true });
    }, 30);

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
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
  }, [open, onCancel]);

  const handleConfirm = useCallback(async () => {
    if (isSubmitting) return;
    if (!contact) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await store.data.archiveContact(contact.id);
      onArchived();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Une erreur est survenue.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, contact, store.data, onArchived]);

  const handleCancel = useCallback(() => {
    if (isSubmitting) return;
    onCancel();
  }, [isSubmitting, onCancel]);

  if (!contact) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="archive-title"
      aria-describedby="archive-desc"
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        className="relative w-full sm:max-w-md bg-bg sm:rounded-2xl border border-brand-violet/20 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.53)] animate-slideInRight sm:animate-fadeIn"
        tabIndex={-1}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-coral/15 ring-1 ring-brand-coral/25 flex items-center justify-center" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-brand-coral">
                <rect x="3" y="4" width="18" height="5" rx="1" />
                <path d="M5 4v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4" />
                <line x1="10" y1="9" x2="14" y2="9" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="archive-title" className="font-display font-bold text-slate-900 text-lg leading-tight">
                Archiver ce contact ?
              </h2>
              <p id="archive-desc" className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                <span className="text-slate-800 font-medium">{contact.firstName} {contact.lastName}</span>
                {' '}ne sera plus affiché dans la liste active. Les données sont conservées dans les archives.
              </p>
            </div>
          </div>

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

        <div className="px-5 py-4 border-t border-brand-violet/10 flex items-center justify-end gap-2 bg-bg-surface/40 backdrop-blur rounded-b-2xl sm:rounded-b-2xl">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-ghost !py-2 !px-3.5"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={handleConfirm}
            className="!bg-brand-coral/90 hover:!bg-brand-coral !text-white ring-1 ring-brand-coral/30 shadow-glow !py-2 !px-3.5 inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Archivage…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="3" y="4" width="18" height="5" rx="1" />
                  <path d="M5 4v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4" />
                  <line x1="10" y1="9" x2="14" y2="9" />
                </svg>
                Archiver
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
