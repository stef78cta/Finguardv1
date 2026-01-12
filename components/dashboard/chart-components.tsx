/**
 * Componente pentru grafice interactive KPI folosind Recharts.
 * 
 * Componente:
 * - KPILineChart: trend KPI în timp
 * - KPIBarChart: comparație KPI între categorii
 * - KPIRadarChart: vizualizare multi-dimensională
 */

'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import type { KPICardData } from './kpi-card';

interface ChartDataPoint {
  period: string;
  value: number;
  target?: number;
  name?: string;
}

/**
 * Custom Tooltip pentru grafice.
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-2 font-semibold text-slate-900 dark:text-slate-50">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div 
            className="h-3 w-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
          <span className="font-medium text-slate-900 dark:text-slate-50">
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Grafic linie pentru trend KPI în timp.
 */
interface KPILineChartProps {
  data: ChartDataPoint[];
  title: string;
  unit?: string;
  showTarget?: boolean;
}

export function KPILineChart({ data, title, unit = '', showTarget = false }: KPILineChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          Nu există date disponibile
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis 
            dataKey="period" 
            className="text-xs text-slate-600 dark:text-slate-400"
          />
          <YAxis 
            className="text-xs text-slate-600 dark:text-slate-400"
            label={{ value: unit, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            name="Valoare"
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          {showTarget && (
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

/**
 * Grafic bare pentru comparație KPI între categorii.
 */
interface KPIBarChartProps {
  data: ChartDataPoint[];
  title: string;
  unit?: string;
}

export function KPIBarChart({ data, title, unit = '' }: KPIBarChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          Nu există date disponibile
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis 
            dataKey="name" 
            className="text-xs text-slate-600 dark:text-slate-400"
          />
          <YAxis 
            className="text-xs text-slate-600 dark:text-slate-400"
            label={{ value: unit, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="value" 
            fill="#8b5cf6" 
            name="Valoare"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/**
 * Grafic radar pentru vizualizare multi-dimensională a KPI-urilor.
 */
interface KPIRadarChartProps {
  data: Array<{
    category: string;
    value: number;
    fullMark: number;
  }>;
  title: string;
}

export function KPIRadarChart({ data, title }: KPIRadarChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          Nu există date disponibile
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid className="stroke-slate-200 dark:stroke-slate-700" />
          <PolarAngleAxis 
            dataKey="category" 
            className="text-xs text-slate-600 dark:text-slate-400"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 'dataMax']}
            className="text-xs text-slate-600 dark:text-slate-400"
          />
          <Radar 
            name="Performanță" 
            dataKey="value" 
            stroke="#8b5cf6" 
            fill="#8b5cf6" 
            fillOpacity={0.6}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/**
 * Grafic pentru comparație KPI cu perioadă anterioară.
 */
interface KPIComparisonChartProps {
  currentPeriod: ChartDataPoint[];
  previousPeriod?: ChartDataPoint[];
  title: string;
  unit?: string;
}

export function KPIComparisonChart({ 
  currentPeriod, 
  previousPeriod, 
  title, 
  unit = '' 
}: KPIComparisonChartProps) {
  // Combină datele pentru comparație
  const combinedData = currentPeriod.map((current, index) => ({
    name: current.name || current.period,
    current: current.value,
    previous: previousPeriod?.[index]?.value,
  }));

  if (combinedData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          Nu există date disponibile
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis 
            dataKey="name" 
            className="text-xs text-slate-600 dark:text-slate-400"
          />
          <YAxis 
            className="text-xs text-slate-600 dark:text-slate-400"
            label={{ value: unit, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="current" 
            fill="#8b5cf6" 
            name="Perioadă curentă"
            radius={[8, 8, 0, 0]}
          />
          {previousPeriod && previousPeriod.length > 0 && (
            <Bar 
              dataKey="previous" 
              fill="#64748b" 
              name="Perioadă anterioară"
              radius={[8, 8, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/**
 * Helper pentru transformarea KPI-urilor în date pentru grafice.
 */
export function transformKPIsForChart(kpis: KPICardData[]): ChartDataPoint[] {
  return kpis
    .filter(kpi => kpi.value !== null)
    .map(kpi => ({
      period: kpi.period 
        ? new Date(kpi.period.end).toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' })
        : 'N/A',
      value: kpi.value!,
      name: kpi.kpi_name,
      target: kpi.target_range?.max ?? undefined,
    }));
}

/**
 * Helper pentru gruparea KPI-urilor pe categorii pentru radar chart.
 */
export function transformKPIsForRadar(kpis: KPICardData[]) {
  const categoryMap = new Map<string, { total: number; count: number; max: number }>();

  kpis.forEach(kpi => {
    if (kpi.value === null) return;
    
    const existing = categoryMap.get(kpi.category) || { total: 0, count: 0, max: 0 };
    categoryMap.set(kpi.category, {
      total: existing.total + kpi.value,
      count: existing.count + 1,
      max: Math.max(existing.max, kpi.target_range?.max ?? kpi.value),
    });
  });

  const categoryLabels: Record<string, string> = {
    liquidity: 'Lichiditate',
    profitability: 'Profitabilitate',
    leverage: 'Îndatorare',
    efficiency: 'Eficiență',
    growth: 'Creștere',
  };

  return Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category: categoryLabels[category] || category,
    value: stats.total / stats.count, // Media
    fullMark: stats.max * 1.2, // 120% din max pentru scale
  }));
}
