/**
 * Secțiunea Executive Summary pentru raportul PDF.
 * Overview-ul performanței financiare, puncte cheie, recomandări.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { globalStyles, getInterpretationColor, formatNumber } from '../utils/styles';
import type { PDFExecutiveSummary } from '@/types/pdf-report';

interface ExecutiveSummarySectionProps {
  /** Date executive summary */
  summary: PDFExecutiveSummary;
}

/**
 * Secțiunea Executive Summary.
 * Oferă o privire de ansamblu rapidă asupra sănătății financiare.
 */
export function ExecutiveSummarySection({ summary }: ExecutiveSummarySectionProps) {
  // Determinare culoare scor
  const scoreColor = getInterpretationColor(
    summary.overallHealthScore >= 80 ? 'excellent' :
    summary.overallHealthScore >= 60 ? 'good' :
    summary.overallHealthScore >= 40 ? 'attention_needed' : 'poor'
  );
  
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={globalStyles.heading1}>Sumar Executiv</Text>
      
      {/* Scor general sănătate financiară */}
      <View
        style={{
          backgroundColor: '#F9FAFB',
          padding: 16,
          borderRadius: 6,
          marginTop: 12,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[globalStyles.bodySmall, globalStyles.textMuted]}>
            Scor Sănătate Financiară
          </Text>
          <Text style={[globalStyles.heading1, { color: scoreColor, marginTop: 4, marginBottom: 0 }]}>
            {formatNumber(summary.overallHealthScore, 0)}/100
          </Text>
        </View>
        
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: scoreColor,
            opacity: 0.2,
          }}
        />
      </View>
      
      {/* Overview general */}
      <View style={{ marginBottom: 16 }}>
        <Text style={globalStyles.heading3}>Privire de Ansamblu</Text>
        <Text style={[globalStyles.body, { marginTop: 6, lineHeight: 1.6 }]}>
          {summary.overview}
        </Text>
      </View>
      
      {/* Puncte forte */}
      <View style={{ marginBottom: 16 }}>
        <Text style={[globalStyles.heading3, { color: '#10B981' }]}>
          ✓ Puncte Forte
        </Text>
        <View style={{ marginTop: 6 }}>
          {summary.keyStrengths.map((strength, index) => (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={[globalStyles.body, { width: 20, color: '#10B981' }]}>•</Text>
              <Text style={[globalStyles.body, { flex: 1 }]}>{strength}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Zone de atenție */}
      {summary.areasOfConcern.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[globalStyles.heading3, { color: '#F59E0B' }]}>
            ⚠ Zone de Atenție
          </Text>
          <View style={{ marginTop: 6 }}>
            {summary.areasOfConcern.map((concern, index) => (
              <View key={index} style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Text style={[globalStyles.body, { width: 20, color: '#F59E0B' }]}>•</Text>
                <Text style={[globalStyles.body, { flex: 1 }]}>{concern}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Recomandări */}
      <View>
        <Text style={[globalStyles.heading3, { color: '#3B82F6' }]}>
          → Recomandări
        </Text>
        <View style={{ marginTop: 6 }}>
          {summary.recommendations.map((recommendation, index) => (
            <View key={index} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={[globalStyles.body, { width: 20, color: '#3B82F6' }]}>
                {index + 1}.
              </Text>
              <Text style={[globalStyles.body, { flex: 1 }]}>{recommendation}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
