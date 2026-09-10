import { formatDueDate } from '../../utils/formatting';
import type { DashboardItem } from '../../selectors/dashboard';

interface TodayPanelProps {
  items: DashboardItem[];
  title?: string;
  tone?: 'violet' | 'cyan';
  onOpenContact: (contactId: string) => void;
}

export function TodayPanel({ items, title = 'À faire aujourd&rsquo;hui', tone = 'violet', onOpenContact }: TodayPanelProps) {
  const count = items.length;
  const color =
    tone === 'cyan'
      ? { chip: 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/30', icon: 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/30', hour: 'text-brand-cyan' }
      : { chip: 'bg-brand-violet/15 text-brand-violet ring-brand-violet/30', icon: 'bg-brand-violet/15 text-brand-violet ring-brand-violet/30', hour: 'text-brand-violet' };

  return (
    <section className="surface relative overflow-hidden p-5">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            tone === 'cyan'
              ? 'radial-gradient(60% 100% at 100% 0%, rgba(34,211,238,0.08), transparent 60%)'
              : 'radial-gradient(60% 100% at 100% 0%, rgba(124,92,255,0.08), transparent 60%)',
        }}
      />
      <div className="relative">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className={`w-8 h-8 rounded-xl ring-1 flex items-center justify-center ${color.icon}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <h2 className="font-display font-bold text-white text-lg leading-none" dangerouslySetInnerHTML={{ __html: title }} />
          </div>
          <span className={`chip ring-1 ${color.chip}`}>
            {count}
          </span>
        </header>

        <ul className="space-y-2">
          {items.map((item) => {
            const { hour } = formatDueDate(item.action.dueDate);
            return (
              <li key={item.id}>
                <button
                  onClick={() => { onOpenContact(item.contactId); }}
                  className="group w-full flex items-center gap-3 p-3 rounded-xl ring-1 ring-transparent
                    hover:bg-white/5 hover:ring-white/10
                    active:scale-[0.99]
                    transition-all duration-150 ease-snap text-left"
                >
                  <span className={`w-8 h-8 shrink-0 rounded-full ring-1 flex items-center justify-center ${color.icon}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {item.label}
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5 truncate">
                      {item.sub}
                    </div>
                    {hour && (
                      <div className={`text-[11px] font-medium mt-0.5 flex items-center gap-1 ${color.hour}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {hour}
                      </div>
                    )}
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
          {items.length === 0 && (
            <li className="p-5 text-center text-sm text-slate-500">
              Rien de prévu pour le moment.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
