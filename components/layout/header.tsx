'use client';

import { UserButton } from '@clerk/nextjs';
import { Building2, ChevronDown } from 'lucide-react';
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

/**
 * Mock data pentru companii - va fi înlocuit cu date reale din API.
 * TODO: Conectare cu API pentru gestionarea companiilor.
 */
const mockCompanies = [
  { id: '1', name: 'SC Exemplu SRL', cui: 'RO12345678' },
  { id: '2', name: 'SC Test Company SRL', cui: 'RO87654321' },
];

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
 * Company Selector Component.
 * 
 * Permite utilizatorului să selecteze compania activă pentru care
 * vizualizează datele financiare. Afișează numele și CUI-ul companiei.
 * 
 * @returns {JSX.Element} Company selector dropdown
 */
function CompanySelector() {
  // TODO: Înlocui cu state management real (Redux/Context)
  const selectedCompanyId = '1';

  const handleCompanyChange = (companyId: string) => {
    // TODO: Implementare logică schimbare companie activă
    console.log('Selected company:', companyId);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
        <SelectTrigger className="h-9 w-[200px] border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 md:w-[280px]">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <SelectValue placeholder="Selectează companie" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {mockCompanies.length === 0 ? (
            <div className="px-2 py-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nu ai companii adăugate
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => {
                  // TODO: Navigate to companies page
                  window.location.href = '/dashboard/companies';
                }}
              >
                Adaugă prima companie
              </Button>
            </div>
          ) : (
            mockCompanies.map((company) => (
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
        </SelectContent>
      </Select>
    </div>
  );
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
            <a
              href={item.href}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
            >
              {item.label}
            </a>
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
