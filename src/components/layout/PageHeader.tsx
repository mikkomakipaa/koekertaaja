import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightActions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  rightActions,
  className
}: PageHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-start sm:justify-between",
      "gap-4 px-4 pt-6 pb-4 sm:px-6 md:px-8",
      className
    )}>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {rightActions && (
        <div className="flex-shrink-0">
          {rightActions}
        </div>
      )}
    </div>
  );
}
