import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface GenericDataTableProps<T> {
  data: T[] | null;
  columns: Column<T>[];
  isLoading: boolean;
  emptyMessage?: string;
}

export const GenericDataTable = <T extends { id: string }>({
  data,
  columns,
  isLoading,
  emptyMessage = "No records found",
}: GenericDataTableProps<T>) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border/40 bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
              {columns.map((col, i) => (
                <TableHead key={i} className={cn("py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground", col.className)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="border-b border-border/20">
                {columns.map((_, j) => (
                  <TableCell key={j} className="py-5">
                    <Skeleton className="h-8 w-full rounded-lg bg-muted/20" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const items = data || [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border/40 rounded-[2rem] bg-muted/10 backdrop-blur-sm">
        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border/40 bg-card/30 backdrop-blur-md shadow-inner">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/40">
            {columns.map((col, i) => (
              <TableHead key={i} className={cn("py-6 font-black uppercase text-[10px] tracking-widest text-muted-foreground", col.className)}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-primary/[0.03] transition-colors border-b border-border/20 group">
              {columns.map((col, i) => (
                <TableCell key={i} className={cn("py-5", col.className)}>
                  {col.accessor(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
