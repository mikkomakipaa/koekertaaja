import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SegmentedControlProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface SegmentedControlItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  activeClassName?: string;
  inactiveClassName?: string;
}

export function SegmentedControl({
  children,
  className,
  ...props
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-[18px] bg-slate-100 p-1 dark:bg-slate-800',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const SegmentedControlItem = forwardRef<HTMLButtonElement, SegmentedControlItemProps>(
  function SegmentedControlItem(
    {
      active = false,
      activeClassName,
      inactiveClassName,
      className,
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex min-w-12 items-center justify-center rounded-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
          active ? activeClassName : inactiveClassName,
          className
        )}
        {...props}
      />
    );
  }
);
