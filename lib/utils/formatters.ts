/**
 * Utilități pentru formatare numere, date și valori monetare
 */

/**
 * Formatează un număr ca valoare monetară RON
 * 
 * @param value - Numărul de formatat
 * @param options - Opțiuni de formatare
 * @returns String formatat ca valoare monetară
 * 
 * @example
 * formatCurrency(1234.56) // => "1.234,56 RON"
 */
export function formatCurrency(
  value: number,
  options?: {
    currency?: string;
    showSymbol?: boolean;
    decimals?: number;
  }
): string {
  const { currency = 'RON', showSymbol = true, decimals = 2 } = options || {};

  const formatted = new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return showSymbol ? `${formatted} ${currency}` : formatted;
}

/**
 * Formatează un număr fără simbol monetar
 * 
 * @param value - Numărul de formatat
 * @param decimals - Număr de zecimale (default: 2)
 * @returns String formatat
 * 
 * @example
 * formatNumber(1234.567, 1) // => "1.234,6"
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formatează un procent
 * 
 * @param value - Valoarea procentuală (0.15 = 15%)
 * @param decimals - Număr de zecimale (default: 2)
 * @returns String formatat cu simbol %
 * 
 * @example
 * formatPercent(0.1567, 1) // => "15,7%"
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${formatNumber(value * 100, decimals)}%`;
}

/**
 * Formatează o dată în format românesc
 * 
 * @param date - Data de formatat
 * @param options - Opțiuni de formatare
 * @returns String formatat
 * 
 * @example
 * formatDate(new Date('2024-03-15')) // => "15 martie 2024"
 */
export function formatDate(
  date: Date | string,
  options?: {
    includeTime?: boolean;
    short?: boolean;
  }
): string {
  const { includeTime = false, short = false } = options || {};
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatOptions: Intl.DateTimeFormatOptions = short
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { day: 'numeric', month: 'long', year: 'numeric' };

  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('ro-RO', formatOptions).format(dateObj);
}

/**
 * Formatează dimensiune fișier în format citibil
 * 
 * @param bytes - Dimensiune în bytes
 * @returns String formatat (ex: "2.5 MB")
 * 
 * @example
 * formatFileSize(1536000) // => "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
