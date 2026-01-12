import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth/clerk';
import { 
  getCompanyById, 
  updateCompany, 
  deleteCompany,
  getUserByClerkIdServer,
  logActivityServer 
} from '@/lib/supabase/queries';
import type { TablesUpdate } from '@/types/database';

/**
 * API Route pentru operațiuni pe o companie specifică.
 * 
 * GET /api/companies/[id] - Obține detalii despre o companie
 * PUT /api/companies/[id] - Actualizează o companie
 * DELETE /api/companies/[id] - Șterge o companie
 * 
 * Toate endpoint-urile necesită autentificare și verifică dacă utilizatorul
 * are acces la compania respectivă (prin tabela company_users).
 */

/**
 * Verifică dacă utilizatorul are acces la companie și rolul său.
 * 
 * @param userId - UUID-ul utilizatorului din Supabase
 * @param companyId - UUID-ul companiei
 * @returns Object cu hasAccess boolean și role string sau null
 */
async function checkUserCompanyAccess(
  userId: string,
  companyId: string
): Promise<{ hasAccess: boolean; role: string | null; companyUserId?: string }> {
  try {
    const { getSupabaseServer } = await import('@/lib/supabase/server');
    const supabase = getSupabaseServer();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('company_users') as any)
      .select('role, id')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();

    if (error || !data) {
      return { hasAccess: false, role: null };
    }

    return { 
      hasAccess: true, 
      role: data.role,
      companyUserId: data.id 
    };
  } catch (error) {
    console.error('Eroare la verificarea accesului:', error);
    return { hasAccess: false, role: null };
  }
}

/**
 * GET /api/companies/[id]
 * 
 * Returnează detalii despre o companie specifică.
 * Utilizatorul trebuie să aibă acces la compania respectivă.
 * 
 * @example
 * GET /api/companies/550e8400-e29b-41d4-a716-446655440000
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifică autentificarea
    const clerkUserId = getAuthUserId();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Autentificare necesară' },
        { status: 401 }
      );
    }

    // Obține userId din Supabase
    const { data: user, error: userError } = await getUserByClerkIdServer(clerkUserId);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilizator negăsit în baza de date' },
        { status: 404 }
      );
    }

    const companyId = params.id;

    // Verifică dacă utilizatorul are acces la companie
    const { hasAccess, role } = await checkUserCompanyAccess(user.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Nu aveți acces la această companie' },
        { status: 403 }
      );
    }

    // Obține datele companiei
    const { data: company, error: companyError } = await getCompanyById(companyId);

    if (companyError || !company) {
      console.error('Eroare la obținerea companiei:', companyError);
      return NextResponse.json(
        { error: 'Companie negăsită' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: company,
      userRole: role,
    });
  } catch (error) {
    console.error('Eroare neașteptată în GET /api/companies/[id]:', error);
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/companies/[id]
 * 
 * Actualizează o companie existentă.
 * Utilizatorul trebuie să aibă rol de 'owner' sau 'admin' pentru a actualiza.
 * 
 * Body (JSON) - toate câmpurile sunt opționale:
 * - name: string - Numele companiei
 * - cui: string - CUI
 * - country_code: string - Codul țării
 * - currency: string - Moneda
 * - fiscal_year_start_month: number - Luna de început an fiscal
 * - address: string - Adresa
 * - phone: string - Telefon
 * - logo_url: string - URL logo
 * - is_active: boolean - Status activ/inactiv
 * 
 * @example
 * PUT /api/companies/550e8400-e29b-41d4-a716-446655440000
 * { "name": "ACME SRL Updated" }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifică autentificarea
    const clerkUserId = getAuthUserId();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Autentificare necesară' },
        { status: 401 }
      );
    }

    // Obține userId din Supabase
    const { data: user, error: userError } = await getUserByClerkIdServer(clerkUserId);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilizator negăsit în baza de date' },
        { status: 404 }
      );
    }

    const companyId = params.id;

    // Verifică dacă utilizatorul are acces și rol adecvat
    const { hasAccess, role } = await checkUserCompanyAccess(user.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Nu aveți acces la această companie' },
        { status: 403 }
      );
    }

    // Doar owner și admin pot actualiza
    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Nu aveți permisiunea de a actualiza această companie' },
        { status: 403 }
      );
    }

    // Obține compania curentă pentru logging
    const { data: oldCompany } = await getCompanyById(companyId);

    // Parse request body
    const body = await request.json();

    // Validare date
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Numele companiei nu poate fi gol' },
          { status: 400 }
        );
      }
    }

    if (body.cui !== undefined) {
      if (typeof body.cui !== 'string' || body.cui.trim().length === 0) {
        return NextResponse.json(
          { error: 'CUI-ul nu poate fi gol' },
          { status: 400 }
        );
      }
      const cuiPattern = /^(RO)?[0-9]+$/;
      if (!cuiPattern.test(body.cui.trim())) {
        return NextResponse.json(
          { error: 'CUI-ul trebuie să conțină doar cifre (opțional cu prefix RO)' },
          { status: 400 }
        );
      }
    }

    if (body.fiscal_year_start_month !== undefined) {
      const month = Number(body.fiscal_year_start_month);
      if (isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json(
          { error: 'Luna de început an fiscal trebuie să fie între 1 și 12' },
          { status: 400 }
        );
      }
    }

    // Pregătește datele pentru update
    const updates: TablesUpdate<'companies'> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.cui !== undefined) updates.cui = body.cui.trim().toUpperCase();
    if (body.country_code !== undefined) updates.country_code = body.country_code;
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.fiscal_year_start_month !== undefined) {
      updates.fiscal_year_start_month = body.fiscal_year_start_month;
    }
    if (body.address !== undefined) updates.address = body.address?.trim() || null;
    if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url?.trim() || null;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    // Actualizează compania
    const { data: company, error: updateError } = await updateCompany(companyId, updates);

    if (updateError || !company) {
      console.error('Eroare la actualizarea companiei:', updateError);

      // Verifică dacă este eroare de duplicat CUI
      if (updateError?.message?.includes('duplicate') || 
          updateError?.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'O companie cu acest CUI există deja în sistem' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Eroare la actualizarea companiei' },
        { status: 500 }
      );
    }

    // Logare activitate
    await logActivityServer({
      user_id: user.id,
      company_id: companyId,
      action: 'company.update',
      entity_type: 'company',
      entity_id: companyId,
      old_values: oldCompany as any,
      new_values: updates as any,
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  null,
      user_agent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      data: company,
      message: 'Companie actualizată cu succes',
    });
  } catch (error) {
    console.error('Eroare neașteptată în PUT /api/companies/[id]:', error);
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/companies/[id]
 * 
 * Șterge o companie.
 * Doar utilizatorii cu rol 'owner' pot șterge o companie.
 * 
 * ATENȚIE: Această operațiune este DESTRUCTIVĂ și va șterge:
 * - Relațiile user-company
 * - Importurile de balanță asociate
 * - KPI-urile calculate
 * - Rapoartele generate
 * - Toate datele asociate companiei
 * 
 * @example
 * DELETE /api/companies/550e8400-e29b-41d4-a716-446655440000
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verifică autentificarea
    const clerkUserId = getAuthUserId();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Autentificare necesară' },
        { status: 401 }
      );
    }

    // Obține userId din Supabase
    const { data: user, error: userError } = await getUserByClerkIdServer(clerkUserId);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Utilizator negăsit în baza de date' },
        { status: 404 }
      );
    }

    const companyId = params.id;

    // Verifică dacă utilizatorul are acces și rol adecvat
    const { hasAccess, role } = await checkUserCompanyAccess(user.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Nu aveți acces la această companie' },
        { status: 403 }
      );
    }

    // Doar owner poate șterge
    if (role !== 'owner') {
      return NextResponse.json(
        { error: 'Doar proprietarul poate șterge compania' },
        { status: 403 }
      );
    }

    // Obține compania pentru logging
    const { data: company } = await getCompanyById(companyId);

    // Șterge compania
    const { data: success, error: deleteError } = await deleteCompany(companyId);

    if (deleteError || !success) {
      console.error('Eroare la ștergerea companiei:', deleteError);
      return NextResponse.json(
        { error: 'Eroare la ștergerea companiei' },
        { status: 500 }
      );
    }

    // Logare activitate
    await logActivityServer({
      user_id: user.id,
      company_id: companyId,
      action: 'company.delete',
      entity_type: 'company',
      entity_id: companyId,
      old_values: company as any,
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  null,
      user_agent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Companie ștearsă cu succes',
    });
  } catch (error) {
    console.error('Eroare neașteptată în DELETE /api/companies/[id]:', error);
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    );
  }
}
