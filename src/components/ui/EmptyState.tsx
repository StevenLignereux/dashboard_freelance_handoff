import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-brand-violet/20 bg-brand-violet/5">
      {icon && (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-violet/10 text-slate-500 mb-4 ring-1 ring-brand-violet/20">
          {icon}
        </div>
      )}
      <h3 className="font-display font-semibold text-slate-900 text-base">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
