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

interface ImportRecordWithRelations {
  id: string;
  company_id: string;
  uploaded_by: string;
  source_file_name: string | null;
  file_size_bytes: number | null;
  source_file_url: string | null;
  period_start: string;
  period_end: string;
  status: string;
  error_message: string | null;
  validation_errors: {
    errors?: string[];
    warnings?: string[];
    totals?: {
      totalClosingDebit?: number;
      totalClosingCredit?: number;
    };
  } | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  company: {
    id: string;
    name: string;
    cui: string | null;
    currency: string;
    country_code: string;
  };
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

interface AccountStats {
  closing_debit: number | string | null;
  closing_credit: number | string | null;
}

/**
 * GET /api/imports/[id]
 *
 * Returnează detalii complete despre un import.
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

    const { data: importData, error: importError } = await supabase
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

    if (importError || !importData) {
      if (importError?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Import negăsit' }, { status: 404 });
      }

      console.error('Eroare la obținerea import:', importError);
      return NextResponse.json({ error: 'Eroare la obținerea importului' }, { status: 500 });
    }

    const importRecord = importData as unknown as ImportRecordWithRelations;

    // ============================================================================
    // ETAPA 4: VERIFICARE ACCES LA COMPANIE
    // ============================================================================

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

    // Număr conturi salvate în DB
    const { count: accountsCount, error: countError } = await supabase
      .from('trial_balance_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('import_id', importId);

    if (countError) {
      console.error('Eroare la numărarea conturilor:', countError);
    }

    // Calculează statistici agregare
    const { data: accountsStatsData, error: statsError } = await supabase
      .from('trial_balance_accounts')
      .select('closing_debit, closing_credit')
      .eq('import_id', importId);

    let aggregatedStats = null;
    if (!statsError && accountsStatsData) {
      const accountsStats = accountsStatsData as unknown as AccountStats[];
      
      const totalClosingDebit = accountsStats.reduce(
        (sum, acc) => sum + (parseFloat(acc.closing_debit?.toString() || '0') || 0),
        0
      );
      const totalClosingCredit = accountsStats.reduce(
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

    if (importRecord.source_file_url) {
      try {
        const { data: urlData, error: urlError } = await supabase.storage
          .from('trial-balance-files')
          .createSignedUrl(importRecord.source_file_url, 3600);

        if (!urlError && urlData) {
          signedUrl = urlData.signedUrl;
        }
      } catch (urlError) {
        console.error('Eroare la generarea URL semnat:', urlError);
      }
    }

    // ============================================================================
    // ETAPA 7: RETURNARE REZULTATE
    // ============================================================================

    const validationData = importRecord.validation_errors || {};
    const errors = validationData.errors || [];
    const warnings = validationData.warnings || [];
    const storedTotals = validationData.totals || {};

    return NextResponse.json({
      data: {
        import: {
          id: importRecord.id,
          company_id: importRecord.company_id,
          uploaded_by: importRecord.uploaded_by,
          file_name: importRecord.source_file_name,
          file_size: importRecord.file_size_bytes,
          file_path: importRecord.source_file_url,
          period_start: importRecord.period_start,
          period_end: importRecord.period_end,
          status: importRecord.status,
          error_message: importRecord.error_message,
          has_errors: errors.length > 0,
          has_warnings: warnings.length > 0,
          validation_errors: errors,
          validation_warnings: warnings,
          created_at: importRecord.created_at,
          updated_at: importRecord.updated_at,
          processed_at: importRecord.processed_at,
        },
        company: importRecord.company,
        uploaded_by: {
          id: importRecord.user.id,
          name: importRecord.user.full_name || 'Unknown',
          email: importRecord.user.email,
        },
        statistics: aggregatedStats || {
          total_accounts: accountsCount || 0,
          total_closing_debit: storedTotals.totalClosingDebit || 0,
          total_closing_credit: storedTotals.totalClosingCredit || 0,
          balance_difference: (storedTotals.totalClosingDebit || 0) - (storedTotals.totalClosingCredit || 0),
          is_balanced: true,
        },
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
