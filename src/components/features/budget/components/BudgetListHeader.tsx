import { cn } from '@/lib/utils';
import { PlusCircle, ChevronDown } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { Budget } from '@/types';

interface BudgetListHeaderProps {
  isListExpanded: boolean;
  currentBudget: Budget | null;
  isLoadingBudgets: boolean;
  onAddBudgetClick: () => void;
  onTitleClick: () => void;
}

export function BudgetListHeader({
  isListExpanded,
  currentBudget,
  isLoadingBudgets,
  onAddBudgetClick,
  onTitleClick,
}: BudgetListHeaderProps) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={onTitleClick}
      >
        <h3 className="text-md font-semibold">
          {isListExpanded ? "Бюджеты:" : "Бюджет:"}
        </h3>
        {!isListExpanded && currentBudget && (
          <span className="text-md">{currentBudget.name}</span>
        )}
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isListExpanded ? "rotate-180" : "rotate-0"
          )}
        />
      </div>
      
      <ActionButton 
        onClick={onAddBudgetClick}
        disabled={isLoadingBudgets}
      />
    </div>
  );
} 