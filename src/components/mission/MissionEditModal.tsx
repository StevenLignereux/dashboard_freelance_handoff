import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore, useReducedMotion } from '../../store/AppStore';
import type { Mission, MissionStatus } from '../../types';

interface MissionEditModalProps {
  missionId: string | null;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: MissionStatus; label: string }[] = [
  { value: 'a_demarrer', label: 'À démarrer' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'terminee', label: 'Terminée' },
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

export function MissionEditModal({ missionId, onClose }: MissionEditModalProps) {
  const store = useAppStore();
  const reduced = useReducedMotion();
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyInert = useRef<Element[]>([]);

  const mission: Mission | undefined = useMemo(
    () => store.data.missions.find((m) => m.id === missionId) ?? undefined,
    [store.data.missions, missionId]
  );

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<MissionStatus>('a_demarrer');
  const [progress, setProgress] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [completePending, setCompletePending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isOpen = !!mission;

  const requestClose = useCallback(() => {
    if (pending || completePending) return;
    onClose();
  }, [pending, completePending, onClose]);

  useEffect(() => {
    if (!mission) return;
    setTitle(mission.title);
    setStatus(mission.status);
    setProgress(mission.progress ?? 0);
    setNotes(mission.notes ?? '');
    setPending(false);
    setCompletePending(false);
    setSubmitError(null);
  }, [mission?.id, mission?.title, mission?.status, mission?.progress, mission?.notes]);

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

  if (!mission) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length === 0) return;
    setPending(true);
    setSubmitError(null);
    try {
      await store.data.updateMission(mission.id, {
        title: title.trim(),
        status,
        progress,
        notes: notes.trim().length > 0 ? notes.trim() : null,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setSubmitError(message);
    } finally {
      setPending(false);
    }
  };

  const handleMarkComplete = async () => {
    setCompletePending(true);
    setSubmitError(null);
    try {
      await store.data.updateMission(mission.id, {
        status: 'terminee',
        progress: 100,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setSubmitError(message);
    } finally {
      setCompletePending(false);
    }
  };

  const isAlreadyTerminee = mission.status === 'terminee';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          key="mission-edit-backdrop"
          className="absolute inset-0 bg-slate-900/55 backdrop-blur-md"
          onClick={requestClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.15 : 0.25 }}
          aria-hidden="true"
        />

        <motion.aside
          key="mission-edit-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Modifier une mission"
          tabIndex={-1}
          className="relative z-10 w-full max-w-2xl rounded-3xl surface backdrop-blur-xl p-6 sm:p-8
            ring-1 ring-brand-violet/20 shadow-[0_60px_120px_-20px_rgba(15,23,42,0.25),0_20px_60px_-10px_rgba(124,92,255,0.15)]"
          initial={reduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="font-display font-bold text-slate-900 text-2xl leading-tight">
                Modifier la mission
              </h2>
              <div className="mt-2 text-sm text-slate-500">
                Mettez à jour les informations de la mission.
              </div>
            </div>

            <div>
              <label className="block">
                <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
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

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block">
                  <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                    Statut
                  </span>
                  <select
                    className="input w-full mt-1"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value as MissionStatus); }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label className="block">
                  <span className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                    Progression
                    <span className="text-slate-700 font-display font-bold tabular-nums">{progress}%</span>
                  </span>
                  <input
                    name="progress"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progress}
                    onChange={(e) => { setProgress(parseInt(e.target.value, 10)); }}
                    className="mt-3 w-full accent-brand-violet"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block">
                <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                  Notes (facultatif)
                </span>
                <textarea
                  rows={3}
                  className="input w-full mt-1"
                  value={notes}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setNotes(e.target.value); }}
                />
              </label>
            </div>

            {submitError && (
              <div role="alert" className="text-sm p-3 rounded-xl bg-brand-coral/10 ring-1 ring-brand-coral/20 text-brand-coral">
                {submitError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center pt-2">
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={pending || completePending || isAlreadyTerminee}
                className="btn-ghost ring-1 ring-brand-green/30 text-brand-green hover:bg-brand-green/10 hover:text-brand-green"
              >
                {completePending ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Marquage…
                  </>
                ) : isAlreadyTerminee ? 'Mission terminée' : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Marquer terminée
                  </>
                )}
              </button>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={requestClose}
                  className="btn-ghost"
                  disabled={pending || completePending}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={pending || completePending || title.trim().length === 0}
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
            </div>
          </form>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
