import React from 'react';
import { cn } from '@/lib/utils';

interface DataTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ children, className, containerClassName, ...props }) => {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-border bg-card shadow-sm", containerClassName)}>
      <table className={cn("w-full text-left border-collapse text-sm", className)} {...props}>
        {children}
      </table>
    </div>
  );
};

export const DataTableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => {
  return (
    <thead className={cn("bg-muted/50 border-b border-border", className)} {...props}>
      {children}
    </thead>
  );
};

export const DataTableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className, ...props }) => {
  return (
    <tbody className={cn("divide-y divide-border", className)} {...props}>
      {children}
    </tbody>
  );
};

export const DataTableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }>(({ children, className, hover = true, ...props }, ref) => {
  return (
    <tr
      ref={ref}
      className={cn(
        "transition-colors", 
        hover && "hover:bg-muted/40", 
        className
      )} 
      {...props}
    >
      {children}
    </tr>
  );
});
DataTableRow.displayName = 'DataTableRow';

export const DataTableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => {
  return (
    <th className={cn("p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground align-middle", className)} {...props}>
      {children}
    </th>
  );
};

export const DataTableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className, ...props }) => {
  return (
    <td className={cn("p-4 align-middle text-foreground", className)} {...props}>
      {children}
    </td>
  );
};

export default DataTable;
