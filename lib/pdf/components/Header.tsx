/**
 * Componenta Header pentru documentele PDF.
 * Afișează logo, titlu raport și informații companie.
 */

import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { globalStyles } from '../utils/styles';
import type { PDFCompanyInfo, PDFReportMetadata } from '@/types/pdf-report';

interface HeaderProps {
  /** Informații companie */
  companyInfo: PDFCompanyInfo;
  
  /** Metadata raport */
  metadata: PDFReportMetadata;
  
  /** Afișează logo (dacă există) */
  showLogo?: boolean;
}

/**
 * Header pentru fiecare pagină din PDF (excepție copertă).
 */
export function PDFHeader({ companyInfo, metadata, showLogo = true }: HeaderProps) {
  return (
    <View style={globalStyles.header}>
      {/* Logo și nume companie */}
      <View style={{ flexDirection: 'column', flex: 1 }}>
        {showLogo && companyInfo.logoUrl && (
          <Image
            src={companyInfo.logoUrl}
            style={{ width: 60, height: 60, marginBottom: 4 }}
          />
        )}
        <Text style={[globalStyles.bodyBold, { fontSize: 14 }]}>
          {companyInfo.name}
        </Text>
        <Text style={[globalStyles.bodySmall, globalStyles.textMuted]}>
          CUI: {companyInfo.cui}
        </Text>
      </View>
      
      {/* Titlu raport și perioadă */}
      <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
        <Text style={[globalStyles.bodyBold, { fontSize: 12 }]}>
          {metadata.title}
        </Text>
        {metadata.subtitle && (
          <Text style={[globalStyles.bodySmall, globalStyles.textMuted]}>
            {metadata.subtitle}
          </Text>
        )}
        <Text style={[globalStyles.bodySmall, globalStyles.textPrimary, { marginTop: 4 }]}>
          {metadata.period.label}
        </Text>
      </View>
    </View>
  );
}

/**
 * Header simplificat pentru pagini specifice (ex: copertă).
 */
export function PDFSimpleHeader({ companyName }: { companyName: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[globalStyles.bodySmall, globalStyles.textMuted]}>
        {companyName}
      </Text>
    </View>
  );
}
