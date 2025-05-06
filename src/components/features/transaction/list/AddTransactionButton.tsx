import { PlusCircle } from 'lucide-react';
import { ReactNode } from 'react';
import { ActionButton, ActionButtonProps } from '@/components/ui/action-button';

interface AddTransactionButtonProps extends Omit<ActionButtonProps, 'text' | 'icon' | 'variant' | 'size'> {
  text?: string;
  icon?: ReactNode;
  variant?: ActionButtonProps['variant'];
  size?: ActionButtonProps['size'];
}

export function AddTransactionButton({
  onClick,
  variant,
  size,
  className = '',
  icon = <PlusCircle className="h-4 w-4" />,
  text,
  disabled = false,
  fullWidth = false,
  ...props
}: AddTransactionButtonProps) {
  return (
    <ActionButton
      onClick={onClick}
      variant={variant}
      size={size}
      className={className}
      icon={icon}
      text={text}
      disabled={disabled}
      fullWidth={fullWidth}
      {...props}
    />
  );
} 