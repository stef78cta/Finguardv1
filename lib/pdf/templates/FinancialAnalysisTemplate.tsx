/**
 * Template principal pentru raportul Financial Analysis PDF.
 * Îmbină toate secțiunile într-un document PDF complet.
 */

import React from 'react';
import { Document, Page, View } from '@react-pdf/renderer';
import { globalStyles } from '../utils/styles';
import { CoverPage } from '../components/CoverPage';
import { PDFHeader } from '../components/Header';
import { PDFFooter } from '../components/Footer';
import { CompanyInfoSection } from '../components/CompanyInfoSection';
import { ExecutiveSummarySection } from '../components/ExecutiveSummarySection';
import { KPIDashboardSection } from '../components/KPIDashboardSection';
import { FinancialStatementsSection } from '../components/FinancialStatementsSection';
import type { PDFReport, PDFGenerationOptions } from '@/types/pdf-report';

interface FinancialAnalysisTemplateProps {
  /** Date raport */
  report: PDFReport;
  
  /** Opțiuni generare */
  options?: PDFGenerationOptions;
}

/**
 * Template complet pentru raportul Financial Analysis.
 * Generează un document PDF multi-pagină cu toate secțiunile.
 */
export function FinancialAnalysisTemplate({ report, options }: FinancialAnalysisTemplateProps) {
  const {
    includeExecutiveSummary = true,
    includeCompanyInfo = true,
    includeKPIs = true,
    includeBalanceSheet = true,
    includeIncomeStatement = true,
    watermark,
  } = options || {};
  
  return (
    <Document
      title={report.metadata.title}
      author={report.metadata.generatedBy.name}
      subject={`Raport financiar pentru ${report.companyInfo.name}`}
      creator="FinGuard"
      producer="FinGuard PDF Generator"
    >
      {/* Pagina de copertă */}
      <CoverPage
        companyInfo={report.companyInfo}
        metadata={report.metadata}
      />
      
      {/* Pagini de conținut */}
      <Page size="A4" style={globalStyles.page}>
        {/* Header */}
        <PDFHeader
          companyInfo={report.companyInfo}
          metadata={report.metadata}
          showLogo={false}
        />
        
        {/* Conținut principal */}
        <View style={globalStyles.container}>
          {/* Informații Companie */}
          {includeCompanyInfo && (
            <CompanyInfoSection companyInfo={report.companyInfo} />
          )}
          
          {/* Executive Summary */}
          {includeExecutiveSummary && report.executiveSummary && (
            <ExecutiveSummarySection summary={report.executiveSummary} />
          )}
          
          {/* Note personalizate (dacă există) */}
          {report.notes && (
            <View style={[globalStyles.card, { marginTop: 16, marginBottom: 16 }]}>
              <Text style={globalStyles.heading3}>Note</Text>
              <Text style={[globalStyles.body, { marginTop: 6 }]}>
                {report.notes}
              </Text>
            </View>
          )}
        </View>
        
        {/* Watermark (dacă există) */}
        {watermark && (
          <View style={globalStyles.watermark} fixed>
            <Text>{watermark}</Text>
          </View>
        )}
        
        {/* Footer */}
        <PDFFooter
          generatedAt={report.metadata.generatedAt}
          generatedBy={report.metadata.generatedBy.name}
        />
      </Page>
      
      {/* KPI Dashboard (pagină separată) */}
      {includeKPIs && report.kpiData && report.kpiData.length > 0 && (
        <Page size="A4" style={globalStyles.page}>
          <PDFHeader
            companyInfo={report.companyInfo}
            metadata={report.metadata}
            showLogo={false}
          />
          
          <View style={globalStyles.container}>
            <KPIDashboardSection
              kpiData={report.kpiData}
              currency={report.companyInfo.currency}
            />
          </View>
          
          {watermark && (
            <View style={globalStyles.watermark} fixed>
              <Text>{watermark}</Text>
            </View>
          )}
          
          <PDFFooter
            generatedAt={report.metadata.generatedAt}
            generatedBy={report.metadata.generatedBy.name}
          />
        </Page>
      )}
      
      {/* Financial Statements (pagini separate) */}
      {(includeBalanceSheet || includeIncomeStatement) &&
       (report.balanceSheet || report.incomeStatement) && (
        <Page size="A4" style={globalStyles.page}>
          <PDFHeader
            companyInfo={report.companyInfo}
            metadata={report.metadata}
            showLogo={false}
          />
          
          <View style={globalStyles.container}>
            <FinancialStatementsSection
              balanceSheet={includeBalanceSheet ? report.balanceSheet : undefined}
              incomeStatement={includeIncomeStatement ? report.incomeStatement : undefined}
              currency={report.companyInfo.currency}
            />
          </View>
          
          {watermark && (
            <View style={globalStyles.watermark} fixed>
              <Text>{watermark}</Text>
            </View>
          )}
          
          <PDFFooter
            generatedAt={report.metadata.generatedAt}
            generatedBy={report.metadata.generatedBy.name}
          />
        </Page>
      )}
    </Document>
  );
}
