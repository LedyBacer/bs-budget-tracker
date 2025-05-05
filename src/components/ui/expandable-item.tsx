import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface ExpandableItemProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ExpandableItem({
  children,
  actions,
  className,
  isExpanded,
  onToggle,
}: ExpandableItemProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "overflow-hidden",
        className
      )}
    >
      <div
        ref={containerRef}
        onClick={onToggle}
        className="cursor-pointer"
      >
        {children}
      </div>
      <div
        className={cn(
          "flex items-center justify-end gap-2",
          "transition-all duration-300 ease-in-out",
          isExpanded
            ? "max-h-40 opacity-100 p-2"
            : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        {actions}
      </div>
    </div>
  );
} 