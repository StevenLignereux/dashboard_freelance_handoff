import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore, useReducedMotion } from '../../store/AppStore';
import type { Request } from '../../types';

interface RequestArchiveConfirmationProps {
  requestId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  const sel = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

export function RequestArchiveConfirmation({ requestId, onClose, onSuccess }: RequestArchiveConfirmationProps) {
  const store = useAppStore();
  const reduced = useReducedMotion();
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyInert = useRef<Element[]>([]);

  const request: Request | null = store.data.requests.find((r) => r.id === requestId) ?? null;

  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isOpen = !!request;

  const requestClose = useCallback(() => {
    if (pending) return;
    onClose();
  }, [pending, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setPending(false);
    setSubmitError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    lastFocusedRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const roots: Element[] = [];
    document.querySelectorAll<HTMLElement>('body > *').forEach((el) => {
      if (el.contains(panelRef.current)) return;
      const attr = el.getAttribute('aria-hidden');
      if (attr !== 'true' && el.getAttribute('inert') === null) {
        el.setAttribute('data-inert-saved', '1');
        el.setAttribute('aria-hidden', 'true');
        el.inert = true;
        roots.push(el);
      }
    });
    previouslyInert.current = roots;

    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      const focusables = panelRef.current ? getFocusable(panelRef.current) : [];
      const first = focusables.find((e) => e.dataset.focusInit !== undefined) ?? focusables[0];
      first.focus({ preventScroll: true });
    }, 40);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = getFocusable(panelRef.current).filter(
        (f) => f.offsetParent !== null || f.tagName === 'INPUT' || f.tagName === 'A'
      );
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
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyInert.current.forEach((el) => {
        el.removeAttribute('data-inert-saved');
        el.removeAttribute('aria-hidden');
        (el as HTMLElement).inert = false;
      });
      previouslyInert.current = [];
      if (lastFocusedRef.current) {
        lastFocusedRef.current.focus({ preventScroll: true });
      }
    };
  }, [isOpen, requestClose, onSuccess]);

  const handleConfirm = useCallback(async () => {
    if (pending) return;
    if (!requestId) return;
    setPending(true);
    setSubmitError(null);
    try {
      await store.data.archiveRequest(requestId);
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setSubmitError(message);
    } finally {
      setPending(false);
    }
  }, [pending, requestId, store.data, onClose, onSuccess]);

  const handleCancel = useCallback(() => {
    requestClose();
  }, [requestClose]);

  if (!request) return null;

  return (
    <AnimatePresence>
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            key={`backdrop-archive-${request.id}`}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={requestClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.3 }}
            aria-hidden="true"
          />

          <motion.aside
            key={`panel-archive-${request.id}`}
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirmer l'archivage"
            tabIndex={-1}
            className="relative z-10 w-full max-w-md rounded-3xl surface backdrop-blur-xl p-6 sm:p-6
              ring-1 ring-white/10 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.9),0_20px_60px_-10px_rgba(124,92,255,0.2)]"
            initial={reduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <div className="space-y-4">
              <h2 className="font-display font-bold text-white text-xl leading-tight">
                Archiver cette demande ?
              </h2>

              <p className="text-sm text-slate-300">
                <strong className="text-white font-semibold">{request.title}</strong>
              </p>

              <p className="text-sm text-slate-400 italic">
                Elle restera dans l'historique mais ne sera plus la demande active.
              </p>

              {submitError && (
                <div role="alert" className="alert-error">
                  {submitError}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-ghost"
                  disabled={pending}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="btn-danger !bg-brand-coral/90 hover:!bg-brand-coral !text-white ring-1 ring-brand-coral/30 shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={pending}
                  data-focus-init
                >
                  {pending ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Archivage…
                    </>
                  ) : (
                    'Archiver'
                  )}
                </button>
              </div>
            </div>
          </motion.aside>
        </div>
    </AnimatePresence>
  );
}
