import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore, useReducedMotion } from '../../store/AppStore';
import type { ExchangeType } from '../../types';

interface ExchangeCreateModalProps {
  requestId: string | null;
  onClose: () => void;
}

const EXCHANGE_TYPE_OPTIONS: { value: ExchangeType; label: string }[] = [
  { value: 'appel', label: 'Appel' },
  { value: 'email', label: 'Email' },
  { value: 'message', label: 'Message' },
  { value: 'rencontre', label: 'Rencontre' },
  { value: 'note', label: 'Note' },
];

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

function nowLocalISO(): string {
  const date = new Date();
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function ExchangeCreateModal({ requestId, onClose }: ExchangeCreateModalProps) {
  const store = useAppStore();
  const reduced = useReducedMotion();
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyInert = useRef<Element[]>([]);

  const request = requestId ? store.data.requests.find((r) => r.id === requestId) : null;
  const canOpen = !!request && !request.archived;

  const [type, setType] = useState<ExchangeType>('appel');
  const [date, setDate] = useState<string>('');
  const [summary, setSummary] = useState('');
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isOpen = canOpen;

  const requestClose = useCallback(() => {
    if (pending) return;
    onClose();
  }, [pending, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setType('appel');
    setDate(nowLocalISO());
    setSummary('');
    setPending(false);
    setSubmitError(null);
  }, [isOpen, requestId]);

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

  if (!request || !canOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (summary.trim().length === 0 || !date || !requestId) return;
    setPending(true);
    setSubmitError(null);
    try {
      await store.data.createExchange({
        requestId,
        type,
        date: new Date(date).toISOString(),
        summary: summary.trim(),
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'enregistrement de l\'échange.';
      setSubmitError(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          key={`exchange-create-backdrop-${request.id}`}
          className="absolute inset-0 bg-slate-900/55 backdrop-blur-md"
          onClick={requestClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.15 : 0.25 }}
          aria-hidden="true"
        />
        <motion.aside
          key={`exchange-create-panel-${request.id}`}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Ajouter un échange"
          tabIndex={-1}
          className="relative z-10 w-full max-w-lg rounded-3xl surface backdrop-blur-xl p-6 sm:p-7
            ring-1 ring-brand-violet/20 shadow-[0_60px_120px_-20px_rgba(15,23,42,0.25),0_20px_60px_-10px_rgba(124,92,255,0.15)]"
          initial={reduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="font-display font-bold text-slate-900 text-2xl leading-tight">
                Ajouter un échange
              </h2>
              <div className="mt-2 text-sm text-slate-500">
                Demande{' '}
                <span className="text-slate-800 font-medium">{request.title}</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block">
                  <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                    Type
                  </span>
                  <select
                    className="input w-full mt-1"
                    value={type}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => { setType(e.target.value as ExchangeType); }}
                  >
                    {EXCHANGE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label className="block">
                  <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                    Date et heure
                  </span>
                  <input
                    name="date"
                    type="datetime-local"
                    className="input w-full mt-1"
                    value={date}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => { setDate(e.target.value); }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block">
                <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                  Résumé <span className="text-brand-coral">*</span>
                </span>
                <textarea
                  required
                  data-focus-init
                  name="summary"
                  rows={3}
                  className="input w-full mt-1"
                  value={summary}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setSummary(e.target.value); }}
                  placeholder="Ex: Appel de 15mn, intéressé par la refonte du site, à relancer J+3."
                />
              </label>
            </div>

            {submitError && (
              <div role="alert" className="alert-error">
                {submitError}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end pt-2">
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
                disabled={pending || summary.trim().length === 0 || !date || !requestId}
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
