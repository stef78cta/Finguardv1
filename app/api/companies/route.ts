import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth/clerk';
import { getUserCompanies, createCompany, deleteCompany } from '@/lib/supabase/queries';
import { getUserByClerkIdServer } from '@/lib/supabase/queries';
import { logActivityServer } from '@/lib/supabase/queries';
import type { TablesInsert } from '@/types/database';

/**
 * API Route pentru gestionarea companiilor.
 *
 * GET /api/companies - Listează toate companiile utilizatorului autentificat
 * POST /api/companies - Creează o companie nouă
 *
 * Ambele endpoint-uri necesită autentificare Clerk.
 */

/**
 * GET /api/companies
 *
 * Returnează lista de companii la care utilizatorul are acces.
 * Include filtre opționale pentru status și rol.
 *
 * Query params:
 * - activeOnly: boolean (optional) - returnează doar companiile active
 * - role: string (optional) - filtrează după rolul utilizatorului (owner, admin, member, viewer)
 *
 * @example
 * GET /api/companies?activeOnly=true&role=owner
 */
export async function GET(request: NextRequest) {
  try {
    // Verifică autentificarea
    const clerkUserId = getAuthUserId();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Autentificare necesară' }, { status: 401 });
    }

    // Obține userId din Supabase folosind clerk_user_id
    const { data: user, error: userError } = await getUserByClerkIdServer(clerkUserId);
    if (userError || !user) {
      return NextResponse.json({ error: 'Utilizator negăsit în baza de date' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const role = searchParams.get('role') as 'owner' | 'admin' | 'member' | 'viewer' | null;

    // Obține companiile utilizatorului
    const { data: companies, error: companiesError } = await getUserCompanies(user.id, {
      activeOnly,
      role: role || undefined,
    });

    if (companiesError) {
      console.error('Eroare la obținerea companiilor:', companiesError);
      return NextResponse.json({ error: 'Eroare la obținerea companiilor' }, { status: 500 });
    }

    return NextResponse.json({
      data: companies,
      count: companies?.length || 0,
    });
  } catch (error) {
    console.error('Eroare neașteptată în GET /api/companies:', error);
    return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 });
  }
}

/**
 * POST /api/companies
 *
 * Creează o companie nouă și adaugă utilizatorul curent ca owner.
 *
 * Body (JSON):
 * - name: string (required) - Numele companiei
 * - cui: string (required) - Codul Unic de Înregistrare (CUI)
 * - country_code: string (optional, default: 'RO') - Codul țării
 * - currency: string (optional, default: 'RON') - Moneda utilizată
 * - fiscal_year_start_month: number (optional, default: 1) - Luna de început an fiscal (1-12)
 * - address: string (optional) - Adresa companiei
 * - phone: string (optional) - Număr de telefon
 * - logo_url: string (optional) - URL logo companie
 *
 * @example
 * POST /api/companies
 * {
 *   "name": "ACME SRL",
 *   "cui": "12345678",
 *   "country_code": "RO",
 *   "currency": "RON"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verifică autentificarea
    const clerkUserId = getAuthUserId();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Autentificare necesară' }, { status: 401 });
    }

    // Obține userId din Supabase
    const { data: user, error: userError } = await getUserByClerkIdServer(clerkUserId);
    if (userError || !user) {
      return NextResponse.json({ error: 'Utilizator negăsit în baza de date' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();

    // Validare date obligatorii
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Numele companiei este obligatoriu' }, { status: 400 });
    }

    if (!body.cui || typeof body.cui !== 'string' || body.cui.trim().length === 0) {
      return NextResponse.json({ error: 'CUI-ul este obligatoriu' }, { status: 400 });
    }

    // Validare CUI (doar cifre sau RO prefix pentru companiile românești)
    const cuiPattern = /^(RO)?[0-9]+$/;
    if (!cuiPattern.test(body.cui.trim())) {
      return NextResponse.json(
        { error: 'CUI-ul trebuie să conțină doar cifre (opțional cu prefix RO)' },
        { status: 400 }
      );
    }

    // Validare fiscal_year_start_month (trebuie să fie între 1 și 12)
    if (body.fiscal_year_start_month !== undefined) {
      const month = Number(body.fiscal_year_start_month);
      if (isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json(
          { error: 'Luna de început an fiscal trebuie să fie între 1 și 12' },
          { status: 400 }
        );
      }
    }

    // Pregătește datele pentru creare companie
    const companyData: TablesInsert<'companies'> = {
      name: body.name.trim(),
      cui: body.cui.trim().toUpperCase(),
      country_code: body.country_code || 'RO',
      currency: body.currency || 'RON',
      fiscal_year_start_month: body.fiscal_year_start_month || 1,
      address: body.address?.trim() || null,
      phone: body.phone?.trim() || null,
      logo_url: body.logo_url?.trim() || null,
      is_active: true,
    };

    // Creează compania
    const { data: company, error: createError } = await createCompany(companyData);

    if (createError || !company) {
      console.error('Eroare la crearea companiei:', createError);

      // Verifică dacă este eroare de duplicat CUI
      if (createError?.message?.includes('duplicate') || createError?.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'O companie cu acest CUI există deja în sistem' },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: 'Eroare la crearea companiei' }, { status: 500 });
    }

    // Adaugă utilizatorul ca owner la companie (folosind service role pentru bypass RLS)
    const { getSupabaseServer } = await import('@/lib/supabase/server');
    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: relationError } = await (supabase.from('company_users') as any).insert({
      company_id: company.id,
      user_id: user.id,
      role: 'owner',
    });

    if (relationError) {
      console.error('Eroare critică la adăugarea relației user-company:', relationError);

      // ROLLBACK: Șterge compania creată pentru a preveni companii orfane
      // Relația user-company este critică - fără ea, utilizatorul nu poate accesa compania
      const { error: deleteError } = await deleteCompany(company.id);

      if (deleteError) {
        console.error('Eroare critică la rollback (ștergere companie):', deleteError);
        // Situație critică: compania va rămâne orfană în DB
        // Necesită intervenție manuală pentru curățare
        return NextResponse.json(
          {
            error: 'Eroare critică la crearea companiei. Operațiunea nu a fost finalizată.',
            details: 'Compania poate fi orfană în sistem. Contactează suportul.',
            orphanedCompanyId: company.id,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: 'Eroare la configurarea companiei. Operațiunea a fost anulată.',
          details: 'Nu s-a putut stabili relația utilizator-companie.',
        },
        { status: 500 }
      );
    }

    // Logare activitate (best effort - nu trebuie să blocheze operațiunea principală)
    try {
      await logActivityServer({
        user_id: user.id,
        company_id: company.id,
        action: 'company.create',
        entity_type: 'company',
        entity_id: company.id,
        new_values: companyData as any,
        ip_address:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      });
    } catch (auditError) {
      // Logăm eroarea dar continuăm operațiunea
      // Audit logging-ul nu trebuie să blocheze crearea companiei
      console.error('AUDIT LOG FAILED pentru company.create:', auditError);
      // TODO: Implementează retry mechanism sau alerting pentru audit failures
    }

    return NextResponse.json(
      {
        data: company,
        message: 'Companie creată cu succes',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Eroare neașteptată în POST /api/companies:', error);
    return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 });
  }
}
