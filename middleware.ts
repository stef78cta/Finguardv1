import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Middleware pentru protejarea rutelor în aplicația FinGuard.
 * 
 * Protejează toate rutele /dashboard/* și /admin/* cu autentificare Clerk.
 * Rutele publice sunt accesibile fără autentificare.
 * 
 * @see https://clerk.com/docs/references/nextjs/clerk-middleware
 */

// Definește rutele care necesită autentificare
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/api/companies(.*)',
  '/api/upload(.*)',
  '/api/imports(.*)',
  '/api/reports(.*)',
]);

// Definește rutele publice (nu necesită autentificare)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook/clerk',
]);

export default clerkMiddleware((auth, req) => {
  // Permite accesul la rutele publice
  if (isPublicRoute(req)) {
    return;
  }

  // Protejează rutele care necesită autentificare
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
