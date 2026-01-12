# FinGuard - API Testing Guide

Ghid complet pentru testarea endpoint-urilor API create în Task 1.6.

**Data:** 12 Ianuarie 2026  
**Status:** Ready for Testing

---

## Prerequisites

1. **Server rulează local:** `npm run dev` (http://localhost:3000)
2. **Supabase configurat:** Database cu toate tabelele din schema
3. **Clerk configurat:** Autentificare funcțională
4. **Utilizator autentificat:** Trebuie să obții JWT token din Clerk
5. **Companie creată:** Trebuie să ai un company_id valid

---

## Obținere Token Autentificare

### Metoda 1: Din Browser DevTools

1. Deschide aplicația în browser
2. Autentifică-te cu Clerk
3. Deschide DevTools → Application → Cookies
4. Caută cookie-ul `__session` (Clerk JWT token)
5. Copiază valoarea

### Metoda 2: Din Network Tab

1. Autentifică-te în aplicație
2. DevTools → Network
3. Caută orice request către `/api/*`
4. Headers → `Authorization: Bearer <token>`
5. Copiază token-ul

---

## 1. POST /api/upload

Upload și procesare trial balance file.

### Request

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/balanta_decembrie_2024.xlsx" \
  -F "company_id=YOUR_COMPANY_UUID" \
  -F "period_start=2024-12-01" \
  -F "period_end=2024-12-31" \
  -F "description=Balanța decembrie 2024"
```

### Postman

- Method: `POST`
- URL: `http://localhost:3000/api/upload`
- Headers:
  - `Authorization`: `Bearer YOUR_JWT_TOKEN`
- Body: `form-data`
  - `file`: (file) - Selectează fișier Excel/CSV
  - `company_id`: (text) - UUID companie
  - `period_start`: (text) - `2024-12-01`
  - `period_end`: (text) - `2024-12-31`
  - `description`: (text) - `Balanța decembrie 2024` (optional)

### Response Success (201)

```json
{
  "success": true,
  "message": "Balanță încărcată și procesată cu succes",
  "data": {
    "import_id": "uuid-here",
    "company_id": "company-uuid",
    "file_name": "balanta_decembrie_2024.xlsx",
    "file_size": 45678,
    "period_start": "2024-12-01",
    "period_end": "2024-12-31",
    "accounts_count": 150,
    "validation": {
      "is_valid": true,
      "errors_count": 0,
      "warnings_count": 2
    },
    "totals": {
      "totalOpeningDebit": 1000000.0,
      "totalOpeningCredit": 1000000.0,
      "totalDebitTurnover": 500000.0,
      "totalCreditTurnover": 500000.0,
      "totalClosingDebit": 1200000.0,
      "totalClosingCredit": 1200000.0
    },
    "statistics": {
      "totalDuration": 1250,
      "parsingDuration": 450,
      "normalizationDuration": 300,
      "validationDuration": 500,
      "totalLines": 150,
      "successfulLines": 150,
      "failedLines": 0,
      "successRate": 100
    }
  },
  "errors": [],
  "warnings": [
    {
      "type": "DUAL_BALANCE",
      "message": "Contul 401 are atât sold debitor cât și creditor",
      "severity": "warning",
      "accountCode": "401",
      "lineNumber": 25
    }
  ]
}
```

### Response Error (422 - Validation Failed)

```json
{
  "success": false,
  "error": "Validarea balanței a eșuat",
  "errors": [
    {
      "type": "BALANCE_GLOBAL_MISMATCH",
      "message": "Total debite (1200000.00) ≠ Total credite (1199999.00). Diferență: 1.00 RON",
      "severity": "error"
    }
  ],
  "warnings": [],
  "statistics": {
    "totalDuration": 1250,
    "totalLines": 150,
    "successfulLines": 150,
    "successRate": 100
  }
}
```

### Response Error (400 - Bad Request)

```json
{
  "error": "Fișierul este prea mare. Maxim 10MB permis.",
  "details": {
    "fileSize": 12000000,
    "maxSize": 10485760
  }
}
```

---

## 2. GET /api/companies/[id]/imports

Listă imports pentru o companie cu paginare și filtrare.

### Request

```bash
curl -X GET "http://localhost:3000/api/companies/YOUR_COMPANY_UUID/imports?status=completed&year=2024&limit=10&offset=0&sortBy=created_at&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/companies/{company_id}/imports`
- Headers:
  - `Authorization`: `Bearer YOUR_JWT_TOKEN`
- Query Params:
  - `status`: `completed` (optional: pending, processing, completed, failed)
  - `year`: `2024` (optional)
  - `month`: `12` (optional: 1-12)
  - `limit`: `10` (optional, default: 50, max: 100)
  - `offset`: `0` (optional, default: 0)
  - `sortBy`: `created_at` (optional: created_at, period_start, file_name)
  - `sortOrder`: `desc` (optional: asc, desc)

### Response Success (200)

```json
{
  "data": [
    {
      "id": "uuid-1",
      "company_id": "company-uuid",
      "uploaded_by": "user-uuid",
      "source_file_name": "balanta_decembrie_2024.xlsx",
      "file_size_bytes": 45678,
      "period_start": "2024-12-01",
      "period_end": "2024-12-31",
      "status": "completed",
      "error_message": null,
      "validation_errors": {
        "errors": [],
        "warnings": [],
        "totals": {...}
      },
      "created_at": "2024-12-15T10:30:00Z",
      "updated_at": "2024-12-15T10:30:45Z",
      "processed_at": "2024-12-15T10:30:45Z"
    },
    {
      "id": "uuid-2",
      "company_id": "company-uuid",
      "uploaded_by": "user-uuid",
      "source_file_name": "balanta_noiembrie_2024.xlsx",
      "file_size_bytes": 43210,
      "period_start": "2024-11-01",
      "period_end": "2024-11-30",
      "status": "completed",
      "error_message": null,
      "validation_errors": {...},
      "created_at": "2024-11-15T14:20:00Z",
      "updated_at": "2024-11-15T14:20:30Z",
      "processed_at": "2024-11-15T14:20:30Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true,
    "nextOffset": 10
  },
  "filters": {
    "status": "completed",
    "year": 2024,
    "month": null,
    "sortBy": "created_at",
    "sortOrder": "desc"
  }
}
```

---

## 3. GET /api/imports/[id]

Detalii complete despre un import.

### Request

```bash
curl -X GET "http://localhost:3000/api/imports/IMPORT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/imports/{import_id}`
- Headers:
  - `Authorization`: `Bearer YOUR_JWT_TOKEN`

### Response Success (200)

```json
{
  "data": {
    "import": {
      "id": "import-uuid",
      "company_id": "company-uuid",
      "uploaded_by": "user-uuid",
      "file_name": "balanta_decembrie_2024.xlsx",
      "file_size": 45678,
      "file_path": "company-uuid/2024/balanta_decembrie_2024_1234567890.xlsx",
      "period_start": "2024-12-01",
      "period_end": "2024-12-31",
      "status": "completed",
      "error_message": null,
      "has_errors": false,
      "has_warnings": true,
      "validation_errors": [],
      "validation_warnings": [
        {
          "type": "DUAL_BALANCE",
          "message": "Contul 401 are atât sold debitor cât și creditor",
          "severity": "warning",
          "accountCode": "401"
        }
      ],
      "created_at": "2024-12-15T10:30:00Z",
      "updated_at": "2024-12-15T10:30:45Z",
      "processed_at": "2024-12-15T10:30:45Z"
    },
    "company": {
      "id": "company-uuid",
      "name": "ACME SRL",
      "cui": "RO12345678",
      "currency": "RON",
      "country_code": "RO"
    },
    "uploaded_by": {
      "id": "user-uuid",
      "name": "Ion Popescu",
      "email": "ion.popescu@example.com"
    },
    "statistics": {
      "total_accounts": 150,
      "total_closing_debit": 1200000.0,
      "total_closing_credit": 1200000.0,
      "balance_difference": 0.0,
      "is_balanced": true
    },
    "signed_url": "https://storage.supabase.co/signed-url-here?token=..."
  }
}
```

---

## 4. GET /api/imports/[id]/accounts

Listă conturi din balanță cu paginare și filtrare.

### Request

```bash
curl -X GET "http://localhost:3000/api/imports/IMPORT_UUID/accounts?account_class=4&has_credit=true&limit=50&offset=0&sortBy=account_code&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Postman

- Method: `GET`
- URL: `http://localhost:3000/api/imports/{import_id}/accounts`
- Headers:
  - `Authorization`: `Bearer YOUR_JWT_TOKEN`
- Query Params:
  - `account_code`: `40` (optional - prefix search)
  - `account_name`: `furnizori` (optional - case-insensitive search)
  - `account_class`: `4` (optional: 1-8)
  - `has_debit`: `true` (optional)
  - `has_credit`: `true` (optional)
  - `limit`: `100` (optional, default: 100, max: 500)
  - `offset`: `0` (optional, default: 0)
  - `sortBy`: `account_code` (optional: account_code, account_name, closing_debit, closing_credit)
  - `sortOrder`: `asc` (optional: asc, desc)

### Response Success (200)

```json
{
  "data": [
    {
      "id": "account-uuid-1",
      "import_id": "import-uuid",
      "account_code": "401",
      "account_name": "Furnizori",
      "opening_debit": 0.0,
      "opening_credit": 50000.0,
      "debit_turnover": 45000.0,
      "credit_turnover": 60000.0,
      "closing_debit": 0.0,
      "closing_credit": 65000.0,
      "created_at": "2024-12-15T10:30:45Z"
    },
    {
      "id": "account-uuid-2",
      "import_id": "import-uuid",
      "account_code": "401.01",
      "account_name": "Furnizori - SC ABC SRL",
      "opening_debit": 0.0,
      "opening_credit": 20000.0,
      "debit_turnover": 15000.0,
      "credit_turnover": 25000.0,
      "closing_debit": 0.0,
      "closing_credit": 30000.0,
      "created_at": "2024-12-15T10:30:45Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "hasMore": false,
    "nextOffset": null
  },
  "filters": {
    "account_code": null,
    "account_name": null,
    "account_class": "4",
    "has_debit": null,
    "has_credit": true,
    "sortBy": "account_code",
    "sortOrder": "asc"
  },
  "import_summary": {
    "import_id": "import-uuid",
    "period_start": "2024-12-01",
    "period_end": "2024-12-31",
    "total_accounts": 150,
    "total_debit": 1200000.0,
    "total_credit": 1200000.0
  },
  "page_totals": {
    "opening_debit": 0.0,
    "opening_credit": 125000.0,
    "debit_turnover": 105000.0,
    "credit_turnover": 155000.0,
    "closing_debit": 0.0,
    "closing_credit": 175000.0
  }
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Autentificare necesară"
}
```

### 403 Forbidden

```json
{
  "error": "Nu aveți permisiuni pentru această companie"
}
```

### 404 Not Found

```json
{
  "error": "Import negăsit"
}
```

### 500 Internal Server Error

```json
{
  "error": "Eroare internă de server",
  "details": "Error message here"
}
```

---

## Testing Workflow

### 1. Setup Initial Data

```bash
# 1. Autentifică-te în aplicație pentru a obține token
# Browser: http://localhost:3000/sign-in

# 2. Creează o companie prin UI sau API
# POST /api/companies (vezi documentația existentă)

# 3. Notează company_id din response
```

### 2. Upload Trial Balance

```bash
# Pregătește un fișier Excel/CSV valid
# Structură: Cont | Denumire | SD_initial | SC_initial | RD | RC | SD_final | SC_final

curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_balance.xlsx" \
  -F "company_id=YOUR_COMPANY_ID" \
  -F "period_start=2024-12-01" \
  -F "period_end=2024-12-31"

# Notează import_id din response
```

### 3. Get Import Details

```bash
curl -X GET "http://localhost:3000/api/imports/IMPORT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. List Accounts

```bash
curl -X GET "http://localhost:3000/api/imports/IMPORT_ID/accounts?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. List All Imports

```bash
curl -X GET "http://localhost:3000/api/companies/COMPANY_ID/imports?year=2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Validation Rules

### File Validation

- **Max size:** 10MB
- **Allowed types:** `.xlsx`, `.xls`, `.csv`
- **MIME types:** `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv`

### Trial Balance Validation

1. **BALANCE_GLOBAL_MISMATCH:** Total debite = Total credite (toleranță 1 RON)
2. **OPENING_BALANCE_MISMATCH:** Solduri inițiale echilibrate
3. **TURNOVER_MISMATCH:** Rulaje echilibrate
4. **CLOSING_BALANCE_MISMATCH:** Solduri finale echilibrate
5. **INVALID_ACCOUNT:** Cont inexistent în Plan Conturi
6. **ACCOUNT_ARITHMETIC_ERROR:** Sold final = Sold inițial + Rulaj
7. **CLASS6_NOT_CLOSED:** Cheltuieli (clasa 6) cu sold ≠ 0
8. **CLASS7_NOT_CLOSED:** Venituri (clasa 7) cu sold ≠ 0

---

## Notes pentru Testing

### TypeScript Issues

Există erori TypeScript minore legate de tipurile Supabase (returnează `never` pentru `trial_balance_imports` și `trial_balance_accounts`). Acestea sunt suprimate cu `@ts-ignore` și **NU afectează funcționalitatea runtime**.

**Soluție permanentă:** Regenerează tipurile Supabase după ce toate tabelele sunt create:

```bash
npm run db:types
# sau
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### Database Schema

Asigură-te că schema SQL completă este implementată în Supabase:

- ✅ `users`
- ✅ `companies`
- ✅ `company_users`
- ✅ `trial_balance_imports`
- ✅ `trial_balance_accounts`
- ✅ Storage bucket: `trial-balance-files`

### File Upload Testing

Pentru testing local, poți folosi fișiere Excel de test:

1. Creează un fișier Excel simplu cu structura balanței
2. Minim 8 coloane: Cont, Denumire, SD_init, SC_init, RD, RC, SD_final, SC_final
3. Asigură-te că totalurile sunt echilibrate

---

## Next Steps

După ce toate testele pass:

1. ✅ **Task 1.6 Complete** - API Endpoints funcționale
2. ⬜ **Task 1.7** - KPI Calculation Engine
3. ⬜ **Task 1.8** - KPI Dashboard UI
4. ⬜ **Task 1.9** - Financial Statements Generation

---

**Document Status:** Complete  
**Last Updated:** 12 Ianuarie 2026  
**Maintainer:** Development Team
