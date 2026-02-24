import { type ReactNode } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PrimaryActionButtonProps {
  icon: ReactNode;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  mode?: ButtonProps['mode'];
  rightMeta?: ReactNode;
  disabled?: boolean;
  className?: string;
}

const primaryActionShadow = 'shadow-[0_2px_6px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.04)]';

export function PrimaryActionButton({
  icon,
  label,
  ariaLabel,
  onClick,
  mode = 'quiz',
  rightMeta,
  disabled = false,
  className,
}: PrimaryActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      mode={mode}
      variant="primary"
      size="chip"
      disabled={disabled}
      className={cn(
        primaryActionShadow,
        'group h-[52px] w-full min-w-12 justify-between rounded-[14px] px-3.5 text-[15px] font-semibold min-[481px]:h-12 max-[480px]:text-[14px]',
        className
      )}
      aria-label={ariaLabel}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
      <span className="ml-auto flex items-center gap-2 text-white/85">
        {rightMeta}
        <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Button>
  );
}
