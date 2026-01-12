/**
 * Secțiunea KPI Dashboard pentru raportul PDF.
 * Afișează KPI-uri grupate pe categorii cu interpretări.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import {
  globalStyles,
  kpiStyles,
  getInterpretationColor,
  getInterpretationBadgeStyle,
  formatNumber,
  formatPercent,
  formatCurrency,
} from '../utils/styles';
import type { PDFKPIDataByCategory, PDFKPIData } from '@/types/pdf-report';

interface KPIDashboardSectionProps {
  /** Date KPI grupate pe categorii */
  kpiData: PDFKPIDataByCategory[];
  
  /** Monedă pentru formatare */
  currency?: string;
}

/**
 * Secțiunea KPI Dashboard.
 * Afișează toate KPI-urile grupate pe categorii.
 */
export function KPIDashboardSection({ kpiData, currency = 'RON' }: KPIDashboardSectionProps) {
  return (
    <View style={{ marginBottom: 24 }} break>
      <Text style={globalStyles.heading1}>Indicatori de Performanță (KPI)</Text>
      
      {kpiData.map((category, idx) => (
        <View key={idx} style={{ marginTop: 16 }} wrap={false}>
          {/* Header categorie */}
          <View
            style={{
              backgroundColor: '#EFF6FF',
              padding: 12,
              borderRadius: 4,
              borderLeftWidth: 4,
              borderColor: '#3B82F6',
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[globalStyles.heading2, { marginTop: 0, marginBottom: 0 }]}>
                {category.categoryLabel}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[globalStyles.bodySmall, globalStyles.textMuted, { marginRight: 8 }]}>
                  Scor: {formatNumber(category.categoryScore, 0)}/100
                </Text>
                <View
                  style={[
                    globalStyles.badge,
                    getInterpretationBadgeStyle(category.categoryInterpretation),
                  ]}
                >
                  <Text>
                    {category.categoryInterpretation === 'excellent' ? 'Excelent' :
                     category.categoryInterpretation === 'good' ? 'Bun' :
                     category.categoryInterpretation === 'attention_needed' ? 'Atenție' : 'Slab'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Grid KPI cards */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {category.kpis.map((kpi: PDFKPIData, kpiIdx: number) => (
              <View key={kpiIdx} style={{ width: '48%' }}>
                <KPICard kpi={kpi} currency={currency} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Card individual pentru un KPI.
 */
function KPICard({ kpi, currency }: { kpi: PDFKPIData; currency: string }) {
  const interpretationColor = getInterpretationColor(kpi.interpretation);
  
  // Formatare valoare bazată pe unitate
  const value = kpi.value.value ?? 0;
  let valueFormatted = '';
  switch (kpi.definition.unit) {
    case 'percentage':
      valueFormatted = formatPercent(value);
      break;
    case 'currency':
      valueFormatted = formatCurrency(value, currency);
      break;
    case 'ratio':
      valueFormatted = formatNumber(value, 2);
      break;
    case 'days':
      valueFormatted = `${formatNumber(value, 0)} zile`;
      break;
    default:
      valueFormatted = formatNumber(value, 2);
  }
  
  return (
    <View style={kpiStyles.kpiCard}>
      {/* Header */}
      <View style={kpiStyles.kpiHeader}>
        <Text style={kpiStyles.kpiName}>{kpi.definition.name || kpi.definition.code}</Text>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: interpretationColor,
          }}
        />
      </View>
      
      {/* Valoare */}
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={kpiStyles.kpiValue}>{valueFormatted}</Text>
      </View>
      
      {/* Trend (dacă există) */}
      {kpi.trend && (
        <View style={kpiStyles.kpiTrend}>
          <Text style={{ color: kpi.trend.direction === 'up' ? '#10B981' : '#EF4444' }}>
            {kpi.trend.direction === 'up' ? '↑' : kpi.trend.direction === 'down' ? '↓' : '→'}
          </Text>
          <Text style={[globalStyles.bodySmall, { marginLeft: 4 }]}>
            {kpi.trend.changePercent > 0 ? '+' : ''}{formatPercent(kpi.trend.changePercent, 1)}
          </Text>
        </View>
      )}
      
      {/* Interpretare */}
      <View style={kpiStyles.kpiInterpretation}>
        <Text style={[globalStyles.bodySmall, { color: interpretationColor }]}>
          {kpi.interpretationMessage}
        </Text>
      </View>
      
      {/* Target range (dacă există) - comentat deocamdată deoarece proprietățile lipsesc din tipuri */}
      {/* {kpi.definition.target_range_min !== null && kpi.definition.target_range_max !== null && (
        <Text style={[globalStyles.caption, { marginTop: 4 }]}>
          Target: {formatNumber(kpi.definition.target_range_min, 1)} - {formatNumber(kpi.definition.target_range_max, 1)}
        </Text>
      )} */}
    </View>
  );
}
