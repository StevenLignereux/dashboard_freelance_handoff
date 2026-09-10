import type { RequestStatus } from '../../types';
import { statusMeta } from '../../tokens/design-tokens';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const meta = statusMeta[status];
  return (
    <span
      className={[
        'chip',
        meta.chipBg,
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
      ].join(' ')}
    >
      <span aria-hidden="true" className="leading-none">
        {meta.iconHint}
      </span>
      <span>{meta.label}</span>
    </span>
  );
}
