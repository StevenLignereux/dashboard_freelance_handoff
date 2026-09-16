import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore, useReducedMotion } from '../../store/AppStore';
import type { Contact } from '../../types';

interface RequestEditModalProps {
  requestId: string | null;
  onClose: () => void;
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

export function RequestEditModal({ requestId, onClose }: RequestEditModalProps) {
  const store = useAppStore();
  const reduced = useReducedMotion();
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyInert = useRef<Element[]>([]);

  const request = requestId
    ? store.data.requests.find((r) => r.id === requestId) ?? null
    : null;
  const contact: Contact | null = request
    ? store.data.contacts.find((c) => c.id === request.contactId) ?? null
    : null;

  const [title, setTitle] = useState(request?.title ?? '');
  const [description, setDescription] = useState(request?.description ?? '');
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isOpen = !!request;

  const requestClose = useCallback(() => {
    if (pending) return;
    onClose();
  }, [pending, onClose]);

  useEffect(() => {
    if (!request) return;
    setTitle(request.title);
    setDescription(request.description ?? '');
    setPending(false);
    setSubmitError(null);
  }, [request?.id, request?.title, request?.description]);

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
  }, [isOpen, requestClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!request || !contact) return;
    if (title.trim().length === 0) return;
    setPending(true);
    setSubmitError(null);
    try {
      await store.data.updateRequest(request.id, {
        title: title.trim(),
        description: description.trim().length > 0 ? description.trim() : null,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setSubmitError(message);
    } finally {
      setPending(false);
    }
  };

  if (!request || !contact) return null;

  return (
    <AnimatePresence>
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            key={`backdrop-${request.id}`}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={requestClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.3 }}
            aria-hidden="true"
          />

          <motion.aside
            key={`panel-${request.id}`}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Modifier une demande"
            tabIndex={-1}
            className="relative z-10 w-full max-w-2xl rounded-3xl surface backdrop-blur-xl p-6 sm:p-8
              ring-1 ring-white/10 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.9),0_20px_60px_-10px_rgba(124,92,255,0.2)]"
            initial={reduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="font-display font-bold text-white text-2xl leading-tight">
                Modifier la demande
              </h2>

              <div className="text-sm text-slate-400">
                Pour le contact{' '}
                <span className="text-slate-200 font-medium">
                  {contact.firstName} {contact.lastName}
                  {contact.company ? ` · ${contact.company}` : ''}
                </span>
              </div>

              <div>
                <label className="block">
                  <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                    Titre <span className="text-brand-coral">*</span>
                  </span>
                  <input
                    required
                    data-focus-init
                    name="title"
                    type="text"
                    className="input w-full mt-1"
                    value={title}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => { setTitle(e.target.value); }}
                  />
                </label>
              </div>

              <div>
                <label className="block">
                  <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                    Description
                  </span>
                  <textarea
                    rows={4}
                    className="input w-full mt-1"
                    value={description}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setDescription(e.target.value); }}
                  />
                </label>
              </div>

              {submitError && (
                <div role="alert" className="alert-error">
                  {submitError}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={requestClose}
                  className="btn-ghost"
                  disabled={pending}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={pending || title.trim().length === 0}
                >
                  {pending ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Enregistrement…
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              </div>
            </form>
          </motion.aside>
        </div>
    </AnimatePresence>
  );
}
