import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth/clerk';
import { getUserByClerkIdServer } from '@/lib/supabase/queries';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * API Route pentru detalii import trial balance.
 *
 * GET /api/imports/[id] - Detalii complete import cu statistici
 *
 * Necesită autentificare Clerk și acces la compania asociată.
 */

/**
 * GET /api/imports/[id]
 *
 * Returnează detalii complete despre un import, incluzând:
 * - Metadata fișier
 * - Status procesare
 * - Rezultate validare
 * - Statistici (totaluri, număr conturi)
 * - Erori și avertismente
 * - Informații despre companie și utilizator
 *
 * Response:
 * - import: Trial Balance Import record
 * - company: Company info (name, cui)
 * - uploaded_by: User info (name, email)
 * - statistics: Agregări și totaluri
 * - signed_url: URL temporar pentru descărcare fișier (expiră după 1h)
 *
 * @example
 * GET /api/imports/550e8400-e29b-41d4-a716-446655440000
 */
export async function GET(
  _request: NextRequest,
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
    // ETAPA 3: OBȚINE IMPORT DIN DB
    // ============================================================================

    const supabase = getSupabaseServer();

    // @ts-ignore - Supabase type inference issue with nested relations
    const { data: importRecord, error: importError } = await supabase
      .from('trial_balance_imports')
      .select(
        `
        *,
        company:companies!trial_balance_imports_company_id_fkey(
          id,
          name,
          cui,
          currency,
          country_code
        ),
        user:users!trial_balance_imports_uploaded_by_fkey(
          id,
          full_name,
          email
        )
      `
      )
      .eq('id', importId)
      .single();

    if (importError || !importRecord) {
      if (importError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Import negăsit' }, { status: 404 });
      }

      console.error('Eroare la obținerea import:', importError);
      return NextResponse.json({ error: 'Eroare la obținerea importului' }, { status: 500 });
    }

    // ============================================================================
    // ETAPA 4: VERIFICARE ACCES LA COMPANIE
    // ============================================================================

    // @ts-ignore - Supabase type inference issue
    const companyId = importRecord.company_id;

    const { data: companyAccess, error: accessError } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single();

    if (accessError || !companyAccess) {
      return NextResponse.json(
        { error: 'Nu aveți permisiuni pentru acest import' },
        { status: 403 }
      );
    }

    // ============================================================================
    // ETAPA 5: OBȚINE STATISTICI SUPLIMENTARE
    // ============================================================================

    // Număr conturi salvate în DB (pentru verificare integritate)
    const { count: accountsCount, error: countError } = await supabase
      .from('trial_balance_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('import_id', importId);

    if (countError) {
      console.error('Eroare la numărarea conturilor:', countError);
    }

    // Calculează statistici agregare
    // @ts-ignore - Supabase type inference issue
    const { data: accountsStats, error: statsError } = await supabase
      .from('trial_balance_accounts')
      .select('closing_debit, closing_credit')
      .eq('import_id', importId);

    let aggregatedStats = null;
    if (!statsError && accountsStats) {
      // @ts-ignore - Supabase type inference issue
      const totalClosingDebit = accountsStats.reduce(
        // @ts-ignore - Supabase type inference issue
        (sum, acc) => sum + (parseFloat(acc.closing_debit?.toString() || '0') || 0),
        0
      );
      // @ts-ignore - Supabase type inference issue
      const totalClosingCredit = accountsStats.reduce(
        // @ts-ignore - Supabase type inference issue
        (sum, acc) => sum + (parseFloat(acc.closing_credit?.toString() || '0') || 0),
        0
      );
      const balance = totalClosingDebit - totalClosingCredit;

      aggregatedStats = {
        total_accounts: accountsCount || 0,
        total_closing_debit: totalClosingDebit,
        total_closing_credit: totalClosingCredit,
        balance_difference: balance,
        is_balanced: Math.abs(balance) <= 1, // Toleranță 1 RON
      };
    }

    // ============================================================================
    // ETAPA 6: GENERARE SIGNED URL PENTRU FIȘIER
    // ============================================================================

    let signedUrl = null;

    // @ts-ignore - Supabase type inference issue
    if (importRecord.source_file_url) {
      try {
        // @ts-ignore - Supabase type inference issue
        const { data: urlData, error: urlError } = await supabase.storage
          .from('trial-balance-files')
          // @ts-ignore - Supabase type inference issue
          .createSignedUrl(importRecord.source_file_url, 3600); // Expiră după 1 oră

        if (!urlError && urlData) {
          signedUrl = urlData.signedUrl;
        }
      } catch (urlError) {
        console.error('Eroare la generarea URL semnat:', urlError);
        // Nu bloca operațiunea dacă generarea URL eșuează
      }
    }

    // ============================================================================
    // ETAPA 7: RETURNARE REZULTATE
    // ============================================================================

    // Extract validation data from JSONB
    // @ts-ignore - Supabase type inference issue
    const validationData = (importRecord.validation_errors as any) || {};
    const errors = validationData.errors || [];
    const warnings = validationData.warnings || [];
    const storedTotals = validationData.totals || {};

    return NextResponse.json({
      data: {
        // Import details
        import: {
          // @ts-ignore - Supabase type inference issue
          id: importRecord.id,
          // @ts-ignore - Supabase type inference issue
          company_id: importRecord.company_id,
          // @ts-ignore - Supabase type inference issue
          uploaded_by: importRecord.uploaded_by,
          // @ts-ignore - Supabase type inference issue
          file_name: importRecord.source_file_name,
          // @ts-ignore - Supabase type inference issue
          file_size: importRecord.file_size_bytes,
          // @ts-ignore - Supabase type inference issue
          file_path: importRecord.source_file_url,
          // @ts-ignore - Supabase type inference issue
          period_start: importRecord.period_start,
          // @ts-ignore - Supabase type inference issue
          period_end: importRecord.period_end,
          // @ts-ignore - Supabase type inference issue
          status: importRecord.status,
          // @ts-ignore - Supabase type inference issue
          error_message: importRecord.error_message,
          has_errors: errors.length > 0,
          has_warnings: warnings.length > 0,
          validation_errors: errors,
          validation_warnings: warnings,
          // @ts-ignore - Supabase type inference issue
          created_at: importRecord.created_at,
          // @ts-ignore - Supabase type inference issue
          updated_at: importRecord.updated_at,
          // @ts-ignore - Supabase type inference issue
          processed_at: importRecord.processed_at,
        },

        // Company info
        // @ts-ignore - Supabase type inference pentru nested relations
        company: importRecord.company,

        // Uploaded by
        uploaded_by: {
          // @ts-ignore - Supabase type inference pentru nested relations
          id: importRecord.user.id,
          // @ts-ignore - Supabase type inference pentru nested relations
          name: importRecord.user.full_name || 'Unknown',
          // @ts-ignore - Supabase type inference pentru nested relations
          email: importRecord.user.email,
        },

        // Statistics
        statistics: aggregatedStats || {
          total_accounts: accountsCount || 0,
          total_closing_debit: storedTotals.totalClosingDebit || 0,
          total_closing_credit: storedTotals.totalClosingCredit || 0,
          balance_difference: (storedTotals.totalClosingDebit || 0) - (storedTotals.totalClosingCredit || 0),
          is_balanced: true,
        },

        // Download URL
        signed_url: signedUrl,
      },
    });
  } catch (error) {
    console.error('Eroare neașteptată în GET /api/imports/[id]:', error);
    return NextResponse.json(
      {
        error: 'Eroare internă de server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
