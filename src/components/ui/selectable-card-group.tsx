import * as React from 'react';
import { cn } from '@/lib/utils';

interface SelectableCardGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

interface SelectableCardProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  isSelected: boolean;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  onSelect: () => void;
  iconClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

export function SelectableCardGroup({ className, ...props }: SelectableCardGroupProps) {
  return <div className={cn('grid gap-3', className)} {...props} />;
}

export function SelectableCard({
  isSelected,
  label,
  description,
  icon,
  onSelect,
  className,
  iconClassName,
  labelClassName,
  descriptionClassName,
  type = 'button',
  ...props
}: SelectableCardProps) {
  return (
    <button
      type={type}
      onClick={onSelect}
      className={cn(
        'rounded-lg border-2 transition-all',
        isSelected
          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
          : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-400',
        className
      )}
      {...props}
    >
      {icon ? <div className={iconClassName}>{icon}</div> : null}
      <div className={labelClassName}>{label}</div>
      {description ? <div className={descriptionClassName}>{description}</div> : null}
    </button>
  );
}
