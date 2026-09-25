import { useState } from 'react';
import type { DashboardItem } from '../../selectors/dashboard';

interface CompleteAutoReminderButtonProps {
  item: DashboardItem;
  onComplete: (item: DashboardItem) => Promise<void>;
}

export function CompleteAutoReminderButton({ item, onComplete }: CompleteAutoReminderButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!item.requestId) return;
    setPending(true);
    setError(null);
    try {
      await onComplete(item);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d’enregistrer la relance.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      <button
        type="button"
        aria-label="Marquer la relance comme faite"
        onClick={() => { void handleComplete(); }}
        disabled={pending}
        className="btn-ghost !px-2.5 !py-2 text-xs text-brand-green hover:bg-brand-green/10"
      >
        {pending ? 'Enregistrement…' : 'Fait'}
      </button>
      {error && <span role="alert" className="text-xs text-brand-coral">{error}</span>}
    </div>
  );
}
