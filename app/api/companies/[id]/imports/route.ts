import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth/clerk';
import { getUserByClerkIdServer } from '@/lib/supabase/queries';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * API Route pentru listarea import-urilor unei companii.
 *
 * GET /api/companies/[id]/imports - Listă imports cu paginare și filtrare
 *
 * Necesită autentificare Clerk și acces la companie.
 */

/**
 * GET /api/companies/[id]/imports
 *
 * Returnează lista de imports pentru o companie specifică.
 * Include filtrare după status, perioadă și paginare.
 *
 * Query params:
 * - status: string (optional) - Filtrare după status: pending, processing, completed, failed
 * - year: number (optional) - Filtrare după an (ex: 2024)
 * - month: number (optional) - Filtrare după lună (1-12)
 * - limit: number (optional, default: 50) - Număr rezultate per pagină
 * - offset: number (optional, default: 0) - Offset pentru paginare
 * - sortBy: string (optional, default: 'created_at') - Sortare: created_at, period_start, file_name
 * - sortOrder: string (optional, default: 'desc') - Ordine: asc, desc
 *
 * Response:
 * - data: TrialBalanceImport[]
 * - pagination: { total, limit, offset, hasMore }
 *
 * @example
 * GET /api/companies/550e8400-e29b-41d4-a716-446655440000/imports?status=completed&year=2024&limit=10
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ============================================================================
    // ETAPA 1: VALIDARE AUTENTIFICARE
    // ============================================================================

    const clerkUserId = getAuthUserId();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Autentificare necesară' }, { status: 401 });
    }

    const { data: user, error: userError } = await getUserByClerkIdServer(clerkUserId);
    if (userError || !user) {
      return NextResponse.json({ error: 'Utilizator negăsit în baza de date' }, { status: 404 });
    }

    // ============================================================================
    // ETAPA 2: VALIDARE COMPANY ID
    // ============================================================================

    const companyId = params.id;

    // Validare UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      return NextResponse.json({ error: 'ID companie invalid' }, { status: 400 });
    }

    // ============================================================================
    // ETAPA 3: VERIFICARE ACCES LA COMPANIE
    // ============================================================================

    const supabase = getSupabaseServer();

    const { data: companyAccess, error: accessError } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single();

    if (accessError || !companyAccess) {
      return NextResponse.json(
        { error: 'Nu aveți permisiuni pentru această companie' },
        { status: 403 }
      );
    }

    // ============================================================================
    // ETAPA 4: PARSARE QUERY PARAMETERS
    // ============================================================================

    const { searchParams } = new URL(request.url);

    // Filtre
    const status = searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'failed' | null;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;

    // Paginare
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const offset = parseInt(searchParams.get('offset') || '0');

    // Sortare
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validare sortBy (whitelist pentru securitate)
    const allowedSortFields = ['created_at', 'period_start', 'period_end', 'file_name', 'total_accounts'];
    if (!allowedSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: `sortBy invalid. Valori permise: ${allowedSortFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validare sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      return NextResponse.json(
        { error: 'sortOrder invalid. Valori permise: asc, desc' },
        { status: 400 }
      );
    }

    // Validare month
    if (month !== null && (month < 1 || month > 12)) {
      return NextResponse.json(
        { error: 'month trebuie să fie între 1 și 12' },
        { status: 400 }
      );
    }

    // ============================================================================
    // ETAPA 5: CONSTRUIRE QUERY
    // ============================================================================

    let query = supabase
      .from('trial_balance_imports')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId);

    // Aplică filtre
    if (status) {
      query = query.eq('status', status);
    }

    if (year !== null) {
      // Filtrare după an folosind period_start
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      query = query.gte('period_start', yearStart).lte('period_start', yearEnd);
    }

    if (month !== null && year !== null) {
      // Filtrare după lună (necesită year)
      const monthStr = month.toString().padStart(2, '0');
      const monthStart = `${year}-${monthStr}-01`;
      
      // Calculează ultima zi a lunii
      const lastDay = new Date(year, month, 0).getDate();
      const monthEnd = `${year}-${monthStr}-${lastDay}`;
      
      query = query.gte('period_start', monthStart).lte('period_start', monthEnd);
    }

    // Aplică sortare
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Aplică paginare
    query = query.range(offset, offset + limit - 1);

    // ============================================================================
    // ETAPA 6: EXECUȚIE QUERY
    // ============================================================================

    const { data: imports, error: importsError, count } = await query;

    if (importsError) {
      console.error('Eroare la obținerea imports:', importsError);
      return NextResponse.json(
        { error: 'Eroare la obținerea listei de imports' },
        { status: 500 }
      );
    }

    // ============================================================================
    // ETAPA 7: RETURNARE REZULTATE
    // ============================================================================

    const hasMore = count !== null && offset + limit < count;

    return NextResponse.json({
      data: imports || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      },
      filters: {
        status,
        year,
        month,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Eroare neașteptată în GET /api/companies/[id]/imports:', error);
    return NextResponse.json(
      {
        error: 'Eroare internă de server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
