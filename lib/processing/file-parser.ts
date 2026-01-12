/**
 * File Parser pentru balanțe de verificare în format Excel și CSV.
 * 
 * Suportă:
 * - Excel (.xlsx, .xls)
 * - CSV cu diverse delimitatoare (,;|tab)
 * - Detectare automată format și mapare coloane
 * - Handling celule merged și formule Excel
 * 
 * @module lib/processing/file-parser
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type {
  RawTrialBalanceLine,
  FileMetadata,
  FormatDetectionResult,
  ColumnMapping,
  ValidationError,
} from '@/types/trial-balance';

/**
 * Parsează un fișier Excel sau CSV și extrage liniile brute.
 * 
 * @param file - Buffer sau string cu conținutul fișierului
 * @param fileName - Nume fișier pentru metadata
 * @param mimeType - Tip MIME fișier
 * @returns Promise cu rezultatul parsării
 * 
 * @example
 * ```typescript
 * const buffer = await file.arrayBuffer();
 * const result = await parseFile(buffer, 'balanta.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
 * ```
 */
export async function parseFile(
  file: ArrayBuffer | Buffer | string,
  fileName: string,
  mimeType: string
): Promise<{
  rawLines: RawTrialBalanceLine[];
  metadata: FileMetadata;
  errors: ValidationError[];
}> {
  const startTime = Date.now();
  const errors: ValidationError[] = [];

  try {
    // Detectează tipul fișierului
    const isExcel = mimeType.includes('spreadsheet') || 
                    mimeType.includes('excel') ||
                    fileName.endsWith('.xlsx') ||
                    fileName.endsWith('.xls');
    
    const isCsv = mimeType.includes('csv') || 
                  mimeType.includes('text/plain') ||
                  fileName.endsWith('.csv');

    let rawLines: RawTrialBalanceLine[];
    let columnMapping: ColumnMapping;

    if (isExcel) {
      const parseResult = parseExcelFile(file as ArrayBuffer | Buffer);
      rawLines = parseResult.rawLines;
      columnMapping = parseResult.columnMapping;
    } else if (isCsv) {
      const parseResult = parseCsvFile(file as string);
      rawLines = parseResult.rawLines;
      columnMapping = parseResult.columnMapping;
    } else {
      errors.push({
        type: 'UNSUPPORTED_FILE_TYPE',
        message: `Tip fișier nesuportat: ${mimeType}. Vă rugăm încărcați un fișier Excel (.xlsx) sau CSV (.csv).`,
        severity: 'error',
      });
      
      return {
        rawLines: [],
        metadata: createEmptyMetadata(fileName, mimeType),
        errors,
      };
    }

    // Validare că am găsit linii
    if (rawLines.length === 0) {
      errors.push({
        type: 'EMPTY_FILE',
        message: 'Fișierul nu conține date valide. Verificați că fișierul nu este gol și conține balanța de verificare.',
        severity: 'error',
      });
    }

    const metadata: FileMetadata = {
      fileName,
      fileSize: getFileSize(file),
      mimeType,
      detectedFormat: isExcel ? 'excel' : 'csv',
      columnCount: Object.keys(rawLines[0] || {}).length - 1, // -1 pentru lineNumber
      columnMapping,
      processedAt: new Date(),
    };

    const duration = Date.now() - startTime;
    console.log(`[FileParser] Fișier parsat în ${duration}ms: ${rawLines.length} linii`);

    return { rawLines, metadata, errors };
  } catch (error) {
    errors.push({
      type: 'PARSING_ERROR',
      message: `Eroare la parsarea fișierului: ${error instanceof Error ? error.message : 'Eroare necunoscută'}`,
      severity: 'error',
      details: { error: String(error) },
    });

    return {
      rawLines: [],
      metadata: createEmptyMetadata(fileName, mimeType),
      errors,
    };
  }
}

/**
 * Parsează un fișier Excel folosind biblioteca xlsx.
 */
function parseExcelFile(file: ArrayBuffer | Buffer): {
  rawLines: RawTrialBalanceLine[];
  formatResult: FormatDetectionResult;
  columnMapping: ColumnMapping;
} {
  // Citește workbook-ul Excel
  const workbook = XLSX.read(file, { 
    type: 'buffer',
    cellFormula: false, // Evaluăm formulele, nu le păstrăm
    cellDates: true,    // Convertim datele automat
  });

  // Presupunem că balanța este pe primul sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convertim sheet-ul în array de array-uri (not objects)
  const data: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1, // Păstrăm headerul ca prima linie
    defval: null, // Valoare default pentru celule goale
    blankrows: false, // Ignorăm rândurile goale
    raw: false, // Nu convertim valori
  }) as unknown[][];

  // Detectăm formatul și găsim rândul cu header
  const formatResult = detectFormat(data);
  
  // Extragem header-ul
  const headerRow = data[formatResult.headerRow] as string[];
  
  // Detectăm maparea coloanelor
  const columnMapping = detectColumnMapping(headerRow);

  // Extragem datele (de la dataStartRow încolo)
  const rawLines: RawTrialBalanceLine[] = [];
  
  for (let i = formatResult.dataStartRow; i < data.length; i++) {
    const row = data[i] as unknown[];
    
    // Ignoră rânduri goale sau cu doar null-uri
    if (!row || row.every((cell) => cell === null || cell === undefined || cell === '')) {
      continue;
    }

    // Creează obiect cu datele din rând
    const line: RawTrialBalanceLine = {
      lineNumber: i + 1, // +1 pentru că Excel începe de la 1
    };

    // Mapăm fiecare coloană
    headerRow.forEach((header, colIndex) => {
      const cellValue = row[colIndex];
      line[header || `col_${colIndex}`] = normalizeCellValue(cellValue);
    });

    rawLines.push(line);
  }

  return { rawLines, formatResult, columnMapping };
}

/**
 * Parsează un fișier CSV folosind PapaParse.
 */
function parseCsvFile(content: string): {
  rawLines: RawTrialBalanceLine[];
  formatResult: FormatDetectionResult;
  columnMapping: ColumnMapping;
} {
  // Auto-detectează delimitatorul
  const delimiter = detectCsvDelimiter(content);

  // Parsează CSV-ul
  const parseResult = Papa.parse(content, {
    delimiter,
    header: false, // Vom procesa headerul manual
    skipEmptyLines: true,
    dynamicTyping: true, // Convertește automat numerele
    transformHeader: (header: string) => header.trim(),
  });

  const data = parseResult.data as string[][];

  // Detectăm formatul
  const formatResult = detectFormat(data);
  formatResult.delimiter = delimiter;

  // Extragem header-ul
  const headerRow = data[formatResult.headerRow];
  
  // Detectăm maparea coloanelor
  const columnMapping = detectColumnMapping(headerRow);

  // Extragem datele
  const rawLines: RawTrialBalanceLine[] = [];

  for (let i = formatResult.dataStartRow; i < data.length; i++) {
    const row = data[i];

    if (!row || row.length === 0) {
      continue;
    }

    const line: RawTrialBalanceLine = {
      lineNumber: i + 1,
    };

    headerRow.forEach((header, colIndex) => {
      line[header || `col_${colIndex}`] = normalizeCellValue(row[colIndex]);
    });

    rawLines.push(line);
  }

  return { rawLines, formatResult, columnMapping };
}

/**
 * Detectează formatul balanței și găsește rândul cu header și primul rând cu date.
 */
function detectFormat(data: unknown[][]): FormatDetectionResult {
  let headerRow = 0;
  let dataStartRow = 1;
  let confidence = 0;

  // Caută rândul cu header (primele 10 rânduri)
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i] as string[];
    
    if (!row || row.length === 0) continue;

    // Verifică dacă rândul conține cuvinte cheie pentru header
    const rowText = row.join(' ').toLowerCase();
    const hasAccountCode = /cont|simbol|cod/i.test(rowText);
    const hasAccountName = /denumire|nume/i.test(rowText);
    const hasDebit = /debit|dt/i.test(rowText);
    const hasCredit = /credit|ct/i.test(rowText);

    // Calculăm confidence score
    const score = [hasAccountCode, hasAccountName, hasDebit, hasCredit]
      .filter(Boolean).length / 4;

    if (score > confidence) {
      confidence = score;
      headerRow = i;
      dataStartRow = i + 1;
    }

    // Dacă am găsit un header foarte bun, oprim căutarea
    if (score >= 0.75) {
      break;
    }
  }

  // Determinăm formatul bazat pe numărul de coloane
  const numColumns = (data[headerRow] as unknown[])?.length || 0;
  let format: 'standard' | 'extended' | 'simplified' = 'standard';

  if (numColumns >= 8 && numColumns <= 10) {
    format = 'standard';
  } else if (numColumns > 10) {
    format = 'extended';
  } else if (numColumns >= 4 && numColumns < 8) {
    format = 'simplified';
  }

  return {
    format,
    confidence,
    headerRow,
    dataStartRow,
  };
}

/**
 * Detectează maparea coloanelor din header la structura standard.
 */
function detectColumnMapping(headerRow: string[]): ColumnMapping {
  const mapping: Partial<ColumnMapping> = {};

  headerRow.forEach((header, index) => {
    if (!header) return;

    const normalizedHeader = header.toLowerCase().trim();

    // Mapare cod cont
    if (/^(cont|simbol|cod)$/i.test(normalizedHeader) ||
        normalizedHeader.includes('cont') && !normalizedHeader.includes('denumire')) {
      mapping.accountCode = index;
    }

    // Mapare denumire cont
    if (/^(denumire|nume)$/i.test(normalizedHeader) ||
        normalizedHeader.includes('denumire') ||
        normalizedHeader.includes('nume cont')) {
      mapping.accountName = index;
    }

    // Mapare solduri inițiale
    if (/sold.*ini.*debit|sd.*ini|debit.*ini/i.test(normalizedHeader)) {
      mapping.openingDebit = index;
    }
    if (/sold.*ini.*credit|sc.*ini|credit.*ini/i.test(normalizedHeader)) {
      mapping.openingCredit = index;
    }

    // Mapare rulaje
    if (/rulaj.*debit|rd|debit.*rulaj/i.test(normalizedHeader) &&
        !/ini|final/i.test(normalizedHeader)) {
      mapping.debitTurnover = index;
    }
    if (/rulaj.*credit|rc|credit.*rulaj/i.test(normalizedHeader) &&
        !/ini|final/i.test(normalizedHeader)) {
      mapping.creditTurnover = index;
    }

    // Mapare solduri finale
    if (/sold.*final.*debit|sd.*final|debit.*final/i.test(normalizedHeader)) {
      mapping.closingDebit = index;
    }
    if (/sold.*final.*credit|sc.*final|credit.*final/i.test(normalizedHeader)) {
      mapping.closingCredit = index;
    }
  });

  // Fallback: dacă nu am găsit mapări complete, presupunem ordinea standard
  // Ordine standard: Cont, Denumire, SD_ini, SC_ini, RD, RC, SD_final, SC_final
  if (Object.keys(mapping).length < 8 && headerRow.length >= 8) {
    return {
      accountCode: mapping.accountCode ?? 0,
      accountName: mapping.accountName ?? 1,
      openingDebit: mapping.openingDebit ?? 2,
      openingCredit: mapping.openingCredit ?? 3,
      debitTurnover: mapping.debitTurnover ?? 4,
      creditTurnover: mapping.creditTurnover ?? 5,
      closingDebit: mapping.closingDebit ?? 6,
      closingCredit: mapping.closingCredit ?? 7,
    };
  }

  return mapping as ColumnMapping;
}

/**
 * Detectează delimitatorul pentru fișiere CSV.
 */
function detectCsvDelimiter(content: string): string {
  const delimiters = [',', ';', '|', '\t'];
  const sample = content.split('\n').slice(0, 5).join('\n');

  let maxCount = 0;
  let bestDelimiter = ',';

  for (const delimiter of delimiters) {
    const count = (sample.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Normalizează valoarea unei celule (conversie la string sau number).
 */
function normalizeCellValue(value: unknown): string | number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Încearcă să convertească la număr
    const num = Number(trimmed.replace(/[,\s]/g, ''));
    if (!isNaN(num) && trimmed !== '') {
      return num;
    }

    return trimmed;
  }

  return String(value);
}

/**
 * Obține dimensiunea fișierului în bytes.
 */
function getFileSize(file: ArrayBuffer | Buffer | string): number {
  if (file instanceof ArrayBuffer) {
    return file.byteLength;
  }
  if (Buffer.isBuffer(file)) {
    return file.length;
  }
  return new Blob([file]).size;
}

/**
 * Creează metadata goală pentru cazuri de eroare.
 */
function createEmptyMetadata(fileName: string, mimeType: string): FileMetadata {
  return {
    fileName,
    fileSize: 0,
    mimeType,
    detectedFormat: 'excel',
    columnCount: 0,
    columnMapping: {
      accountCode: 0,
      accountName: 1,
      openingDebit: 2,
      openingCredit: 3,
      debitTurnover: 4,
      creditTurnover: 5,
      closingDebit: 6,
      closingCredit: 7,
    },
    processedAt: new Date(),
  };
}
