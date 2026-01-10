import { UserButton } from '@clerk/nextjs';

/**
 * Layout pentru dashboard-ul FinGuard.
 * 
 * Include header-ul cu UserButton pentru gestionarea profilului.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              FinGuard
            </h1>
          </div>
          
          {/* User Button - Clerk component cu dropdown pentru profil */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'h-10 w-10',
              },
            }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
