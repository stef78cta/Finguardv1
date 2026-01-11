# FinGuard - Supabase Storage Setup

## 📋 Overview

Acest folder conține configurația completă pentru Supabase Storage utilizat pentru stocarea fișierelor de balanță de verificare (trial balance files).

---

## 📁 Fișiere

### `storage_setup.sql`

Script SQL complet pentru configurarea storage infrastructure:

- **Bucket creation**: `trial-balance-files` cu limite și restricții
- **RLS Policies**: 4 politici pentru acces controlat (INSERT, SELECT, UPDATE, DELETE)
- **Helper Functions**: 3 funcții SQL pentru management și validare
- **Indexes**: Optimizări pentru query-uri frecvente
- **Verification**: Checks automate pentru setup corect

---

## 🚀 Quick Start

### Opțiunea 1: Supabase Dashboard (Recomandat)

1. Deschide **Supabase Dashboard** → **SQL Editor**
2. Creează un nou query
3. Copiază conținutul din `storage_setup.sql`
4. Rulează scriptul (F5 sau click "Run")
5. Verifică output-ul pentru mesaje de success

### Opțiunea 2: Supabase CLI

```bash
# Asigură-te că ești în root-ul proiectului
cd C:\_Software\SAAS\Finguard

# Link proiectul (dacă nu ai făcut deja)
supabase link --project-ref YOUR_PROJECT_REF

# Copiază scriptul în migrations
cp database/storage/storage_setup.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_storage_setup.sql

# Aplică migrația
supabase db push
```

---

## 🔧 Configurație

### Bucket Settings

```sql
Bucket ID: trial-balance-files
Public: false (acces controlat prin RLS)
Max File Size: 10MB (10,485,760 bytes)
Allowed MIME Types:
  - application/vnd.ms-excel (.xls)
  - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (.xlsx)
  - text/csv (.csv)
  - application/csv (.csv alternate)
```

### Path Structure

```
company_id/year/filename.ext

Exemplu:
550e8400-e29b-41d4-a716-446655440000/2024/balanta_decembrie_2024_1736601234567.xlsx
```

**Componente:**
- `company_id`: UUID al companiei (segment 1)
- `year`: An (1900-2100) (segment 2)
- `filename`: Nume fișier sanitizat cu timestamp pentru unicitate (segment 3)

---

## 🔐 Row Level Security Policies

### Policy 1: Upload Files (INSERT)
- **Nume**: `Users can upload files to their companies`
- **Permisiuni**: Authenticated users
- **Condiții**: 
  - User are acces la companie prin `company_users`
  - Path începe cu `company_id` valid

### Policy 2: Download Files (SELECT)
- **Nume**: `Users can download their company files`
- **Permisiuni**: Toate rolurile din companie (owner/admin/member/viewer)
- **Condiții**: User este membru în `company_users`

### Policy 3: Delete Files (DELETE)
- **Nume**: `Users can delete their company files`
- **Permisiuni**: Doar owner/admin
- **Condiții**:
  - Rol owner sau admin
  - Fișier mai nou de 90 zile (protecție audit)

### Policy 4: Update Metadata (UPDATE)
- **Nume**: `Users can update their company file metadata`
- **Permisiuni**: Doar owner/admin
- **Condiții**: 
  - Rol owner sau admin
  - Nu se poate schimba `company_id` din path

---

## 🛠️ Helper Functions

### 1. `storage.validate_file_path(TEXT)`

Validează formatul path-ului.

```sql
SELECT storage.validate_file_path('550e8400-e29b-41d4-a716-446655440000/2024/file.xlsx');
-- Returns: true

SELECT storage.validate_file_path('invalid-path');
-- Returns: false
```

**Validări:**
- Minimum 3 segmente (company_id/year/filename)
- Primul segment = UUID valid
- Al doilea segment = an valid (1900-2100)

### 2. `storage.get_company_storage_stats(UUID)`

Obține statistici storage per companie.

```sql
SELECT * FROM storage.get_company_storage_stats('company-uuid');
```

**Returns:**
- `total_files`: Număr total fișiere
- `total_size_bytes`: Dimensiune totală bytes
- `total_size_mb`: Dimensiune MB
- `avg_size_bytes`: Dimensiune medie
- `oldest_file`: Data celui mai vechi fișier
- `newest_file`: Data celui mai nou fișier

### 3. `storage.cleanup_old_files(INT)`

Șterge fișiere vechi fără import asociat activ.

```sql
-- Șterge fișiere mai vechi de 365 zile
SELECT storage.cleanup_old_files(365);
-- Returns: număr fișiere șterse
```

**Utilizare:** Rulează ca maintenance job (cron) pentru curățare automată.

---

## ✅ Verificare Setup

După rularea scriptului, verifică că totul funcționează:

### 1. Verifică Bucket

```sql
SELECT * FROM storage.buckets WHERE id = 'trial-balance-files';
```

Trebuie să returneze un rând cu:
- `public = false`
- `file_size_limit = 10485760`
- `allowed_mime_types` = array cu 4 tipuri

### 2. Verifică Policies

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%company%';
```

Trebuie să returneze 4 politici:
- INSERT policy
- SELECT policy
- UPDATE policy
- DELETE policy

### 3. Verifică Functions

```sql
SELECT proname 
FROM pg_proc 
WHERE proname IN (
  'validate_file_path',
  'get_company_storage_stats',
  'cleanup_old_files'
);
```

Trebuie să returneze cele 3 funcții.

### 4. Test Upload (TypeScript)

```typescript
import { uploadFile } from '@/lib/supabase/storage';

const result = await uploadFile({
  companyId: 'your-company-uuid',
  file: yourFile,
  year: 2024,
});

console.log('Upload success:', result.path);
```

---

## 🧪 Testing RLS

### Test ca Utilizator Autentificat

```sql
-- Setează contextul utilizatorului
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "clerk-user-id-here"}';

-- Încearcă să listezi fișiere
-- Ar trebui să vezi doar fișierele companiilor tale
SELECT name, created_at 
FROM storage.objects 
WHERE bucket_id = 'trial-balance-files';
```

### Test Upload Permission

```sql
-- Ca utilizator cu acces la companie X
-- Upload ar trebui să reușească:
INSERT INTO storage.objects (bucket_id, name, ...)
VALUES ('trial-balance-files', 'company-x-uuid/2024/test.xlsx', ...);

-- Upload în altă companie (fără acces)
-- Ar trebui să eșueze:
INSERT INTO storage.objects (bucket_id, name, ...)
VALUES ('trial-balance-files', 'company-y-uuid/2024/test.xlsx', ...);
-- Error: new row violates row-level security policy
```

---

## 🔗 Integrare

### TypeScript Utilities

Utilizează funcțiile din `lib/supabase/storage.ts`:

```typescript
import {
  uploadFile,
  downloadFile,
  deleteFile,
  listCompanyFiles,
  validateFile,
  generateStoragePath,
} from '@/lib/supabase/storage';
```

### React Hooks

Utilizează hooks din `lib/hooks/use-file-upload.ts`:

```typescript
import {
  useFileUpload,
  useMultiFileUpload,
  useDragAndDrop,
} from '@/lib/hooks/use-file-upload';
```

### TypeScript Types

Importă tipuri din `types/storage.ts`:

```typescript
import type {
  StorageUploadOptions,
  StorageUploadResult,
  StorageFileMetadata,
  CompanyStorageStats,
} from '@/types/storage';
```

---

## 📊 Monitoring

### Query Storage Stats per Companie

```sql
SELECT 
  c.name as company_name,
  s.total_files,
  ROUND(s.total_size_mb, 2) as size_mb,
  s.oldest_file::date,
  s.newest_file::date
FROM companies c
CROSS JOIN LATERAL storage.get_company_storage_stats(c.id) s
WHERE s.total_files > 0
ORDER BY s.total_size_mb DESC;
```

### Query Total Storage Usage

```sql
SELECT 
  COUNT(*) as total_files,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'trial-balance-files';
```

---

## 🚨 Troubleshooting

### Problema: RLS blochează upload-ul

**Cauză:** User-ul nu are acces la companie sau JWT claims lipsesc.

**Soluție:**
```sql
-- Verifică membership
SELECT * FROM company_users 
WHERE user_id IN (
  SELECT id FROM users WHERE clerk_user_id = 'clerk-id-here'
);

-- Verifică JWT
SELECT auth.jwt() ->> 'sub';
```

### Problema: Eroare "bucket not found"

**Cauză:** Bucket-ul nu a fost creat sau numele este greșit.

**Soluție:**
```sql
-- Re-run bucket creation
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('trial-balance-files', 'trial-balance-files', false, 10485760, 
  ARRAY['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/csv'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

### Problema: File size limit exceeded

**Cauză:** Fișierul depășește 10MB.

**Soluție:**
```typescript
// Verifică dimensiunea înainte de upload
import { validateFile } from '@/lib/supabase/storage';

const validation = validateFile(file);
if (!validation.isValid) {
  alert(validation.error); // "Fișierul este prea mare. Maxim 10MB permis."
}
```

---

## 📚 Documentație Completă

Pentru detalii complete despre implementare, vezi:

- **`TASK_0.5_STORAGE.md`** - Documentație completă task
- **`lib/supabase/storage.ts`** - Implementare utilități TypeScript
- **`lib/hooks/use-file-upload.ts`** - React hooks
- **`types/storage.ts`** - Tipuri TypeScript

---

## 🔄 Maintenance

### Cleanup Job Recomandat

Rulează lunar pentru curățare fișiere vechi:

```typescript
// API route: app/api/admin/maintenance/storage-cleanup/route.ts
export async function POST() {
  const supabase = await createServerClient();
  const { data } = await supabase.rpc('cleanup_old_files', { days_old: 365 });
  return Response.json({ filesDeleted: data });
}
```

### Monitoring Recommendations

- **Weekly**: Verifică storage usage per companie
- **Monthly**: Rulează cleanup pentru fișiere vechi
- **Quarterly**: Review și ajustează limits dacă necesar

---

## ✅ Status

**Setup Status:** ✅ COMPLETED  
**Data:** 11 Ianuarie 2026  
**Task:** 0.5 - File Storage Configuration  
**Phase:** PHASE 0 - Foundation Setup (100% Complete)

**Next Steps:**
- Testează upload în Supabase Dashboard
- Integrează în UI components (Task 1.5)
- Link cu Trial Balance Processing (Task 1.4)

---

**Ultima actualizare:** 11 Ianuarie 2026  
**Versiune:** 1.0
