import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth/clerk';
import { getUserByClerkIdServer, logActivityServer } from '@/lib/supabase/queries';
import { getSupabaseServer } from '@/lib/supabase/server';
import { processTrialBalance } from '@/lib/processing';
import { generateStoragePath, STORAGE_LIMITS } from '@/lib/supabase/storage';
import type { TablesInsert } from '@/types/database';

/**
 * API Route pentru upload și procesare trial balance.
 *
 * POST /api/upload - Upload fișier Excel/CSV, procesare, validare și salvare în DB
 *
 * Necesită autentificare Clerk.
 */

/**
 * POST /api/upload
 *
 * Upload și procesare balanță de verificare.
 *
 * Pași:
 * 1. Validare autentificare și permisiuni
 * 2. Validare fișier (dimensiune, tip)
 * 3. Validare date obligatorii (company_id, period_start, period_end)
 * 4. Upload fișier în Supabase Storage
 * 5. Procesare cu Trial Balance Engine
 * 6. Salvare import și conturi în DB
 * 7. Returnare rezultate
 *
 * Body (multipart/form-data):
 * - file: File (required) - Fișier Excel/CSV
 * - company_id: string (required) - UUID companie
 * - period_start: string (required) - Data început perioadă (ISO 8601)
 * - period_end: string (required) - Data sfârșit perioadă (ISO 8601)
 * - description: string (optional) - Descriere import
 *
 * Response:
 * - success: boolean
 * - data: { import_id, accounts_count, validation, statistics }
 * - errors: ValidationError[] (dacă există)
 * - warnings: ValidationWarning[] (dacă există)
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', file);
 * formData.append('company_id', companyId);
 * formData.append('period_start', '2024-12-01');
 * formData.append('period_end', '2024-12-31');
 *
 * const response = await fetch('/api/upload', {
 *   method: 'POST',
 *   body: formData,
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // ============================================================================
    // ETAPA 1: VALIDARE AUTENTIFICARE
    // ============================================================================

    const clerkUserId = getAuthUserId();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Autentificare necesară' }, { status: 401 });
    }

    // Obține userId din Supabase
    const { data: user, error: userError } = await getUserByClerkIdServer(clerkUserId);
    if (userError || !user) {
      return NextResponse.json({ error: 'Utilizator negăsit în baza de date' }, { status: 404 });
    }

    // ============================================================================
    // ETAPA 2: PARSARE FORM DATA
    // ============================================================================

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const companyId = formData.get('company_id') as string | null;
    const periodStart = formData.get('period_start') as string | null;
    const periodEnd = formData.get('period_end') as string | null;
    const description = (formData.get('description') as string | null) || null;

    // ============================================================================
    // ETAPA 3: VALIDARE DATE OBLIGATORII
    // ============================================================================

    if (!file) {
      return NextResponse.json({ error: 'Fișierul este obligatoriu' }, { status: 400 });
    }

    if (!companyId || companyId.trim().length === 0) {
      return NextResponse.json({ error: 'company_id este obligatoriu' }, { status: 400 });
    }

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'period_start și period_end sunt obligatorii' },
        { status: 400 }
      );
    }

    // Validare UUID companyId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      return NextResponse.json({ error: 'company_id invalid (trebuie să fie UUID)' }, { status: 400 });
    }

    // Validare date
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Datele trebuie să fie în format ISO 8601 valid (ex: 2024-12-31)' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'period_start trebuie să fie înainte de period_end' },
        { status: 400 }
      );
    }

    // ============================================================================
    // ETAPA 4: VALIDARE FIȘIER
    // ============================================================================

    // Validare dimensiune
    if (file.size > STORAGE_LIMITS.MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Fișierul este prea mare. Maxim ${STORAGE_LIMITS.MAX_FILE_SIZE_MB}MB permis.`,
          details: { fileSize: file.size, maxSize: STORAGE_LIMITS.MAX_FILE_SIZE },
        },
        { status: 400 }
      );
    }

    // Validare tip fișier
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!STORAGE_LIMITS.ALLOWED_EXTENSIONS.includes(extension as '.xls' | '.xlsx' | '.csv')) {
      return NextResponse.json(
        {
          error: `Format fișier neacceptat. Formate acceptate: ${STORAGE_LIMITS.ALLOWED_EXTENSIONS.join(', ')}`,
          details: { fileName: file.name, extension },
        },
        { status: 400 }
      );
    }

    // Validare MIME type
    if (!STORAGE_LIMITS.ALLOWED_MIME_TYPES.includes(file.type as typeof STORAGE_LIMITS.ALLOWED_MIME_TYPES[number])) {
      return NextResponse.json(
        {
          error: 'Tipul fișierului nu este valid. Folosește Excel (.xls, .xlsx) sau CSV (.csv).',
          details: { mimeType: file.type },
        },
        { status: 400 }
      );
    }

    // ============================================================================
    // ETAPA 5: VERIFICARE ACCES LA COMPANIE
    // ============================================================================

    const supabase = getSupabaseServer();

    // Verifică dacă utilizatorul are acces la companie prin company_users
    const { data: companyAccess, error: accessError } = await supabase
      .from('company_users')
      .select('role, company_id')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single();

    if (accessError || !companyAccess) {
      return NextResponse.json(
        { error: 'Nu aveți permisiuni pentru această companie' },
        { status: 403 }
      );
    }

    // Verifică dacă utilizatorul poate face upload (owner, admin, member - NU viewer)
    // @ts-expect-error - Supabase type inference issue
    if (companyAccess.role === 'viewer') {
      return NextResponse.json(
        { error: 'Rolul dumneavoastră (viewer) nu permite upload de balanțe' },
        { status: 403 }
      );
    }

    // ============================================================================
    // ETAPA 6: UPLOAD FIȘIER ÎN STORAGE
    // ============================================================================

    const year = startDate.getFullYear();
    const storagePath = generateStoragePath(companyId, file.name, year);

    console.log(`[Upload API] Încep upload fișier: ${file.name} (${file.size} bytes)`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('trial-balance-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false, // Nu suprascrie fișiere existente
      });

    if (uploadError) {
      console.error('Eroare upload storage:', uploadError);
      return NextResponse.json(
        { error: `Eroare la upload fișier: ${uploadError.message}` },
        { status: 500 }
      );
    }

    console.log(`[Upload API] Fișier uploadat cu succes: ${uploadData.path}`);

    // ============================================================================
    // ETAPA 7: PROCESARE CU TRIAL BALANCE ENGINE
    // ============================================================================

    console.log(`[Upload API] Încep procesarea cu Trial Balance Engine...`);

    // Citește fișierul ca ArrayBuffer pentru procesare
    const fileBuffer = await file.arrayBuffer();

    // Procesează balanța
    const processingResult = await processTrialBalance(
      fileBuffer,
      file.name,
      file.type,
      {
        balanceTolerance: 1, // Toleranță 1 RON pentru echilibru
        strictAccountFormat: true, // Validare strictă format conturi
        autoNormalizeNames: true, // Normalizare automată denumiri
        ignoreWarnings: false, // Include avertismentele în rezultat
      },
      {
        companyId,
        periodStart: startDate,
        periodEnd: endDate,
        currency: 'RON', // TODO: Obține din company settings
      }
    );

    console.log(
      `[Upload API] Procesare completă: ${processingResult.success ? 'SUCCES' : 'EȘUAT'}`
    );
    console.log(
      `[Upload API] Statistici: ${processingResult.statistics.successfulLines}/${processingResult.statistics.totalLines} linii procesate`
    );
    console.log(
      `[Upload API] Validare: ${processingResult.errors.length} erori, ${processingResult.warnings.length} avertismente`
    );

    // Dacă procesarea a eșuat, șterge fișierul din storage și returnează erori
    if (!processingResult.success) {
      console.error('[Upload API] Procesare eșuată. Șterge fișierul din storage...');

      // Best effort: încearcă să ștergi fișierul (nu bloca dacă eșuează)
      try {
        await supabase.storage.from('trial-balance-files').remove([uploadData.path]);
      } catch (deleteError) {
        console.error('Eroare la ștergerea fișierului din storage:', deleteError);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Validarea balanței a eșuat',
          errors: processingResult.errors,
          warnings: processingResult.warnings,
          statistics: processingResult.statistics,
        },
        { status: 422 } // Unprocessable Entity
      );
    }

    // ============================================================================
    // ETAPA 8: SALVARE IMPORT ÎN DB
    // ============================================================================

    console.log(`[Upload API] Salvare rezultate în DB...`);

    // Creează import record
    const importData: TablesInsert<'trial_balance_imports'> = {
      company_id: companyId,
      uploaded_by: user.id,
      source_file_url: uploadData.path,
      source_file_name: file.name,
      file_size_bytes: file.size,
      period_start: periodStart,
      period_end: periodEnd,
      status: 'completed',
      validation_errors: {
        errors: processingResult.errors,
        warnings: processingResult.warnings,
        statistics: processingResult.statistics,
        totals: processingResult.totals,
      } as any,
      error_message: description || null,
      processed_at: new Date().toISOString(),
    };

    // @ts-ignore - Supabase type inference issue with trial_balance_imports
    const { data: importRecord, error: importError } = await supabase
      .from('trial_balance_imports')
      .insert(importData)
      .select()
      .single();

    if (importError || !importRecord) {
      console.error('Eroare la salvarea import:', importError);

      // Best effort: șterge fișierul din storage
      try {
        await supabase.storage.from('trial-balance-files').remove([uploadData.path]);
      } catch (deleteError) {
        console.error('Eroare la ștergerea fișierului din storage:', deleteError);
      }

      return NextResponse.json(
        { error: 'Eroare la salvarea importului în baza de date' },
        { status: 500 }
      );
    }

    console.log(`[Upload API] Import salvat cu ID: ${importRecord.id}`);

    // ============================================================================
    // ETAPA 9: SALVARE CONTURI ÎN DB
    // ============================================================================

    // Pregătește conturile pentru inserare
    const accountsData: TablesInsert<'trial_balance_accounts'>[] = processingResult.accounts.map(
      (account) => ({
        import_id: importRecord.id,
        account_code: account.accountCode,
        account_name: account.accountName,
        opening_debit: account.openingDebit,
        opening_credit: account.openingCredit,
        debit_turnover: account.debitTurnover,
        credit_turnover: account.creditTurnover,
        closing_debit: account.closingDebit,
        closing_credit: account.closingCredit,
      })
    );

    // Inserare batch conturi (Supabase suportă până la 1000 linii per batch)
    // Dacă sunt mai multe, împarte în batch-uri
    const BATCH_SIZE = 500;
    let insertedCount = 0;

    for (let i = 0; i < accountsData.length; i += BATCH_SIZE) {
      const batch = accountsData.slice(i, i + BATCH_SIZE);

      // @ts-ignore - Supabase type inference issue with trial_balance_accounts
      const { error: accountsError } = await supabase
        .from('trial_balance_accounts')
        .insert(batch);

      if (accountsError) {
        console.error(`Eroare la salvarea batch ${i / BATCH_SIZE + 1} de conturi:`, accountsError);

        // Rollback: șterge import și fișier
        await supabase.from('trial_balance_imports').delete().eq('id', importRecord.id);
        await supabase.storage.from('trial-balance-files').remove([uploadData.path]);

        return NextResponse.json(
          { error: 'Eroare la salvarea conturilor în baza de date' },
          { status: 500 }
        );
      }

      insertedCount += batch.length;
      console.log(`[Upload API] Salvate ${insertedCount}/${accountsData.length} conturi...`);
    }

    console.log(`[Upload API] Toate conturile salvate cu succes (${insertedCount} total)`);

    // ============================================================================
    // ETAPA 10: LOGARE ACTIVITATE
    // ============================================================================

    // Best effort logging (nu trebuie să blocheze operațiunea)
    try {
      await logActivityServer({
        user_id: user.id,
        company_id: companyId,
        action: 'trial_balance.upload',
        entity_type: 'trial_balance_import',
        entity_id: importRecord.id,
        new_values: {
          file_name: file.name,
          period_start: periodStart,
          period_end: periodEnd,
          accounts_count: processingResult.accounts.length,
        } as any,
        ip_address:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      });
    } catch (auditError) {
      console.error('AUDIT LOG FAILED pentru trial_balance.upload:', auditError);
    }

    // ============================================================================
    // ETAPA 11: RETURNARE REZULTATE
    // ============================================================================

    return NextResponse.json(
      {
        success: true,
        message: 'Balanță încărcată și procesată cu succes',
        data: {
          import_id: importRecord.id,
          company_id: companyId,
          file_name: file.name,
          file_size: file.size,
          period_start: periodStart,
          period_end: periodEnd,
          accounts_count: processingResult.accounts.length,
          validation: {
            is_valid: processingResult.validation.isValid,
            errors_count: processingResult.errors.length,
            warnings_count: processingResult.warnings.length,
          },
          totals: processingResult.totals,
          statistics: processingResult.statistics,
        },
        errors: processingResult.errors,
        warnings: processingResult.warnings,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Eroare neașteptată în POST /api/upload:', error);
    return NextResponse.json(
      {
        error: 'Eroare internă de server',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
