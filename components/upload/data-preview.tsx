'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TrialBalanceAccount } from '@/types/trial-balance';

/**
 * Props pentru componenta DataPreview.
 */
interface DataPreviewProps {
  data: TrialBalanceAccount[];
  maxRows?: number;
  className?: string;
}

/**
 * Componentă pentru preview primele N linii din Trial Balance după procesare.
 * 
 * Afișează datele normalizate în format tabelar pentru verificare vizuală.
 * Include toate cele 8 coloane standard ale balanței de verificare.
 * 
 * @example
 * ```tsx
 * <DataPreview 
 *   data={normalizedData}
 *   maxRows={10}
 * />
 * ```
 */
export function DataPreview({ data, maxRows = 10, className }: DataPreviewProps) {
  const previewData = data.slice(0, maxRows);
  const hasMore = data.length > maxRows;

  /**
   * Formatare valoare numerică pentru afișare.
   */
  const formatNumber = (value: number): string => {
    return value.toLocaleString('ro-RO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Preview Date</CardTitle>
            <CardDescription>
              Primele {previewData.length} linii din {data.length} procesate
            </CardDescription>
          </div>
          {hasMore && (
            <Badge variant="secondary">
              +{data.length - maxRows} mai multe
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Cont</TableHead>
                <TableHead className="min-w-[200px]">Denumire</TableHead>
                <TableHead className="text-right">Sold Inițial D</TableHead>
                <TableHead className="text-right">Sold Inițial C</TableHead>
                <TableHead className="text-right">Rulaj Debit</TableHead>
                <TableHead className="text-right">Rulaj Credit</TableHead>
                <TableHead className="text-right">Sold Final D</TableHead>
                <TableHead className="text-right">Sold Final C</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nu există date de afișat
                  </TableCell>
                </TableRow>
              ) : (
                previewData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.accountCode}</TableCell>
                    <TableCell>{row.accountName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.openingDebit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.openingCredit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.debitTurnover)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.creditTurnover)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.closingDebit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(row.closingCredit)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Footer cu totalizare */}
        {previewData.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium">Totalizare Preview ({previewData.length} linii):</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Sold Inițial D</p>
                <p className="font-medium">
                  {formatNumber(
                    previewData.reduce((sum, row) => sum + row.openingDebit, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Sold Inițial C</p>
                <p className="font-medium">
                  {formatNumber(
                    previewData.reduce((sum, row) => sum + row.openingCredit, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Rulaj Debit</p>
                <p className="font-medium">
                  {formatNumber(previewData.reduce((sum, row) => sum + row.debitTurnover, 0))}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Rulaj Credit</p>
                <p className="font-medium">
                  {formatNumber(previewData.reduce((sum, row) => sum + row.creditTurnover, 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
