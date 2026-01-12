/**
 * Stiluri și teme pentru documentele PDF generate cu React PDF.
 * 
 * Definește paleta de culori, fonturi, spacing și stiluri reutilizabile
 * pentru componentele PDF.
 */

import { StyleSheet } from '@react-pdf/renderer';
import { DEFAULT_PDF_STYLE } from '@/types/pdf-report';

/**
 * Stiluri globale pentru documentele PDF.
 * Folosite de toate componentele PDF.
 */
export const globalStyles = StyleSheet.create({
  // ========== PAGINĂ ==========
  page: {
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 50,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#1F2937',
  },
  
  pageNarrow: {
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 25,
  },
  
  // ========== LAYOUT ==========
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ========== TIPOGRAFIE ==========
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  
  heading1: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  
  heading2: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 6,
  },
  
  heading3: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  
  body: {
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#1F2937',
    lineHeight: 1.5,
  },
  
  bodySmall: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#6B7280',
    lineHeight: 1.4,
  },
  
  bodyBold: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
  },
  
  caption: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#9CA3AF',
    marginTop: 4,
  },
  
  // ========== CULORI TEXT ==========
  textPrimary: {
    color: '#3B82F6',
  },
  
  textSecondary: {
    color: '#10B981',
  },
  
  textDanger: {
    color: '#EF4444',
  },
  
  textWarning: {
    color: '#F59E0B',
  },
  
  textMuted: {
    color: '#6B7280',
  },
  
  // ========== SPACING ==========
  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt3: { marginTop: 16 },
  mt4: { marginTop: 24 },
  mt5: { marginTop: 32 },
  
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb3: { marginBottom: 16 },
  mb4: { marginBottom: 24 },
  mb5: { marginBottom: 32 },
  
  ml1: { marginLeft: 4 },
  ml2: { marginLeft: 8 },
  ml3: { marginLeft: 16 },
  ml4: { marginLeft: 24 },
  
  mr1: { marginRight: 4 },
  mr2: { marginRight: 8 },
  mr3: { marginRight: 16 },
  mr4: { marginRight: 24 },
  
  p1: { padding: 4 },
  p2: { padding: 8 },
  p3: { padding: 16 },
  p4: { padding: 24 },
  
  px2: { paddingHorizontal: 8 },
  px3: { paddingHorizontal: 16 },
  
  py2: { paddingVertical: 8 },
  py3: { paddingVertical: 16 },
  
  // ========== COMPONENTE ==========
  card: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  
  cardBordered: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 4,
    border: '1px solid #E5E7EB',
    marginBottom: 8,
  },
  
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  
  badgeWarning: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  
  badgeDanger: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  
  badgeInfo: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  
  // ========== TABELE ==========
  table: {
    marginTop: 8,
    marginBottom: 16,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  
  tableCell: {
    fontSize: 10,
    color: '#1F2937',
  },
  
  tableCellHeader: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  
  tableCellRight: {
    fontSize: 10,
    color: '#1F2937',
    textAlign: 'right',
  },
  
  tableCellBold: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
  },
  
  // ========== BORDERE & DIVIDERS ==========
  divider: {
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 16,
  },
  
  dividerThick: {
    borderBottomWidth: 2,
    borderColor: '#D1D5DB',
    marginVertical: 16,
  },
  
  border: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  borderPrimary: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  
  // ========== FOOTER & HEADER ==========
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderColor: '#3B82F6',
  },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  pageNumber: {
    fontSize: 10,
    color: '#6B7280',
  },
  
  // ========== WATERMARK ==========
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 72,
    color: '#E5E7EB',
    opacity: 0.3,
    fontFamily: 'Helvetica-Bold',
  },
});

/**
 * Stiluri specifice pentru KPI cards.
 */
export const kpiStyles = StyleSheet.create({
  kpiCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 4,
    border: '1px solid #E5E7EB',
    marginBottom: 12,
  },
  
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  kpiName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    flex: 1,
  },
  
  kpiValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  
  kpiUnit: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
  },
  
  kpiInterpretation: {
    fontSize: 10,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  kpiTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 10,
    marginTop: 4,
  },
  
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

/**
 * Stiluri pentru situații financiare.
 */
export const statementStyles = StyleSheet.create({
  statementContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  
  statementTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderColor: '#3B82F6',
  },
  
  categoryHeader: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 2,
  },
  
  subcategoryHeader: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    paddingVertical: 4,
    paddingLeft: 12,
    marginTop: 4,
  },
  
  accountLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingLeft: 24,
    fontSize: 10,
  },
  
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 4,
    backgroundColor: '#F9FAFB',
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
  },
  
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#3B82F6',
  },
});

/**
 * Helper pentru obținerea culorii bazate pe interpretare.
 */
export function getInterpretationColor(
  interpretation: 'excellent' | 'good' | 'attention_needed' | 'poor'
): string {
  switch (interpretation) {
    case 'excellent':
      return '#10B981'; // green
    case 'good':
      return '#3B82F6'; // blue
    case 'attention_needed':
      return '#F59E0B'; // amber
    case 'poor':
      return '#EF4444'; // red
  }
}

/**
 * Helper pentru obținerea stilului badge-ului bazat pe interpretare.
 */
export function getInterpretationBadgeStyle(
  interpretation: 'excellent' | 'good' | 'attention_needed' | 'poor'
) {
  switch (interpretation) {
    case 'excellent':
      return globalStyles.badgeSuccess;
    case 'good':
      return globalStyles.badgeInfo;
    case 'attention_needed':
      return globalStyles.badgeWarning;
    case 'poor':
      return globalStyles.badgeDanger;
  }
}

/**
 * Helper pentru formatare valoare monetară.
 */
export function formatCurrency(value: number, currency: string = 'RON'): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Helper pentru formatare număr.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Helper pentru formatare procent.
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Helper pentru formatare dată.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Helper pentru formatare dată scurtă.
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}
