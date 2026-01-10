'use client';

/**
 * Error boundary global pentru gestionarea erorilor din aplicație
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-red-900">Ceva nu a funcționat corect</h2>
        <p className="mb-6 text-red-700">{error.message || 'A apărut o eroare neprevăzută'}</p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
        >
          Încearcă din nou
        </button>
      </div>
    </div>
  );
}
