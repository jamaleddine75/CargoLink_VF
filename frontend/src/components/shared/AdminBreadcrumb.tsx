import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  href?: string;
}

interface AdminBreadcrumbProps {
  items: Crumb[];
  className?: string;
}

const AdminBreadcrumb = ({ items = [], className }: AdminBreadcrumbProps) => (
  <nav className={cn("flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4", className)}>
    <Link to="/admin/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
      <Home className="w-3 h-3" />
      <span className="hidden sm:inline">Dashboard</span>
    </Link>
    {items.map((crumb, i) => (
      <React.Fragment key={i}>
        <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
        {crumb.href ? (
          <Link to={crumb.href} className="hover:text-foreground transition-colors">{crumb.label}</Link>
        ) : (
          <span className="text-foreground">{crumb.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export default AdminBreadcrumb;
