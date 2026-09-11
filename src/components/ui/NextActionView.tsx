import type { NextAction } from '../../types';
import { formatScheduleLabel } from '../../utils/formatting';
import { nextActionLabels } from '../../tokens/design-tokens';

interface NextActionProps {
  action: NextAction;
  variant?: 'compact' | 'standard';
}

export function NextActionView({ action, variant = 'standard' }: NextActionProps) {
  const scheduleLabel = formatScheduleLabel(action.dueDate);
  const isOverdue = action.isOverdue;
  const isToday = action.isToday;

  const toneClass = isOverdue
    ? 'text-brand-coral'
    : isToday
    ? 'text-brand-violet'
    : 'text-slate-300';

  const iconBg = isOverdue
    ? 'bg-brand-coral/15 text-brand-coral ring-1 ring-brand-coral/30'
    : isToday
    ? 'bg-brand-violet/15 text-brand-violet ring-1 ring-brand-violet/30'
    : 'bg-white/5 text-slate-400 ring-1 ring-white/10';

  const icon = isOverdue ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ) : isToday ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const actionLabel =
    action.label ||
    nextActionLabels[action.type] ||
    'Prochaine action';

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`w-5 h-5 shrink-0 rounded-md flex items-center justify-center ${iconBg}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-[12px] font-medium ${toneClass} truncate`} title={actionLabel}>
            {actionLabel}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 min-w-0">
            <span className="truncate">{scheduleLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        'flex items-start gap-2.5 p-2.5 rounded-xl ring-1 min-w-0',
        isOverdue
          ? 'bg-brand-coral/5 ring-brand-coral/15'
          : isToday
          ? 'bg-brand-violet/5 ring-brand-violet/15'
          : 'bg-white/5 ring-white/5',
      ].join(' ')}
    >
      <span
        className={`mt-0.5 w-6 h-6 shrink-0 rounded-lg flex items-center justify-center ${iconBg}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-semibold ${toneClass} truncate`} title={actionLabel}>
          {actionLabel}
        </div>
        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap min-w-0">
          <span className="truncate">{scheduleLabel}</span>
          {isOverdue && action.overdueDays && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-brand-coral font-semibold truncate">
                Retard : {action.overdueDays} j
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
