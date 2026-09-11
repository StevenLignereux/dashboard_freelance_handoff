import { motion } from 'framer-motion';
import type { Contact, Request } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { RelationshipBadge } from '../ui/RelationshipBadge';
import { NextActionView } from '../ui/NextActionView';
import { getInitials, useAvatarGradient } from '../../utils/formatting';
import { statusMeta } from '../../tokens/design-tokens';
import { useReducedMotion } from '../../store/AppStore';

export type TradingCardSize = 'sm' | 'lg';

interface TradingCardProps {
  contact: Contact;
  activeRequest?: Request;
  size?: TradingCardSize;
  /** Utilisé par framer-motion pour la shared-element transition */
  layoutId?: string;
  /** État hover (cursor) pour size=lg où c'est une carte d'affichage */
  staticMode?: boolean;
}

export function TradingCard({
  contact,
  activeRequest,
  size = 'sm',
  layoutId,
  staticMode = false,
}: TradingCardProps) {
  const reduced = useReducedMotion();
  const status = activeRequest?.status ?? 'sans_suite';
  const meta = statusMeta[status];
  const initials = getInitials(contact.firstName, contact.lastName);
  const gradient = useAvatarGradient(contact.avatarSeed);

  const haloColor = meta.color;
  const dense = size === 'lg';

  const pad = dense ? 'p-5' : 'p-4';
  const avatar = dense
    ? 'w-24 h-24 rounded-3xl text-2xl'
    : 'w-20 h-20 rounded-2xl text-2xl';
  const h3 = dense ? 'text-xl' : 'text-lg';
  const company = dense ? 'text-[13px]' : 'text-xs';
  const gapY = dense ? 'gap-3' : 'gap-3';
  const border = dense ? 'border-[3px]' : 'border-2';

  return (
    <motion.div
      layoutId={layoutId ? `${layoutId}__card` : undefined}
      className={[
        'relative aspect-[270/380] w-full rounded-2xl overflow-hidden select-none',
        `bg-bg-surface ${border} shadow-card ${staticMode ? '' : 'will-change-transform'}`,
        'transition-colors duration-200',
        meta.borderColor,
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-60 transition-opacity duration-300"
        style={{
          padding: '1px',
          background: `linear-gradient(${reduced ? 135 : 'var(--hl-angle, 135deg)'} at ${reduced ? '30% 20%' : 'var(--hl-px, 30%)'} ${reduced ? '20%' : 'var(--hl-py, 20%)'}, rgba(255,255,255,0.22), rgba(255,255,255,0) 55%)`,
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[28%] opacity-0 transition-opacity duration-400 ease-out card-halo"
        style={{
          background: `radial-gradient(closest-side at 50% 50%, ${haloColor}33 0%, ${haloColor}11 35%, transparent 70%)`,
          filter: 'blur(18px)',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out card-highlight"
        style={{
          background: `radial-gradient(600px circle at ${reduced ? '30% 25%' : 'var(--hl-px, 50%)'} ${reduced ? '25%' : 'var(--hl-py, 50%)'}, rgba(255,255,255,0.08), transparent 40%)`,
          mixBlendMode: 'screen',
        }}
      />

      <div
        aria-hidden="true"
        className="card-foil pointer-events-none absolute inset-0 rounded-2xl opacity-75"
        style={{
          backgroundPosition: reduced
            ? '50% 50%'
            : 'var(--foil-x, 50%) var(--foil-y, 50%)',
        }}
      />

      <motion.div
        layoutId={layoutId ? `${layoutId}__content` : undefined}
        className={`relative h-full w-full ${pad} flex flex-col ${gapY} min-h-0`}
        style={{ zIndex: 2 }}
      >
        <div className="flex items-start justify-between gap-2 shrink-0">
          <RelationshipBadge relationship={contact.relationship} withDot />
          <span
            className={`${dense ? 'w-3 h-3' : 'w-2.5 h-2.5'} rounded-full shrink-0`}
            style={{
              background: haloColor,
              boxShadow: `0 0 14px ${haloColor}, 0 0 4px ${haloColor}`,
            }}
            aria-hidden="true"
            title={meta.label}
          />
        </div>

        <div className="flex flex-col items-center text-center shrink-0 min-w-0">
          <div
            className={`relative ${avatar} flex items-center justify-center ring-1 ring-white/10 shadow-card shrink-0`}
            style={gradient}
          >
            <div
              className="absolute inset-0 rounded-2xl opacity-40 mix-blend-overlay"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.55), transparent 45%)',
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
            <span className="relative font-display font-bold text-white tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
              {initials}
            </span>
          </div>

          <h3
            className={`mt-3 font-display font-bold text-white leading-tight ${h3} truncate max-w-full w-full`}
            title={`${contact.firstName} ${contact.lastName}`}
          >
            {contact.firstName} {contact.lastName}
          </h3>
          {contact.company && (
            <p
              className={`${company} text-slate-400 mt-0.5 truncate max-w-full w-full`}
              title={contact.company}
            >
              {contact.company}
            </p>
          )}
        </div>

        <div className="divider shrink-0" />

        <div className="space-y-2 min-h-0 flex-1 flex flex-col overflow-hidden">
          {activeRequest ? (
            <>
              <div className="shrink-0 min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Demande
                </div>
                <p
                  className={`${dense ? 'text-[14px] leading-snug' : 'text-sm'} font-medium text-slate-100 line-clamp-2`}
                  title={activeRequest.title}
                >
                  {activeRequest.title}
                </p>
              </div>

              <div className="shrink-0">
                <StatusBadge status={status} size="sm" />
              </div>

              {activeRequest.nextAction && (
                <div className="shrink-0 min-w-0">
                  <NextActionView
                    action={activeRequest.nextAction}
                    variant={dense ? 'compact' : 'standard'}
                  />
                </div>
              )}
            </>
          ) : (
            <div className={`${dense ? 'text-[13px]' : 'text-xs'} text-slate-500 italic text-center py-3 shrink-0`}>
              Aucune demande active
            </div>
          )}
        </div>

        <div className="mt-auto shrink-0 min-w-0">
          <div className="divider mb-3 shrink-0" />
          <div
            className={`flex items-center justify-between gap-2 ${dense ? 'text-[11px]' : 'text-[11px]'} text-slate-400 min-w-0`}
          >
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="font-semibold tabular-nums text-slate-300 shrink-0">
                {contact.totalRequests}
              </span>
              <span className="text-slate-500 truncate min-w-0">
                demande{contact.totalRequests > 1 ? 's' : ''}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 min-w-0 justify-end">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
              <span className="font-semibold tabular-nums text-slate-300 shrink-0">
                {contact.totalMissions}
              </span>
              <span className="text-slate-500 truncate min-w-0">
                mission{contact.totalMissions > 1 ? 's' : ''}
              </span>
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
