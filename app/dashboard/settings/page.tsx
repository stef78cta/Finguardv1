import { User, Building2, Bell, Lock, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

/**
 * Pagina pentru setările aplicației.
 * 
 * Secțiuni:
 * - Profil utilizator
 * - Setări companie
 * - Notificări
 * - Securitate
 * - Abonament și facturare
 * 
 * TODO: Implementare setări complete
 */
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Setări
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Gestionează setările contului și preferințele
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden md:inline">Companie</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notificări</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden md:inline">Securitate</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Abonament</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="mt-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Setări Profil
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Setările profilului sunt gestionate prin Clerk. Folosește butonul de profil din header pentru a actualiza informațiile.
            </p>
          </Card>
        </TabsContent>

        {/* Company Settings */}
        <TabsContent value="company" className="mt-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Setări Companie
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Configurări specifice companiei active.
            </p>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Preferințe Notificări
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Controlează ce notificări primești prin email sau în aplicație.
            </p>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Securitate și Autentificare
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Autentificarea este gestionată prin Clerk cu 2FA și metode de login sociale.
            </p>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="mt-6">
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Abonament și Facturare
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-50">
                      Plan Trial
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Valabil 14 zile
                    </p>
                  </div>
                  <Button variant="outline">Upgrade Plan</Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
