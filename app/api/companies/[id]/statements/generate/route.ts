/**
 * API Endpoint: POST /api/companies/[id]/statements/generate
 * 
 * Generează situații financiare (Balance Sheet și Income Statement)
 * pentru o companie pe baza unui import de balanță de verificare.
 * 
 * @route POST /api/companies/:companyId/statements/generate
 * @access Protected - necesită autentificare și acces la companie
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { generateFinancialStatements } from '@/lib/processing/financial-statements-generator';
import type { GenerateStatementsOptions } from '@/types/financial-statements';

/**
 * Request body pentru generare situații financiare.
 */
interface GenerateStatementsRequest {
  /** ID-ul importului balanței de verificare */
  importId: string;
  
  /** Opțiuni de generare */
  options?: GenerateStatementsOptions;
}

/**
 * POST /api/companies/[id]/statements/generate
 * 
 * Generează situații financiare pentru o companie.
 * 
 * @param request - Next.js request object
 * @param params - Route params { id: string }
 * @returns JSON cu rezultatul generării
 * 
 * @example Request Body
 * ```json
 * {
 *   "importId": "uuid-of-trial-balance-import",
 *   "options": {
 *     "generateBalanceSheet": true,
 *     "generateIncomeStatement": true,
 *     "overwrite": false,
 *     "includeAccountDetails": true
 *   }
 * }
 * ```
 * 
 * @example Success Response (200)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "statementIds": {
 *       "balanceSheetId": "uuid-balance-sheet",
 *       "incomeStatementId": "uuid-income-statement"
 *     },
 *     "totalLinesGenerated": 150,
 *     "balanceSheet": { ... },
 *     "incomeStatement": { ... },
 *     "duration": 450
 *   },
 *   "warnings": [],
 *   "message": "Situații financiare generate cu succes"
 * }
 * ```
 * 
 * @example Error Response (400)
 * ```json
 * {
 *   "success": false,
 *   "error": "Import ID este obligatoriu"
 * }
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificare autentificare
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Neautorizat. Vă rugăm să vă autentificați.' },
        { status: 401 }
      );
    }
    
    const companyId = params.id;
    
    // 2. Parsare request body
    let body: GenerateStatementsRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Request body invalid' },
        { status: 400 }
      );
    }
    
    const { importId, options = {} } = body;
    
    // 3. Validare input
    if (!importId) {
      return NextResponse.json(
        { success: false, error: 'Import ID este obligatoriu' },
        { status: 400 }
      );
    }
    
    // 4. Creare client Supabase
    const supabase = await getSupabaseServerClient();
    
    // 5. Verificare că utilizatorul este în tabela users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Utilizator nu a fost găsit în baza de date' },
        { status: 404 }
      );
    }
    
    const userTyped = user as any;
    
    // 6. Verificare acces la companie
    const { data: companyUser, error: companyUserError } = await supabase
      .from('company_users')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', userTyped.id)
      .single();
    
    if (companyUserError || !companyUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nu aveți acces la această companie' 
        },
        { status: 403 }
      );
    }
    
    // 7. Verificare că importul aparține companiei
    const { data: importData, error: importError } = await supabase
      .from('trial_balance_imports')
      .select('company_id, status')
      .eq('id', importId)
      .single();
    
    if (importError || !importData) {
      return NextResponse.json(
        { success: false, error: 'Import nu a fost găsit' },
        { status: 404 }
      );
    }
    
    const importTyped = importData as any;
    
    if (importTyped.company_id !== companyId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Importul nu aparține acestei companii' 
        },
        { status: 403 }
      );
    }
    
    // 8. Verificare status import (trebuie să fie completed sau validated)
    if (importTyped.status !== 'completed' && importTyped.status !== 'validated') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Importul trebuie să fie completat înainte de generare. Status actual: ${importTyped.status}` 
        },
        { status: 400 }
      );
    }
    
    // 9. Generare situații financiare
    const result = await generateFinancialStatements(
      supabase,
      importId,
      userTyped.id,
      options
    );
    
    // 10. Verificare rezultat
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Eroare la generarea situațiilor financiare',
          errors: result.errors,
          warnings: result.warnings
        },
        { status: 500 }
      );
    }
    
    // 11. Logging activitate
    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: userTyped.id,
          company_id: companyId,
          action: 'generate_financial_statements',
          entity_type: 'trial_balance_import',
          entity_id: importId,
          new_values: {
            balance_sheet_id: result.statementIds.balanceSheetId,
            income_statement_id: result.statementIds.incomeStatementId,
            lines_generated: result.totalLinesGenerated,
          },
        } as any);
    } catch (logError) {
      // Nu bloca request-ul dacă logging-ul eșuează
      console.error('Eroare logging activitate:', logError);
    }
    
    // 12. Răspuns succes
    return NextResponse.json({
      success: true,
      data: {
        statementIds: result.statementIds,
        totalLinesGenerated: result.totalLinesGenerated,
        balanceSheet: result.balanceSheet ? {
          totalAssets: result.balanceSheet.totalAssets,
          totalLiabilitiesAndEquity: result.balanceSheet.totalLiabilitiesAndEquity,
          isBalanced: result.balanceSheet.isBalanced,
          balanceDifference: result.balanceSheet.balanceDifference,
          assetsGroupsCount: result.balanceSheet.assets.length,
          liabilitiesGroupsCount: result.balanceSheet.liabilitiesAndEquity.length,
        } : undefined,
        incomeStatement: result.incomeStatement ? {
          totalRevenues: result.incomeStatement.totalRevenues,
          totalExpenses: result.incomeStatement.totalExpenses,
          netProfit: result.incomeStatement.netProfit,
          operatingProfit: result.incomeStatement.operatingProfit,
          revenuesGroupsCount: result.incomeStatement.revenues.length,
          expensesGroupsCount: result.incomeStatement.expenses.length,
        } : undefined,
        duration: result.duration,
      },
      warnings: result.warnings,
      message: 'Situații financiare generate cu succes',
    }, { status: 200 });
    
  } catch (error) {
    console.error('Eroare generare situații financiare:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Eroare internă la generarea situațiilor financiare',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/companies/[id]/statements/generate
 * 
 * Returnează informații despre endpoint (pentru documentație).
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/companies/[id]/statements/generate',
    description: 'Generează situații financiare (Balance Sheet și Income Statement) din balanța de verificare',
    method: 'POST',
    authentication: 'Required (Clerk)',
    requestBody: {
      importId: 'string (required) - ID-ul importului balanței de verificare',
      options: {
        generateBalanceSheet: 'boolean (optional, default: true)',
        generateIncomeStatement: 'boolean (optional, default: true)',
        generateCashFlow: 'boolean (optional, default: false)',
        overwrite: 'boolean (optional, default: false) - Suprascrie situațiile existente',
        includeAccountDetails: 'boolean (optional, default: true)',
        balanceTolerance: 'number (optional, default: 1.0) - Toleranță echilibru Bilanț în RON',
      }
    },
    responseFields: {
      success: 'boolean',
      data: {
        statementIds: {
          balanceSheetId: 'string | undefined',
          incomeStatementId: 'string | undefined',
        },
        totalLinesGenerated: 'number',
        balanceSheet: 'object | undefined',
        incomeStatement: 'object | undefined',
        duration: 'number (milliseconds)',
      },
      warnings: 'string[]',
      message: 'string',
    },
    example: {
      importId: '550e8400-e29b-41d4-a716-446655440000',
      options: {
        generateBalanceSheet: true,
        generateIncomeStatement: true,
        overwrite: false,
      }
    }
  });
}
