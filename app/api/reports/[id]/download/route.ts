/**
 * API Endpoint pentru descărcarea rapoartelor PDF.
 * 
 * POST /api/reports/[id]/download - Generează și descarcă raportul PDF
 * 
 * Endpoint protejat cu Clerk authentication.
 * Verifică că utilizatorul are acces la raportul cerut.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { generatePDFReport } from '@/lib/pdf/pdf-generator';
import type { PDFGenerationOptions } from '@/types/pdf-report';

/**
 * POST /api/reports/[id]/download
 * 
 * Generează raportul PDF pentru un import de balanță.
 * 
 * Body (opțional):
 * ```json
 * {
 *   "options": {
 *     "includeExecutiveSummary": true,
 *     "includeKPIs": true,
 *     "includeBalanceSheet": true,
 *     "includeIncomeStatement": true,
 *     "watermark": "DRAFT"
 *   }
 * }
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ========== 1. AUTENTIFICARE ==========
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Neautentificat' },
        { status: 401 }
      );
    }
    
    // ========== 2. VERIFICARE USER ÎN DATABASE ==========
    const supabase = getSupabaseServerClient();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();
    
    if (userError || !user) {
      console.error('[API Reports Download] User DB error:', userError);
      return NextResponse.json(
        { success: false, error: 'Utilizator nu găsit în database' },
        { status: 404 }
      );
    }
    
    // ========== 3. VERIFICARE TRIAL BALANCE IMPORT ==========
    const importId = params.id;
    
    const { data: trialBalanceImport, error: importError } = await supabase
      .from('trial_balance_imports')
      .select('*, companies(*)')
      .eq('id', importId)
      .single();
    
    if (importError || !trialBalanceImport) {
      console.error('[API Reports Download] Import not found:', importError);
      return NextResponse.json(
        { success: false, error: 'Import balanță nu a fost găsit' },
        { status: 404 }
      );
    }
    
    // ========== 4. VERIFICARE ACCES LA COMPANIE ==========
    const companyId = trialBalanceImport.company_id;
    
    const { data: companyAccess, error: accessError } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .single();
    
    if (accessError || !companyAccess) {
      console.error('[API Reports Download] Access denied:', accessError);
      return NextResponse.json(
        { success: false, error: 'Nu aveți acces la această companie' },
        { status: 403 }
      );
    }
    
    // ========== 5. VERIFICARE STATUS IMPORT ==========
    if (trialBalanceImport.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: `Import-ul este în status "${trialBalanceImport.status}". Așteptați finalizarea procesării.`,
        },
        { status: 400 }
      );
    }
    
    // ========== 6. PARSARE OPȚIUNI (din body) ==========
    let options: PDFGenerationOptions = {
      includeExecutiveSummary: true,
      includeCompanyInfo: true,
      includeKPIs: true,
      includeBalanceSheet: true,
      includeIncomeStatement: true,
      includeCharts: false, // Pentru moment, graficele nu sunt disponibile
      language: 'ro',
      template: 'default',
      compress: true,
    };
    
    try {
      const body = await request.json();
      if (body.options) {
        options = { ...options, ...body.options };
      }
    } catch {
      // Body gol sau invalid - folosim opțiunile default
    }
    
    // ========== 7. GENERARE PDF ==========
    console.log('[API Reports Download] Generating PDF for import:', importId);
    
    const pdfResult = await generatePDFReport({
      companyId,
      trialBalanceImportId: importId,
      userId: user.id,
      options,
      saveToStorage: false, // Nu salvăm în storage, returnăm direct
    });
    
    if (!pdfResult.success || !pdfResult.pdfBuffer) {
      console.error('[API Reports Download] PDF generation failed:', pdfResult.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Generarea PDF-ului a eșuat',
          details: pdfResult.errors,
        },
        { status: 500 }
      );
    }
    
    // ========== 8. LOG ACTIVITATE ==========
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      company_id: companyId,
      action: 'report_downloaded',
      resource_type: 'trial_balance_import',
      resource_id: importId,
      metadata: {
        file_size: pdfResult.fileSize,
        duration_ms: pdfResult.duration,
        options,
      },
    });
    
    // ========== 9. RETURN PDF ==========
    const filename = `Raport_${trialBalanceImport.companies.name}_${
      new Date(trialBalanceImport.period_end).toISOString().split('T')[0]
    }.pdf`;
    
    console.log('[API Reports Download] PDF generated successfully:', {
      filename,
      size: pdfResult.fileSize,
      duration: pdfResult.duration,
    });
    
    return new NextResponse(pdfResult.pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfResult.fileSize?.toString() || '',
        'X-Generation-Time': pdfResult.duration.toString(),
        'X-File-Size': pdfResult.fileSize?.toString() || '',
      },
    });
  } catch (error) {
    console.error('[API Reports Download] Unexpected error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Eroare internă la generarea raportului',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/[id]/download
 * 
 * Returnează informații despre raportul care poate fi generat (fără a-l genera).
 * Util pentru a verifica dacă raportul poate fi generat și pentru preview opțiuni.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autentificare
    const { userId: clerkUserId } = auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: 'Neautentificat' },
        { status: 401 }
      );
    }
    
    const supabase = getSupabaseServerClient();
    
    // User DB
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Utilizator nu găsit' },
        { status: 404 }
      );
    }
    
    // Import info
    const importId = params.id;
    
    const { data: trialBalanceImport, error: importError } = await supabase
      .from('trial_balance_imports')
      .select('*, companies(*)')
      .eq('id', importId)
      .single();
    
    if (importError || !trialBalanceImport) {
      return NextResponse.json(
        { success: false, error: 'Import nu a fost găsit' },
        { status: 404 }
      );
    }
    
    // Verificare acces
    const { data: companyAccess } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', trialBalanceImport.company_id)
      .eq('user_id', user.id)
      .single();
    
    if (!companyAccess) {
      return NextResponse.json(
        { success: false, error: 'Acces refuzat' },
        { status: 403 }
      );
    }
    
    // Return info
    return NextResponse.json({
      success: true,
      data: {
        importId: trialBalanceImport.id,
        companyName: trialBalanceImport.companies.name,
        periodStart: trialBalanceImport.period_start,
        periodEnd: trialBalanceImport.period_end,
        status: trialBalanceImport.status,
        canGenerate: trialBalanceImport.status === 'completed',
        availableOptions: {
          includeExecutiveSummary: true,
          includeCompanyInfo: true,
          includeKPIs: true,
          includeBalanceSheet: true,
          includeIncomeStatement: true,
          includeCharts: false, // Nu sunt disponibile încă
        },
      },
    });
  } catch (error) {
    console.error('[API Reports Info] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Eroare la obținerea informațiilor',
      },
      { status: 500 }
    );
  }
}
