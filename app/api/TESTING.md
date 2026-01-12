# API Testing Guide - FinGuard

Ghid pentru testarea API-urilor implementate în FinGuard.

## Reports API (Task 1.11)

### GET /api/companies/[id]/reports

Lista rapoarte pentru o companie cu filtrare, sortare și paginare.

**Query Parameters:**
- `reportType` (optional): Tip raport (`financial_analysis`, `kpi_dashboard`, `comparative_analysis`, `executive_summary`, `detailed_breakdown`)
- `status` (optional): Status raport (`generating`, `completed`, `error`)
- `sortBy` (optional): Câmp sortare (`created_at`, `title`, `report_type`)
- `sortOrder` (optional): Direcție (`asc`, `desc`)
- `page` (optional): Număr pagină (default: 1)
- `perPage` (optional): Elemente per pagină (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "uuid",
        "company_id": "uuid",
        "source_import_id": "uuid",
        "report_type": "financial_analysis",
        "title": "Analiză Financiară - Ianuarie 2024",
        "generated_by": "uuid",
        "file_path": "/path/to/file.pdf",
        "report_data": {},
        "created_at": "2024-01-15T10:00:00Z",
        "expires_at": null,
        "companyName": "Company Name",
        "periodFormatted": "Ianuarie 2024",
        "isExpired": false,
        "canDownload": true
      }
    ],
    "total": 25,
    "page": 1,
    "perPage": 10,
    "totalPages": 3,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

**Testing:**
```bash
# Test 1: Get all reports
curl -X GET "http://localhost:3000/api/companies/{company-id}/reports" \
  -H "Authorization: Bearer {clerk-token}"

# Test 2: Filter by type
curl -X GET "http://localhost:3000/api/companies/{company-id}/reports?reportType=kpi_dashboard" \
  -H "Authorization: Bearer {clerk-token}"

# Test 3: Pagination
curl -X GET "http://localhost:3000/api/companies/{company-id}/reports?page=2&perPage=5" \
  -H "Authorization: Bearer {clerk-token}"
```

---

### POST /api/companies/[id]/reports

Generează un raport nou pentru companie.

**Request Body:**
```json
{
  "reportType": "financial_analysis",
  "sourceImportId": "uuid",
  "title": "Analiză Financiară Ianuarie",
  "format": "pdf",
  "includeCharts": true,
  "includeDetails": true,
  "includeComparison": false,
  "language": "ro"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "status": "generating",
    "message": "Report generation started. You will be notified when it is ready."
  }
}
```

**Testing:**
```bash
curl -X POST "http://localhost:3000/api/companies/{company-id}/reports" \
  -H "Authorization: Bearer {clerk-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "kpi_dashboard",
    "sourceImportId": "{import-id}",
    "format": "pdf",
    "includeCharts": true
  }'
```

---

### GET /api/reports/[id]

Obține detaliile unui raport specific.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "company_id": "uuid",
    "report_type": "financial_analysis",
    "title": "Analiză Financiară - Ianuarie 2024",
    "file_path": "/path/to/file.pdf",
    "created_at": "2024-01-15T10:00:00Z",
    "companyName": "Company Name",
    "periodFormatted": "Ianuarie 2024",
    "fileSize": 2048576,
    "pageCount": 15,
    "isExpired": false,
    "canDownload": true
  }
}
```

**Testing:**
```bash
curl -X GET "http://localhost:3000/api/reports/{report-id}" \
  -H "Authorization: Bearer {clerk-token}"
```

---

### DELETE /api/reports/[id]

Șterge un raport.

**Response:**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

**Testing:**
```bash
curl -X DELETE "http://localhost:3000/api/reports/{report-id}" \
  -H "Authorization: Bearer {clerk-token}"
```

---

### GET /api/reports/[id]/download

Descarcă un raport în formatul specificat.

**Query Parameters:**
- `format` (required): Format download (`pdf`, `excel`)

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "/storage/reports/file.pdf",
    "filename": "analiza_financiara_ianuarie.pdf",
    "expiresIn": 3600,
    "message": "Download URL generated successfully"
  }
}
```

**Testing:**
```bash
# Download PDF
curl -X GET "http://localhost:3000/api/reports/{report-id}/download?format=pdf" \
  -H "Authorization: Bearer {clerk-token}"

# Download Excel
curl -X GET "http://localhost:3000/api/reports/{report-id}/download?format=excel" \
  -H "Authorization: Bearer {clerk-token}"
```

---

## Error Responses

Toate API-urile returnează erori în format consistent:

```json
{
  "success": false,
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validare eșuată)
- `401` - Unauthorized (lipsă autentificare)
- `403` - Forbidden (permisiuni insuficiente)
- `404` - Not Found (resursă inexistentă)
- `410` - Gone (raport expirat)
- `500` - Internal Server Error

---

## Securitate

Toate API-urile sunt protejate prin:

1. **Autentificare Clerk**: Token JWT în header Authorization
2. **Verificare access companie**: User-ul trebuie să fie membru al companiei
3. **Row Level Security**: Queries folosesc RLS policies din Supabase
4. **Activity Logging**: Toate acțiunile sunt înregistrate în `activity_logs`

---

## Testing Checklist

### Reports API

- [ ] GET /api/companies/[id]/reports - fără filtre
- [ ] GET /api/companies/[id]/reports - cu filtru tip raport
- [ ] GET /api/companies/[id]/reports - cu filtru status
- [ ] GET /api/companies/[id]/reports - cu sortare
- [ ] GET /api/companies/[id]/reports - cu paginare
- [ ] POST /api/companies/[id]/reports - generare raport valid
- [ ] POST /api/companies/[id]/reports - validare input invalid
- [ ] POST /api/companies/[id]/reports - import inexistent
- [ ] GET /api/reports/[id] - raport existent
- [ ] GET /api/reports/[id] - raport inexistent
- [ ] GET /api/reports/[id] - fără permisiuni
- [ ] DELETE /api/reports/[id] - ștergere cu permisiuni owner
- [ ] DELETE /api/reports/[id] - ștergere fără permisiuni
- [ ] GET /api/reports/[id]/download?format=pdf
- [ ] GET /api/reports/[id]/download?format=excel
- [ ] GET /api/reports/[id]/download - raport expirat

---

## Notes

- **TODO Task 1.10**: Implementare efectivă generare PDF/Excel
- **TODO Task 1.10**: Integrare cu Supabase Storage pentru fișiere
- **TODO Phase 2**: Background jobs cu BullMQ pentru procesare
- **TODO Phase 2**: Notificări email când raportul e gata
