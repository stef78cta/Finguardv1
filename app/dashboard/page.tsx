import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Pagina principală a Dashboard-ului FinGuard.
 * 
 * Această pagină este protejată de middleware și necesită autentificare.
 * Afișează un mesaj de bun venit pentru utilizatorul autentificat.
 */
export default async function DashboardPage() {
  // Obține utilizatorul autentificat
  const user = await currentUser();

  // Dacă nu există utilizator (nu ar trebui să se întâmple datorită middleware-ului)
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
            Bun venit în FinGuard! 👋
          </h1>
          <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
            Platformă de analiză financiară automată
          </p>
        </div>

        {/* User Info Card */}
        <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
          <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Informații Utilizator
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full"
                />
              )}
              <div>
                <p className="text-lg font-medium text-slate-900 dark:text-slate-50">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {user.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-md bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                ✅ Autentificare funcțională!
              </p>
              <p className="mt-1 text-xs text-green-700 dark:text-green-500">
                Middleware-ul protejează această rută. Utilizatorul a fost sincronizat cu baza de date.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="🏢 Gestionare Companii"
            description="Adaugă și gestionează companiile tale"
            status="Coming Soon"
          />
          <FeatureCard
            title="📊 Upload Balanță"
            description="Încarcă balanțe de verificare"
            status="Coming Soon"
          />
          <FeatureCard
            title="📈 Indicatori KPI"
            description="Vizualizează indicatorii financiari"
            status="Coming Soon"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Componentă pentru afișarea unui feature card.
 */
function FeatureCard({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
      <span className="mt-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        {status}
      </span>
    </div>
  );
}
