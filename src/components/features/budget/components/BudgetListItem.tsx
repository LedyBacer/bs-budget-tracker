import { cn } from '@/lib/utils';
import { Budget } from '@/types';
import { HapticButton } from '@/components/ui/haptic-button';

interface BudgetListItemProps {
  budget: Budget;
  isSelected: boolean;
  onSelect: (budgetId: string) => void;
}

export function BudgetListItem({ budget, isSelected, onSelect }: BudgetListItemProps) {
  return (
    <HapticButton
      key={budget.id}
      variant={isSelected ? 'secondary' : 'ghost'}
      onClick={() => onSelect(budget.id)}
      className={cn(
        'h-auto w-full justify-start py-2 px-3 text-left',
        isSelected && 'font-semibold'
      )}
    >
      {budget.name}
    </HapticButton>
  );
} 