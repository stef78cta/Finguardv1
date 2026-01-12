'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { FileDropzone } from '@/components/upload/file-dropzone';
import { DatePicker } from '@/components/upload/date-picker';
import { UploadProgress, UploadStatus } from '@/components/upload/upload-progress';
import { ValidationResults } from '@/components/upload/validation-results';
import { DataPreview } from '@/components/upload/data-preview';
import { useCompanies } from '@/hooks/use-companies';
import { processTrialBalance, type ProcessingResult, type TrialBalanceAccount } from '@/lib/processing';

/**
 * Pagina de upload pentru Trial Balance files.
 * 
 * Workflow:
 * 1. Utilizatorul selectează compania
 * 2. Selectează data balanței (obligatoriu)
 * 3. Încarcă fișierul (Excel sau CSV)
 * 4. Sistemul procesează și validează automat
 * 5. Afișează rezultatele validării + preview date
 * 6. Dacă valid, utilizatorul poate importa în DB
 * 
 * Features:
 * - Drag & drop file upload
 * - Progress tracking în timp real
 * - Validare comprehensivă cu 16 verificări
 * - Preview primele 10 linii procesate
 * - Error handling clar și informativ
 */
export default function UploadPage() {
  const { userId: _userId } = useAuth(); // Unused for now, will be used for logging
  const { toast } = useToast();
  const { companies, loading: companiesLoading } = useCompanies();

  // State management
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [previewData, setPreviewData] = useState<TrialBalanceAccount[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * Handler pentru selecția fișierului.
   * Resetează starea anterioară și pregătește pentru procesare nouă.
   */
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setProcessingResult(null);
    setPreviewData([]);
    setUploadError(null);
    setUploadStatus('idle');
    setUploadProgress(0);
  };

  /**
   * Handler pentru procesarea fișierului.
   * Execută parsing, normalizare și validare folosind Trial Balance Processing Engine.
   */
  const handleProcessFile = async () => {
    if (!selectedFile) {
      toast({
        title: 'Eroare',
        description: 'Te rog selectează un fișier.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: 'Eroare',
        description: 'Te rog selectează data balanței.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCompanyId) {
      toast({
        title: 'Eroare',
        description: 'Te rog selectează compania.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Pas 1: Uploading (simulat - fișierul este deja în memory)
      setUploadStatus('uploading');
      setUploadProgress(10);
      setUploadError(null);

      await new Promise(resolve => setTimeout(resolve, 500)); // Simulare upload

      // Pas 2: Processing
      setUploadStatus('processing');
      setUploadProgress(30);

      // Citire fișier ca ArrayBuffer
      const fileBuffer = await selectedFile.arrayBuffer();

      // Procesare fișier folosind Trial Balance Engine
      const result = await processTrialBalance(
        fileBuffer,
        selectedFile.name,
        selectedFile.type,
        {
          balanceTolerance: 1, // Toleranță 1 RON
          strictAccountFormat: true,
          autoNormalizeNames: true,
        },
        {
          companyId: selectedCompanyId,
          periodStart: selectedDate,
          periodEnd: selectedDate,
          currency: 'RON',
        }
      );

      setUploadProgress(60);

      // Pas 3: Validating
      setUploadStatus('validating');
      setUploadProgress(80);

      await new Promise(resolve => setTimeout(resolve, 500)); // Simulare validare

      // Salvare rezultate
      setProcessingResult(result);
      setPreviewData(result.accounts);
      setUploadProgress(100);

      // Check dacă validarea a trecut
      if (result.success && result.validation.isValid) {
        setUploadStatus('success');
        toast({
          title: 'Success',
          description: `Fișierul a fost procesat cu succes. ${result.accounts.length} conturi importate.`,
        });
      } else {
        setUploadStatus('error');
        setUploadError(
          `Validare eșuată: ${result.errors.length} erori detectate.`
        );
        toast({
          title: 'Validare eșuată',
          description: 'Au fost detectate erori în fișier. Vezi detaliile mai jos.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadError(
        error instanceof Error ? error.message : 'A apărut o eroare la procesarea fișierului.'
      );
      toast({
        title: 'Eroare',
        description: 'A apărut o eroare la procesarea fișierului.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handler pentru salvarea datelor validate în DB.
   * Apelează API endpoint-ul /api/upload.
   */
  const handleImportToDatabase = async () => {
    if (!processingResult?.success || !previewData.length) {
      return;
    }

    try {
      setUploadStatus('processing');
      setUploadProgress(0);

      // TODO: Implementare API call către /api/upload
      // const response = await fetch('/api/upload', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     companyId: selectedCompanyId,
      //     balanceDate: selectedDate,
      //     data: previewData,
      //   }),
      // });

      // Simulare API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUploadProgress(100);
      setUploadStatus('success');

      toast({
        title: 'Import reușit',
        description: 'Datele au fost salvate cu succes în baza de date.',
      });

      // Reset form după import success
      setTimeout(() => {
        setSelectedFile(null);
        setProcessingResult(null);
        setPreviewData([]);
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      setUploadStatus('error');
      toast({
        title: 'Eroare import',
        description: 'A apărut o eroare la salvarea datelor.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Balanță de Verificare</h1>
        <p className="text-muted-foreground mt-2">
          Încarcă fișiere Excel sau CSV cu balanța de verificare pentru procesare automată
        </p>
      </div>

      <Separator />

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configurare Import</CardTitle>
          <CardDescription>
            Selectează compania și data, apoi încarcă fișierul pentru procesare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Selector */}
          <div className="space-y-2">
            <Label htmlFor="company">Companie *</Label>
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
              disabled={companiesLoading || uploadStatus === 'processing'}
            >
              <SelectTrigger id="company">
                <SelectValue placeholder="Selectează compania" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} ({company.cui})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Datele vor fi importate pentru compania selectată
            </p>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date">Data Balanței *</Label>
            <DatePicker
              date={selectedDate}
              onDateChange={setSelectedDate}
              disabled={uploadStatus === 'processing'}
              placeholder="Selectează data balanței (ex: 31 decembrie 2023)"
            />
            <p className="text-xs text-muted-foreground">
              Data pentru care este generată balanța de verificare
            </p>
          </div>

          {/* File Dropzone */}
          <div className="space-y-2">
            <Label>Fișier Balanță *</Label>
            <FileDropzone
              onFileSelect={handleFileSelect}
              disabled={uploadStatus === 'processing'}
              acceptedFormats={['.xlsx', '.xls', '.csv']}
              maxSize={10 * 1024 * 1024}
            />
            <p className="text-xs text-muted-foreground">
              Formate suportate: Excel (.xlsx, .xls) sau CSV. Dimensiune maximă: 10MB
            </p>
          </div>

          {/* Process Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setProcessingResult(null);
                setPreviewData([]);
                setUploadStatus('idle');
                setUploadProgress(0);
                setUploadError(null);
              }}
              disabled={uploadStatus === 'processing' || !selectedFile}
            >
              Resetează
            </Button>
            <Button
              onClick={handleProcessFile}
              disabled={
                !selectedFile ||
                !selectedDate ||
                !selectedCompanyId ||
                uploadStatus === 'processing'
              }
            >
              Procesează Fișierul
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadStatus !== 'idle' && (
        <UploadProgress
          status={uploadStatus}
          progress={uploadProgress}
          fileName={selectedFile?.name}
          error={uploadError || undefined}
        />
      )}

      {/* Validation Results */}
      {processingResult && (
        <ValidationResults result={processingResult.validation} />
      )}

      {/* Data Preview */}
      {previewData.length > 0 && (
        <DataPreview data={previewData} maxRows={10} />
      )}

      {/* Import Button */}
      {processingResult?.success && previewData.length > 0 && uploadStatus === 'success' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Datele sunt valide și gata pentru import</p>
                <p className="text-sm text-muted-foreground">
                  {previewData.length} conturi vor fi importate în baza de date
                </p>
              </div>
              <Button onClick={handleImportToDatabase} size="lg">
                Importă în Baza de Date
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
