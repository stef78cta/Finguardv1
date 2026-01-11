'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Upload,
  BarChart3,
  FileText,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Elementele de navigație din sidebar.
 * Fiecare element include icon, label, și href pentru routing.
 */
const navigationItems = [
  {
    label: 'Companii',
    href: '/dashboard/companies',
    icon: Building2,
    description: 'Gestionează companiile tale',
  },
  {
    label: 'Încărcare Date',
    href: '/dashboard/upload',
    icon: Upload,
    description: 'Încarcă balanțe de verificare',
  },
  {
    label: 'Indicatori KPI',
    href: '/dashboard/indicators',
    icon: BarChart3,
    description: 'Vizualizează indicatori financiari',
  },
  {
    label: 'Rapoarte',
    href: '/dashboard/reports',
    icon: FileText,
    description: 'Rapoarte și analize',
  },
  {
    label: 'Setări',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Configurări aplicație',
  },
];

interface SidebarProps {
  /**
   * Controlează dacă sidebar-ul este vizibil pe mobile.
   */
  isOpen?: boolean;
  /**
   * Callback pentru închiderea sidebar-ului pe mobile.
   */
  onClose?: () => void;
}

/**
 * Componentă Sidebar pentru navigația în dashboard.
 * 
 * Features:
 * - Navigație persistentă pe desktop
 * - Collapsible sidebar pe mobile/tablet
 * - Active state pentru ruta curentă
 * - Iconuri pentru fiecare secțiune
 * - Tooltips cu descrieri
 * 
 * @param {SidebarProps} props - Proprietăți pentru controlul sidebar-ului
 * @returns {JSX.Element} Sidebar component
 */
export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay pentru mobile când sidebar-ul este deschis */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900',
          'lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <span className="text-sm font-bold">FG</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              FinGuard
            </h2>
          </div>

          {/* Buton închidere pe mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
            aria-label="Închide meniu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 p-4">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50'
                )}
                title={item.description}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-50'
                  )}
                />
                <span>{item.label}</span>

                {/* Active Indicator */}
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-700 dark:bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer cu informații utile */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              💡 Sfat
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Navighează rapid folosind tastatura
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

/**
 * Buton pentru deschiderea sidebar-ului pe mobile.
 * Se afișează doar pe ecrane mici (< lg breakpoint).
 * 
 * @param {object} props - Proprietăți componente
 * @param {() => void} props.onClick - Callback pentru click
 * @returns {JSX.Element} Mobile menu button
 */
export function MobileSidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="lg:hidden"
      aria-label="Deschide meniu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
