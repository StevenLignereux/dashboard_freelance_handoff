import { useCallback, useMemo, useState } from 'react';
import { useAppStore } from '../store/AppStore';
import { EmptyState } from '../components/ui/EmptyState';
import type { Mission } from '../types';
import type { OpenContactPayload } from '../App';

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
      return 'bg-brand-violet/10 text-slate-700 ring-brand-violet/20';
  }
}

function MissionCard({ mission, contactName, onOpenContact, onEditMission }: { mission: Mission; contactName: string; onOpenContact: (id: string | OpenContactPayload) => void; onEditMission: (missionId: string) => void }) {
  const store = useAppStore();
  const meta = missionStatusMeta[mission.status];
  const progress = mission.progress ?? 0;
  const [completing, setCompleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isTerminee = mission.status === 'terminee';

  const handleMarkComplete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTerminee || completing) return;
    setActionError(null);
    setCompleting(true);
    try {
      await store.data.updateMission(mission.id, { status: 'terminee', progress: 100 });
    } catch (err) {
      console.error('Failed to complete mission:', err);
      setActionError('Impossible de terminer la mission. Vérifie ta connexion et réessaie.');
    } finally {
      setCompleting(false);
    }
  }, [store.data, mission.id, isTerminee, completing]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEditMission(mission.id);
  }, [onEditMission, mission.id]);

  return (
    <div
      className="group surface p-5 text-left hover:ring-brand-violet/30 transition-all active:scale-[0.998] flex flex-col gap-3 cursor-pointer"
      onClick={() => { onOpenContact(mission.contactId); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenContact(mission.contactId);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-slate-900 truncate">{mission.title}</h3>
          <p className="text-sm text-slate-500 truncate">{contactName}</p>
        </div>
        <span className={`chip shrink-0 ring-1 ${toneClasses(meta.tone)}`}>{meta.label}</span>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500">Progression</span>
          <span className="font-display font-bold text-slate-800 tabular-nums">{progress}%</span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-brand-violet/10 overflow-hidden"
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
        <p className="text-xs text-slate-400 line-clamp-2 pt-1 border-t border-brand-violet/10">
          {mission.notes}
        </p>
      )}
      {actionError && (
        <p className="text-xs text-brand-coral pt-1 border-t border-brand-violet/10" role="alert">
          {actionError}
        </p>
      )}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-brand-violet/10 mt-1" onClick={(e) => { e.stopPropagation(); }}>
        <button
          type="button"
          onClick={handleEdit}
          className="btn-ghost !py-1.5 !px-2.5 text-xs inline-flex items-center gap-1.5 hover:bg-brand-violet/10"
          aria-label={`Modifier la mission ${mission.title}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
          Modifier
        </button>
        <button
          type="button"
          onClick={handleMarkComplete}
          disabled={isTerminee || completing}
          className={`btn-ghost !py-1.5 !px-2.5 text-xs inline-flex items-center gap-1.5 ring-1 ${isTerminee ? 'ring-slate-500/15 text-slate-400 cursor-not-allowed' : 'ring-brand-green/30 text-brand-green hover:bg-brand-green/10'}`}
          aria-label={isTerminee ? 'Mission déjà terminée' : `Marquer ${mission.title} comme terminée`}
        >
          {completing ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {isTerminee ? 'Terminée' : 'Marquer terminée'}
        </button>
      </div>
    </div>
  );
}

type FilterView = 'following' | 'completed' | 'all';

interface MissionsPageProps {
  onOpenContact: (contactId: string | OpenContactPayload) => void;
  onEditMission: (missionId: string) => void;
}

export function MissionsPage({ onOpenContact, onEditMission }: MissionsPageProps) {
  const store = useAppStore();
  const [currentView, setCurrentView] = useState<FilterView>('following');

  const allFilteredItems = useMemo(() => {
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

  const displayedItems = useMemo(() => {
    if (currentView === 'all') return allFilteredItems;
    if (currentView === 'following') {
      return allFilteredItems.filter(({ mission }) => 
        mission.status === 'a_demarrer' || mission.status === 'en_cours' || mission.status === 'en_attente'
      );
    }
    return allFilteredItems.filter(({ mission }) => mission.status === 'terminee');
  }, [allFilteredItems, currentView]);

  const ongoingCount = useMemo(() => 
    store.data.missions.filter(m => m.status === 'en_cours').length,
    [store.data.missions]
  );

  const viewCounts = useMemo(() => {
    const following = allFilteredItems.filter(({ mission }) => 
      mission.status === 'a_demarrer' || mission.status === 'en_cours' || mission.status === 'en_attente'
    ).length;
    const completed = allFilteredItems.filter(({ mission }) => mission.status === 'terminee').length;
    return { following, completed, all: allFilteredItems.length };
  }, [allFilteredItems]);

  const hasActiveSearch = store.search.query.trim().length > 0;
  const totalMissions = store.data.missions.length;
  const totalFollowingMissions = store.data.missions.filter(m => m.status === 'a_demarrer' || m.status === 'en_cours' || m.status === 'en_attente').length;

  const emptyStateConfig = useMemo(() => {
    if (hasActiveSearch && allFilteredItems.length === 0) {
      return {
        title: 'Aucun résultat',
        description: 'Aucune mission ne correspond à ta recherche.'
      };
    }

    if (hasActiveSearch && allFilteredItems.length > 0 && displayedItems.length === 0) {
      if (currentView === 'following') {
        return {
          title: 'Aucune mission à suivre',
          description: 'Ta recherche a trouvé des missions, mais aucune ne correspond à la vue "À suivre". Essaie de changer de filtre.'
        };
      }
      if (currentView === 'completed') {
        return {
          title: 'Aucune mission terminée',
          description: 'Ta recherche a trouvé des missions, mais aucune ne correspond à la vue "Terminées". Essaie de changer de filtre.'
        };
      }
    }

    if (!hasActiveSearch && totalMissions === 0) {
      return {
        title: 'Aucune mission trouvée',
        description: 'Les missions apparaîtront ici une fois créées depuis une demande.'
      };
    }

    if (currentView === 'following') {
      if (totalFollowingMissions === 0 && totalMissions > 0) {
        return {
          title: 'Aucune mission à suivre',
          description: 'Toutes tes missions sont terminées. Tu peux en créer une nouvelle depuis une demande.'
        };
      }
      if (totalMissions === 0) {
        return {
          title: 'Aucune mission trouvée',
          description: 'Les missions apparaîtront ici une fois créées depuis une demande.'
        };
      }
      return {
        title: 'Aucune mission à suivre',
        description: 'Aucune mission ne correspond à la vue "À suivre". Essaie de changer de filtre.'
      };
    }

    if (currentView === 'completed') {
      return {
        title: 'Aucune mission terminée',
        description: 'Les missions que tu marques comme terminées apparaîtront ici.'
      };
    }

    return {
      title: 'Aucune mission trouvée',
      description: 'Les missions apparaîtront ici une fois créées depuis une demande.'
    };
  }, [currentView, hasActiveSearch, allFilteredItems.length, displayedItems.length, totalMissions, totalFollowingMissions]);

  const viewOptions: { value: FilterView; label: string; count: number }[] = [
    { value: 'following', label: 'À suivre', count: viewCounts.following },
    { value: 'completed', label: 'Terminées', count: viewCounts.completed },
    { value: 'all', label: 'Toutes', count: viewCounts.all },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-[1600px] mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-slate-900 text-2xl sm:text-3xl tracking-tight">
            Missions
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Vue d&rsquo;ensemble des missions en cours, à démarrer et terminées.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="chip bg-brand-green/15 text-brand-green ring-1 ring-brand-green/30">
            {ongoingCount} en cours
          </div>
        </div>
      </header>

      <div className="inline-flex p-1 bg-slate-100 rounded-lg" role="group" aria-label="Filtres de mission">
        {viewOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => { setCurrentView(option.value); }}
            aria-pressed={currentView === option.value}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              currentView === option.value
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {option.label}
            <span className={`ml-1.5 ${currentView === option.value ? 'text-slate-500' : 'text-slate-400'}`}>
              {option.count}
            </span>
          </button>
        ))}
      </div>

      {displayedItems.length === 0 ? (
        <EmptyState
          title={emptyStateConfig.title}
          description={emptyStateConfig.description}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedItems.map(({ mission, contact }) => {
            const contactName = contact
              ? `${contact.firstName} ${contact.lastName}${contact.company ? ` · ${contact.company}` : ''}`
              : 'Contact inconnu';
            return (
              <MissionCard
                key={mission.id}
                mission={mission}
                contactName={contactName}
                onOpenContact={onOpenContact}
                onEditMission={onEditMission}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
