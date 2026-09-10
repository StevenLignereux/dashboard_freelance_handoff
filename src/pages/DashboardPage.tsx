import { AttentionPanel } from '../components/dashboard/AttentionPanel';
import { TodayPanel } from '../components/dashboard/TodayPanel';
import { ActiveMissionsPanel } from '../components/dashboard/ActiveMissionsPanel';
import { ContactsSection } from '../components/contact/ContactsSection';
import {
  dashboardActiveMissions,
  dashboardAttentionItems,
  dashboardTodayItems,
} from '../data/mockData';

interface DashboardPageProps {
  onOpenContact: (contactId: string) => void;
  activeContactId: string | null;
}

export function DashboardPage({
  onOpenContact,
  activeContactId,
}: DashboardPageProps) {
  const totalAttention =
    dashboardAttentionItems.length +
    dashboardTodayItems.length +
    dashboardActiveMissions.filter((m) => m.progress < 30).length;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-10 max-w-[1600px] mx-auto">
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight">
            Bonjour Manon !{' '}
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
            Des personnes, pas juste des projets.
          </p>
        </blockquote>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <AttentionPanel onOpenContact={onOpenContact} />
        <TodayPanel onOpenContact={onOpenContact} />
        <ActiveMissionsPanel onOpenContact={onOpenContact} />
      </section>

      <ContactsSection
        onOpenContact={onOpenContact}
        activeContactId={activeContactId}
      />

      <section className="grid gap-5 md:grid-cols-3 pt-4">
        <div className="surface p-5 flex items-start gap-4">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-brand-violet/15 text-brand-violet ring-1 ring-brand-violet/25 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-white">
              Chaque contact compte.
            </h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Un simple message peut ouvrir de grandes opportunités.
            </p>
          </div>
        </div>
        <div className="md:col-span-2 surface relative overflow-hidden p-0 min-h-[150px]">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, #1a1f2d 0%, #161A22 50%, #1e1a30 100%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 300%22 preserveAspectRatio=%22xMidYMid slice%22><defs><linearGradient id=%22g%22 x1=%220%22 y1=%220%22 x2=%221%22 y2=%221%22><stop offset=%220%25%22 stop-color=%22%237C5CFF%22 stop-opacity=%220.2%22/><stop offset=%22100%25%22 stop-color=%22%2322D3EE%22 stop-opacity=%220.15%22/></linearGradient></defs><rect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23g)%22/></svg>")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/60 to-transparent" />
          <div className="relative p-5 sm:p-6 flex items-center h-full min-h-[150px]">
            <div className="max-w-md">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-brand-violet mb-2">
                Devise
              </p>
              <p className="font-display font-bold text-white text-xl sm:text-2xl leading-tight text-shadow-glow">
                Discipline aujourd&rsquo;hui,
                <br className="hidden sm:block" /> liberté demain.
              </p>
              <div className="mt-4 w-20 h-1 rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan shadow-glow-cyan" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
