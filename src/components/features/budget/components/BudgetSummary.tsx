import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Budget } from '@/types';

interface BudgetSummaryProps {
  budget: Budget;
  isExpanded: boolean;
}

export function BudgetSummary({ budget, isExpanded }: BudgetSummaryProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Детали бюджета: "{budget.name}"</h3>
      </div>

      <div className="flex justify-between">
        <span className="text-muted-foreground">Общая сумма:</span>
        <span className="font-medium">{formatCurrency(budget.totalAmount)}</span>
      </div>
      
      <div className={cn(
        "grid grid-rows-[0fr] transition-all duration-300 ease-in-out",
        isExpanded && "grid-rows-[1fr]"
      )}>
        <div className="overflow-hidden">
          <div className="space-y-2 ">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Расходы:</span>
              <span className="font-medium text-red-600">{formatCurrency(budget.totalExpense)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доходы:</span>
              <span className="font-medium text-green-600">{formatCurrency(budget.totalIncome)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <span className="text-muted-foreground">Текущий баланс:</span>
        <span className={`text-lg font-bold ${budget.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(budget.balance)}
        </span>
      </div>
    </div>
  );
} 