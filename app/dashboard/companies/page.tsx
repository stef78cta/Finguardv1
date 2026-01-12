'use client';

import { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CompanyForm } from '@/components/forms/company-form';
import { useCompanies } from '@/hooks/use-companies';
import { useToast } from '@/hooks/use-toast';
import type { Company } from '@/types/database';
import type { CreateCompanyData, UpdateCompanyData } from '@/hooks/use-companies';

/**
 * Pagina pentru gestionarea companiilor.
 * 
 * Permite utilizatorilor să:
 * - Vizualizeze lista de companii cu detalii
 * - Adauge companii noi
 * - Editeze și șteargă companii existente
 * - Filtreze companii după status (activ/inactiv)
 */
export default function CompaniesPage() {
  const { toast } = useToast();
  const {
    companies,
    loading,
    error,
    createCompany,
    updateCompany,
    deleteCompany,
  } = useCompanies({ activeOnly: false });

  // State pentru modalele de creare/editare
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // State pentru modul de confirmare ștergere
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Handler pentru crearea unei companii noi.
   */
  const handleCreate = async (data: CreateCompanyData) => {
    const result = await createCompany(data);
    
    if (result.success) {
      toast({
        title: 'Companie creată',
        description: `${data.name} a fost adăugată cu succes.`,
      });
      setIsCreateModalOpen(false);
    } else {
      toast({
        title: 'Eroare',
        description: result.error || 'Nu s-a putut crea compania.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handler pentru editarea unei companii.
   */
  const handleEdit = async (data: UpdateCompanyData) => {
    if (!selectedCompany) return;

    const result = await updateCompany(selectedCompany.id, data);
    
    if (result.success) {
      toast({
        title: 'Companie actualizată',
        description: 'Modificările au fost salvate cu succes.',
      });
      setIsEditModalOpen(false);
      setSelectedCompany(null);
    } else {
      toast({
        title: 'Eroare',
        description: result.error || 'Nu s-au putut salva modificările.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Deschide dialogul de editare pentru o companie.
   */
  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  /**
   * Deschide dialogul de confirmare pentru ștergere.
   */
  const openDeleteDialog = (company: Company) => {
    setCompanyToDelete(company);
    setIsDeleteDialogOpen(true);
  };

  /**
   * Handler pentru ștergerea unei companii.
   */
  const handleDelete = async () => {
    if (!companyToDelete) return;

    setIsDeleting(true);
    const result = await deleteCompany(companyToDelete.id);
    
    if (result.success) {
      toast({
        title: 'Companie ștearsă',
        description: `${companyToDelete.name} a fost eliminată din sistem.`,
      });
      setIsDeleteDialogOpen(false);
      setCompanyToDelete(null);
    } else {
      toast({
        title: 'Eroare',
        description: result.error || 'Nu s-a putut șterge compania.',
        variant: 'destructive',
      });
    }
    setIsDeleting(false);
  };

  /**
   * Formatează data pentru afișare
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Se încarcă companiile...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Companii
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Gestionează companiile tale și datele financiare
            </p>
          </div>
        </div>

        <Card className="border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-900 dark:text-red-300">
            ⚠️ <strong>Eroare:</strong> {error}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Companii
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Gestionează companiile tale și datele financiare
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adaugă Companie
        </Button>
      </div>

      {/* Lista de companii sau Empty State */}
      {companies.length === 0 ? (
        /* Empty State */
        <>
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-blue-50 p-6 dark:bg-blue-900/20">
                <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Nicio companie adăugată
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Începe prin a adăuga prima ta companie pentru a putea încărca balanțe de verificare și genera rapoarte financiare.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 gap-2"
              >
                <Plus className="h-4 w-4" />
                Adaugă Prima Companie
              </Button>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              💡 <strong>Sfat:</strong> Pentru fiecare companie vei putea încărca balanțe de verificare, genera rapoarte financiare și vizualiza indicatori KPI.
            </p>
          </Card>
        </>
      ) : (
        /* Lista cu companii */
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Companie</TableHead>
                  <TableHead>CUI</TableHead>
                  <TableHead>Țară</TableHead>
                  <TableHead>Monedă</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creat la</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-50">
                            {company.name}
                          </p>
                          {company.address && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {company.address.length > 30
                                ? `${company.address.substring(0, 30)}...`
                                : company.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {company.cui}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {company.country_code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {company.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      {company.phone ? (
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                          <Phone className="h-3 w-3" />
                          {company.phone}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Activ
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-900/20 dark:text-gray-400">
                          Inactiv
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(company.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(company)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editează</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(company)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Șterge</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Stats Card */}
          <Card className="border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              📊 Total companii: <strong>{companies.length}</strong> ({' '}
              {companies.filter((c) => c.is_active).length} active,{' '}
              {companies.filter((c) => !c.is_active).length} inactive )
            </p>
          </Card>
        </>
      )}

      {/* Modal pentru creare companie */}
      <CompanyForm
        mode="create"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Modal pentru editare companie */}
      <CompanyForm
        mode="edit"
        company={selectedCompany}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCompany(null);
        }}
        onSubmit={handleEdit}
      />

      {/* Dialog de confirmare ștergere */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmare ștergere</DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să ștergi compania{' '}
              <strong>{companyToDelete?.name}</strong>?
              <br />
              <br />
              <span className="text-red-600 dark:text-red-400">
                ⚠️ Această acțiune va șterge TOATE datele asociate companiei:
                balanțe, rapoarte, KPI-uri. Operațiunea este ireversibilă!
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setCompanyToDelete(null);
              }}
              disabled={isDeleting}
            >
              Anulează
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se șterge...
                </>
              ) : (
                'Da, șterge compania'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
