import { AddTransactionButton } from './AddTransactionButton';
import { ReactNode } from 'react';

interface AddTransactionButtonContainerProps {
  onClick: () => void;
  className?: string;
  containerClassName?: string;
  children?: ReactNode;
  isSticky?: boolean;
  buttonProps?: Omit<React.ComponentProps<typeof AddTransactionButton>, 'onClick'>;
  title?: string;
}

export function AddTransactionButtonContainer({
  onClick,
  className = '',
  containerClassName = '',
  children,
  isSticky = true,
  buttonProps,
  title,
}: AddTransactionButtonContainerProps) {
  const containerClass = `${isSticky ? 'sticky top-0 z-10 bg-background py-2' : ''} ${containerClassName}`;
  
  return (
    <div className={containerClass}>
      {title ? (
        <div className="flex items-center justify-between px-1">
          <h3 className="text-md font-semibold">{title}</h3>
          <AddTransactionButton 
            onClick={onClick} 
            className={className}
            {...buttonProps}
          />
        </div>
      ) : children ? (
        children
      ) : (
        <AddTransactionButton 
          onClick={onClick} 
          className={className}
          {...buttonProps}
        />
      )}
    </div>
  );
} 