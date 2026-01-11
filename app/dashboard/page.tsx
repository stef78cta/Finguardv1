import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Upload,
  BarChart3,
  FileText,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Pagina principală a Dashboard-ului FinGuard.
 * 
 * Afișează overview-ul cu statistici rapide și acțiuni principale.
 * Include quick links către funcționalitățile principale.
 */
export default async function DashboardPage() {
  // Obține utilizatorul autentificat
  const user = await currentUser();

  // Dacă nu există utilizator (nu ar trebui să se întâmple datorită middleware-ului)
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Bun venit, {user.firstName}! 👋
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Acesta este dashboard-ul tău de analiză financiară. Începe prin a adăuga o companie.
        </p>
      </div>

      {/* Quick Stats - Placeholder pentru viitor */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Companii Active"
          value="0"
          icon={Building2}
          trend="+0% față de luna trecută"
          trendUp={false}
        />
        <StatCard
          title="Balanțe Procesate"
          value="0"
          icon={Upload}
          trend="Luna curentă"
          trendUp={false}
        />
        <StatCard
          title="Rapoarte Generate"
          value="0"
          icon={FileText}
          trend="Total"
          trendUp={false}
        />
        <StatCard
          title="Ultima Activitate"
          value="Astăzi"
          icon={Clock}
          trend={new Date().toLocaleDateString('ro-RO')}
          trendUp={false}
        />
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
          Acțiuni Rapide
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Adaugă Companie"
            description="Creează o nouă companie pentru analiză"
            icon={Building2}
            href="/dashboard/companies"
            iconColor="text-blue-600 dark:text-blue-400"
            bgColor="bg-blue-50 dark:bg-blue-900/20"
          />
          <QuickActionCard
            title="Încarcă Balanță"
            description="Upload fișier Excel sau CSV"
            icon={Upload}
            href="/dashboard/upload"
            iconColor="text-green-600 dark:text-green-400"
            bgColor="bg-green-50 dark:bg-green-900/20"
          />
          <QuickActionCard
            title="Vizualizează KPI"
            description="Vezi indicatorii financiari"
            icon={BarChart3}
            href="/dashboard/indicators"
            iconColor="text-purple-600 dark:text-purple-400"
            bgColor="bg-purple-50 dark:bg-purple-900/20"
          />
        </div>
      </Card>

      {/* Recent Activity - Placeholder */}
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
          Activitate Recentă
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
            <Clock className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Nu există activitate recentă
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Activitatea ta va apărea aici
          </p>
        </div>
      </Card>
    </div>
  );
}

/**
 * Card pentru afișarea statisticilor rapide.
 */
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
            {value}
          </p>
        </div>
        <div className="rounded-full bg-blue-50 p-3 dark:bg-blue-900/20">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1">
        {trendUp && <TrendingUp className="h-4 w-4 text-green-600" />}
        <p className="text-xs text-slate-600 dark:text-slate-400">{trend}</p>
      </div>
    </Card>
  );
}

/**
 * Card pentru acțiuni rapide cu link.
 */
function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  iconColor,
  bgColor,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  iconColor: string;
  bgColor: string;
}) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer p-6 transition-all hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className={`rounded-lg ${bgColor} p-3`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 dark:text-slate-50 dark:group-hover:text-blue-400">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
