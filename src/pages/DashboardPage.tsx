import { AttentionPanel } from '../components/dashboard/AttentionPanel';
import { TodayPanel } from '../components/dashboard/TodayPanel';
import { ActiveMissionsPanel } from '../components/dashboard/ActiveMissionsPanel';
import { ContactsSection } from '../components/contact/ContactsSection';
import { useAppStore } from '../store/AppStore';
import { buildDashboardData } from '../selectors/dashboard';
import { currentUser, appConfig } from '../config/appConfig';

interface DashboardPageProps {
  onOpenContact: (contactId: string) => void;
  activeContactId: string | null;
}

export function DashboardPage({
  onOpenContact,
  activeContactId,
}: DashboardPageProps) {
  const store = useAppStore();
  const dashboard = buildDashboardData({
    requests: store.data.requests,
    contacts: store.data.contacts,
    missions: store.data.missions,
  });

  const totalAttention = dashboard.attentionCount;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-10 max-w-[1600px] mx-auto">
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight">
            Bonjour {currentUser.firstName} !{' '}
            <span aria-hidden="true" className="text-brand-amber">
              👋
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            <span className="text-brand-violet font-semibold">
              {totalAttention} chose{totalAttention > 1 ? 's' : ''}
            </span>{' '}
            méritent ton attention aujourd&rsquo;hui.
          </p>
        </div>
        <blockquote className="hidden lg:block text-right max-w-sm">
          <p className="text-slate-500 text-sm italic leading-relaxed">
            <span className="text-brand-violet/60 text-3xl leading-none align-[-8px] font-serif">
              “
            </span>
            {appConfig.signatureQuote}
          </p>
        </blockquote>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <AttentionPanel items={dashboard.overdueActions} onOpenContact={onOpenContact} />
        <TodayPanel items={dashboard.todayActions} onOpenContact={onOpenContact} />
        <ActiveMissionsPanel missions={dashboard.activeMissions} contacts={store.data.contacts} onOpenContact={onOpenContact} />
      </section>

      <ContactsSection
        onOpenContact={onOpenContact}
        activeContactId={activeContactId}
        compact
      />

      <section>
        <TodayPanel
          title="À venir"
          tone="cyan"
          items={dashboard.upcomingActions}
          onOpenContact={onOpenContact}
        />
      </section>
    </div>
  );
}
