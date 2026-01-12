/**
 * Secțiunea Company Info pentru raportul PDF.
 * Afișează detalii despre companie: contact, fiscal, etc.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { globalStyles } from '../utils/styles';
import type { PDFCompanyInfo } from '@/types/pdf-report';

interface CompanyInfoSectionProps {
  /** Informații companie */
  companyInfo: PDFCompanyInfo;
}

/**
 * Secțiunea cu informații detaliate despre companie.
 */
export function CompanyInfoSection({ companyInfo }: CompanyInfoSectionProps) {
  const fiscalYearMonths = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];
  
  const fiscalYearStart = fiscalYearMonths[companyInfo.fiscalYearStartMonth - 1];
  
  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.heading2}>Informații Companie</Text>
      
      {/* Grid cu informații */}
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        {/* Coloană 1 */}
        <View style={{ flex: 1 }}>
          <InfoRow label="Denumire" value={companyInfo.name} />
          <InfoRow label="CUI" value={companyInfo.cui} />
          <InfoRow label="Țară" value={companyInfo.country} />
        </View>
        
        {/* Coloană 2 */}
        <View style={{ flex: 1 }}>
          <InfoRow label="Monedă" value={companyInfo.currency} />
          <InfoRow label="An fiscal începe în" value={fiscalYearStart} />
          {companyInfo.phone && <InfoRow label="Telefon" value={companyInfo.phone} />}
        </View>
      </View>
      
      {/* Adresă (full width) */}
      {companyInfo.address && (
        <View style={{ marginTop: 8 }}>
          <InfoRow label="Adresă" value={companyInfo.address} />
        </View>
      )}
    </View>
  );
}

/**
 * Rând cu label și valoare.
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 6 }}>
      <Text style={[globalStyles.bodySmall, globalStyles.textMuted, { width: 120 }]}>
        {label}:
      </Text>
      <Text style={[globalStyles.bodySmall, { flex: 1 }]}>
        {value}
      </Text>
    </View>
  );
}
