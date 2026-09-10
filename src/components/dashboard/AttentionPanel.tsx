import { dashboardAttentionItems } from '../../data/mockData';
import { formatDueDate } from '../../utils/formatting';

interface AttentionPanelProps {
  onOpenContact: (contactId: string) => void;
}

export function AttentionPanel({ onOpenContact }: AttentionPanelProps) {
  const count = dashboardAttentionItems.length;

  return (
    <section className="surface relative overflow-hidden p-5">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(60% 100% at 0% 0%, rgba(255,122,89,0.08), transparent 60%)',
        }}
      />
      <div className="relative">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-brand-coral/15 text-brand-coral ring-1 ring-brand-coral/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </span>
            <h2 className="font-display font-bold text-white text-lg leading-none">
              À traiter en priorité
            </h2>
          </div>
          <span className="chip bg-brand-coral/15 text-brand-coral ring-1 ring-brand-coral/30">
            {count}
          </span>
        </header>

        <ul className="space-y-2">
          {dashboardAttentionItems.map((item) => {
            const { when, hour } = formatDueDate(item.action.dueDate);
            return (
              <li key={item.id}>
                <button
                  onClick={() => onOpenContact(item.contactId)}
                  className="group w-full flex items-center gap-3 p-3 rounded-xl ring-1 ring-transparent
                    hover:bg-white/5 hover:ring-white/10
                    active:scale-[0.99]
                    transition-all duration-150 ease-snap text-left"
                >
                  <span className="w-8 h-8 shrink-0 rounded-full bg-brand-coral/15 text-brand-coral ring-1 ring-brand-coral/30 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {item.label}
                    </div>
                    <div className="text-xs text-brand-coral font-medium mt-0.5 flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      <span>{item.sub}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {when}
                      {hour && <span> · {hour}</span>}
                    </div>
                  </div>
                  <span
                    className="text-slate-500 group-hover:text-white transition-colors"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
