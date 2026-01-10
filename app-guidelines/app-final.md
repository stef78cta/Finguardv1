## Descriere aplicatie

FinGuard – analiza afacerii tale

- este o aplicație care oferă o soluție completă pentru analiza financiară, cu indicatori cheie, validări automate și o interfață profesională adaptată pentru utilizatorii din domeniul contabil.

- este o aplicație web inovatoare care oferă servicii de analiză financiară automată pentru companiile românești. Platforma se poziționează ca un consultant financiar digital, oferind evaluări rapide și precise ale situației economice a firmelor.

- reprezintă o soluție mai avansată și comprehensivă pentru analiza financiară, orientată către managerii care necesită instrumente sofisticate de control și evaluare a performanței companiei.

- este ideal pentru antreprenorii care doresc evaluări rapide și punctuale ale situației financiare, oferind un raport cost-beneficiu excelent pentru analize ocazionale. Simplitatea și viteza sunt punctele sale forte.

- se adresează managerilor și profesioniștilor financiari care necesită instrumente complexe de monitorizare continuă, cu funcționalități avansate de planificare și control. Oferă o abordare holistică asupra managementului financiar.

## Funcționalități principale

- Analiză financiară automată: Aplicația procesează balanțele lunare încărcate de utilizatori și generează rapoarte de analiză financiară comprehensive în doar câteva secunde
- Ușurință în utilizare: Nu necesită identificarea firmei prin nume sau cod fiscal, asigurând confidențialitate totală
- Accesibilitate multiplă: Poate fi accesat de pe orice dispozitiv - telefon, tabletă, laptop sau desktop
- Securitate garantată: Datele sunt stocate în cloud pe Amazon, cu acces securizat prin email și parolă personalizată

## Features:

- Procesare rapidă a datelor financiare
- Preturi competitive comparativ cu consultanța tradițională
- Biblioteca personală cu istoricul rapoartelor generate
- Prezentarea trendurilor și a evoluției comparative
- Analize comparative pentru perioade anterioare
- Compararea evoluției lunare și anuale
- Identificarea rapidă a tendințelor de evoluție

## Analize detaliate

- Analiza veniturilor: Monitorizarea detaliată a cifrei de afaceri, altor venituri din exploatare, venituri financiare și extraordinare
- Analiza cheltuielilor: Evaluarea costurilor pe categorii (cheltuieli pentru realizarea cifrei de afaceri, cheltuieli fixe, cheltuieli financiare)
- Analiza patrimonială: Evaluarea activului (mijloace fixe, stocuri, creanțe, disponibilități) și pasivului (capitaluri proprii, datorii diverse)
- Indicatori Economico-Financiari , kpi
- Previziuni bugetare

## Grup țintă

- Afaceri mici și mijlocii care necesită control financiar riguros
- Firme și cabinete de contabilitate care oferă servicii către clienți
- Instituții financiare nebancare (IFN), companii de leasing și analiști financiari
- Analiști financiari - instrumente profesionale avansate

## Accesibilitate și compatibilitate

- Multi-device: accesibil de pe telefon, tabletă, laptop, desktop
- Format Excel suportat pentru încărcarea balanțelor
- Aplicație web - nu necesită instalare software
- Disponibilitate 24/7 - acces oricând la aplicație

## Descriere Meniuri:

### Meniu Landing Page :

- Cum functioneaza ,
- Caracteristici ,
- Testimoniale,
- Preturi ,
- Intrebari frecvente

### Meniu Footer :

- FinGuard - Claritate financiară bazată pe AI
- Resurse: Blog financiar, Ghid financiar , Studiu de caz
- Companie: Despre noi , Termeni si conditii , Politica confidentialitate

### Meniu user client (sidebar):

- Dashboard (dashboard-client-page)
- Incarcare balanta (incarca-balanta-page)
- Rapoarte financiare (rapoarte-financiare-page)
- Indicatori cheie (indicatori-page)
- Analize financiare (analize-financiare-page)
- Analize Comparative (analiza-comparative-page)
- Previziuni bugetare (previziuni-bugetare-page)
- Alte Analize (alte-analize-page)

### Meniu user admin (sidebar)

- Dashboard user admin (dashboard-admin-page)

## Workflow :

A din LandingPage user deschide (signup) cont in aplicatie:

- un user poate sa deschida cont pentru mai multe companii ;
- o companie poate sa aiba alocati mai multi useri
- dupa deschiderea unui cont se afiseaza dashboard client

B inserare companie pentru care se va analiza datele financiare:

- se va introduce codul unic de identificare a companiei (CUI) ; conditie de validare upload : userul trebuie sa achite abonamentul pentru utilizare

C user-ul incarca balanta de verificare

- un user poate sa incarce balante de la mai multe companii .

i. La incarcarea unei balante de verificare, user-ului i se solicita obligatoriu sa defineasca data documentului; Acea data va fi data de referinta a balantei de verificare.

Trebuie adăugat un câmp de dată obligatoriu în componenta de încărcare a balanței de verificare. Câmpul folosește un input de tip "date" cu validare obligatorie și este poziționat deasupra câmpului pentru fișier. Data selectată este salvată în obiectul `UploadedFile` și afișată în informațiile fișierului încărcat. Utilizatorul nu poate procesa fișierul fără să selecteze mai întâi data de referință a balanței.

ii. Modulul sa fie astfel încât să accepte orice balanță Excel/CSV și să o transforme în format standard pentru DB.

iii. daca un user incarca mai multe balante de verificare pentru aceeasi luna (aceeasi data de referinta a balantei de verificare) de la aceeasi companie sa fie intrebat daca balanta de verificare noua o inlocuiteste pe cea deja incarcata

iv. se efectueaza verificari tehnice a fisierului incarcat de catre user.

Verificarile unei balante de verificare sunt urmatoarele:

1. Step 1: detectează dacă e balanță cu 4 sau 5 egalități (sau alt format definit în config).Unele companii au balanță de verificare cu patru egalități, alte companii cu cinci egalități; Vrem să procesăm automat și uniform, soluția optimă e să avem un modul de “normalizare” a balanței imediat după upload, înainte de a salva datele în DB

Soluția propusă: Pas intermediar de normalizare

1️⃣ Detectare format automat

• La încărcarea fișierului, scriptul citește header-ul și numărul de coloane.
• În funcție de asta, identifică tipul balanței (4 egalități, 5 egalități etc.).
Exemplu logic simplificat:

```text
if (coloane.length === 6) tip = "4_egalitati";
else if (coloane.length === 8) tip = "5_egalitati";
```

---

2️⃣ Mapare dinamică a coloanelor

• Definim un dicționar de mapare care spune unde se află fiecare câmp.

3️⃣ Structură unificată în aplicație

După mapare, salvăm în DB un format standard:

```sql
CREATE TABLE trial_balance (
id (uuid, pk)
import_id (uuid, fk → trial_balance_imports.id)
account_code (varchar)
account_name (varchar)
opening_debit (numeric)
opening_credit (numeric)
debit_turnover (numeric)
credit_turnover (numeric)
closing_debit (numeric)
closing_credit (numeric)

);
```

Astfel:

• Dacă balanța nu are sold inițial → setăm 0.
• Dacă are coloane extra → le ignorăm după mapare.

2. Step 2: Ensure Your Trial Balance is Balanced ; we can use the built-in Data Validation functionality. (*)

v. dupa incarcarea unei balante de verificare , datele se vor verifica si valida, iar pe ecran la user va aparea mesajul “Balanta de verificare incarcata corect” sau “Balanta de verificare incarcata cu erori” , se vor afisa erorile pe care userul trebuie sa le corecteze in fisierul excel si apoi sa il incarce din nou

✅ Checklist tehnic pentru validarea balanței de verificare

1. Verificări de echilibru global
   • Total Debite = Total Credite
   • (Solduri inițiale + Rulaje debit) = (Solduri inițiale + Rulaje credit)

---

2. Verificarea structurii și a conturilor
   • Toate conturile din balanță există în Planul de Conturi
   • Nu există conturi invalide/eronate

---

3. Egalități de bază pe solduri și rulaje
   • Total solduri inițiale debitoare = Total solduri inițiale creditoare
   • Total rulaje debitoare = Total rulaje creditoare
   • Total solduri finale debitoare = Total solduri finale creditoare
   • Verificare suplimentară:
   (Sold inițial + Rulaj debit) = (Sold inițial + Rulaj credit)

---

4. Coerența aritmetică pe fiecare cont
   • Pentru fiecare cont:
   Sold final = Sold inițial + (Rulaj debit – Rulaj credit)

---

5. Închiderea conturilor de rezultat
   • Conturile din clasa 6 (Cheltuieli) au sold final = 0
   • Conturile din clasa 7 (Venituri) au sold final = 0
   • Contul 121 „Profit sau pierdere”:
   Sold final 121 = Total venituri (clasa 7) – Total cheltuieli (clasa 6)

---

6. Concordanța sintetic–analitic
   (Dacă există balanță analitică)
   • Totalurile subconturilor = soldul contului sintetic
   (ex. 401.01 + 401.02 + ... = 401)

✅ Structură mesaje validare/eroare – Balanță de verificare (PERN app)

1. Echilibru global
   • Cod eroare: BALANCE_GLOBAL_MISMATCH
   • Mesaj: „Eroare: totalul debitelor nu este egal cu totalul creditelor.”
   • Cod eroare: BALANCE_TOTAL_MISMATCH
   • Mesaj: „Eroare: suma soldurilor inițiale + rulaje debit ≠ suma soldurilor inițiale + rulaje credit.”

---

2. Structura conturilor
   • Cod eroare: INVALID_ACCOUNT
   • Mesaj: „Eroare: contul {account_number} nu există în Planul de Conturi.”

---

3. Egalități pe solduri și rulaje
   • Cod eroare: OPENING_BALANCE_MISMATCH
   • Mesaj: „Eroare: totalul soldurilor inițiale debitoare ≠ totalul soldurilor inițiale creditoare.”
   • Cod eroare: TURNOVER_MISMATCH
   • Mesaj: „Eroare: totalul rulajelor debitoare ≠ totalul rulajelor creditoare.”
   • Cod eroare: CLOSING_BALANCE_MISMATCH
   • Mesaj: „Eroare: totalul soldurilor finale debitoare ≠ totalul soldurilor finale creditoare.”

---

4. Coerența aritmetică per cont
   • Cod eroare: ACCOUNT_ARITHMETIC_ERROR
   • Mesaj: „Eroare la contul {account_number}: sold final ≠ sold inițial + (rulaj debit – rulaj credit).”

---

5. Închiderea conturilor de rezultat
   • Cod eroare: CLASS6_NOT_CLOSED
   • Mesaj: „Eroare: contul de cheltuieli {account_number} are sold final ≠ 0.”
   • Cod eroare: CLASS7_NOT_CLOSED
   • Mesaj: „Eroare: contul de venituri {account_number} are sold final ≠ 0.”
   • Cod eroare: ACCOUNT121_ERROR
   • Mesaj: „Eroare: soldul final al contului 121 nu corespunde cu diferența dintre venituri și cheltuieli.”

---

6. Concordanța sintetic–analitic
   • Cod eroare: SYNTHETIC_ANALYTIC_MISMATCH
   • Mesaj: „Eroare: totalul subconturilor pentru {account_number} nu este egal cu soldul contului sintetic.”

D dupa procesarea balantei de verificare, user poate sa vizualizeze rapoartele create

E Rapoartele, indicatorii , balantele de verificare se stocheaza in baza de date pe luna si companie

## Descriere Baza de date:

### Principii tabele – baza de date:

- baza de date trebuie ca toate datele incarcate de useri sa fie arhivate pe tip de document, perioada, companie, etc
- baza de date sa permita oricand ca un indicator kpi sa se modifice formula.
- baza de date care sa permita oricand ca un raport sa se modifice formule si structura.
- baza de date care sa separe intenționată între date contabile brute și date financiare derivate.
- Baza de date care sa permita reconstituirea balanței originale oricând, audit și trasabilitate, recalcul nelimitat al rapoartelor.

### Recomandari tabele:

#### 1. Identitate și acces

users

Reprezintă persoana autenticată.

• id (uuid, pk)
• email (varchar, unique)
• password_hash (varchar)
• full_name (varchar)
• rol_user (valori tipice: administrator_companie, contabilitate, asociat_companie, financiar, alt_rol
• created_at (timestamp)
• last_login_at (timestamp)

---

companies

Entitatea juridică analizată.

• id (uuid, pk)
• name (varchar)
• cui (varchar, unique)
• country_code (char(2))
• currency (char(3))
• fiscal_year_start_month (int)
• created_at (timestamp)

---

company_users

Relație many-to-many user ↔ company, cu rol.

• id (uuid, pk)
• company_id (uuid, fk → companies.id)
• user_id (uuid, fk → users.id)
• role (varchar)
valori tipice: client, admin
• created_at (timestamp)

---

#### 2. Import balanță de verificare

trial_balance_imports

Un upload de balanță pentru o perioadă. Definește contextul: companie, perioadă, fișier, status. Un import = o balanță pentru o perioadă.

La ce se folosește:

- Ca istoric al fișierelor încărcate (audit).
- Ca legătură între fișierul brut și datele extrase din el (trial_balance).
- Dacă există erori la procesare, poți ști exact ce fișier le-a provocat.
- În UI, pentru ca utilizatorul să-și vadă toate fișierele încărcate și statusul lor.

• id (uuid, pk)
• company_id (uuid, fk → companies.id)
• period_start (date)
• period_end (date)
• source_file_name (varchar)
• uploaded_by (uuid, fk → users.id)
• status (varchar)
draft, validated, processed, error
• created_at (timestamp)

---

trial_balance_accounts

Liniile din balanță (nivel de cont contabil). Conține toate sumele exact așa cum vin din balanță

Rol: Conține liniile individuale ale balanței de verificare după ce fișierul brut este citit, curățat și uniformizat.
Este forma standard pe care aplicația o poate folosi pentru calcule și rapoarte.

• id (uuid, pk)
• import_id (uuid, fk → trial_balance_imports.id)
• account_code (varchar)
• account_name (varchar)
• opening_debit (numeric)
• opening_credit (numeric)
• debit_turnover (numeric)
• credit_turnover (numeric)
• closing_debit (numeric)
• closing_credit (numeric)

---

#### 3. Plan contabil și mapare

chart_of_accounts

Planul de conturi intern, normalizat.

• id (uuid, pk)
• account_code (varchar)
• account_name (varchar)
• account_type (varchar)
asset, liability, equity, revenue, expense
• company_id (uuid, fk → companies.id, nullable pentru template global)

---

account_mappings

• Leagă conturile din balanță de structura financiară. Leagă fiecare cont din balanță de un cont intern sau categorie financiară.
Maparea se poate schimba fără a altera datele brute. Un recalcul va genera alte rezultate, dar balanța rămâne identică.

• id (uuid, pk)
• trial_balance_account_id (uuid, fk → trial_balance_accounts.id)
• chart_account_id (uuid, fk → chart_of_accounts.id)

---

#### 4. Date financiare derivate

financial_statements

Un set de rapoarte generate pentru o perioadă.

• id (uuid, pk)
• company_id (uuid, fk → companies.id)
• period_start (date)
• period_end (date)
• source_import_id (uuid, fk → trial_balance_imports.id)
• generated_at (timestamp)

---

balance_sheet_lines

Liniile din bilanț.

• id (uuid, pk)
• statement_id (uuid, fk → financial_statements.id)
• category (varchar)
active_imobilizate, active_curente, datorii, capitaluri
• account_code (varchar)
• amount (numeric)

---

profit_and_loss_lines

Liniile P&L.

• id (uuid, pk)
• statement_id (uuid, fk → financial_statements.id)
• category (varchar)
venituri_operationale, cheltuieli_operationale, financiare, extraordinare
• account_code (varchar)
• amount (numeric)

---

cash_flow_lines

Cash flow indirect sau direct.

• id (uuid, pk)
• statement_id (uuid, fk → financial_statements.id)
• section (varchar)
operating, investing, financing
• description (varchar)
• amount (numeric)

---

#### 5. KPI

kpi_definitions

Definiții standard sau custom.

Este “șablonul” unui indicator, nu valoarea efectivă.

Exemple:
Lichiditate curentă → formula: (Active circulante) / (Datorii pe termen scurt)
Marja netă → formula: (Profit net / Cifra de afaceri) * 100

• id (uuid, pk)
• code (varchar, unique)
• name (varchar)
• formula (text)
• unit (string)
• description (text)

---

kpi_values

Valori calculate pe perioadă.

Rol: Stochează valorile concrete ale indicatorilor și rapoartelor, pentru un anumit user, upload și perioadă.

La ce se folosește:
Pentru afișare rapidă a rezultatelor în UI (nu trebuie recalculat de fiecare dată).
Pentru istoric și comparații (poți vedea evoluția în timp a unui indicator).
Pentru export PDF/Excel cu valorile calculate.

• id (uuid, pk)
• kpi_definition_id (uuid, fk → kpi_definitions.id)
• company_id (uuid, fk → companies.id)
• period_start (date)
• period_end (date)
• value (numeric)
• calculated_at (timestamp)
• trial_balance_imports_id (uuid, fk → trial_balance_imports.id)
•

………………………….

## Indici și constrângeri PostgreSQL pentru performanță și integritate

- UUID, chei primare : toate tabelele folosesc uuid ca PK. Generezi UUID în aplicație sau cu gen_random_uuid().
- Constrângeri : pentru tabelul trial_balance_imports = singură balanță pe companie și perioadă.

CHECK (period_start <= period_end)

CHECK (status IN ('draft','validated','processed','error'))

- Constrângeri : pentru trial_balance_accounts = un cont nu poate fi simultan debitor și creditor.
  CHECK (
  NOT (opening_debit > 0 AND opening_credit > 0)
  );
  CHECK (
  NOT (closing_debit > 0 AND closing_credit > 0)
  );

- Constrângeri : pentru tabelul trial_balance_accounts = un cont apare o singură dată într-o balanță.

UNIQUE (import_id, account_code)

- Constrângeri : pentru tabelul financial_statements =

UNIQUE (company_id, period_start, period_end)

CHECK (period_start <= period_end)

- Constrângeri : pentru tabelul balance_sheet_lines = Un cont apare o singură dată pe bilanț.

UNIQUE (statement_id, account_code)

- Constrângeri : pentru tabelul profit_and_loss_lines

CHECK (
category IN ('venituri','cheltuieli')
);

UNIQUE (statement_id, account_code)

- Constrângeri : pentru tabelul kpi_definitions

UNIQUE (code)

- Constrângeri : pentru tabelul kpi_values

UNIQUE (
kpi_definition_id,
company_id,
period_start,
period_end
:)

CHECK (period_start <= period_end)

## Tech stack:

When suggesting code, please use the following libraries:

### 1. Frontend

o Framework: **React** cu **Next.js** și **TypeScript**

o Framework CSS: **Tailwind CSS**

o Managementul Stării: **Redux Toolkit cu RTK Query**

o Formulare: **React Hook Form** integrat cu **Zod**

o Autentificare: **Clerk** identity provider unic (frontend + backend)

o Comunicarea Frontend-Backend: **RTK Query** ; **Axios** (opțional doar pentru upload fișiere cu progres si pentru cazuri speciale (streaming, interceptori custom)

o Table: **React Table** (**TanStack Table**)

o **next-themes** - Sistem de teme pentru suport dark/light mode

o Export rapoarte: - **jspdf** + **html2canvas** – pentru export PDF - **xlsx** (tot **SheetJS**) ** – pentru export Excel.

o Upload & parsing fișiere:

- **SheetJS (xlsx)** – pentru citirea Excel/CSV direct în browser
- **PapaParse** – pentru fișiere CSV mari.

o Librării UI și componente: - **Radix UI** - Set complet de componente UI primitive (Dialog, Tabs, Progress, Select, etc.) - **shadcn/ui** - Sistem de componente bazat pe Radix UI și Tailwind CSS - **Lucide** - Iconuri SVG moderne (Bell, Settings, Upload, FileSpreadsheet, TrendingUp, etc.)

- **Date-fns**- manipulare date
- Charts- **Ant Design Charts** (G2Plot) ; regula : Ant Design doar pentru charts , niciun component UI Ant Design vizibil

- **Sonner**- toast notifications elegant

o Utilitare și validare: - **clsx & tailwind-merge** - Utilitare pentru gestionarea claselor CSS - **class-variance-authority (cva)** - Utilitar pentru variante de componente - **cn function** - Funcție helper pentru combinarea claselor Tailwind

o Development Tools:
• ESLint - linting pentru calitatea codului
• decimal.js pentru Decimal handling ; Evită number pentru sume financiare.

### 2. Backend

o Framework: Express.js cu TypeScript

o Baza de Date: PostgreSQL , folosind Prisma

o Securitate Backend:

- Validarea Datelor: Folosind Joi sau Express Validator.
- Protecția împotriva atacurilor CSRF și XSS: Folosind middleware-ul csurf (doar dacă se folosește cookie-based auth.)
- Rate Limiting și Protecție împotriva DDoS: Utilizarea express-rate-limit este o practică bună.
  Observație: Aceasta este o abordare solidă. Asigură-te că middleware-urile sunt configurate corespunzător pentru a preveni problemele de securitate.

o Controlul accesului API: CORS Asigură-te că este configurat corespunzător.

o Gestionarea variabilelor de mediu: dotenv

o Operațiuni CRUD ORM (Object-Relational Mapping): Refine cu Prisma

o Autentificare și Autorizare: Clerk identity provider unic (frontend + backend)

o Alte Tehnologii și Practici Recomandate:
a) Caching: Redis.
b) Serviciu de Logare: Winston pentru logarea evenimentelor și erorilor din
aplicație. Integrează cu Morgan pentru logarea cererilor HTTP, ceea ce este specific recomandat pentru aplicațiile Express.
c) Testare: Folosirea Jest și React Testing Library.
d) Observabilitate: Prometheus și Grafana pentru monitorizare, iar Elastic Stack (ELK) pentru logare și analiză sunt soluții puternice.
e) CI/CD: GitHub Actions este o alegere excelentă pentru automatizarea fluxului de lucru.
f) BullMQ + Redis background jobs (foarte recomandat , pentru: import balanțe mari , recalcul KPI ,generare rapoarte)

g) Upload & procesare fișiere pe server:
o Multer (pentru upload).
o xlsx sau csv-parser – pentru prelucrare server-side.
h) Deploy & hosting:
o Front-end: Vercel
o DB: Supabase (PostgreSQL cu API automat) Row Level Security (RLS) logic

---

