import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Budget } from '@/types';

interface BudgetSummaryProps {
  budget: Budget;
  isExpanded: boolean;
}

export function BudgetSummary({ budget, isExpanded }: BudgetSummaryProps) {
  return (
    <div className="">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Детали бюджета: "{budget.name}"</h3>
      </div>

      <div className="flex justify-between">
        <span className="text-muted-foreground">Общая сумма:</span>
        <span className="font-medium">{formatCurrency(budget.total_amount)}</span>
      </div>

      <div
        className={cn(
          'grid grid-rows-[0fr] transition-all duration-300 ease-in-out',
          isExpanded && 'grid-rows-[1fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Расходы:</span>
              <span className="font-medium text-red-600">
                {formatCurrency(budget.total_expense)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доходы:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(budget.total_income)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Текущий баланс:</span>
        <span
          className={`text-lg font-bold ${budget.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
        >
          {formatCurrency(budget.balance)}
        </span>
      </div>
    </div>
  );
}
