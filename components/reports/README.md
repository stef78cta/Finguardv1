# Reports Components

Componente React pentru gestionarea rapoartelor financiare în FinGuard.

## Componente Disponibile

### 1. ReportList

Componentă pentru afișarea listei de rapoarte cu filtrare, sortare și paginare.

**Features:**
- Tabel responsiv cu rapoarte
- Filtrare după tip și status
- Sortare multiple coloane
- Paginare
- Selecție multiplă
- Acțiuni: vizualizare, download, ștergere
- Alerte pentru rapoarte expirate

**Usage:**

```tsx
import { ReportList } from '@/components/reports/report-list';

<ReportList
  reports={reports}
  isLoading={isLoading}
  onDownload={(reportId) => handleDownload(reportId)}
  onView={(reportId) => router.push(`/dashboard/reports/${reportId}`)}
  onDelete={(reportId) => handleDelete(reportId)}
  onFilterTypeChange={(type) => setTypeFilter(type)}
  onFilterStatusChange={(status) => setStatusFilter(status)}
  currentTypeFilter={typeFilter}
  currentStatusFilter={statusFilter}
  currentPage={page}
  totalPages={totalPages}
  onPageChange={(page) => setPage(page)}
/>
```

### 2. ReportViewer

Componentă pentru vizualizarea detaliilor unui raport individual.

**Features:**
- Metadata raport completă
- Preview date JSON
- Acțiuni export multiple formate
- Alerte expirare
- Informații fișier

**Usage:**

```tsx
import { ReportViewer } from '@/components/reports/report-viewer';

<ReportViewer
  report={report}
  isLoading={isLoading}
  onDownload={(reportId, format) => handleDownload(reportId, format)}
  onDelete={(reportId) => handleDelete(reportId)}
  onRegenerate={(reportId) => handleRegenerate(reportId)}
/>
```

### 3. ExportOptions

Dialog pentru selectarea opțiunilor de export ale rapoartelor.

**Features:**
- Selectare format (PDF/Excel)
- Opțiuni personalizare (grafice, detalii, comparație)
- Setări calitate imagine
- Preview dimensiune estimată
- Resetare la valori implicite

**Usage:**

```tsx
import { ExportOptions } from '@/components/reports/export-options';

<ExportOptions
  open={isDialogOpen}
  onClose={() => setIsDialogOpen(false)}
  onExport={(format, options) => handleExport(format, options)}
  isLoading={isExporting}
  reportId={reportId}
  reportTitle={reportTitle}
/>
```

## Type Safety

Toate componentele folosesc tipuri TypeScript stricte din `@/types/reports`:

- `ReportWithDetails` - Raport cu date calculate
- `ReportType` - Tipuri de rapoarte
- `ReportStatus` - Statusuri raport
- `ReportExportFormat` - Formate export
- `ExportCustomOptions` - Opțiuni personalizare export

## Helper Functions

Funcții utilitare disponibile în `@/types/reports`:

- `formatReportType(type)` - Formatare tip raport în română
- `formatReportStatus(status)` - Formatare status în română
- `getReportStatusColor(status)` - Obținere clase Tailwind pentru status
- `formatFileSize(bytes)` - Formatare dimensiune fișier
- `isReportExpired(report)` - Verificare expirare raport
- `getDaysUntilExpiration(report)` - Zile rămase până la expirare

## Styling

Toate componentele folosesc:
- Tailwind CSS pentru styling
- shadcn/ui pentru componente UI de bază
- Dark mode support complet
- Responsive design

## Dependențe

- `lucide-react` - Iconuri
- `@/components/ui/*` - Componente shadcn/ui
- `@/types/reports` - Tipuri TypeScript

## API Integration

Componentele se integrează cu API-ul prin:
- Custom hooks (`useReports` - în dezvoltare)
- Callback props pentru acțiuni async
- Loading states pentru feedback utilizator

## Best Practices

1. **Loading States**: Afișează întotdeauna loading indicator pentru operațiuni async
2. **Error Handling**: Gestionează erorile la nivel de componentă părinte
3. **Accessibility**: Toate componentele au suport keyboard navigation
4. **Performance**: Folosește React.memo pentru componente mari (în dezvoltare)

## TODO

- [ ] Adaugă export bulk pentru selecție multiplă
- [ ] Implementează drag & drop pentru organizare rapoarte
- [ ] Adaugă preview raport înainte de download
- [ ] Implementează sharing links pentru rapoarte
- [ ] Adaugă templates personalizate pentru rapoarte

## Exemple Complete

Vezi `/app/dashboard/reports/page.tsx` pentru implementare completă.
