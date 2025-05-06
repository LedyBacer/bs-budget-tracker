import { HapticButton } from '@/components/ui/haptic-button';
import { PlusCircle } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ActionButtonProps {
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  icon?: ReactNode;
  text?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function ActionButton({
  onClick,
  variant = 'ghost',
  size = 'sm',
  className = '',
  icon = <PlusCircle className="mr-1 h-4 w-4" />,
  text = 'Добавить',
  disabled = false,
  fullWidth = false,
}: ActionButtonProps) {
  return (
    <HapticButton
      onClick={onClick}
      variant={variant}
      size={size}
      className={cn(
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
    >
      {icon}
      {text}
    </HapticButton>
  );
} 