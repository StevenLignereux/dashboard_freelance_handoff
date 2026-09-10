import { dashboardActiveMissions } from '../../data/mockData';
import { contacts } from '../../data/mockData';

interface ActiveMissionsPanelProps {
  onOpenContact: (contactId: string) => void;
}

export function ActiveMissionsPanel({ onOpenContact }: ActiveMissionsPanelProps) {
  const count = dashboardActiveMissions.length;

  return (
    <section className="surface relative overflow-hidden p-5">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(60% 100% at 100% 0%, rgba(52,211,153,0.08), transparent 60%)',
        }}
      />
      <div className="relative">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-brand-green/15 text-brand-green ring-1 ring-brand-green/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              </svg>
            </span>
            <h2 className="font-display font-bold text-white text-lg leading-none">
              Missions en cours
            </h2>
          </div>
          <span className="chip bg-brand-green/15 text-brand-green ring-1 ring-brand-green/30">
            {count}
          </span>
        </header>

        <ul className="space-y-2">
          {dashboardActiveMissions.map((mission) => {
            const contact = contacts.find((c) => c.id === mission.contactId);
            const progress = mission.progress ?? 0;
            return (
              <li key={mission.id}>
                <button
                  onClick={() => onOpenContact(mission.contactId)}
                  className="group w-full text-left p-3 rounded-xl ring-1 ring-transparent
                    hover:bg-white/5 hover:ring-white/10
                    active:scale-[0.99]
                    transition-all duration-150 ease-snap"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 shrink-0 rounded-full bg-brand-green/15 text-brand-green ring-1 ring-brand-green/30 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {mission.title}
                      </div>
                      {contact && (
                        <div className="text-xs text-slate-400 truncate">
                          {contact.firstName} {contact.lastName}
                          {contact.company && ` · ${contact.company}`}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-display font-bold text-brand-green text-sm tabular-nums">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pl-11">
                    <div
                      className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progression : ${progress}%`}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-green to-brand-cyan shadow-[0_0_10px_rgba(52,211,153,0.4)] transition-all duration-500 ease-snap"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
