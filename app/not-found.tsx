import Link from 'next/link';

/**
 * Pagină 404 - Not Found
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mb-6 text-2xl font-semibold text-gray-700">Pagina nu a fost găsită</h2>
        <p className="mb-8 text-gray-600">Ne pare rău, pagina pe care o căutați nu există.</p>
        <Link
          href="/"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Înapoi la pagina principală
        </Link>
      </div>
    </div>
  );
}
