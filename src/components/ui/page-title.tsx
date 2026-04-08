import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: ElementType;
  children: ReactNode;
}

export function PageTitle({
  as,
  children,
  className,
  ...props
}: PageTitleProps) {
  const Comp = as ?? 'h1';

  return (
    <Comp
      className={cn(
        'text-[22px] font-bold leading-[1.1] tracking-tight text-slate-950 dark:text-slate-50 max-[480px]:text-[19px]',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
