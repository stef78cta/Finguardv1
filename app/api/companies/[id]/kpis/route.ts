/**
 * API Endpoint pentru obținerea KPI-urilor unei companii.
 * 
 * GET /api/companies/[id]/kpis
 * - Returnează toate KPI-urile calculate pentru o companie
 * - Suportă filtrare după categorie, perioadă
 * - Include metadata și interpretare
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import type { KPICategory } from '@/types/kpi';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/companies/[id]/kpis
 * 
 * Query params:
 * - category: string (optional) - filtrează după categorie (liquidity, profitability, leverage, efficiency, growth)
 * - period_start: string (optional) - ISO date pentru început perioadă
 * - period_end: string (optional) - ISO date pentru sfârșit perioadă
 * - import_id: string (optional) - ID specific import
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Autentificare
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: companyId } = await context.params;
    const { searchParams } = new URL(request.url);
    
    // Query params
    const category = searchParams.get('category') as KPICategory | null;
    const periodStart = searchParams.get('period_start');
    const periodEnd = searchParams.get('period_end');
    const importId = searchParams.get('import_id');

    const supabase = getSupabaseServer();

    // Verifică acces la companie
    const { data: companyAccess, error: accessError } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .single();

    if (accessError || !companyAccess) {
      return NextResponse.json(
        { error: 'Nu ai acces la această companie' },
        { status: 403 }
      );
    }

    // Construiește query pentru KPI values
    let kpiQuery = supabase
      .from('kpi_values')
      .select(`
        id,
        kpi_definition_id,
        trial_balance_import_id,
        value,
        metadata,
        calculated_at,
        kpi_definitions!inner(
          id,
          code,
          name,
          description,
          category,
          unit,
          target_range_min,
          target_range_max,
          formula,
          display_order,
          is_active
        ),
        trial_balance_imports!inner(
          id,
          period_start,
          period_end,
          status
        )
      `)
      .eq('company_id', companyId)
      .order('calculated_at', { ascending: false });

    // Aplică filtre opționale
    if (category) {
      kpiQuery = kpiQuery.eq('kpi_definitions.category', category);
    }

    if (importId) {
      kpiQuery = kpiQuery.eq('trial_balance_import_id', importId);
    }

    if (periodStart) {
      kpiQuery = kpiQuery.gte('trial_balance_imports.period_start', periodStart);
    }

    if (periodEnd) {
      kpiQuery = kpiQuery.lte('trial_balance_imports.period_end', periodEnd);
    }

    const { data: kpiValues, error: kpiError } = await kpiQuery;

    if (kpiError) {
      console.error('Error fetching KPI values:', kpiError);
      return NextResponse.json(
        { error: 'Eroare la obținerea KPI-urilor' },
        { status: 500 }
      );
    }

    // Transformă datele pentru răspuns
    const transformedData = kpiValues?.map((kpiValue: any) => {
      const definition = kpiValue.kpi_definitions;
      const importData = kpiValue.trial_balance_imports;
      
      return {
        id: kpiValue.id,
        kpi_code: definition.code,
        kpi_name: definition.name,
        kpi_description: definition.description,
        category: definition.category,
        unit: definition.unit,
        value: kpiValue.value,
        target_range: {
          min: definition.target_range_min,
          max: definition.target_range_max,
        },
        period: {
          start: importData.period_start,
          end: importData.period_end,
        },
        import_id: kpiValue.trial_balance_import_id,
        metadata: kpiValue.metadata,
        calculated_at: kpiValue.calculated_at,
        display_order: definition.display_order,
      };
    }) || [];

    // Grupează KPI-uri după categorie pentru răspuns structurat
    const groupedByCategory = transformedData.reduce((acc: any, kpi: any) => {
      if (!acc[kpi.category]) {
        acc[kpi.category] = [];
      }
      acc[kpi.category].push(kpi);
      return acc;
    }, {});

    // Calculează statistici
    const statistics = {
      total: transformedData.length,
      by_category: Object.entries(groupedByCategory).map(([category, kpis]: [string, any]) => ({
        category,
        count: kpis.length,
      })),
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
      grouped: groupedByCategory,
      statistics,
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/companies/[id]/kpis:', error);
    return NextResponse.json(
      { error: 'Eroare internă server' },
      { status: 500 }
    );
  }
}
