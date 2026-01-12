/**
 * API Route: GET/POST /api/companies/[id]/reports
 * 
 * Gestionează rapoartele pentru o companie:
 * - GET: Listează toate rapoartele companiei
 * - POST: Generează un raport nou
 * 
 * @module app/api/companies/[id]/reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import type { 
  GenerateReportOptions, 
  ReportListFilter,
  ReportWithDetails 
} from '@/types/reports';

/**
 * GET /api/companies/[id]/reports
 * 
 * Returnează lista de rapoarte pentru o companie.
 * Suportă filtrare, sortare și paginare.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificare autentificare
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: companyId } = await params;

    // 2. Creează client Supabase
    const supabase = await createServerClient();

    // 3. Verifică dacă user-ul are acces la companie
    const { data: companyUser, error: companyUserError } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .single();

    if (companyUserError || !companyUser) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // 4. Parse query parameters pentru filtrare
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('reportType');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '10');

    // 5. Construiește query pentru rapoarte
    let query = supabase
      .from('reports')
      .select('*, companies(name)', { count: 'exact' })
      .eq('company_id', companyId);

    // Aplică filtre
    if (reportType && reportType !== 'all') {
      query = query.eq('report_type', reportType);
    }
    
    // Note: status nu există în schema, folosim report_type pentru demo
    // În producție ar trebui adăugat câmp status în tabelul reports
    
    // Sortare
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Paginare
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    // 6. Execută query
    const { data: reports, error: reportsError, count } = await query;

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // 7. Transformă datele pentru a adăuga câmpuri calculate
    const reportsWithDetails: ReportWithDetails[] = (reports || []).map((report: any) => {
      const expiresAt = report.expires_at ? new Date(report.expires_at) : null;
      const isExpired = expiresAt ? expiresAt < new Date() : false;

      return {
        ...report,
        companyName: report.companies?.name || 'N/A',
        periodFormatted: formatPeriod(report.created_at),
        fileSize: undefined, // TODO: Calculează din file_path
        pageCount: undefined,
        isExpired,
        canDownload: !isExpired && !!report.file_path,
      };
    });

    // 8. Returnează răspuns cu paginare
    const totalPages = Math.ceil((count || 0) / perPage);

    return NextResponse.json({
      success: true,
      data: {
        reports: reportsWithDetails,
        total: count || 0,
        page,
        perPage,
        totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/companies/[id]/reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/companies/[id]/reports
 * 
 * Generează un raport nou pentru companie.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Verificare autentificare
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: companyId } = await params;

    // 2. Parse body
    const body: GenerateReportOptions = await request.json();

    // 3. Validare input
    if (!body.reportType || !body.sourceImportId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: reportType, sourceImportId' 
        },
        { status: 400 }
      );
    }

    // 4. Creează client Supabase
    const supabase = await createServerClient();

    // 5. Verifică access la companie
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      );
    }

    const { data: companyUser, error: companyUserError } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', dbUser.id)
      .single();

    if (companyUserError || !companyUser) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // 6. Verifică dacă import-ul există și aparține companiei
    const { data: importData, error: importError } = await supabase
      .from('trial_balance_imports')
      .select('id, status, period_start, period_end')
      .eq('id', body.sourceImportId)
      .eq('company_id', companyId)
      .single();

    if (importError || !importData) {
      return NextResponse.json(
        { success: false, error: 'Source import not found or does not belong to company' },
        { status: 404 }
      );
    }

    if (importData.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Source import is not completed yet' },
        { status: 400 }
      );
    }

    // 7. Creează raport în DB (status: generating)
    const reportTitle = body.title || generateReportTitle(
      body.reportType,
      importData.period_start,
      importData.period_end
    );

    const { data: newReport, error: createError } = await supabase
      .from('reports')
      .insert({
        company_id: companyId,
        source_import_id: body.sourceImportId,
        report_type: body.reportType,
        title: reportTitle,
        generated_by: dbUser.id,
        file_path: null, // Va fi setat când raportul e generat
        report_data: {
          options: body,
          status: 'generating',
        },
        // expires_at: Se poate adăuga logică de expirare (ex: 30 zile)
      })
      .select()
      .single();

    if (createError || !newReport) {
      console.error('Error creating report:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create report' },
        { status: 500 }
      );
    }

    // 8. TODO: Triggerează generarea efectivă a raportului (background job)
    // Aici ar trebui să adaugi un job BullMQ pentru generarea PDF/Excel
    // Pentru MVP, returnăm reportul creat cu status 'generating'

    // 9. Log activitate
    await supabase
      .from('activity_logs')
      .insert({
        user_id: dbUser.id,
        company_id: companyId,
        action: 'report_generated',
        entity_type: 'report',
        entity_id: newReport.id,
        details: {
          report_type: body.reportType,
          source_import_id: body.sourceImportId,
        },
      });

    // 10. Returnează raport creat
    return NextResponse.json({
      success: true,
      data: {
        reportId: newReport.id,
        status: 'generating',
        message: 'Report generation started. You will be notified when it is ready.',
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/companies/[id]/reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Formatează perioada pentru afișare.
 */
function formatPeriod(date: string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ro-RO', { 
    year: 'numeric', 
    month: 'long' 
  }).format(d);
}

/**
 * Helper: Generează titlu raport automat.
 */
function generateReportTitle(
  reportType: string, 
  periodStart: string, 
  periodEnd: string
): string {
  const typeNames: Record<string, string> = {
    financial_analysis: 'Analiză Financiară',
    kpi_dashboard: 'Dashboard KPI',
    comparative_analysis: 'Analiză Comparativă',
    executive_summary: 'Sumar Executiv',
    detailed_breakdown: 'Analiză Detaliată',
  };

  const typeName = typeNames[reportType] || 'Raport';
  const period = formatPeriod(periodStart);
  
  return `${typeName} - ${period}`;
}
