import { auth, currentUser } from '@clerk/nextjs/server';
import type { User } from '@clerk/nextjs/server';

/**
 * Funcții helper pentru autentificare cu Clerk în FinGuard.
 * 
 * Acest modul oferă utilități pentru:
 * - Obținerea utilizatorului autentificat
 * - Verificarea autentificării
 * - Gestionarea sesiunilor
 * 
 * @see https://clerk.com/docs/references/nextjs/overview
 */

/**
 * Tipuri pentru utilizatorul FinGuard
 */
export type FinGuardUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  imageUrl: string;
  createdAt: Date;
};

/**
 * Obține utilizatorul autentificat curent.
 * 
 * Această funcție trebuie folosită în Server Components, Server Actions,
 * Route Handlers și Middleware.
 * 
 * @returns {Promise<FinGuardUser | null>} - Utilizatorul autentificat sau null
 * 
 * @example
 * ```typescript
 * // În Server Component
 * const user = await getCurrentAuthUser();
 * if (!user) {
 *   redirect('/sign-in');
 * }
 * ```
 */
export async function getCurrentAuthUser(): Promise<FinGuardUser | null> {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  return mapClerkUserToFinGuardUser(user);
}

/**
 * Verifică dacă utilizatorul este autentificat.
 * 
 * @returns {Promise<boolean>} - True dacă utilizatorul este autentificat
 * 
 * @example
 * ```typescript
 * const isAuth = await isAuthenticated();
 * if (!isAuth) {
 *   return { error: 'Unauthorized' };
 * }
 * ```
 */
export async function isAuthenticated(): Promise<boolean> {
  const { userId } = auth();
  return !!userId;
}

/**
 * Obține userId-ul utilizatorului autentificat.
 * 
 * Folosește această funcție când ai nevoie doar de userId,
 * fără informații complete despre utilizator (mai eficient).
 * 
 * @returns {string | null} - userId-ul utilizatorului sau null
 * 
 * @example
 * ```typescript
 * const userId = getAuthUserId();
 * if (!userId) {
 *   return Response.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export function getAuthUserId(): string | null {
  const { userId } = auth();
  return userId;
}

/**
 * Obține organizația curentă (dacă există).
 * 
 * În viitor, acest lucru poate fi extins pentru suport multi-organizație.
 * 
 * @returns {string | null} - organizationId sau null
 */
export function getAuthOrganizationId(): string | null {
  const { orgId } = auth();
  return orgId || null;
}

/**
 * Necesită autentificare - aruncă eroare dacă utilizatorul nu e autentificat.
 * 
 * Folosește în Server Actions sau Route Handlers unde vrei să forțezi autentificarea.
 * 
 * @throws {Error} - Dacă utilizatorul nu este autentificat
 * 
 * @example
 * ```typescript
 * export async function createCompanyAction(formData: FormData) {
 *   const userId = requireAuth(); // Throws if not authenticated
 *   // ... rest of the logic
 * }
 * ```
 */
export function requireAuth(): string {
  const userId = getAuthUserId();
  
  if (!userId) {
    throw new Error('Autentificare necesară');
  }

  return userId;
}

/**
 * Mapează un utilizator Clerk la tipul FinGuardUser.
 * 
 * @param {User} clerkUser - Utilizatorul din Clerk
 * @returns {FinGuardUser} - Utilizator în formatul FinGuard
 */
function mapClerkUserToFinGuardUser(clerkUser: User): FinGuardUser {
  return {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
    imageUrl: clerkUser.imageUrl,
    createdAt: new Date(clerkUser.createdAt),
  };
}

/**
 * Extrage informații despre utilizator pentru sincronizare în DB.
 * 
 * Această funcție este folosită în webhook-ul Clerk pentru a extrage
 * datele necesare sincronizării cu tabelul users din Supabase.
 * 
 * @param {any} clerkUserData - Date despre utilizator din webhook Clerk
 * @returns {Object} - Date formatate pentru inserare în DB
 */
export function extractUserDataForSync(clerkUserData: any) {
  return {
    clerk_user_id: clerkUserData.id,
    email: clerkUserData.email_addresses?.[0]?.email_address || null,
    first_name: clerkUserData.first_name || null,
    last_name: clerkUserData.last_name || null,
    avatar_url: clerkUserData.image_url || null,
    metadata: {
      created_at: clerkUserData.created_at,
      updated_at: clerkUserData.updated_at,
    },
  };
}
