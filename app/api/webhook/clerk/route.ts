import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { extractUserDataForSync } from '@/lib/auth/clerk';

/**
 * Webhook handler pentru sincronizarea utilizatorilor Clerk cu baza de date Supabase.
 * 
 * Acest endpoint gestionează evenimentele:
 * - user.created: Creează utilizator nou în DB
 * - user.updated: Actualizează datele utilizatorului
 * - user.deleted: Marchează utilizatorul ca șters (soft delete)
 * 
 * Configurare în Clerk Dashboard:
 * 1. Webhooks → Add Endpoint
 * 2. URL: https://your-domain.com/api/webhook/clerk
 * 3. Subscribe to events: user.created, user.updated, user.deleted
 * 4. Copiază Signing Secret în CLERK_WEBHOOK_SECRET
 * 
 * @see https://clerk.com/docs/integrations/webhooks
 */

/**
 * Handler POST pentru webhook-ul Clerk.
 * 
 * Verifică semnătura webhook-ului și procesează evenimentele de utilizator.
 */
export async function POST(req: Request) {
  // Obține webhook secret din variabile de mediu
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET nu este setat în variabilele de mediu');
    return Response.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Obține header-ele necesare pentru verificarea semnăturii
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // Verifică dacă toate header-ele sunt prezente
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Header-e webhook lipsă');
    return Response.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Obține body-ul raw
  const payload = await req.text();

  // Creează un nou Svix webhook pentru verificare
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verifică semnătura webhook-ului
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Eroare la verificarea semnăturii webhook:', err);
    return Response.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Procesează evenimentul
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;

      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;

      default:
        console.log(`Eveniment neprocesat: ${eventType}`);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(`Eroare la procesarea evenimentului ${eventType}:`, error);
    return Response.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

/**
 * Gestionează crearea unui utilizator nou.
 * 
 * @param {any} userData - Date despre utilizator din Clerk
 */
async function handleUserCreated(userData: any) {
  const userDataForSync = extractUserDataForSync(userData);

  // Calculează data de expirare a trial-ului (14 zile de la înregistrare)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (getSupabaseServer().from('users') as any).insert({
      clerk_user_id: userDataForSync.clerk_user_id,
      email: userDataForSync.email,
      first_name: userDataForSync.first_name,
      last_name: userDataForSync.last_name,
      avatar_url: userDataForSync.avatar_url,
      subscription_tier: 'free',
      subscription_status: 'trial',
      trial_ends_at: trialEndsAt.toISOString(),
      metadata: userDataForSync.metadata,
      last_login_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Eroare la crearea utilizatorului în DB:', error);
    throw error;
  }

  console.log(`✅ Utilizator creat în DB: ${userDataForSync.email}`);
}

/**
 * Gestionează actualizarea datelor unui utilizator.
 * 
 * @param {any} userData - Date actualizate despre utilizator din Clerk
 */
async function handleUserUpdated(userData: any) {
  const userDataForSync = extractUserDataForSync(userData);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (getSupabaseServer().from('users') as any).update({
      email: userDataForSync.email,
      first_name: userDataForSync.first_name,
      last_name: userDataForSync.last_name,
      avatar_url: userDataForSync.avatar_url,
      metadata: userDataForSync.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', userDataForSync.clerk_user_id);

  if (error) {
    console.error('Eroare la actualizarea utilizatorului în DB:', error);
    throw error;
  }

  console.log(`✅ Utilizator actualizat în DB: ${userDataForSync.email}`);
}

/**
 * Gestionează ștergerea unui utilizator.
 * 
 * În loc de hard delete, putem face soft delete sau păstra recordul pentru audit.
 * 
 * @param {any} userData - Date despre utilizatorul șters din Clerk
 */
async function handleUserDeleted(userData: any) {
  const clerkUserId = userData.id;

  // Opțional: Soft delete - marchează utilizatorul ca șters
  // În loc să ștergem recordul, actualizăm statusul
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (getSupabaseServer().from('users') as any).update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('Eroare la ștergerea utilizatorului din DB:', error);
    throw error;
  }

  console.log(`✅ Utilizator marcat ca șters în DB: ${clerkUserId}`);

  // Alternativ: Hard delete - elimină complet recordul
  // const { error } = await supabaseServer
  //   .from('users')
  //   .delete()
  //   .eq('clerk_user_id', clerkUserId);
}
