/**
 * Componenta CoverPage pentru documentele PDF.
 * Pagina de copertă cu titlu raport, logo, și informații generale.
 */

import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { globalStyles, formatDate } from '../utils/styles';
import { PDFCoverFooter } from './Footer';
import type { PDFCompanyInfo, PDFReportMetadata } from '@/types/pdf-report';

interface CoverPageProps {
  /** Informații companie */
  companyInfo: PDFCompanyInfo;
  
  /** Metadata raport */
  metadata: PDFReportMetadata;
}

/**
 * Pagina de copertă pentru raportul PDF.
 * Design modern, profesional, cu branding FinGuard.
 */
export function CoverPage({ companyInfo, metadata }: CoverPageProps) {
  return (
    <Page size="A4" style={globalStyles.page}>
      {/* Container principal centrat */}
      <View style={[globalStyles.container, globalStyles.center]}>
        {/* Logo FinGuard */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontSize: 36,
              fontFamily: 'Helvetica-Bold',
              color: '#3B82F6',
              textAlign: 'center',
            }}
          >
            FinGuard
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#6B7280',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            Analiză Financiară Automată
          </Text>
        </View>
        
        {/* Divider decorativ */}
        <View
          style={{
            width: '60%',
            height: 2,
            backgroundColor: '#3B82F6',
            marginBottom: 48,
          }}
        />
        
        {/* Titlu raport */}
        <View style={{ marginBottom: 32, width: '80%' }}>
          <Text
            style={{
              fontSize: 28,
              fontFamily: 'Helvetica-Bold',
              color: '#1F2937',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {metadata.title}
          </Text>
          
          {metadata.subtitle && (
            <Text
              style={{
                fontSize: 16,
                color: '#6B7280',
                textAlign: 'center',
              }}
            >
              {metadata.subtitle}
            </Text>
          )}
        </View>
        
        {/* Informații companie */}
        <View
          style={{
            backgroundColor: '#F9FAFB',
            padding: 24,
            borderRadius: 8,
            width: '70%',
            marginBottom: 32,
          }}
        >
          {/* Logo companie (dacă există) */}
          {companyInfo.logoUrl && (
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Image
                src={companyInfo.logoUrl}
                style={{ width: 80, height: 80 }}
              />
            </View>
          )}
          
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Helvetica-Bold',
              color: '#1F2937',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {companyInfo.name}
          </Text>
          
          <Text
            style={{
              fontSize: 12,
              color: '#6B7280',
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            CUI: {companyInfo.cui}
          </Text>
          
          {companyInfo.address && (
            <Text
              style={{
                fontSize: 10,
                color: '#9CA3AF',
                textAlign: 'center',
              }}
            >
              {companyInfo.address}
            </Text>
          )}
        </View>
        
        {/* Perioadă analizată */}
        <View
          style={{
            backgroundColor: '#EFF6FF',
            padding: 16,
            borderRadius: 6,
            borderLeftWidth: 4,
            borderColor: '#3B82F6',
            marginBottom: 48,
            width: '60%',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Helvetica-Bold',
              color: '#1E40AF',
              marginBottom: 4,
            }}
          >
            Perioada Analizată
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Helvetica-Bold',
              color: '#1F2937',
            }}
          >
            {metadata.period.label}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: '#6B7280',
              marginTop: 4,
            }}
          >
            {formatDate(metadata.period.start)} - {formatDate(metadata.period.end)}
          </Text>
        </View>
        
        {/* Data generării */}
        <View style={{ marginTop: 'auto' }}>
          <Text
            style={{
              fontSize: 10,
              color: '#9CA3AF',
              textAlign: 'center',
            }}
          >
            Raport generat la {formatDate(metadata.generatedAt)}
          </Text>
          <Text
            style={{
              fontSize: 9,
              color: '#D1D5DB',
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            de {metadata.generatedBy.name}
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: '#E5E7EB',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Versiune raport: {metadata.version}
          </Text>
        </View>
      </View>
      
      {/* Footer */}
      <PDFCoverFooter />
    </Page>
  );
}
