'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Company } from '@/types/database';
import type { CreateCompanyData, UpdateCompanyData } from '@/hooks/use-companies';

/**
 * Formular pentru crearea sau editarea unei companii.
 * 
 * Gestionează validarea datelor, afișarea erorilor și submit-ul formularului.
 * Poate fi folosit atât pentru crearea unei companii noi, cât și pentru editare.
 * 
 * @param mode - 'create' sau 'edit'
 * @param company - Date companie existente (doar pentru edit mode)
 * @param isOpen - Starea deschis/închis a dialogului
 * @param onClose - Callback pentru închiderea dialogului
 * @param onSubmit - Callback pentru submit formular cu datele validate
 * 
 * @example
 * ```typescript
 * <CompanyForm
 *   mode="create"
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={async (data) => {
 *     const result = await createCompany(data);
 *     if (result.success) {
 *       toast.success('Companie creată!');
 *     }
 *   }}
 * />
 * ```
 */

/**
 * Props pentru modul de creare companie nouă.
 */
type CompanyFormCreateProps = {
  mode: 'create';
  company?: never;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCompanyData) => Promise<void>;
};

/**
 * Props pentru modul de editare companie existentă.
 */
type CompanyFormEditProps = {
  mode: 'edit';
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateCompanyData) => Promise<void>;
};

/**
 * Union type pentru props - permite type safety pe baza modului.
 */
type CompanyFormProps = CompanyFormCreateProps | CompanyFormEditProps;

/**
 * Valorile implicite pentru formularul de companie nouă
 */
const DEFAULT_FORM_VALUES: CreateCompanyData = {
  name: '',
  cui: '',
  country_code: 'RO',
  currency: 'RON',
  fiscal_year_start_month: 1,
  address: '',
  phone: '',
  logo_url: '',
};

/**
 * Lista de țări suportate (poate fi extinsă în viitor)
 */
const COUNTRIES = [
  { value: 'RO', label: 'România' },
  { value: 'MD', label: 'Moldova' },
  { value: 'HU', label: 'Ungaria' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'OTHER', label: 'Altă țară' },
];

/**
 * Lista de monede suportate
 */
const CURRENCIES = [
  { value: 'RON', label: 'RON - Leu Românesc' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - Dolar American' },
  { value: 'GBP', label: 'GBP - Liră Sterlină' },
];

/**
 * Lunile pentru anul fiscal (1 = Ianuarie, 12 = Decembrie)
 */
const FISCAL_MONTHS = [
  { value: 1, label: 'Ianuarie' },
  { value: 2, label: 'Februarie' },
  { value: 3, label: 'Martie' },
  { value: 4, label: 'Aprilie' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Iunie' },
  { value: 7, label: 'Iulie' },
  { value: 8, label: 'August' },
  { value: 9, label: 'Septembrie' },
  { value: 10, label: 'Octombrie' },
  { value: 11, label: 'Noiembrie' },
  { value: 12, label: 'Decembrie' },
];

export function CompanyForm({
  mode,
  company,
  isOpen,
  onClose,
  onSubmit,
}: CompanyFormProps) {
  // State pentru valorile formularului
  const [formData, setFormData] = useState<CreateCompanyData>(() => {
    if (mode === 'edit' && company) {
      return {
        name: company.name,
        cui: company.cui,
        country_code: company.country_code,
        currency: company.currency,
        fiscal_year_start_month: company.fiscal_year_start_month,
        address: company.address || '',
        phone: company.phone || '',
        logo_url: company.logo_url || '',
      };
    }
    return DEFAULT_FORM_VALUES;
  });

  // State pentru erori de validare
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCompanyData, string>>>({});
  
  // State pentru loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Sincronizează datele companiei cu formularul când se schimbă compania editată.
   * 
   * Acest effect rezolvă problema când editezi companii diferite succesiv:
   * useState cu funcție de inițializare rulează doar o dată la mount, deci când
   * editezi Compania A, apoi Compania B, formularul ar afișa în continuare datele
   * Companiei A fără acest effect.
   */
  useEffect(() => {
    if (mode === 'edit' && company) {
      setFormData({
        name: company.name,
        cui: company.cui,
        country_code: company.country_code,
        currency: company.currency,
        fiscal_year_start_month: company.fiscal_year_start_month,
        address: company.address || '',
        phone: company.phone || '',
        logo_url: company.logo_url || '',
      });
    } else if (mode === 'create') {
      setFormData(DEFAULT_FORM_VALUES);
    }
  }, [mode, company]);

  /**
   * Validează formularul și returnează erorile găsite.
   * 
   * @returns Object cu erorile de validare sau null dacă nu sunt erori
   */
  const validateForm = (): Partial<Record<keyof CreateCompanyData, string>> | null => {
    const newErrors: Partial<Record<keyof CreateCompanyData, string>> = {};

    // Validare nume (obligatoriu, min 2 caractere)
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Numele companiei este obligatoriu';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Numele trebuie să aibă cel puțin 2 caractere';
    }

    // Validare CUI (obligatoriu, format corect)
    if (!formData.cui || formData.cui.trim().length === 0) {
      newErrors.cui = 'CUI-ul este obligatoriu';
    } else {
      const cuiPattern = /^(RO)?[0-9]+$/;
      if (!cuiPattern.test(formData.cui.trim())) {
        newErrors.cui = 'CUI-ul trebuie să conțină doar cifre (opțional cu prefix RO)';
      } else if (formData.cui.replace(/^RO/, '').length < 2) {
        newErrors.cui = 'CUI-ul trebuie să aibă cel puțin 2 cifre';
      }
    }

    // Validare telefon (opțional, dar dacă este completat trebuie să aibă format corect)
    if (formData.phone && formData.phone.trim().length > 0) {
      const phonePattern = /^[\d\s\-\+\(\)]+$/;
      if (!phonePattern.test(formData.phone.trim())) {
        newErrors.phone = 'Formatul numărului de telefon nu este valid';
      }
    }

    // Validare URL logo (opțional, dar dacă este completat trebuie să fie URL valid)
    if (formData.logo_url && formData.logo_url.trim().length > 0) {
      try {
        new URL(formData.logo_url);
      } catch {
        newErrors.logo_url = 'URL-ul logo-ului nu este valid';
      }
    }

    return Object.keys(newErrors).length > 0 ? newErrors : null;
  };

  /**
   * Handler pentru schimbarea valorilor în formular.
   */
  const handleChange = (field: keyof CreateCompanyData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Șterge eroarea pentru câmpul modificat
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handler pentru submit formular.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validează formularul
    const validationErrors = validateForm();
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      // Pregătește datele pentru submit (trim strings și normalizare CUI)
      const submitData: CreateCompanyData = {
        ...formData,
        name: formData.name.trim(),
        cui: formData.cui.trim().toUpperCase(),
        address: formData.address?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        logo_url: formData.logo_url?.trim() || undefined,
      };

      await onSubmit(submitData);
      
      // Resetează formularul după succes
      setFormData(DEFAULT_FORM_VALUES);
      onClose();
    } catch (error) {
      console.error('Eroare la submit formular:', error);
      // Eroarea va fi gestionată de componenta părinte
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handler pentru închiderea dialogului.
   */
  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(DEFAULT_FORM_VALUES);
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adaugă Companie Nouă' : 'Editează Companie'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Completează informațiile despre compania pe care vrei să o analizezi.'
              : 'Modifică informațiile despre companie.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Generale */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Date Generale</h3>
            
            {/* Nume Companie */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nume Companie <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: ACME SRL"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* CUI */}
            <div className="space-y-2">
              <label htmlFor="cui" className="text-sm font-medium">
                CUI (Cod Unic de Înregistrare) <span className="text-destructive">*</span>
              </label>
              <Input
                id="cui"
                type="text"
                placeholder="Ex: 12345678 sau RO12345678"
                value={formData.cui}
                onChange={(e) => handleChange('cui', e.target.value)}
                className={errors.cui ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.cui && (
                <p className="text-sm text-destructive">{errors.cui}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Poate include prefix RO. Doar cifre sunt permise.
              </p>
            </div>

            {/* Țară și Monedă - Grid 2 coloane */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Țară */}
              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium">
                  Țară
                </label>
                <Select
                  value={formData.country_code}
                  onValueChange={(value) => handleChange('country_code', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Selectează țara" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Monedă */}
              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">
                  Monedă
                </label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleChange('currency', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Selectează moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* An Fiscal */}
            <div className="space-y-2">
              <label htmlFor="fiscal_month" className="text-sm font-medium">
                Luna de început an fiscal
              </label>
              <Select
                value={formData.fiscal_year_start_month?.toString()}
                onValueChange={(value) => handleChange('fiscal_year_start_month', parseInt(value))}
                disabled={isSubmitting}
              >
                <SelectTrigger id="fiscal_month">
                  <SelectValue placeholder="Selectează luna" />
                </SelectTrigger>
                <SelectContent>
                  {FISCAL_MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pentru majoritatea companiilor, anul fiscal începe în Ianuarie
              </p>
            </div>
          </div>

          {/* Date Contact (Opționale) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Date Contact <span className="text-muted-foreground">(opțional)</span>
            </h3>

            {/* Adresă */}
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Adresă
              </label>
              <Input
                id="address"
                type="text"
                placeholder="Ex: Str. Exemplu nr. 10, București"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Telefon */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Telefon
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ex: +40 21 123 4567"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={errors.phone ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Logo URL */}
            <div className="space-y-2">
              <label htmlFor="logo_url" className="text-sm font-medium">
                URL Logo
              </label>
              <Input
                id="logo_url"
                type="url"
                placeholder="Ex: https://example.com/logo.png"
                value={formData.logo_url}
                onChange={(e) => handleChange('logo_url', e.target.value)}
                className={errors.logo_url ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.logo_url && (
                <p className="text-sm text-destructive">{errors.logo_url}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Link către imaginea logo-ului companiei (PNG, JPG)
              </p>
            </div>
          </div>

          {/* Footer cu butoane */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Se salvează...'
                : mode === 'create'
                ? 'Creează Companie'
                : 'Salvează Modificările'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
