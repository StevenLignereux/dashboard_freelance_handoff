import { useMemo } from 'react';
import { useAppStore } from '../store/AppStore';
import { EmptyState } from '../components/ui/EmptyState';
import type { Mission } from '../types';

const missionStatusMeta: Record<Mission['status'], { label: string; tone: 'green' | 'violet' | 'slate' | 'amber' }> = {
  a_demarrer: { label: 'À démarrer', tone: 'violet' },
  en_cours: { label: 'En cours', tone: 'green' },
  en_attente: { label: 'En attente', tone: 'amber' },
  terminee: { label: 'Terminée', tone: 'slate' },
};

function toneClasses(tone: 'green' | 'violet' | 'slate' | 'amber'): string {
  switch (tone) {
    case 'green':
      return 'bg-brand-green/15 text-brand-green ring-brand-green/30';
    case 'violet':
      return 'bg-brand-violet/15 text-brand-violet ring-brand-violet/30';
    case 'amber':
      return 'bg-brand-amber/15 text-brand-amber ring-brand-amber/30';
    case 'slate':
      return 'bg-white/10 text-slate-300 ring-white/10';
  }
}

function MissionCard({ mission, contactName, onOpenContact }: { mission: Mission; contactName: string; onOpenContact: (id: string) => void }) {
  const meta = missionStatusMeta[mission.status];
  const progress = mission.progress ?? 0;
  return (
    <button
      onClick={() => { onOpenContact(mission.contactId); }}
      className="group surface p-5 text-left hover:ring-brand-violet/30 transition-all active:scale-[0.998] flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-white truncate">{mission.title}</h3>
          <p className="text-sm text-slate-400 truncate">{contactName}</p>
        </div>
        <span className={`chip shrink-0 ring-1 ${toneClasses(meta.tone)}`}>{meta.label}</span>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400">Progression</span>
          <span className="font-display font-bold text-slate-200 tabular-nums">{progress}%</span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progression : ${progress}%`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan shadow-[0_0_10px_rgba(124,92,255,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {mission.notes && (
        <p className="text-xs text-slate-500 line-clamp-2 pt-1 border-t border-white/5">
          {mission.notes}
        </p>
      )}
    </button>
  );
}

interface MissionsPageProps {
  onOpenContact: (contactId: string) => void;
}

export function MissionsPage({ onOpenContact }: MissionsPageProps) {
  const store = useAppStore();

  const items = useMemo(() => {
    const { contacts, missions } = store.data;
    const query = store.search.query.trim().toLowerCase();
    const contactById = new Map(contacts.map((c) => [c.id, c]));
    return missions
      .map((m) => ({
        mission: m,
        contact: contactById.get(m.contactId),
      }))
      .filter(({ mission, contact }) => {
        if (!query) return true;
        const hay = [mission.title, mission.notes, contact?.firstName, contact?.lastName, contact?.company]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => {
        const order: Mission['status'][] = ['a_demarrer', 'en_cours', 'en_attente', 'terminee'];
        return order.indexOf(a.mission.status) - order.indexOf(b.mission.status);
      });
  }, [store.data.missions, store.data.contacts, store.search.query]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-[1600px] mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl tracking-tight">
            Missions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Vue d&rsquo;ensemble des missions en cours, à démarrer et terminées.
          </p>
        </div>
        <div className="chip bg-brand-green/15 text-brand-green ring-1 ring-brand-green/30">
          {items.filter((i) => i.mission.status === 'en_cours').length} en cours
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune mission trouvée"
          description="Les missions apparaîtront ici une fois liées à une demande."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ mission, contact }) => {
            const contactName = contact
              ? `${contact.firstName} ${contact.lastName}${contact.company ? ` · ${contact.company}` : ''}`
              : 'Contact inconnu';
            return (
              <MissionCard
                key={mission.id}
                mission={mission}
                contactName={contactName}
                onOpenContact={onOpenContact}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
