/**
 * Utilități pentru generarea graficelor în PDF.
 * 
 * NOTĂ: Export grafice Recharts → PNG este complex în server-side Next.js.
 * Această implementare oferă grafice simple generate direct în PDF folosind
 * React PDF primitives (View, SVG dacă e suportat).
 * 
 * Pentru grafice complexe, alternativele sunt:
 * 1. Chart.js cu node-canvas pentru server-side rendering
 * 2. Puppeteer pentru screenshot grafice browser-side
 * 3. Grafice simple cu React PDF (implementat aici)
 */

import type { PDFChartData } from '@/types/pdf-report';

/**
 * Generează date simplificate pentru grafice PDF.
 * Convertește KPI data într-un format ușor de vizualizat în PDF.
 */
export function prepareChartDataForPDF(
  labels: string[],
  values: number[],
  title: string,
  type: 'bar' | 'line' | 'radar' | 'pie' = 'bar'
): PDFChartData {
  return {
    type,
    title,
    data: {
      labels,
      datasets: [
        {
          label: title,
          data: values,
          color: '#3B82F6',
        },
      ],
    },
    description: `Grafic ${type} pentru ${title}`,
  };
}

/**
 * Calculează height pentru bara în bar chart bazat pe valoare.
 */
export function calculateBarHeight(
  value: number,
  maxValue: number,
  maxHeight: number = 100
): number {
  if (maxValue === 0) return 0;
  return (value / maxValue) * maxHeight;
}

/**
 * Generează culori pentru dataset-uri multiple.
 */
export function generateChartColors(count: number): string[] {
  const baseColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  
  return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
}

/**
 * Formatare label lung pentru grafic (truncate dacă necesar).
 */
export function formatChartLabel(label: string, maxLength: number = 20): string {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + '...';
}

/**
 * Convertește KPI data în chart data pentru categoria overview.
 */
export function kpiDataToChartData(
  kpiData: Array<{ name: string; value: number }>,
  categoryName: string
): PDFChartData {
  return {
    type: 'bar',
    title: `Overview ${categoryName}`,
    data: {
      labels: kpiData.map(kpi => formatChartLabel(kpi.name, 15)),
      datasets: [
        {
          label: categoryName,
          data: kpiData.map(kpi => kpi.value),
          color: '#3B82F6',
        },
      ],
    },
    description: `Reprezentare grafică a KPI-urilor din categoria ${categoryName}`,
  };
}

/**
 * Placeholder pentru image Base64 (pentru viitor când implementăm chart export).
 * În prezent, graficele vor fi generate cu React PDF primitives.
 */
export function generatePlaceholderChartImage(
  width: number = 400,
  height: number = 300
): string {
  // În viitor, aici va fi logica pentru generarea imaginii chart-ului
  // folosind Chart.js + node-canvas sau Puppeteer
  return '';
}
