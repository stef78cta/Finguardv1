import { SignIn } from '@clerk/nextjs';

/**
 * Pagina de Sign In folosind componenta Clerk.
 * 
 * Această pagină folosește catch-all route [[...sign-in]] pentru a gestiona
 * toate sub-rutele necesare pentru procesul de autentificare (email verification, etc.).
 * 
 * @see https://clerk.com/docs/components/authentication/sign-in
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            FinGuard
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Analiză financiară automată pentru companiile din România
          </p>
        </div>
        
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-xl',
            },
          }}
        />
      </div>
    </div>
  );
}
