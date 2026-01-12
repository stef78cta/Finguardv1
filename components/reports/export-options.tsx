/**
 * Componentă pentru opțiunile de export ale rapoartelor.
 * 
 * Oferă:
 * - Dialog pentru selectare opțiuni export
 * - Alegere format (PDF/Excel)
 * - Opțiuni personalizare raport
 * - Preview și confirmare export
 * 
 * @module components/reports/export-options
 */

'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, CheckCircle, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { ReportExportFormat } from '@/types/reports';

/**
 * Props pentru componenta ExportOptions.
 */
export interface ExportOptionsProps {
  /** Dialog deschis/închis */
  open: boolean;
  
  /** Callback pentru închidere dialog */
  onClose: () => void;
  
  /** Callback pentru confirmare export */
  onExport: (format: ReportExportFormat, options: ExportCustomOptions) => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** ID raport pentru export */
  reportId?: string;
  
  /** Titlu raport */
  reportTitle?: string;
}

/**
 * Opțiuni personalizare export.
 */
export interface ExportCustomOptions {
  /** Include grafice */
  includeCharts: boolean;
  
  /** Include detalii complete */
  includeDetails: boolean;
  
  /** Include analiză comparativă */
  includeComparison: boolean;
  
  /** Calitate imagini (low/medium/high) */
  imageQuality: 'low' | 'medium' | 'high';
}

/**
 * Componentă ExportOptions - dialog opțiuni export rapoarte.
 */
export function ExportOptions({
  open,
  onClose,
  onExport,
  isLoading = false,
  reportTitle = 'Raport Financiar',
}: ExportOptionsProps) {
  const [selectedFormat, setSelectedFormat] = useState<ReportExportFormat>('pdf');
  const [customOptions, setCustomOptions] = useState<ExportCustomOptions>({
    includeCharts: true,
    includeDetails: true,
    includeComparison: false,
    imageQuality: 'high',
  });

  /**
   * Gestionează schimbarea opțiunii.
   */
  const handleOptionChange = (key: keyof ExportCustomOptions, value: boolean | string) => {
    setCustomOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Gestionează export-ul.
   */
  const handleExport = () => {
    onExport(selectedFormat, customOptions);
  };

  /**
   * Resetează opțiunile la valorile implicite.
   */
  const resetOptions = () => {
    setCustomOptions({
      includeCharts: true,
      includeDetails: true,
      includeComparison: false,
      imageQuality: 'high',
    });
    setSelectedFormat('pdf');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportă Raport</DialogTitle>
          <DialogDescription>
            Selectează formatul și opțiunile pentru exportul raportului "{reportTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selectare format */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Format Export
            </Label>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {/* PDF Option */}
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  selectedFormat === 'pdf'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                onClick={() => setSelectedFormat('pdf')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <FileText className={`h-5 w-5 ${
                      selectedFormat === 'pdf'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                        PDF
                      </h3>
                      {selectedFormat === 'pdf' && (
                        <CheckCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Format universal, ideal pentru prezentări și arhivare
                    </p>
                  </div>
                </div>
              </Card>

              {/* Excel Option */}
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  selectedFormat === 'excel'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                onClick={() => setSelectedFormat('excel')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <FileSpreadsheet className={`h-5 w-5 ${
                      selectedFormat === 'excel'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                        Excel
                      </h3>
                      {selectedFormat === 'excel' && (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Date editabile, perfect pentru analize suplimentare
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Opțiuni personalizare */}
          <div>
            <Label className="text-base font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Opțiuni Export
            </Label>
            
            <Card className="p-4">
              <div className="space-y-4">
                {/* Include Charts */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-50">
                      Include grafice
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Adaugă grafice vizuale pentru KPI-uri și tendințe
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={customOptions.includeCharts}
                    onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600"
                  />
                </div>

                {/* Include Details */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-50">
                      Include detalii complete
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Toate conturile și subcategoriile
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={customOptions.includeDetails}
                    onChange={(e) => handleOptionChange('includeDetails', e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600"
                  />
                </div>

                {/* Include Comparison */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-50">
                      Include analiză comparativă
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Compară cu perioada anterioară (dacă e disponibilă)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={customOptions.includeComparison}
                    onChange={(e) => handleOptionChange('includeComparison', e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600"
                  />
                </div>

                {/* Image Quality (doar pentru PDF) */}
                {selectedFormat === 'pdf' && customOptions.includeCharts && (
                  <div>
                    <div className="font-medium text-slate-900 dark:text-slate-50 mb-2">
                      Calitate imagini
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as const).map((quality) => (
                        <Button
                          key={quality}
                          variant={customOptions.imageQuality === quality ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleOptionChange('imageQuality', quality)}
                          className="capitalize"
                        >
                          {quality === 'low' ? 'Mică' : quality === 'medium' ? 'Medie' : 'Mare'}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      Calitate mai mare = fișier mai mare
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Info dimensiune estimată */}
          <Card className="p-3 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Dimensiune estimată:</strong>{' '}
                {selectedFormat === 'pdf' 
                  ? customOptions.includeCharts 
                    ? '2-5 MB' 
                    : '0.5-1 MB'
                  : '0.2-0.5 MB'
                }
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={resetOptions}
            disabled={isLoading}
          >
            Resetează
          </Button>
          
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Anulează
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={isLoading}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isLoading ? 'Se exportă...' : `Exportă ${selectedFormat.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
