/**
 * KPI Calculator
 * 
 * Calculează valori KPI individuali pe baza componentelor financiare extrase.
 * Parsează și evaluează formule JSONB complexe cu calcule intermediare.
 */

import type { 
  KPIDefinition, 
  KPIFormula, 
  FinancialComponents, 
  KPICalculationResult,
  KPICalculationMetadata 
} from '@/types/kpi';

/**
 * Calculează valoarea unui KPI pe baza definiției și componentelor financiare.
 * 
 * Procesează formula JSONB, calculează valori intermediare dacă există,
 * și evaluează formula finală.
 * 
 * @param definition - Definiția KPI cu formula parsată
 * @param components - Componentele financiare extrase din balanță
 * @param debug - Mod debug pentru logging detaliat (optional)
 * @returns Rezultatul calculului cu metadata
 * 
 * @example
 * ```typescript
 * const kpiDef = {
 *   id: "...",
 *   code: "current_ratio",
 *   parsedFormula: {
 *     numerator: "current_assets",
 *     denominator: "current_liabilities",
 *     formula: "current_assets / current_liabilities"
 *   }
 * };
 * const result = calculateKPI(kpiDef, financialComponents);
 * console.log(result.value); // ex: 1.85
 * ```
 */
export function calculateKPI(
  definition: KPIDefinition,
  components: FinancialComponents,
  debug = false
): KPICalculationResult {
  const startTime = Date.now();
  const warnings: string[] = [];
  
  try {
    const formula = definition.parsedFormula;
    
    // Validare formulă
    if (!formula || !formula.formula) {
      throw new Error(`Formulă invalidă pentru KPI ${definition.code}`);
    }
    
    // Creare context pentru evaluare formule
    // Include toate componentele financiare + calcule intermediare
    const evaluationContext: Record<string, number> = { ...components };
    
    // Calcul valori intermediare (ex: revenue_per_day, nopat, etc.)
    const intermediateValues = calculateIntermediateValues(formula, components, warnings);
    Object.assign(evaluationContext, intermediateValues);
    
    // Logging pentru debug
    if (debug) {
      console.log(`\n=== Calculare KPI: ${definition.code} ===`);
      console.log('Formula:', formula.formula);
      console.log('Componente disponibile:', Object.keys(evaluationContext).length);
      if (Object.keys(intermediateValues).length > 0) {
        console.log('Valori intermediare:', intermediateValues);
      }
    }
    
    // Evaluare formulă principală
    const value = evaluateFormula(formula.formula, evaluationContext, warnings);
    
    // Validare rezultat
    if (!isFinite(value)) {
      if (value === Infinity || value === -Infinity) {
        warnings.push(`Diviziune la zero în formula ${definition.code}`);
        throw new Error('Diviziune la zero');
      }
      if (isNaN(value)) {
        warnings.push(`Rezultat NaN pentru ${definition.code} - verificați componentele`);
        throw new Error('Calcul invalid (NaN)');
      }
    }
    
    // Validare range pentru procente
    if (definition.unit === 'percentage' && Math.abs(value) > 10000) {
      warnings.push(`Valoare procentuală suspectă: ${value}% pentru ${definition.code}`);
    }
    
    // Identificare componente folosite efectiv în calcul
    const usedComponents = extractUsedComponents(formula.formula, components);
    
    // Construire metadata
    const metadata: KPICalculationMetadata = {
      components: usedComponents,
      intermediateValues: Object.keys(intermediateValues).length > 0 ? intermediateValues : undefined,
      formulaUsed: formula.formula,
      warnings: warnings.length > 0 ? warnings : undefined,
      calculatedAt: new Date(),
    };
    
    if (debug) {
      console.log(`Rezultat: ${value}`);
      console.log(`Durata: ${Date.now() - startTime}ms`);
      if (warnings.length > 0) {
        console.log('Avertismente:', warnings);
      }
    }
    
    return {
      kpi_definition_id: definition.id,
      kpi_code: definition.code,
      value: roundToDecimals(value, 4),
      metadata,
    };
    
  } catch (error) {
    // Returnare rezultat cu eroare
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (debug) {
      console.error(`Eroare calcul KPI ${definition.code}:`, errorMessage);
    }
    
    return {
      kpi_definition_id: definition.id,
      kpi_code: definition.code,
      value: null,
      metadata: {
        components: {},
        formulaUsed: definition.parsedFormula.formula,
        warnings: warnings.length > 0 ? warnings : undefined,
        calculatedAt: new Date(),
      },
      error: errorMessage,
    };
  }
}

/**
 * Calculează valori intermediare definite în formulă.
 * 
 * Unele formule KPI au calcule intermediare (ex: nopat, revenue_per_day).
 * Această funcție identifică și calculează aceste valori.
 * 
 * @param formula - Formula KPI
 * @param components - Componente financiare
 * @param warnings - Array pentru acumulare warnings
 * @returns Obiect cu valori intermediare calculate
 */
function calculateIntermediateValues(
  formula: KPIFormula,
  components: FinancialComponents,
  warnings: string[]
): Record<string, number> {
  const intermediates: Record<string, number> = {};
  
  // Parcurgere toate câmpurile din formula (excludem formula principală)
  for (const [key, value] of Object.entries(formula)) {
    // Ignorăm câmpurile standard
    if (key === 'formula' || key === 'numerator' || key === 'denominator') {
      continue;
    }
    
    // Dacă valoarea este string, e o formulă intermediară
    if (typeof value === 'string') {
      try {
        const intermediateValue = evaluateFormula(value, components, warnings);
        intermediates[key] = intermediateValue;
      } catch (error) {
        warnings.push(`Eroare calcul valoare intermediară ${key}: ${error}`);
        intermediates[key] = 0;
      }
    }
  }
  
  return intermediates;
}

/**
 * Evaluează o formulă matematică într-un context dat.
 * 
 * Înlocuiește variabilele din formulă cu valorile lor și evaluează expresia.
 * Folosește Function constructor pentru evaluare (sandboxed).
 * 
 * @param formulaString - Formula ca string (ex: "(a + b) / c * 100")
 * @param context - Context cu valori pentru variabile
 * @param warnings - Array pentru warnings
 * @returns Rezultatul calculului
 * 
 * @example
 * ```typescript
 * const result = evaluateFormula(
 *   "current_assets / current_liabilities",
 *   { current_assets: 100000, current_liabilities: 50000 }
 * );
 * // result = 2.0
 * ```
 */
function evaluateFormula(
  formulaString: string,
  context: Record<string, number>,
  warnings: string[]
): number {
  // Extragere variabile din formulă (identificatori JavaScript valizi)
  const variablePattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  const variables = formulaString.match(variablePattern) || [];
  
  // Înlocuire variabile cu valorile lor
  let evaluableFormula = formulaString;
  const usedVariables: Record<string, number> = {};
  
  for (const variable of variables) {
    // Skip JavaScript keywords/operators
    if (['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'].includes(variable)) {
      continue;
    }
    
    const value = context[variable];
    
    if (value === undefined) {
      warnings.push(`Variabila '${variable}' lipsește din context`);
      // Folosim 0 pentru a evita NaN
      usedVariables[variable] = 0;
      evaluableFormula = evaluableFormula.replace(
        new RegExp(`\\b${variable}\\b`, 'g'),
        '0'
      );
    } else {
      usedVariables[variable] = value;
      evaluableFormula = evaluableFormula.replace(
        new RegExp(`\\b${variable}\\b`, 'g'),
        String(value)
      );
    }
  }
  
  // Validare formulă înainte de evaluare (securitate)
  if (!isSafeFormula(evaluableFormula)) {
    throw new Error(`Formulă nesigură: ${formulaString}`);
  }
  
  // Evaluare folosind Function constructor (mai sigur decât eval)
  try {
    // eslint-disable-next-line no-new-func
    const evalFunction = new Function(`return (${evaluableFormula});`);
    const result = evalFunction();
    
    return Number(result);
  } catch (error) {
    throw new Error(`Eroare evaluare formulă "${formulaString}": ${error}`);
  }
}

/**
 * Verifică dacă o formulă este sigură pentru evaluare.
 * 
 * Previne injecția de cod prin verificarea că formula conține doar:
 * - Numere
 * - Operatori matematici: + - * / ( ) %
 * - Spații
 * 
 * @param formula - Formula de verificat
 * @returns true dacă e sigură
 */
function isSafeFormula(formula: string): boolean {
  // Permite doar: cifre, operatori matematici, paranteze, punct, spații
  const safePattern = /^[\d\s+\-*/%().]+$/;
  return safePattern.test(formula);
}

/**
 * Extrage componentele efectiv folosite într-o formulă.
 * 
 * @param formulaString - Formula KPI
 * @param allComponents - Toate componentele disponibile
 * @returns Subset de componente folosite în formulă
 */
function extractUsedComponents(
  formulaString: string,
  allComponents: FinancialComponents
): Partial<FinancialComponents> {
  const used: Partial<FinancialComponents> = {};
  
  // Extragere toate variabilele din formulă
  const variablePattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
  const variables = formulaString.match(variablePattern) || [];
  
  for (const variable of variables) {
    if (variable in allComponents) {
      used[variable as keyof FinancialComponents] = 
        allComponents[variable as keyof FinancialComponents];
    }
  }
  
  return used;
}

/**
 * Rotunjește un număr la un anumit număr de zecimale.
 * 
 * @param value - Valoarea de rotunjit
 * @param decimals - Număr zecimale (default: 4)
 * @returns Valoare rotunjită
 */
function roundToDecimals(value: number, decimals = 4): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Formatează un rezultat KPI pentru afișare human-readable.
 * 
 * @param result - Rezultatul KPI
 * @param definition - Definiția KPI (pentru unit)
 * @returns String formatat
 */
export function formatKPIResult(result: KPICalculationResult, definition: KPIDefinition): string {
  if (result.value === null) {
    return `${definition.name}: N/A (${result.error})`;
  }
  
  let formattedValue: string;
  
  switch (definition.unit) {
    case 'percentage':
      formattedValue = `${result.value.toFixed(2)}%`;
      break;
    
    case 'currency':
      formattedValue = new Intl.NumberFormat('ro-RO', {
        style: 'currency',
        currency: 'RON',
      }).format(result.value);
      break;
    
    case 'ratio':
      formattedValue = result.value.toFixed(2);
      break;
    
    case 'times':
      formattedValue = `${result.value.toFixed(2)}x`;
      break;
    
    case 'days':
      formattedValue = `${Math.round(result.value)} zile`;
      break;
    
    default:
      formattedValue = result.value.toFixed(2);
  }
  
  return `${definition.name}: ${formattedValue}`;
}

/**
 * Calculează un batch de KPI-uri în paralel.
 * 
 * @param definitions - Lista definiții KPI
 * @param components - Componente financiare
 * @param debug - Mod debug
 * @returns Array cu rezultate
 */
export function calculateKPIBatch(
  definitions: KPIDefinition[],
  components: FinancialComponents,
  debug = false
): KPICalculationResult[] {
  return definitions.map(def => calculateKPI(def, components, debug));
}

/**
 * Calculează și interpretează rezultatul unui KPI.
 * Oferă feedback despre calitatea valorii (excelent/bun/slab).
 * 
 * @param result - Rezultatul KPI
 * @param definition - Definiția KPI
 * @returns Interpretare text
 */
export function interpretKPIResult(result: KPICalculationResult, definition: KPIDefinition): string {
  if (result.value === null) {
    return 'Nu s-a putut calcula';
  }
  
  const value = result.value;
  
  // Interpretări bazate pe valori standard din seed data
  switch (definition.code) {
    case 'current_ratio':
      if (value > 1.5) return '✅ Excelent - Lichiditate solidă';
      if (value >= 1) return '⚠️ Bun - Lichiditate acceptabilă';
      return '❌ Slab - Probleme de lichiditate';
    
    case 'quick_ratio':
      if (value > 1) return '✅ Excelent';
      if (value >= 0.8) return '⚠️ Bun';
      return '❌ Slab';
    
    case 'debt_to_equity':
      if (value < 1) return '✅ Conservator - Îndatorare redusă';
      if (value <= 2) return '⚠️ Moderat';
      return '❌ Agresiv - Îndatorare ridicată';
    
    case 'roa':
      if (value > 15) return '✅ Excelent';
      if (value >= 5) return '⚠️ Bun';
      return '❌ Slab';
    
    case 'roe':
      if (value > 20) return '✅ Excelent';
      if (value >= 10) return '⚠️ Bun';
      return '❌ Slab';
    
    case 'gross_margin':
      if (value > 40) return '✅ Excelent';
      if (value >= 20) return '⚠️ Bun';
      return '❌ Slab';
    
    case 'asset_turnover':
      if (value > 2) return '✅ Eficient';
      if (value >= 1) return '⚠️ Normal';
      return '❌ Ineficient';
    
    default:
      return 'Valoare calculată';
  }
}
