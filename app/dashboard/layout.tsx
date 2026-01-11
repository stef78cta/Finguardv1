'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { DashboardHeader } from '@/components/layout/header';

/**
 * Layout pentru dashboard-ul FinGuard.
 * 
 * Arhitectură:
 * - Sidebar persistent pe desktop, collapsible pe mobile
 * - Header sticky cu company selector, theme toggle, user menu
 * - Main content area cu padding adaptat pentru sidebar
 * - Responsive design pentru toate device-urile
 * 
 * @param {object} props - Proprietăți layout
 * @param {React.ReactNode} props.children - Conținut pagină
 * @returns {JSX.Element} Dashboard layout structure
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // State pentru controlul sidebar-ului pe mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  /**
   * Toggle sidebar visibility pe mobile.
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Închide sidebar-ul (folosit la click pe overlay sau link).
   */
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Desktop persistent, Mobile collapsible */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Header - Sticky top */}
        <DashboardHeader onMenuClick={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Footer - Opțional */}
        <footer className="border-t border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © 2026 FinGuard. Toate drepturile rezervate.
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="/docs"
                  className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                >
                  Documentație
                </a>
                <a
                  href="/support"
                  className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                >
                  Suport
                </a>
                <a
                  href="/privacy"
                  className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                >
                  Confidențialitate
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
