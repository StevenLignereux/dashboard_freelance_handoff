import { useEffect, useRef, useState, type MouseEvent, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import type { Contact, Request } from '../../types';
import { useReducedMotion } from '../../store/AppStore';
import { TradingCard } from './TradingCard';

interface ContactCardProps {
  contact: Contact;
  activeRequest?: Request;
  isActive?: boolean;
  onOpen: (contactId: string) => void;
}

const TILT_MAX = 5;

export function ContactCard({
  contact,
  activeRequest,
  isActive = false,
  onOpen,
}: ContactCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pressedRef = useRef(false);
  const hoveredRef = useRef(false);
  const [, forceRender] = useState(0);

  const apply = () => {
    const inner = innerRef.current;
    const next = pendingRef.current;
    if (!inner || !next) {
      pendingRef.current = null;
      rafRef.current = null;
      return;
    }
    const tiltClampX = Math.max(-TILT_MAX, Math.min(TILT_MAX, next.x));
    const tiltClampY = Math.max(-TILT_MAX, Math.min(TILT_MAX, next.y));
    inner.style.setProperty('--tilt-x', `${tiltClampX.toFixed(2)}deg`);
    inner.style.setProperty('--tilt-y', `${tiltClampY.toFixed(2)}deg`);
    inner.style.setProperty('--foil-x', `${next.px.toFixed(1)}%`);
    inner.style.setProperty('--foil-y', `${next.py.toFixed(1)}%`);
    inner.style.setProperty('--hl-px', `${next.px.toFixed(1)}%`);
    inner.style.setProperty('--hl-py', `${next.py.toFixed(1)}%`);
    inner.style.setProperty(
      '--hl-angle',
      `${(Math.atan2(next.py - 50, next.px - 50) * 180) / Math.PI + 90}deg`
    );

    const scale = pressedRef.current ? 'scale(0.975)' : hoveredRef.current ? 'scale(1.03)' : 'scale(1)';

    if (reduced) {
      inner.style.transform = scale;
    } else {
      inner.style.transform = `perspective(1000px) rotateX(${tiltClampX.toFixed(2)}deg) rotateY(${(-tiltClampY).toFixed(2)}deg) ${scale} translateZ(0)`;
    }

    const halo = inner.querySelector<HTMLElement>(':scope > .card-halo');
    const hl = inner.querySelector<HTMLElement>(':scope > .card-highlight');
    if (halo) halo.style.opacity = hoveredRef.current ? '1' : '0';
    if (hl) hl.style.opacity = hoveredRef.current ? '1' : '0';

    pendingRef.current = null;
    rafRef.current = null;
  };

  const schedule = (x: number, y: number, px: number, py: number) => {
    pendingRef.current = { x, y, px, py };
    rafRef.current ??= window.requestAnimationFrame(apply);
  };

  const reset = () => {
    hoveredRef.current = false;
    pressedRef.current = false;
    pendingRef.current = { x: 0, y: 0, px: 50, py: 50 };
    rafRef.current ??= window.requestAnimationFrame(apply);
    forceRender((n) => (n + 1) % 1_000_000);
  };

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const rotateY = ((px - 50) / 50) * TILT_MAX;
    const rotateX = ((50 - py) / 50) * TILT_MAX;
    schedule(rotateX, rotateY, px, py);
  };

  const press = (v: boolean) => {
    pressedRef.current = v;
    const next = pendingRef.current ?? { x: 0, y: 0, px: 50, py: 50 };
    schedule(next.x, next.y, next.px, next.py);
  };

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(contact.id);
    }
  };

  const hoverStart = () => {
    hoveredRef.current = true;
    const next = pendingRef.current ?? { x: 0, y: 0, px: 50, py: 50 };
    schedule(next.x, next.y, next.px, next.py);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={() => {
        onOpen(contact.id);
      }}
      onMouseEnter={hoverStart}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      onMouseDown={() => { press(true); }}
      onMouseUp={() => { press(false); }}
      onBlur={reset}
      onKeyDown={handleKey}
      whileTap={reduced ? { scale: 0.98 } : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      aria-label={`Ouvrir la fiche de ${contact.firstName} ${contact.lastName}`}
      className={[
        'group relative text-left w-full max-w-[280px] mx-auto block p-0 bg-transparent border-0',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/60 rounded-[1.75rem]',
        isActive ? 'ring-2 ring-offset-4 ring-offset-bg ring-brand-violet/60' : '',
      ].join(' ')}
    >
      <div
        ref={innerRef}
        style={{
          transformOrigin: '50% 50%',
          transformStyle: 'preserve-3d',
        }}
        className={[
          'h-full w-full rounded-2xl [transition:transform_300ms_cubic-bezier(0.2,0.8,0.2,1),filter_300ms_ease]',
          hoveredRef.current
            ? '[filter:drop-shadow(0_30px_40px_rgba(124,92,255,0.18))]'
            : '[filter:drop-shadow(0_10px_20px_rgba(0,0,0,0.25))]',
        ].join(' ')}
      >
        <TradingCard
          layoutId={`card-${contact.id}`}
          contact={contact}
          activeRequest={activeRequest}
          size="sm"
          staticMode
        />
      </div>
    </motion.button>
  );
}
