import { useRef, useState, type MouseEvent, type KeyboardEvent } from 'react';
import type { Contact, Request } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { RelationshipBadge } from '../ui/RelationshipBadge';
import { NextActionView } from '../ui/NextActionView';
import { getInitials, useAvatarGradient } from '../../utils/formatting';
import { statusMeta } from '../../tokens/design-tokens';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface ContactCardProps {
  contact: Contact;
  activeRequest?: Request;
  isActive?: boolean;
  onOpen: (contactId: string) => void;
}

export function ContactCard({
  contact,
  activeRequest,
  isActive = false,
  onOpen,
}: ContactCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, posX: 50, posY: 50 });
  const [pressed, setPressed] = useState(false);

  const status = activeRequest?.status ?? 'sans_suite';
  const meta = statusMeta[status];
  const initials = getInitials(contact.firstName, contact.lastName);
  const gradient = useAvatarGradient(contact.avatarSeed);

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 6;
    const rotateX = (0.5 - py) * 6;
    setTilt({
      x: Math.max(-3, Math.min(3, rotateX)),
      y: Math.max(-3, Math.min(3, rotateY)),
      posX: px * 100,
      posY: py * 100,
    });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0, posX: 50, posY: 50 });

  const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(contact.id);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpen(contact.id)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setTilt((t) => ({ ...t }))}
      onMouseLeave={resetTilt}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onKeyDown={handleKey}
      aria-label={`Ouvrir la fiche de ${contact.firstName} ${contact.lastName}`}
      className={[
        'group relative text-left w-full aspect-[270/380] max-w-[280px] mx-auto',
        'focus:outline-none',
      ].join(' ')}
    >
      <div
        className={[
          'relative h-full w-full rounded-2xl overflow-hidden',
          'bg-bg-surface card-inner-glow',
          'border-2 transition-all duration-200 ease-snap will-change-transform',
          meta.borderColor,
          isActive
            ? 'ring-2 ring-offset-2 ring-offset-bg ' + meta.ringColor
            : 'hover:shadow-glow hover:[transform:translateZ(0)]',
        ].join(' ')}
        style={{
          transform: reduced
            ? pressed
              ? 'scale(0.985)'
              : undefined
            : `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${pressed ? 'scale(0.985)' : ''}`,
          ['--foil-pos' as string]: `${tilt.posX}% ${tilt.posY}%`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-300"
          aria-hidden="true"
          style={{
            background: `radial-gradient(60% 50% at 50% 0%, ${meta.color}22, transparent 70%)`,
          }}
        />

        <div className="card-foil absolute inset-0 rounded-2xl" aria-hidden="true" />

        <div className="relative h-full w-full p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <RelationshipBadge relationship={contact.relationship} withDot />
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: meta.color, boxShadow: `0 0 10px ${meta.color}` }}
              aria-hidden="true"
              title={meta.label}
            />
          </div>

          <div className="flex flex-col items-center text-center -mt-1">
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center ring-1 ring-white/10 shadow-card"
              style={gradient}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-30 mix-blend-overlay"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 40%)',
                }}
              />
              <div
                className="absolute inset-0 rounded-2xl"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22><filter id=%22n%22><feTurbulence baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/><feColorMatrix values=%220 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
                  mixBlendMode: 'overlay',
                }}
              />
              <span className="relative font-display font-bold text-white text-2xl tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
                {initials}
              </span>
            </div>

            <h3 className="mt-3 font-display font-bold text-white text-lg leading-tight">
              {contact.firstName} {contact.lastName}
            </h3>
            {contact.company && (
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-full px-2">
                {contact.company}
              </p>
            )}
          </div>

          <div className="divider" />

          <div className="space-y-2 min-h-0">
            {activeRequest ? (
              <>
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Demande
                  </div>
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {activeRequest.title}
                  </p>
                </div>

                <div>
                  <StatusBadge status={status} size="sm" />
                </div>

                {activeRequest.nextAction && (
                  <NextActionView action={activeRequest.nextAction} variant="standard" />
                )}
              </>
            ) : (
              <div className="text-xs text-slate-500 italic text-center py-3">
                Aucune demande active
              </div>
            )}
          </div>

          <div className="mt-auto">
            <div className="divider mb-3" />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="font-semibold tabular-nums text-slate-300">
                  {contact.totalRequests}
                </span>
                <span className="text-slate-500">
                  demande{contact.totalRequests > 1 ? 's' : ''}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
                <span className="font-semibold tabular-nums text-slate-300">
                  {contact.totalMissions}
                </span>
                <span className="text-slate-500">
                  mission{contact.totalMissions > 1 ? 's' : ''}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
