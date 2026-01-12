import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth/clerk';
import { getUserByClerkIdServer } from '@/lib/supabase/queries';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * API Route pentru listarea conturilor din trial balance import.
 *
 * GET /api/imports/[id]/accounts - Conturi din balanță cu paginare și filtrare
 *
 * Necesită autentificare Clerk și acces la compania asociată.
 */

/**
 * GET /api/imports/[id]/accounts
 *
 * Returnează conturile dintr-o balanță de verificare cu opțiuni de filtrare și paginare.
 *
 * Query params:
 * - account_code: string (optional) - Filtrare după cod cont (partial match, ex: "40" găsește toate conturile care încep cu 40)
 * - account_name: string (optional) - Filtrare după denumire (case-insensitive, partial match)
 * - account_class: string (optional) - Filtrare după clasa contului (1-8)
 * - has_debit: boolean (optional) - Doar conturi cu sold debitor > 0
 * - has_credit: boolean (optional) - Doar conturi cu sold creditor > 0
 * - limit: number (optional, default: 100) - Număr rezultate per pagină
 * - offset: number (optional, default: 0) - Offset pentru paginare
 * - sortBy: string (optional, default: 'account_code') - Sortare: account_code, account_name, closing_debit, closing_credit
 * - sortOrder: string (optional, default: 'asc') - Ordine: asc, desc
 *
 * Response:
 * - data: TrialBalanceAccount[]
 * - pagination: { total, limit, offset, hasMore }
 * - import_summary: { period, total_accounts, total_debit, total_credit }
 *
 * @example
 * GET /api/imports/550e8400-e29b-41d4-a716-446655440000/accounts?account_class=4&has_credit=true&limit=50
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
    // ETAPA 2: VALIDARE IMPORT ID
    // ============================================================================

    const importId = params.id;

    // Validare UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(importId)) {
      return NextResponse.json({ error: 'ID import invalid' }, { status: 400 });
    }

    // ============================================================================
    // ETAPA 3: VERIFICARE EXISTENȚĂ IMPORT ȘI ACCES
    // ============================================================================

    const supabase = getSupabaseServer();

    // Obține import pentru a valida existența și a obține company_id
    // @ts-ignore - Supabase type inference issue
    const { data: importRecord, error: importError } = await supabase
      .from('trial_balance_imports')
      .select('id, company_id, period_start, period_end, validation_errors')
      .eq('id', importId)
      .single();

    if (importError || !importRecord) {
      if (importError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Import negăsit' }, { status: 404 });
      }

      console.error('Eroare la obținerea import:', importError);
      return NextResponse.json({ error: 'Eroare la obținerea importului' }, { status: 500 });
    }

    // Verifică acces la companie
    const { data: companyAccess, error: accessError } = await supabase
      .from('company_users')
      .select('role')
      // @ts-ignore - Supabase type inference issue
      .eq('company_id', importRecord.company_id)
      .eq('user_id', user.id)
      .single();

    if (accessError || !companyAccess) {
      return NextResponse.json(
        { error: 'Nu aveți permisiuni pentru acest import' },
        { status: 403 }
      );
    }

    // ============================================================================
    // ETAPA 4: PARSARE QUERY PARAMETERS
    // ============================================================================

    const { searchParams } = new URL(request.url);

    // Filtre
    const accountCode = searchParams.get('account_code');
    const accountName = searchParams.get('account_name');
    const accountClass = searchParams.get('account_class');
    const hasDebit = searchParams.get('has_debit') === 'true';
    const hasCredit = searchParams.get('has_credit') === 'true';

    // Paginare
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500); // Max 500
    const offset = parseInt(searchParams.get('offset') || '0');

    // Sortare
    const sortBy = searchParams.get('sortBy') || 'account_code';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Validare sortBy (whitelist pentru securitate)
    const allowedSortFields = [
      'account_code',
      'account_name',
      'opening_debit',
      'opening_credit',
      'debit_turnover',
      'credit_turnover',
      'closing_debit',
      'closing_credit',
    ];
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

    // Validare accountClass
    if (accountClass && !/^[1-8]$/.test(accountClass)) {
      return NextResponse.json(
        { error: 'account_class trebuie să fie între 1 și 8' },
        { status: 400 }
      );
    }

    // ============================================================================
    // ETAPA 5: CONSTRUIRE QUERY
    // ============================================================================

    // @ts-ignore - Supabase type inference issue
    let query = supabase
      .from('trial_balance_accounts')
      .select('*', { count: 'exact' })
      .eq('import_id', importId);

    // Aplică filtre
    if (accountCode) {
      // Filtrare parțială (prefix match)
      query = query.like('account_code', `${accountCode}%`);
    }

    if (accountName) {
      // Filtrare case-insensitive pe denumire (folosește ilike pentru PostgreSQL)
      query = query.ilike('account_name', `%${accountName}%`);
    }

    if (accountClass) {
      // Filtrare după clasa contului (primul caracter din cod)
      query = query.like('account_code', `${accountClass}%`);
    }

    if (hasDebit) {
      // Doar conturi cu sold debitor > 0
      query = query.gt('closing_debit', 0);
    }

    if (hasCredit) {
      // Doar conturi cu sold creditor > 0
      query = query.gt('closing_credit', 0);
    }

    // Aplică sortare
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Aplică paginare
    query = query.range(offset, offset + limit - 1);

    // ============================================================================
    // ETAPA 6: EXECUȚIE QUERY
    // ============================================================================

    const { data: accounts, error: accountsError, count } = await query;

    if (accountsError) {
      console.error('Eroare la obținerea conturilor:', accountsError);
      return NextResponse.json(
        { error: 'Eroare la obținerea conturilor din balanță' },
        { status: 500 }
      );
    }

    // ============================================================================
    // ETAPA 7: CALCUL TOTALURI PENTRU PAGINA CURENTĂ
    // ============================================================================

    let pageTotals = null;
    if (accounts && accounts.length > 0) {
      // @ts-ignore - Supabase type inference issue
      const totalOpeningDebit = accounts.reduce(
        // @ts-ignore - Supabase type inference issue
        (sum, acc) => sum + (parseFloat(acc.opening_debit?.toString() || '0') || 0),
        0
      );
      // @ts-ignore - Supabase type inference issue
      const totalOpeningCredit = accounts.reduce(
        // @ts-ignore - Supabase type inference issue
        (sum, acc) => sum + (parseFloat(acc.opening_credit?.toString() || '0') || 0),
        0
      );
      // @ts-ignore - Supabase type inference issue
      const totalDebitTurnover = accounts.reduce(
        // @ts-ignore - Supabase type inference issue
        (sum, acc) => sum + (parseFloat(acc.debit_turnover?.toString() || '0') || 0),
        0
      );
      // @ts-ignore - Supabase type inference issue
      const totalCreditTurnover = accounts.reduce(
        // @ts-ignore - Supabase type inference issue
        (sum, acc) => sum + (parseFloat(acc.credit_turnover?.toString() || '0') || 0),
        0
      );
      // @ts-ignore - Supabase type inference issue
      const totalClosingDebit = accounts.reduce(
        // @ts-ignore - Supabase type inference issue
        (sum, acc) => sum + (parseFloat(acc.closing_debit?.toString() || '0') || 0),
        0
      );
      // @ts-ignore - Supabase type inference issue
      const totalClosingCredit = accounts.reduce(
        // @ts-ignore - Supabase type inference issue
        (sum, acc) => sum + (parseFloat(acc.closing_credit?.toString() || '0') || 0),
        0
      );

      pageTotals = {
        opening_debit: totalOpeningDebit,
        opening_credit: totalOpeningCredit,
        debit_turnover: totalDebitTurnover,
        credit_turnover: totalCreditTurnover,
        closing_debit: totalClosingDebit,
        closing_credit: totalClosingCredit,
      };
    }

    // ============================================================================
    // ETAPA 8: RETURNARE REZULTATE
    // ============================================================================

    const hasMore = count !== null && offset + limit < count;

    return NextResponse.json({
      data: accounts || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      },
      filters: {
        account_code: accountCode,
        account_name: accountName,
        account_class: accountClass,
        has_debit: hasDebit || null,
        has_credit: hasCredit || null,
        sortBy,
        sortOrder,
      },
      import_summary: {
        // @ts-ignore - Supabase type inference issue
        import_id: importRecord.id,
        // @ts-ignore - Supabase type inference issue
        period_start: importRecord.period_start,
        // @ts-ignore - Supabase type inference issue
        period_end: importRecord.period_end,
        total_accounts: count || 0,
        // @ts-ignore - Supabase type inference issue
        total_debit: ((importRecord.validation_errors as any)?.totals?.totalClosingDebit) || 0,
        // @ts-ignore - Supabase type inference issue
        total_credit: ((importRecord.validation_errors as any)?.totals?.totalClosingCredit) || 0,
      },
      page_totals: pageTotals,
    });
  } catch (error) {
    console.error('Eroare neașteptată în GET /api/imports/[id]/accounts:', error);
    return NextResponse.json(
      {
        error: 'Eroare internă de server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
