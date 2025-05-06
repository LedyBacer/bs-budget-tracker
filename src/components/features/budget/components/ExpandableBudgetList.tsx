import { cn } from '@/lib/utils';
import { Budget } from '@/types';
import { BudgetListItem } from './BudgetListItem';

interface ExpandableBudgetListProps {
  budgets: Budget[];
  currentBudgetId: string | null;
  isListExpanded: boolean;
  onBudgetSelect: (budgetId: string) => void;
}

export function ExpandableBudgetList({
  budgets,
  currentBudgetId,
  isListExpanded,
  onBudgetSelect,
}: ExpandableBudgetListProps) {
  return (
    <div 
      className={cn(
        "flex flex-col space-y-1 transition-all duration-300 ease-in-out",
        isListExpanded 
          ? "opacity-100 max-h-[1000px] overflow-visible" 
          : "opacity-0 max-h-0 overflow-hidden"
      )}
    >
      {budgets.map((budget) => (
        <BudgetListItem
          key={budget.id}
          budget={budget}
          isSelected={currentBudgetId === budget.id}
          onSelect={onBudgetSelect}
        />
      ))}
    </div>
  );
} 