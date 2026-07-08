import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EntityCardProps {
  avatar?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  statusBadge?: React.ReactNode;
  details?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const EntityCard = React.forwardRef<HTMLDivElement, EntityCardProps>(({
  avatar,
  title,
  subtitle,
  statusBadge,
  details,
  actions,
  footer,
  onClick,
  className,
}, ref) => {
  return (
    <Card
      ref={ref}
      onClick={onClick}
      className={cn(
        "bg-card text-card-foreground border border-border rounded-lg overflow-hidden shadow-sm transition-all duration-200",
        onClick && "cursor-pointer active:scale-[0.99] hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {avatar && <div className="shrink-0">{avatar}</div>}
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate text-base leading-snug">
                {title}
              </h3>
              {subtitle && (
                <div className="text-xs text-muted-foreground mt-1">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {statusBadge}
            {actions}
          </div>
        </div>

        {details && (
          <div className="text-sm text-foreground/85 my-4">
            {details}
          </div>
        )}

        {footer && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

EntityCard.displayName = 'EntityCard';
export default EntityCard;
