// src/components/features/budget/BudgetDetails.tsx
import { useBudgets } from '@/contexts/BudgetContext';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeletons';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';

export function BudgetDetails() {
  const { currentBudget } = useBudgets();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentBudget) {
    return (
      <div className="text-muted-foreground p-4 text-center">
        Выберите бюджет для просмотра деталей.
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground mb-6 rounded-lg border p-4 relative">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Детали бюджета: "{currentBudget.name}"</h3>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                isOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </div>
        </CollapsibleTrigger>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Общая сумма:</span>
            <span className="font-medium">{formatCurrency(currentBudget.totalAmount)}</span>
          </div>
          
          <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
            <div className="space-y-2 mt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Расходы:</span>
                <span className="font-medium text-red-600">{formatCurrency(currentBudget.totalExpense)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доходы:</span>
                <span className="font-medium text-green-600">{formatCurrency(currentBudget.totalIncome)}</span>
              </div>
            </div>
          </CollapsibleContent>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Текущий баланс:</span>
            <span className={`text-lg font-bold ${currentBudget.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentBudget.balance)}
            </span>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
