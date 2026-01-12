/**
 * Secțiunea Financial Statements pentru raportul PDF.
 * Afișează Balance Sheet și Income Statement.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { globalStyles, statementStyles, formatCurrency } from '../utils/styles';
import type { BalanceSheet, IncomeStatement } from '@/types/financial-statements';

interface FinancialStatementsSectionProps {
  /** Balance Sheet (opțional) */
  balanceSheet?: BalanceSheet;
  
  /** Income Statement (opțional) */
  incomeStatement?: IncomeStatement;
  
  /** Monedă pentru formatare */
  currency?: string;
}

/**
 * Secțiunea Situații Financiare.
 */
export function FinancialStatementsSection({
  balanceSheet,
  incomeStatement,
  currency = 'RON',
}: FinancialStatementsSectionProps) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={globalStyles.heading1}>Situații Financiare</Text>
      
      {/* Balance Sheet */}
      {balanceSheet && (
        <View style={{ marginTop: 16 }} break>
          <BalanceSheetView balanceSheet={balanceSheet} currency={currency} />
        </View>
      )}
      
      {/* Income Statement */}
      {incomeStatement && (
        <View style={{ marginTop: 24 }} break>
          <IncomeStatementView incomeStatement={incomeStatement} currency={currency} />
        </View>
      )}
    </View>
  );
}

/**
 * View pentru Balance Sheet (Bilanț).
 */
function BalanceSheetView({ balanceSheet, currency }: { balanceSheet: BalanceSheet; currency: string }) {
  return (
    <View style={statementStyles.statementContainer}>
      <Text style={statementStyles.statementTitle}>Bilanț</Text>
      
      {/* ACTIVE */}
      <View style={{ marginBottom: 16 }}>
        <Text style={[globalStyles.heading3, { backgroundColor: '#EFF6FF', padding: 6, borderRadius: 2 }]}>
          ACTIVE
        </Text>
        
        {balanceSheet.assets.map((group, idx) => (
          <View key={idx} style={{ marginTop: 8 }}>
            <Text style={statementStyles.categoryHeader}>{formatCategoryName(group.category)}</Text>
            
            {group.lines.length > 0 && group.lines.slice(0, 5).map((line, lineIdx) => (
              <View key={lineIdx} style={statementStyles.accountLine}>
                <Text style={{ flex: 1 }}>{line.account_code} - {line.description || 'N/A'}</Text>
                <Text style={{ width: 100, textAlign: 'right' }}>
                  {formatCurrency(line.amount, currency)}
                </Text>
              </View>
            ))}
            
            {group.lines.length > 5 && (
              <Text style={[globalStyles.caption, { marginLeft: 24, marginTop: 2 }]}>
                ... și încă {group.lines.length - 5} conturi
              </Text>
            )}
            
            <View style={statementStyles.totalLine}>
              <Text style={{ flex: 1 }}>Total {formatCategoryName(group.category)}</Text>
              <Text style={{ width: 100, textAlign: 'right' }}>
                {formatCurrency(group.subtotal, currency)}
              </Text>
            </View>
          </View>
        ))}
        
        <View style={statementStyles.grandTotalLine}>
          <Text style={{ flex: 1 }}>TOTAL ACTIVE</Text>
          <Text style={{ width: 100, textAlign: 'right' }}>
            {formatCurrency(balanceSheet.totalAssets, currency)}
          </Text>
        </View>
      </View>
      
      {/* PASIVE + CAPITALURI */}
      <View style={{ marginTop: 16 }}>
        <Text style={[globalStyles.heading3, { backgroundColor: '#FEF3C7', padding: 6, borderRadius: 2 }]}>
          PASIVE ȘI CAPITALURI PROPRII
        </Text>
        
        {balanceSheet.liabilitiesAndEquity.map((group, idx) => (
          <View key={idx} style={{ marginTop: 8 }}>
            <Text style={statementStyles.categoryHeader}>{formatCategoryName(group.category)}</Text>
            
            {group.lines.length > 0 && group.lines.slice(0, 5).map((line, lineIdx) => (
              <View key={lineIdx} style={statementStyles.accountLine}>
                <Text style={{ flex: 1 }}>{line.account_code} - {line.description || 'N/A'}</Text>
                <Text style={{ width: 100, textAlign: 'right' }}>
                  {formatCurrency(line.amount, currency)}
                </Text>
              </View>
            ))}
            
            {group.lines.length > 5 && (
              <Text style={[globalStyles.caption, { marginLeft: 24, marginTop: 2 }]}>
                ... și încă {group.lines.length - 5} conturi
              </Text>
            )}
            
            <View style={statementStyles.totalLine}>
              <Text style={{ flex: 1 }}>Total {formatCategoryName(group.category)}</Text>
              <Text style={{ width: 100, textAlign: 'right' }}>
                {formatCurrency(group.subtotal, currency)}
              </Text>
            </View>
          </View>
        ))}
        
        <View style={statementStyles.grandTotalLine}>
          <Text style={{ flex: 1 }}>TOTAL PASIVE ȘI CAPITALURI</Text>
          <Text style={{ width: 100, textAlign: 'right' }}>
            {formatCurrency(balanceSheet.totalLiabilitiesAndEquity, currency)}
          </Text>
        </View>
      </View>
      
      {/* Verificare echilibru */}
      {!balanceSheet.isBalanced && (
        <View style={{ marginTop: 12, backgroundColor: '#FEE2E2', padding: 8, borderRadius: 4 }}>
          <Text style={[globalStyles.bodySmall, { color: '#991B1B' }]}>
            ⚠ Atenție: Bilanțul nu este echilibrat. Diferență: {formatCurrency(Math.abs(balanceSheet.balanceDifference), currency)}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * View pentru Income Statement (Cont P&L).
 */
function IncomeStatementView({ incomeStatement, currency }: { incomeStatement: IncomeStatement; currency: string }) {
  return (
    <View style={statementStyles.statementContainer}>
      <Text style={statementStyles.statementTitle}>Cont de Profit și Pierdere</Text>
      
      {/* VENITURI */}
      <View style={{ marginBottom: 16 }}>
        <Text style={[globalStyles.heading3, { backgroundColor: '#D1FAE5', padding: 6, borderRadius: 2 }]}>
          VENITURI
        </Text>
        
        {incomeStatement.revenues.map((group, idx) => (
          <View key={idx} style={{ marginTop: 8 }}>
            <Text style={statementStyles.categoryHeader}>{formatRevenueSubcategory(group.subcategory)}</Text>
            
            {group.lines.length > 0 && group.lines.slice(0, 5).map((line, lineIdx) => (
              <View key={lineIdx} style={statementStyles.accountLine}>
                <Text style={{ flex: 1 }}>{line.account_code} - {line.description || 'N/A'}</Text>
                <Text style={{ width: 100, textAlign: 'right' }}>
                  {formatCurrency(line.amount, currency)}
                </Text>
              </View>
            ))}
            
            {group.lines.length > 5 && (
              <Text style={[globalStyles.caption, { marginLeft: 24, marginTop: 2 }]}>
                ... și încă {group.lines.length - 5} conturi
              </Text>
            )}
            
            <View style={statementStyles.totalLine}>
              <Text style={{ flex: 1 }}>Total {formatRevenueSubcategory(group.subcategory)}</Text>
              <Text style={{ width: 100, textAlign: 'right' }}>
                {formatCurrency(group.subtotal, currency)}
              </Text>
            </View>
          </View>
        ))}
        
        <View style={statementStyles.grandTotalLine}>
          <Text style={{ flex: 1 }}>TOTAL VENITURI</Text>
          <Text style={{ width: 100, textAlign: 'right' }}>
            {formatCurrency(incomeStatement.totalRevenues, currency)}
          </Text>
        </View>
      </View>
      
      {/* CHELTUIELI */}
      <View style={{ marginTop: 16 }}>
        <Text style={[globalStyles.heading3, { backgroundColor: '#FEE2E2', padding: 6, borderRadius: 2 }]}>
          CHELTUIELI
        </Text>
        
        {incomeStatement.expenses.map((group, idx) => (
          <View key={idx} style={{ marginTop: 8 }}>
            <Text style={statementStyles.categoryHeader}>{formatExpenseSubcategory(group.subcategory)}</Text>
            
            {group.lines.length > 0 && group.lines.slice(0, 5).map((line, lineIdx) => (
              <View key={lineIdx} style={statementStyles.accountLine}>
                <Text style={{ flex: 1 }}>{line.account_code} - {line.description || 'N/A'}</Text>
                <Text style={{ width: 100, textAlign: 'right' }}>
                  {formatCurrency(line.amount, currency)}
                </Text>
              </View>
            ))}
            
            {group.lines.length > 5 && (
              <Text style={[globalStyles.caption, { marginLeft: 24, marginTop: 2 }]}>
                ... și încă {group.lines.length - 5} conturi
              </Text>
            )}
            
            <View style={statementStyles.totalLine}>
              <Text style={{ flex: 1 }}>Total {formatExpenseSubcategory(group.subcategory)}</Text>
              <Text style={{ width: 100, textAlign: 'right' }}>
                {formatCurrency(group.subtotal, currency)}
              </Text>
            </View>
          </View>
        ))}
        
        <View style={statementStyles.grandTotalLine}>
          <Text style={{ flex: 1 }}>TOTAL CHELTUIELI</Text>
          <Text style={{ width: 100, textAlign: 'right' }}>
            {formatCurrency(incomeStatement.totalExpenses, currency)}
          </Text>
        </View>
      </View>
      
      {/* Profit Net */}
      <View style={{ marginTop: 16 }}>
        <View
          style={[
            statementStyles.grandTotalLine,
            { backgroundColor: incomeStatement.netProfit >= 0 ? '#D1FAE5' : '#FEE2E2' },
          ]}
        >
          <Text style={{ flex: 1 }}>PROFIT NET</Text>
          <Text style={{ width: 100, textAlign: 'right' }}>
            {formatCurrency(incomeStatement.netProfit, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Helper pentru formatare nume categorie bilanț.
 */
function formatCategoryName(category: string): string {
  const names: Record<string, string> = {
    'active_imobilizate': 'Active Imobilizate',
    'active_circulante': 'Active Circulante',
    'cheltuieli_in_avans': 'Cheltuieli în Avans',
    'capitaluri_proprii': 'Capitaluri Proprii',
    'provizioane': 'Provizioane',
    'datorii': 'Datorii',
    'venituri_in_avans': 'Venituri în Avans',
  };
  return names[category] || category;
}

/**
 * Helper pentru formatare subcategorie venituri.
 */
function formatRevenueSubcategory(subcategory?: string): string {
  if (!subcategory) return 'Venituri';
  const names: Record<string, string> = {
    'venituri_exploatare': 'Venituri din Exploatare',
    'venituri_financiare': 'Venituri Financiare',
    'venituri_extraordinare': 'Venituri Extraordinare',
  };
  return names[subcategory] || subcategory;
}

/**
 * Helper pentru formatare subcategorie cheltuieli.
 */
function formatExpenseSubcategory(subcategory?: string): string {
  if (!subcategory) return 'Cheltuieli';
  const names: Record<string, string> = {
    'cheltuieli_exploatare': 'Cheltuieli de Exploatare',
    'cheltuieli_financiare': 'Cheltuieli Financiare',
    'cheltuieli_extraordinare': 'Cheltuieli Extraordinare',
    'cheltuieli_impozit': 'Impozit pe Profit',
  };
  return names[subcategory] || subcategory;
}
