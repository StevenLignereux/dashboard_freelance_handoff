import type { RelationshipType } from '../../types';
import { relationshipMeta } from '../../tokens/design-tokens';

interface RelationshipBadgeProps {
  relationship: RelationshipType;
  withDot?: boolean;
}

export function RelationshipBadge({
  relationship,
  withDot = false,
}: RelationshipBadgeProps) {
  const meta = relationshipMeta[relationship];
  return (
    <span className={`chip ${meta.chipBg} text-[10px]`}>
      {withDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${meta.dotColor} shadow-[0_0_8px_currentColor]`}
          aria-hidden="true"
        />
      )}
      <span>{meta.label}</span>
    </span>
  );
}
