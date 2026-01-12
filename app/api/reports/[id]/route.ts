/**
 * API Route: GET/DELETE /api/reports/[id]
 * 
 * Gestionează un raport individual:
 * - GET: Obține detaliile raportului
 * - DELETE: Șterge raportul
 * 
 * @module app/api/reports/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import type { ReportWithDetails } from '@/types/reports';

/**
 * GET /api/reports/[id]
 * 
 * Returnează detaliile unui raport specific.
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

    const { id: reportId } = await params;

    // 2. Creează client Supabase
    const supabase = await createServerClient();

    // 3. Obține user DB
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

    // 4. Obține raportul cu verificare de acces
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        companies(name),
        trial_balance_imports(period_start, period_end)
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // 5. Verifică dacă user-ul are acces la compania raportului
    const { data: companyUser, error: accessError } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', report.company_id)
      .eq('user_id', dbUser.id)
      .single();

    if (accessError || !companyUser) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this report' },
        { status: 403 }
      );
    }

    // 6. Construiește ReportWithDetails
    const expiresAt = report.expires_at ? new Date(report.expires_at) : null;
    const isExpired = expiresAt ? expiresAt < new Date() : false;

    const reportWithDetails: ReportWithDetails = {
      ...report,
      companyName: report.companies?.name || 'N/A',
      periodFormatted: formatPeriod(
        report.trial_balance_imports?.period_start,
        report.trial_balance_imports?.period_end
      ),
      fileSize: undefined, // TODO: Calculează din storage
      pageCount: undefined,
      isExpired,
      canDownload: !isExpired && !!report.file_path,
    };

    // 7. Returnează raportul
    return NextResponse.json({
      success: true,
      data: reportWithDetails,
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/reports/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * 
 * Șterge un raport.
 */
export async function DELETE(
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

    const { id: reportId } = await params;

    // 2. Creează client Supabase
    const supabase = await createServerClient();

    // 3. Obține user DB
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

    // 4. Obține raportul pentru verificare acces
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, company_id, file_path')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // 5. Verifică dacă user-ul are permisiune (owner sau admin)
    const { data: companyUser, error: accessError } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', report.company_id)
      .eq('user_id', dbUser.id)
      .single();

    if (accessError || !companyUser) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Doar owner și admin pot șterge rapoarte
    if (!['owner', 'admin'].includes(companyUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to delete reports' },
        { status: 403 }
      );
    }

    // 6. Șterge fișierul din storage (dacă există)
    if (report.file_path) {
      // TODO: Implementare ștergere din Supabase Storage
      // const { error: storageError } = await supabase.storage
      //   .from('reports')
      //   .remove([report.file_path]);
      
      // if (storageError) {
      //   console.error('Error deleting file from storage:', storageError);
      // }
    }

    // 7. Șterge raportul din DB
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      console.error('Error deleting report:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete report' },
        { status: 500 }
      );
    }

    // 8. Log activitate
    await supabase
      .from('activity_logs')
      .insert({
        user_id: dbUser.id,
        company_id: report.company_id,
        action: 'report_deleted',
        entity_type: 'report',
        entity_id: reportId,
        details: {
          deleted_at: new Date().toISOString(),
        },
      });

    // 9. Returnează succes
    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/reports/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper: Formatează perioada pentru afișare.
 */
function formatPeriod(periodStart?: string, periodEnd?: string): string {
  if (!periodStart) return 'N/A';
  
  const start = new Date(periodStart);
  const end = periodEnd ? new Date(periodEnd) : null;
  
  const formatter = new Intl.DateTimeFormat('ro-RO', { 
    year: 'numeric', 
    month: 'long' 
  });
  
  if (end && start.getMonth() !== end.getMonth()) {
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }
  
  return formatter.format(start);
}
