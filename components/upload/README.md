# Upload Components - FinGuard

Componente React pentru interfața de upload și procesare a balanțelor de verificare.

## Componente Disponibile

### 1. FileDropzone

Componentă drag & drop pentru upload fișiere Trial Balance.

**Caracteristici:**
- Drag & drop support cu highlight visual
- Click pentru selecție fișier
- Validare tip fișier (Excel: .xlsx, .xls / CSV: .csv)
- Validare dimensiune (10MB max)
- Preview informații fișier selectat
- Opțiune ștergere fișier înainte de procesare
- Mesaje eroare clare și informative

**Utilizare:**
```tsx
import { FileDropzone } from '@/components/upload/file-dropzone';

<FileDropzone 
  onFileSelect={(file) => console.log(file)}
  acceptedFormats={['.xlsx', '.xls', '.csv']}
  maxSize={10 * 1024 * 1024}
  disabled={false}
/>
```

---

### 2. ValidationResults

Componentă pentru afișarea rezultatelor validării Trial Balance.

**Caracteristici:**
- Status general (valid/invalid)
- Erori critice (blocante) cu 4 nivele severity
- Avertismente (non-blocante)
- Metadata procesare (totaluri, linii)
- Detalii tehnice pentru fiecare eroare (linie, sugestie)
- Scroll area pentru liste lungi
- Badge-uri pentru contorizare erori/avertismente

**Utilizare:**
```tsx
import { ValidationResults } from '@/components/upload/validation-results';

<ValidationResults 
  result={validationResult}
  metadata={{
    totalRows: 100,
    validRows: 95,
    totalDebit: 1500000,
    totalCredit: 1500000,
  }}
/>
```

---

### 3. UploadProgress

Componentă pentru tracking progress procesare fișier.

**Caracteristici:**
- Progress bar animat
- 5 status-uri: idle, uploading, processing, validating, success, error
- Culori dinamice (success=verde, error=roșu, default=primary)
- Mesaje status descriptive
- Indicator progres procentual
- Pași vizuali (Pas 1/3, 2/3, 3/3)
- Mesaje success/error cu detalii

**Utilizare:**
```tsx
import { UploadProgress } from '@/components/upload/upload-progress';

<UploadProgress 
  status="processing"
  progress={45}
  fileName="balanta_dec_2023.xlsx"
  error={undefined}
/>
```

---

### 4. DatePicker

Componentă calendar pentru selecția datei balanței.

**Caracteristici:**
- Calendar widget cu react-day-picker
- Localizare română (date-fns/locale/ro)
- Popover pentru selecție dată
- Format afișare: dd MMMM yyyy (ex: 31 decembrie 2023)
- Buton dezactivabil
- Placeholder customizabil

**Utilizare:**
```tsx
import { DatePicker } from '@/components/upload/date-picker';

<DatePicker 
  date={selectedDate}
  onDateChange={(date) => setSelectedDate(date)}
  placeholder="Selectează data balanței"
  disabled={false}
/>
```

---

### 5. DataPreview

Componentă pentru preview primele N linii procesate din Trial Balance.

**Caracteristici:**
- Tabel cu toate 8 coloane standard
- Preview primele 10 linii (configurabil)
- Formatare valori numerice (locale ro-RO)
- Scroll area pentru vizualizare completă
- Totaluri parțiale pentru preview
- Badge pentru indicare linii suplimentare
- Empty state pentru listă goală

**Utilizare:**
```tsx
import { DataPreview } from '@/components/upload/data-preview';

<DataPreview 
  data={processedAccounts}
  maxRows={10}
/>
```

---

## Workflow Upload Complet

Exemplu de utilizare a tuturor componentelor împreună în pagina `/dashboard/upload`:

```tsx
'use client';

import { useState } from 'react';
import { FileDropzone } from '@/components/upload/file-dropzone';
import { DatePicker } from '@/components/upload/date-picker';
import { UploadProgress } from '@/components/upload/upload-progress';
import { ValidationResults } from '@/components/upload/validation-results';
import { DataPreview } from '@/components/upload/data-preview';
import { processTrialBalance } from '@/lib/processing';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [processingResult, setProcessingResult] = useState(null);

  const handleProcessFile = async () => {
    // 1. Upload simulation
    setUploadStatus('uploading');
    setProgress(10);

    // 2. Processing
    setUploadStatus('processing');
    setProgress(30);
    const fileBuffer = await selectedFile!.arrayBuffer();
    const result = await processTrialBalance(
      fileBuffer,
      selectedFile!.name,
      selectedFile!.type
    );
    setProgress(60);

    // 3. Validating
    setUploadStatus('validating');
    setProgress(80);
    
    // 4. Complete
    setProcessingResult(result);
    setProgress(100);
    setUploadStatus(result.success ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      <DatePicker date={selectedDate} onDateChange={setSelectedDate} />
      <FileDropzone onFileSelect={setSelectedFile} />
      <Button onClick={handleProcessFile}>Procesează</Button>
      
      {uploadStatus !== 'idle' && (
        <UploadProgress 
          status={uploadStatus} 
          progress={progress}
          fileName={selectedFile?.name}
        />
      )}
      
      {processingResult && (
        <>
          <ValidationResults result={processingResult.validation} />
          <DataPreview data={processingResult.accounts} maxRows={10} />
        </>
      )}
    </div>
  );
}
```

---

## Dependențe

- **react-dropzone**: Drag & drop functionality
- **date-fns**: Date formatting și localizare română
- **react-day-picker**: Calendar widget
- **shadcn/ui**: Badge, ScrollArea, Calendar, Button, Card, etc.

---

## Tipuri TypeScript

Toate componentele sunt fully typed cu TypeScript. Tipurile principale:

```typescript
// Upload status
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'validating' | 'success' | 'error';

// Trial Balance Account
interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  openingDebit: number;
  openingCredit: number;
  debitTurnover: number;
  creditTurnover: number;
  closingDebit: number;
  closingCredit: number;
}

// Processing Result
interface ProcessingResult {
  success: boolean;
  accounts: TrialBalanceAccount[];
  validation: ValidationResult;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  // ...
}
```

---

## Acceptance Criteria - Task 1.5 ✅

- [x] Componentă drag & drop funcțională cu react-dropzone
- [x] Progress bar pentru upload și procesare
- [x] Preview primele 10 linii după upload
- [x] Selector dată obligatoriu (calendar widget)
- [x] Afișare erori de validare clare cu indicarea liniei
- [x] Build SUCCESS fără erori TypeScript
- [x] UI responsive pe toate device-urile

---

## Next Steps

Task 1.6: Upload API Endpoints
- Implementare `POST /api/upload` pentru procesare și salvare în DB
- Implementare `GET /api/companies/[id]/imports` pentru listă imports
- Integrare cu Supabase pentru storage și database
