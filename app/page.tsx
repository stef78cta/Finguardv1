import Link from 'next/link';

/**
 * Landing page principală FinGuard
 * Pagina de prezentare a produsului pentru vizitatori noi
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white md:text-6xl">
          FinGuard
        </h1>
        
        <p className="mb-8 text-xl text-gray-600 dark:text-gray-300 md:text-2xl">
          Analiză Financiară Automată pentru Companiile din România
        </p>

        <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
          Încarcă balanța contabilă și primește instant: KPI-uri calculate automat, situații
          financiare, rapoarte profesionale și analize comparative.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Începe Acum - Gratuit
          </Link>
          
          <Link
            href="/sign-in"
            className="rounded-lg border-2 border-blue-600 px-8 py-3 text-lg font-semibold text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-800"
          >
            Autentificare
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              📊 Analiză Automată
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Procesare inteligentă a balanței contabile cu 15+ validări tehnice automate
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              📈 25+ KPI-uri
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Indicatori cheie de performanță calculați instant: lichiditate, profitabilitate,
              eficiență
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
              📄 Rapoarte PDF
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Export rapoarte profesionale cu grafice și analize comparative între perioade
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
