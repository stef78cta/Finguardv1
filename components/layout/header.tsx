'use client';

import { UserButton } from '@clerk/nextjs';
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { MobileSidebarToggle } from './sidebar';
import { useCompanies } from '@/hooks/use-companies';
import type { Company } from '@/types/database';

interface DashboardHeaderProps {
  /**
   * Callback pentru deschiderea sidebar-ului pe mobile.
   */
  onMenuClick: () => void;
}

/**
 * Header component pentru dashboard.
 * 
 * Features:
 * - Company selector dropdown pentru schimbarea companiei active
 * - Theme toggle pentru dark/light mode
 * - User menu cu Clerk UserButton
 * - Mobile menu toggle pentru sidebar
 * - Breadcrumbs (opțional, pentru viitor)
 * 
 * @param {DashboardHeaderProps} props - Proprietăți componente
 * @returns {JSX.Element} Dashboard header
 */
export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        {/* Left Section: Mobile Menu + Company Selector */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <MobileSidebarToggle onClick={onMenuClick} />

          {/* Company Selector */}
          <CompanySelector />
        </div>

        {/* Right Section: Theme Toggle + User Button */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Button - Clerk component */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'h-9 w-9',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

/**
 * Key pentru storage-ul local al companiei selectate.
 */
const SELECTED_COMPANY_KEY = 'finguard:selectedCompanyId';

/**
 * Company Selector Component.
 * 
 * Permite utilizatorului să selecteze compania activă pentru care
 * vizualizează datele financiare. Afișează numele și CUI-ul companiei.
 * 
 * Stochează selecția în localStorage pentru persistență între sesiuni.
 * 
 * @returns {JSX.Element} Company selector dropdown
 */
function CompanySelector() {
  const { companies, loading } = useCompanies({ activeOnly: true });
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  /**
   * Încarcă compania selectată din localStorage la mount.
   */
  useEffect(() => {
    const savedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
    if (savedCompanyId) {
      setSelectedCompanyId(savedCompanyId);
    }
  }, []);

  /**
   * Selectează automat prima companie dacă nu există selecție.
   */
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      const firstCompany = companies[0];
      setSelectedCompanyId(firstCompany.id);
      localStorage.setItem(SELECTED_COMPANY_KEY, firstCompany.id);
    }
  }, [companies, selectedCompanyId]);

  /**
   * Handler pentru schimbarea companiei active.
   * Salvează selecția în localStorage pentru persistență.
   */
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    localStorage.setItem(SELECTED_COMPANY_KEY, companyId);
    
    // Emit custom event pentru a notifica alte componente despre schimbare
    window.dispatchEvent(
      new CustomEvent('companyChanged', { detail: { companyId } })
    );
  };

  /**
   * Găsește compania selectată din lista de companii.
   */
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-9 w-[200px] animate-pulse items-center rounded-md border border-slate-200 bg-slate-100 px-3 dark:border-slate-700 dark:bg-slate-800 md:w-[280px]">
        <Building2 className="mr-2 h-4 w-4 text-slate-400" />
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedCompanyId || undefined}
        onValueChange={handleCompanyChange}
        disabled={companies.length === 0}
      >
        <SelectTrigger className="h-9 w-[200px] border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 md:w-[280px]">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <SelectValue placeholder="Selectează companie">
              {selectedCompany ? (
                <span className="truncate">{selectedCompany.name}</span>
              ) : (
                'Selectează companie'
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {companies.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nu ai companii adăugate
              </p>
              <Link href="/dashboard/companies">
                <Button variant="link" size="sm" className="mt-2 gap-1">
                  <Plus className="h-3 w-3" />
                  Adaugă prima companie
                </Button>
              </Link>
            </div>
          ) : (
            companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{company.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    CUI: {company.cui}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
          
          {/* Separator și link către gestionare companii */}
          {companies.length > 0 && (
            <>
              <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
              <Link href="/dashboard/companies" className="block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs"
                >
                  <Building2 className="h-3 w-3" />
                  Gestionează companii
                </Button>
              </Link>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Hook custom pentru a obține compania selectată curent.
 * 
 * Poate fi folosit în orice componentă care trebuie să știe
 * care este compania activă.
 * 
 * @returns {Object} Obiect cu compania selectată și funcție de refresh
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { selectedCompany, refreshCompany } = useSelectedCompany();
 *   
 *   if (!selectedCompany) {
 *     return <div>Selectează o companie</div>;
 *   }
 *   
 *   return <div>{selectedCompany.name}</div>;
 * }
 * ```
 */
export function useSelectedCompany() {
  const { companies, loading, getCompany } = useCompanies({ activeOnly: true });
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Încarcă compania selectată din localStorage
  useEffect(() => {
    const savedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY);
    if (savedCompanyId) {
      setSelectedCompanyId(savedCompanyId);
    }
  }, []);

  // Actualizează compania selectată când se schimbă ID-ul sau lista de companii
  useEffect(() => {
    // useRef pentru tracking mount status - previne setState pe componente unmounted
    let isMounted = true;

    if (selectedCompanyId) {
      const company = companies.find((c) => c.id === selectedCompanyId);
      if (company) {
        setSelectedCompany(company);
      } else {
        // Compania nu mai există sau nu este disponibilă
        // Încercăm să o obținem direct de la API
        getCompany(selectedCompanyId).then((result) => {
          // Verificăm dacă componenta e încă montată înainte de setState
          if (!isMounted) return;

          if (result.success && result.data) {
            setSelectedCompany(result.data);
          } else {
            // Compania nu a fost găsită, resetăm selecția
            setSelectedCompanyId(null);
            setSelectedCompany(null);
            localStorage.removeItem(SELECTED_COMPANY_KEY);
          }
        });
      }
    } else if (companies.length > 0) {
      // Auto-selectează prima companie dacă nu există selecție
      const firstCompany = companies[0];
      setSelectedCompanyId(firstCompany.id);
      setSelectedCompany(firstCompany);
      localStorage.setItem(SELECTED_COMPANY_KEY, firstCompany.id);
    }

    // Cleanup function - marchează componenta ca unmounted
    return () => {
      isMounted = false;
    };
  }, [selectedCompanyId, companies, getCompany]);

  // Ascultă pentru schimbări de companie de la alte componente
  useEffect(() => {
    const handleCompanyChange = (event: CustomEvent) => {
      const { companyId } = event.detail;
      setSelectedCompanyId(companyId);
    };

    window.addEventListener('companyChanged', handleCompanyChange as EventListener);
    
    return () => {
      window.removeEventListener('companyChanged', handleCompanyChange as EventListener);
    };
  }, []);

  /**
   * Funcție pentru a reîmprospăta datele companiei selectate.
   */
  const refreshCompany = async () => {
    if (selectedCompanyId) {
      const result = await getCompany(selectedCompanyId);
      if (result.success && result.data) {
        setSelectedCompany(result.data);
      }
    }
  };

  return {
    selectedCompany,
    selectedCompanyId,
    loading,
    refreshCompany,
  };
}

/**
 * Breadcrumbs Component - pentru navigație ierarhică.
 * Poate fi folosit în viitor pentru a afișa calea curentă în aplicație.
 * 
 * @example
 * ```tsx
 * <Breadcrumbs items={[
 *   { label: 'Dashboard', href: '/dashboard' },
 *   { label: 'Companii', href: '/dashboard/companies' },
 *   { label: 'SC Exemplu SRL' }
 * ]} />
 * ```
 */
export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronDown className="mx-2 h-4 w-4 rotate-[-90deg] text-slate-400" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-900 dark:text-slate-50">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
