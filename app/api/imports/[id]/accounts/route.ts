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

interface ImportRecord {
  id: string;
  company_id: string;
  period_start: string;
  period_end: string;
  validation_errors: {
    totals?: {
      totalClosingDebit?: number;
      totalClosingCredit?: number;
    };
  } | null;
}

interface AccountRecord {
  opening_debit: number | string | null;
  opening_credit: number | string | null;
  debit_turnover: number | string | null;
  credit_turnover: number | string | null;
  closing_debit: number | string | null;
  closing_credit: number | string | null;
}

/**
 * GET /api/imports/[id]/accounts
 *
 * Returnează conturile dintr-o balanță de verificare cu opțiuni de filtrare și paginare.
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
    const { data: importData, error: importError } = await supabase
      .from('trial_balance_imports')
      .select('id, company_id, period_start, period_end, validation_errors')
      .eq('id', importId)
      .single();

    if (importError || !importData) {
      if (importError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Import negăsit' }, { status: 404 });
      }

      console.error('Eroare la obținerea import:', importError);
      return NextResponse.json({ error: 'Eroare la obținerea importului' }, { status: 500 });
    }

    const importRecord = importData as unknown as ImportRecord;

    // Verifică acces la companie
    const { data: companyAccess, error: accessError } = await supabase
      .from('company_users')
      .select('role')
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

    let query = supabase
      .from('trial_balance_accounts')
      .select('*', { count: 'exact' })
      .eq('import_id', importId);

    // Aplică filtre
    if (accountCode) {
      query = query.like('account_code', `${accountCode}%`);
    }

    if (accountName) {
      query = query.ilike('account_name', `%${accountName}%`);
    }

    if (accountClass) {
      query = query.like('account_code', `${accountClass}%`);
    }

    if (hasDebit) {
      query = query.gt('closing_debit', 0);
    }

    if (hasCredit) {
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
      const typedAccounts = accounts as unknown as AccountRecord[];
      
      const totalOpeningDebit = typedAccounts.reduce(
        (sum, acc) => sum + (parseFloat(acc.opening_debit?.toString() || '0') || 0),
        0
      );
      const totalOpeningCredit = typedAccounts.reduce(
        (sum, acc) => sum + (parseFloat(acc.opening_credit?.toString() || '0') || 0),
        0
      );
      const totalDebitTurnover = typedAccounts.reduce(
        (sum, acc) => sum + (parseFloat(acc.debit_turnover?.toString() || '0') || 0),
        0
      );
      const totalCreditTurnover = typedAccounts.reduce(
        (sum, acc) => sum + (parseFloat(acc.credit_turnover?.toString() || '0') || 0),
        0
      );
      const totalClosingDebit = typedAccounts.reduce(
        (sum, acc) => sum + (parseFloat(acc.closing_debit?.toString() || '0') || 0),
        0
      );
      const totalClosingCredit = typedAccounts.reduce(
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
        import_id: importRecord.id,
        period_start: importRecord.period_start,
        period_end: importRecord.period_end,
        total_accounts: count || 0,
        total_debit: importRecord.validation_errors?.totals?.totalClosingDebit || 0,
        total_credit: importRecord.validation_errors?.totals?.totalClosingCredit || 0,
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
