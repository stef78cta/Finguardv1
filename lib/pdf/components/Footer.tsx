/**
 * Componenta Footer pentru documentele PDF.
 * Afișează număr pagină, dată generare și informații copyright.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { globalStyles, formatDateShort } from '../utils/styles';

interface FooterProps {
  /** Dată generare */
  generatedAt: Date;
  
  /** Nume utilizator care a generat */
  generatedBy?: string;
  
  /** Text copyright/disclaimer (opțional) */
  disclaimer?: string;
}

/**
 * Footer pentru fiecare pagină din PDF.
 * React PDF va injecta automat numărul paginii.
 */
export function PDFFooter({ generatedAt, generatedBy, disclaimer }: FooterProps) {
  return (
    <View style={globalStyles.footer}>
      {/* Stânga: Info generare */}
      <View style={{ flexDirection: 'column' }}>
        <Text style={globalStyles.pageNumber}>
          Generat: {formatDateShort(generatedAt)}
        </Text>
        {generatedBy && (
          <Text style={[globalStyles.pageNumber, { fontSize: 8 }]}>
            de {generatedBy}
          </Text>
        )}
      </View>
      
      {/* Centru: Disclaimer (dacă există) */}
      {disclaimer && (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <Text style={[globalStyles.pageNumber, { fontSize: 8, textAlign: 'center' }]}>
            {disclaimer}
          </Text>
        </View>
      )}
      
      {/* Dreapta: Număr pagină */}
      <View>
        <Text
          style={globalStyles.pageNumber}
          render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} din ${totalPages}`}
          fixed
        />
      </View>
    </View>
  );
}

/**
 * Footer simplificat fără număr pagină (pentru copertă).
 */
export function PDFCoverFooter() {
  return (
    <View style={[globalStyles.footer, { borderTopWidth: 0 }]}>
      <Text style={[globalStyles.pageNumber, { fontSize: 8 }]}>
        © {new Date().getFullYear()} FinGuard - Analiză Financiară Automată
      </Text>
      <Text style={[globalStyles.pageNumber, { fontSize: 8 }]}>
        www.finguard.ro
      </Text>
    </View>
  );
}
